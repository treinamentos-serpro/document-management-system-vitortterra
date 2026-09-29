const API_PREFIX = '/api';

async function parseResponse(response) {
  if (response.ok) {
    return response;
  }

  let message = 'Não foi possível concluir a operação.';

  try {
    const body = await response.json();
    message = body.error?.message || message;
  } catch {
    // Mantém a mensagem padrão quando a API não retorna JSON.
  }

  throw new Error(message);
}

export async function listDocuments(owner) {
  const query = owner ? `?owner=${encodeURIComponent(owner)}` : '';
  const response = await parseResponse(
    await fetch(`${API_PREFIX}/documents${query}`),
  );
  const body = await response.json();

  return body.documents;
}

export async function uploadDocument(file, owner) {
  const formData = new FormData();
  formData.append('file', file);

  const headers = owner ? { 'X-User-Id': owner } : {};
  const response = await parseResponse(
    await fetch(`${API_PREFIX}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    }),
  );

  return response.json();
}

export async function downloadDocument(documentId, originalName) {
  const response = await parseResponse(
    await fetch(`${API_PREFIX}/documents/${encodeURIComponent(documentId)}/download`),
  );
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = originalName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}
