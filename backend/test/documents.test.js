const { after, before, test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temporaryStorage = fs.mkdtempSync(
  path.join(os.tmpdir(), 'dms-backend-test-'),
);
process.env.STORAGE_DIR = temporaryStorage;
process.env.MAX_FILE_SIZE = '32';

const app = require('../src/app');
const documentsRepository = require('../src/repositories/documents.repository');
const documentsService = require('../src/services/documents.service');

let server;

before(async () => {
  server = await new Promise((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  fs.rmSync(temporaryStorage, { recursive: true, force: true });
});

function request(pathname, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      host: '127.0.0.1',
      port: server.address().port,
      path: pathname,
      method: options.method || 'GET',
      headers: options.headers,
    };

    const request = http.request(requestOptions, (response) => {
      let body = '';
      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => resolve({
        statusCode: response.statusCode,
        headers: response.headers,
        body,
      }));
    });

    request.on('error', reject);
    request.end(options.body);
  });
}

function multipartFile(filename, content) {
  const boundary = `----dms-test-${Date.now()}`;
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\n`),
    Buffer.from(
      `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
      'Content-Type: text/plain\r\n\r\n',
    ),
    Buffer.from(content),
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ]);

  return {
    body,
    headers: {
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': body.length,
      'X-User-Id': `upload-owner-${Date.now()}`,
    },
  };
}

test('GET /health retorna o status da aplicação', async () => {
  const response = await request('/health');

  assert.equal(response.statusCode, 200);
  assert.deepEqual(JSON.parse(response.body), { status: 'ok' });
});

test('POST /upload salva e retorna os metadados do arquivo', async () => {
  const multipart = multipartFile('notes.txt', 'conteudo local');
  const response = await request('/upload', {
    method: 'POST',
    headers: multipart.headers,
    body: multipart.body,
  });
  const document = JSON.parse(response.body);

  assert.equal(response.statusCode, 201);
  assert.equal(document.originalName, 'notes.txt');
  assert.equal(document.size, Buffer.byteLength('conteudo local'));
  assert.equal(document.mimeType, 'text/plain');
  assert.equal(typeof document.id, 'string');
  assert.equal('filePath' in document, false);
});

test('POST /upload rejeita arquivos acima do limite configurado', async () => {
  const multipart = multipartFile('large.txt', '123456789012345678901234567890123');
  const response = await request('/upload', {
    method: 'POST',
    headers: multipart.headers,
    body: multipart.body,
  });

  assert.equal(response.statusCode, 413);
  assert.deepEqual(JSON.parse(response.body), {
    error: {
      code: 'FILE_TOO_LARGE',
      message: 'O arquivo excede o tamanho máximo permitido.',
    },
  });
});

test('download transmite arquivo enviado sem usar nome original como caminho', async () => {
  const content = 'conteudo do arquivo';
  const multipart = multipartFile('../../notes.txt', content);
  const uploadResponse = await request('/upload', {
    method: 'POST',
    headers: multipart.headers,
    body: multipart.body,
  });
  const document = JSON.parse(uploadResponse.body);
  const storedDocument = documentsRepository.findById(document.id);

  assert.equal(uploadResponse.statusCode, 201);
  assert.equal(path.dirname(storedDocument.filePath), temporaryStorage);
  assert.match(path.basename(storedDocument.filePath), /^[0-9a-f-]+\.txt$/);

  const downloadResponse = await request(`/documents/${document.id}/download`);

  assert.equal(downloadResponse.statusCode, 200);
  assert.equal(downloadResponse.body, content);
  assert.match(downloadResponse.headers['content-disposition'], /attachment/);
  assert.equal(downloadResponse.headers['content-type'], 'text/plain');
});

test('GET /documents lista documentos do proprietário informado', async () => {
  const owner = `owner-${Date.now()}`;
  documentsRepository.save({
    originalname: 'owned.txt',
    size: 7,
    mimetype: 'text/plain',
    filename: 'owned-file.txt',
    path: path.join(temporaryStorage, 'owned-file.txt'),
  }, owner);
  documentsRepository.save({
    originalname: 'other.txt',
    size: 5,
    mimetype: 'text/plain',
    filename: 'other-file.txt',
    path: path.join(temporaryStorage, 'other-file.txt'),
  }, 'another-owner');

  const response = await request(`/documents?owner=${owner}`);
  const body = JSON.parse(response.body);

  assert.equal(response.statusCode, 200);
  assert.equal(body.documents.length, 1);
  assert.equal(body.documents[0].owner, owner);
  assert.equal(body.documents[0].originalName, 'owned.txt');
  assert.equal('filePath' in body.documents[0], false);
  assert.equal('storedName' in body.documents[0], false);
});

test('POST /upload sem arquivo retorna erro de validação', async () => {
  const response = await request('/upload', { method: 'POST' });

  assert.equal(response.statusCode, 400);
  assert.deepEqual(JSON.parse(response.body), {
    error: {
      code: 'FILE_REQUIRED',
      message: 'Nenhum arquivo foi enviado.',
    },
  });
});

test('GET /documents/:id/download retorna 404 para documento inexistente', async () => {
  const response = await request('/documents/does-not-exist/download');

  assert.equal(response.statusCode, 404);
  assert.deepEqual(JSON.parse(response.body), {
    error: {
      code: 'DOCUMENT_NOT_FOUND',
      message: 'Documento não encontrado.',
    },
  });
});

test('GET /documents/:id/download retorna 404 se o arquivo físico sumiu', async () => {
  const document = documentsRepository.save({
    originalname: 'missing.txt',
    size: 0,
    mimetype: 'text/plain',
    filename: 'missing.txt',
    path: path.join(temporaryStorage, 'missing.txt'),
  }, 'owner');

  const response = await request(`/documents/${document.id}/download`);

  assert.equal(response.statusCode, 404);
  assert.deepEqual(JSON.parse(response.body), {
    error: {
      code: 'DOCUMENT_NOT_FOUND',
      message: 'Documento não encontrado.',
    },
  });
});

test('o serviço rejeita upload sem arquivo', () => {
  assert.throws(
    () => documentsService.upload(),
    (error) => error.code === 'FILE_REQUIRED' && error.statusCode === 400,
  );
});

test('o serviço encontra documento existente para download', () => {
  const owner = `download-owner-${Date.now()}`;
  const savedDocument = documentsRepository.save({
    originalname: 'download.txt',
    size: 8,
    mimetype: 'text/plain',
    filename: 'download-file.txt',
    path: path.join(temporaryStorage, 'download-file.txt'),
  }, owner);

  const document = documentsService.findForDownload(savedDocument.id);

  assert.equal(document.originalName, 'download.txt');
  assert.equal(document.filePath, path.join(temporaryStorage, 'download-file.txt'));
});