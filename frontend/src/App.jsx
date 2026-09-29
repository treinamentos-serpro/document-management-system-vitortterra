import { useEffect, useState } from 'react';
import DocumentList from './components/DocumentList.jsx';
import UploadComponent from './components/UploadComponent.jsx';
import { listDocuments } from './services/documentService.js';
import './App.css';

export default function App() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  async function refreshDocuments() {
    setIsLoading(true);
    setError('');

    try {
      setDocuments(await listDocuments());
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshDocuments();
  }, []);

  return (
    <main className="app-shell">
      <div className="app-content">
        <header className="app-header">
          <div>
            <p className="kicker">Document Management System</p>
            <h1>Seus documentos, no lugar certo.</h1>
            <p>Envie arquivos para o armazenamento local e encontre-os quando precisar.</p>
          </div>
          <span className="app-badge">Armazenamento local</span>
        </header>

        <div className="workspace">
          <section className="upload-panel" aria-labelledby="upload-heading">
            <p className="eyebrow">Novo arquivo</p>
            <h2 id="upload-heading">Enviar documento</h2>
            <UploadComponent onUploaded={refreshDocuments} />
          </section>
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={error}
          />
        </div>
      </div>
    </main>
  );
}
