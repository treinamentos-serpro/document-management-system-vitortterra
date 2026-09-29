const documentsService = require('../services/documents.service');

function upload(request, response, next) {
  try {
    const owner = request.get('X-User-Id');
    const document = documentsService.upload(request.file, owner);
    response.status(201).json(document);
  } catch (error) {
    next(error);
  }
}

function list(request, response, next) {
  try {
    const documents = documentsService.list(request.query.owner);
    response.json({ documents });
  } catch (error) {
    next(error);
  }
}

function download(request, response, next) {
  try {
    const document = documentsService.findForDownload(request.params.id);
    response.download(
      document.filePath,
      document.originalName,
      { headers: { 'Content-Type': document.mimeType || 'application/octet-stream' } },
      (error) => {
        if (!error) return;
        if (response.headersSent) {
          response.destroy(error);
          return;
        }

        if (error.code === 'ENOENT') {
          error.statusCode = 404;
          error.code = 'DOCUMENT_NOT_FOUND';
        } else {
          error.statusCode = 500;
          error.code = 'STORAGE_ERROR';
        }

        next(error);
      },
    );
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upload,
  list,
  download,
};
