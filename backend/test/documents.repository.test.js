const { before, test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const temporaryStorage = fs.mkdtempSync(
  path.join(os.tmpdir(), 'dms-repository-test-'),
);
process.env.STORAGE_DIR = temporaryStorage;

const documentsRepository = require('../src/repositories/documents.repository');

before(() => {
  fs.rmSync(temporaryStorage, { recursive: true, force: true });
});

function createFile(overrides = {}) {
  return {
    originalname: 'document.txt',
    size: 12,
    mimetype: 'text/plain',
    filename: 'stored-document.txt',
    path: path.join(temporaryStorage, 'stored-document.txt'),
    ...overrides,
  };
}

test('save retorna metadados públicos e preserva os dados do documento', () => {
  const document = documentsRepository.save(createFile(), 'owner-1');

  assert.equal(document.originalName, 'document.txt');
  assert.equal(document.size, 12);
  assert.equal(document.mimeType, 'text/plain');
  assert.equal(document.owner, 'owner-1');
  assert.equal(typeof document.id, 'string');
  assert.equal(typeof document.uploadedAt, 'string');
  assert.equal('storedName' in document, false);
  assert.equal('filePath' in document, false);

  const storedDocument = documentsRepository.findById(document.id);
  assert.equal(storedDocument.storedName, 'stored-document.txt');
  assert.equal(storedDocument.filePath, createFile().path);
});

test('list filtra por proprietário e retorna documentos públicos', () => {
  const owner = `owner-${Date.now()}`;
  const ownedDocument = documentsRepository.save(
    createFile({ originalname: 'owned.txt' }),
    owner,
  );
  documentsRepository.save(
    createFile({ originalname: 'other.txt' }),
    `other-${Date.now()}`,
  );

  const documents = documentsRepository.list(owner);

  assert.equal(documents.length, 1);
  assert.equal(documents[0].id, ownedDocument.id);
  assert.equal(documents[0].originalName, 'owned.txt');
  assert.equal('filePath' in documents[0], false);
  assert.equal('storedName' in documents[0], false);
});

test('list sem proprietário retorna todos os documentos', () => {
  const owner = `all-documents-owner-${Date.now()}`;
  documentsRepository.save(createFile(), owner);

  const documents = documentsRepository.list();

  assert.ok(documents.some((document) => document.owner === owner));
});

test('findById retorna undefined para documento inexistente', () => {
  assert.equal(documentsRepository.findById('missing-document-id'), undefined);
});