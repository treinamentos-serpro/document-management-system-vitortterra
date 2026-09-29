import DownloadButton from './DownloadButton.jsx';

function formatFileSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function DocumentList({ documents, isLoading, error }) {
  return (
    <section className="document-section" aria-labelledby="documents-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Arquivo local</p>
          <h2 id="documents-heading">Documentos disponíveis</h2>
        </div>
        <span className="document-count">{documents.length}</span>
      </div>

      {isLoading && <p className="empty-state">Carregando documentos...</p>}
      {!isLoading && error && <p className="error-state">{error}</p>}
      {!isLoading && !error && documents.length === 0 && (
        <p className="empty-state">Nenhum documento foi enviado ainda.</p>
      )}
      {!isLoading && !error && documents.length > 0 && (
        <div className="document-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tamanho</th>
                <th>Usuário</th>
                <th>Enviado em</th>
                <th><span className="visually-hidden">Ações</span></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className="document-name">{document.originalName}</td>
                  <td>{formatFileSize(document.size)}</td>
                  <td>{document.owner}</td>
                  <td>{formatDate(document.uploadedAt)}</td>
                  <td>
                    <DownloadButton
                      documentId={document.id}
                      originalName={document.originalName}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
