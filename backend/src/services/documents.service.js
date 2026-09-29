const documentsRepository = require('../repositories/documents.repository');

function upload(file, owner) {
  if (!file) {
    const error = new Error('Nenhum arquivo foi enviado.');
    error.code = 'FILE_REQUIRED';
    error.statusCode = 400;
    throw error;
  }

  const resolvedOwner = owner || process.env.DEFAULT_OWNER || 'anonymous';
  return documentsRepository.save(file, resolvedOwner);
}

function list(owner) {
  return documentsRepository.list(owner);
}

function findForDownload(id) {
  const document = documentsRepository.findById(id);

  if (!document) {
    const error = new Error('Documento não encontrado.');
    error.code = 'DOCUMENT_NOT_FOUND';
    error.statusCode = 404;
    throw error;
  }

  return document;
}

module.exports = {
  upload,
  list,
  findForDownload,
};
