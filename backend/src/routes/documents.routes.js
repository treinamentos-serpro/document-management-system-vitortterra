const express = require('express');
const multer = require('multer');
const documentsController = require('../controllers/documents.controller');
const documentsRepository = require('../repositories/documents.repository');

const router = express.Router();
const upload = documentsRepository.createUploadMiddleware();

router.post('/upload', upload, documentsController.upload);
router.get('/documents', documentsController.list);
router.get('/documents/:id/download', documentsController.download);

router.use((error, _request, _response, next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    error.statusCode = 413;
    error.code = 'FILE_TOO_LARGE';
    error.message = 'O arquivo excede o tamanho máximo permitido.';
  }

  next(error);
});

module.exports = router;
