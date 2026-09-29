import { useState } from 'react';
import { uploadDocument } from '../services/documentService.js';

export default function UploadComponent({ onUploaded }) {
  const [file, setFile] = useState(null);
  const [owner, setOwner] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    if (!file) {
      setMessage('Selecione um arquivo antes de enviar.');
      return;
    }

    setIsUploading(true);
    setMessage('');

    try {
      const document = await uploadDocument(file, owner.trim());
      setFile(null);
      event.target.reset();
      setOwner('');
      setMessage(`Arquivo "${document.originalName}" enviado com sucesso.`);
      onUploaded(document);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form className="upload-form" onSubmit={handleSubmit}>
      <div className="field-group">
        <label htmlFor="document-file">Arquivo</label>
        <input
          id="document-file"
          type="file"
          onChange={(event) => setFile(event.target.files?.[0] || null)}
          disabled={isUploading}
        />
      </div>
      <div className="field-group">
        <label htmlFor="document-owner">Usuário (opcional)</label>
        <input
          id="document-owner"
          type="text"
          value={owner}
          onChange={(event) => setOwner(event.target.value)}
          placeholder="anonymous"
          disabled={isUploading}
        />
      </div>
      <button type="submit" disabled={isUploading}>
        {isUploading ? 'Enviando...' : 'Enviar documento'}
      </button>
      {message && <p className="form-message">{message}</p>}
    </form>
  );
}
