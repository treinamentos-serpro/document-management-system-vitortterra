const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(__dirname, '../../storage'),
);
const documents = new Map();

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, storageDirectory);
  },
  filename: (_request, file, callback) => {
    const candidate = path.extname(file.originalname).toLowerCase();
    const extension = /^\.[a-z0-9]{1,10}$/.test(candidate) ? candidate : '';
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

function createUploadMiddleware() {
  const configuredMaximum = process.env.MAX_FILE_SIZE;
  const maximumFileSize = configuredMaximum
    ? Number(configuredMaximum)
    : 10 * 1024 * 1024;

  if (!Number.isSafeInteger(maximumFileSize) || maximumFileSize <= 0) {
    throw new Error('MAX_FILE_SIZE deve ser um inteiro positivo.');
  }

  return multer({
    storage,
    limits: {
      fileSize: maximumFileSize,
      files: 1,
      fields: 0,
      parts: 2,
    },
  }).single('file');
}

function save(file, owner) {
  const document = {
    id: crypto.randomUUID(),
    originalName: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    uploadedAt: new Date().toISOString(),
    owner,
    storedName: file.filename,
    filePath: file.path,
  };

  documents.set(document.id, document);
  return toPublicMetadata(document);
}

function list(owner) {
  return [...documents.values()]
    .filter((document) => !owner || document.owner === owner)
    .sort((first, second) => second.uploadedAt.localeCompare(first.uploadedAt))
    .map(toPublicMetadata);
}

function findById(id) {
  return documents.get(id);
}

function toPublicMetadata(document) {
  const { storedName, filePath, ...metadata } = document;
  return metadata;
}

module.exports = {
  createUploadMiddleware,
  save,
  list,
  findById,
};
