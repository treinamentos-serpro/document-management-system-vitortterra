const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const multer = require('multer');

const storageDirectory = path.resolve(
  process.env.STORAGE_DIR || path.join(process.cwd(), 'storage'),
);
const documents = new Map();

fs.mkdirSync(storageDirectory, { recursive: true });

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, storageDirectory);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

function createUploadMiddleware() {
  const maximumFileSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024);

  return multer({
    storage,
    limits: { fileSize: maximumFileSize },
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
