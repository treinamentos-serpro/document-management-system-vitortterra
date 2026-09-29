const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');

function handleUploadErrors(uploadMiddleware) {
  return (request, response, next) => {
    uploadMiddleware(request, response, (error) => {
      if (!error) return next();

      if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
        error.statusCode = 413;
        error.code = 'FILE_TOO_LARGE';
      } else if (error.code && /^E[A-Z]+$/.test(error.code)) {
        error.statusCode = 500;
        error.code = 'STORAGE_ERROR';
      } else {
        error.statusCode = 400;
        error.code = 'INVALID_REQUEST';
      }

      next(error);
    });
  };
}

function createDocumentsRouter(uploadMiddleware) {
  const router = express.Router();

  router.post('/upload', handleUploadErrors(uploadMiddleware), documentsController.upload);
  router.get('/documents', documentsController.list);
  router.get('/documents/:id/download', documentsController.download);

  return router;
}

module.exports = createDocumentsRouter;
