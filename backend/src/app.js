// Seed do servidor backend do Document Management System.
//
// Este arquivo é apenas um ponto de partida mínimo. Ao longo do workshop você
// vai usar o Agent Mode do GitHub Copilot para construir as camadas:
//   - routes/       (definição das rotas)
//   - controllers/  (entrada HTTP e validação)
//   - services/     (regras de negócio)
//   - repositories/ (persistência: arquivos locais + metadados em memória)
//
// Restrição do projeto: uploads são gravados no filesystem local da aplicação
// usando multer com diskStorage. Não utilize provedores externos.

const express = require('express');
const createDocumentsRouter = require('./routes/documents.routes');
const documentsRepository = require('./repositories/documents.repository');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(createDocumentsRouter(documentsRepository.createUploadMiddleware()));

// Endpoint de verificação de saúde. As demais rotas (/upload, /documents,
// /documents/:id/download) serão implementadas durante o Passo 2.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((error, _request, response, _next) => {
  const messages = {
    FILE_REQUIRED: 'Nenhum arquivo foi enviado.',
    FILE_TOO_LARGE: 'O arquivo excede o tamanho máximo permitido.',
    INVALID_REQUEST: 'A requisição enviada é inválida.',
    DOCUMENT_NOT_FOUND: 'Documento não encontrado.',
    STORAGE_ERROR: 'Não foi possível acessar o armazenamento.',
    INTERNAL_ERROR: 'Ocorreu um erro interno.',
  };
  const code = Object.hasOwn(messages, error.code) ? error.code : 'INTERNAL_ERROR';
  const statusCode = code === 'INTERNAL_ERROR'
    ? 500
    : error.statusCode || (code === 'FILE_TOO_LARGE' ? 413 : code === 'STORAGE_ERROR' ? 500 : 400);

  response.status(statusCode).json({
    error: {
      code,
      message: messages[code],
    },
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`DMS backend ouvindo na porta ${PORT}`);
  });
}

module.exports = app;
