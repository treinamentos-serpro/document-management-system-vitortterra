const documentsService = require('../services/documents.service');

function upload(request, response, next) {
  try {
    const owner = request.get('X-User-Id') || process.env.DEFAULT_OWNER || 'anonymous';
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
    response.download(document.filePath, document.originalName, (error) => {
      if (error && !response.headersSent) {
        next(error);
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  upload,
  list,
  download,
};
