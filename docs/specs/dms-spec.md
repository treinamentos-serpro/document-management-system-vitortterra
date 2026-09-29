# Especificação - Document Management System

## 1. Objetivo

Disponibilizar uma aplicação web para envio, listagem e download de documentos armazenados exclusivamente no filesystem local da aplicação.

## 2. Escopo

### Dentro do escopo

- Upload de documentos via formulário web.
- Armazenamento local dos arquivos.
- Listagem dos documentos disponíveis ao usuário.
- Download de documentos por identificador.
- Associação de cada documento a um usuário.
- Metadados mantidos em memória.
- Interface React consumindo a API por `fetch`.
- Tratamento de erros de validação, arquivo inexistente e falhas de armazenamento.

### Fora do escopo

- Armazenamento em nuvem ou provedores externos.
- Persistência de metadados em banco de dados.
- Autenticação e autorização completas.
- Versionamento de documentos.
- Exclusão ou edição de documentos.
- Compartilhamento entre usuários.
- Preview ou conversão de arquivos.
- Busca textual no conteúdo dos documentos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O usuário deve conseguir enviar um documento usando `multipart/form-data`. |
| RF-02 | O campo do arquivo no upload deve se chamar `file`. |
| RF-03 | O sistema deve rejeitar requisições sem arquivo. |
| RF-04 | O sistema deve gerar um identificador único para cada documento. |
| RF-05 | O sistema deve preservar o nome original do arquivo nos metadados. |
| RF-06 | O arquivo deve ser gravado no diretório local configurado. |
| RF-07 | O sistema deve registrar tamanho, data de upload e dono do documento. |
| RF-08 | O usuário deve conseguir listar os documentos disponíveis. |
| RF-09 | A listagem deve retornar os documentos ordenados do mais recente para o mais antigo. |
| RF-10 | O usuário deve conseguir baixar um documento informando seu identificador. |
| RF-11 | O download deve retornar o arquivo binário com nome original e tipo apropriado quando disponível. |
| RF-12 | Documentos inexistentes devem retornar erro HTTP `404`. |
| RF-13 | O sistema deve aceitar a identificação do usuário pelo cabeçalho `X-User-Id`. |
| RF-14 | Quando `X-User-Id` não for informado, o dono deve ser registrado como `anonymous`. |
| RF-15 | A listagem deve permitir filtrar documentos pelo usuário por meio do parâmetro opcional `owner`. |
| RF-16 | O frontend deve atualizar a listagem após um upload bem-sucedido. |
| RF-17 | O frontend deve exibir mensagens compreensíveis para sucesso e falha. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser armazenados localmente usando `multer` com `diskStorage`. |
| RNF-02 | Não devem ser usados serviços externos de armazenamento ou upload. |
| RNF-03 | Os metadados devem permanecer em memória nesta primeira versão. |
| RNF-04 | O diretório de armazenamento deve ser configurável por variável de ambiente. |
| RNF-05 | O limite máximo do arquivo deve ser configurável por variável de ambiente. |
| RNF-06 | A aplicação deve utilizar configuração compatível com o princípio 12-Factor. |
| RNF-07 | O backend deve seguir o fluxo `routes -> controllers -> services -> repositories`. |
| RNF-08 | Controllers devem tratar HTTP, services devem conter regras de negócio e repositories devem tratar persistência. |
| RNF-09 | O sistema deve impedir traversal de diretórios e não deve usar o nome original como caminho físico. |
| RNF-10 | A API deve retornar JSON padronizado para erros. |
| RNF-11 | A aplicação deve funcionar com Node.js, Express, React e Vite já definidos no projeto. |
| RNF-12 | O código deve permanecer em JavaScript, sem introdução de TypeScript. |
| RNF-13 | O backend deve disponibilizar o endpoint `GET /health`. |
| RNF-14 | O frontend deve consumir a API pelo prefixo `/api`, usando o proxy existente do Vite. |

## 5. Configuração

| Variável | Obrigatória | Padrão | Descrição |
| --- | --- | --- | --- |
| `PORT` | Não | `3000` | Porta HTTP do backend. |
| `STORAGE_DIR` | Não | `backend/storage` | Diretório para armazenamento dos arquivos. |
| `MAX_FILE_SIZE` | Não | `10485760` | Tamanho máximo em bytes, equivalente a 10 MB. |
| `DEFAULT_OWNER` | Não | `anonymous` | Dono usado quando `X-User-Id` não for informado. |

O diretório configurado deve ser criado automaticamente caso não exista.

## 6. Modelo de dados

### 6.1 Metadados públicos

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `id` | string | Sim | Identificador único, preferencialmente UUID. |
| `originalName` | string | Sim | Nome original informado pelo cliente. |
| `size` | number | Sim | Tamanho do arquivo em bytes. |
| `mimeType` | string | Não | Tipo MIME informado pelo upload. |
| `uploadedAt` | string | Sim | Data e hora em ISO 8601. |
| `owner` | string | Sim | Identificador do usuário dono. |

### 6.2 Dados internos

Os seguintes dados podem ser mantidos internamente pelo repository, mas não devem ser expostos na API:

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `storedName` | string | Nome físico seguro usado no filesystem. |
| `filePath` | string | Caminho absoluto ou resolvido do arquivo armazenado. |

O nome físico deve ser derivado do identificador gerado pelo sistema, podendo preservar apenas uma extensão sanitizada.

## 7. Contratos de API

### 7.1 `GET /health`

Resposta `200`:

```json
{
	"status": "ok"
}
```

### 7.2 `POST /upload`

#### Requisição

- Content-Type: `multipart/form-data`
- Campo obrigatório: `file`
- Cabeçalho opcional: `X-User-Id`

Exemplo conceitual:

```text
POST /upload
X-User-Id: user-123
Content-Type: multipart/form-data
file=<arquivo>
```

#### Sucesso

Status: `201 Created`

```json
{
	"id": "uuid",
	"originalName": "relatorio.pdf",
	"size": 24576,
	"mimeType": "application/pdf",
	"uploadedAt": "2026-09-29T12:00:00.000Z",
	"owner": "user-123"
}
```

#### Erros

- `400 Bad Request`: nenhum arquivo enviado ou multipart inválido.
- `413 Payload Too Large`: arquivo acima de `MAX_FILE_SIZE`.
- `500 Internal Server Error`: falha ao gravar o arquivo ou registrar metadados.

### 7.3 `GET /documents`

#### Parâmetros opcionais

| Parâmetro | Descrição |
| --- | --- |
| `owner` | Retorna apenas documentos pertencentes ao usuário informado. |

#### Sucesso

Status: `200 OK`

```json
{
	"documents": [
		{
			"id": "uuid",
			"originalName": "relatorio.pdf",
			"size": 24576,
			"mimeType": "application/pdf",
			"uploadedAt": "2026-09-29T12:00:00.000Z",
			"owner": "user-123"
		}
	]
}
```

Uma lista vazia deve ser considerada sucesso:

```json
{
	"documents": []
}
```

#### Erros

- `400 Bad Request`: filtro inválido.
- `500 Internal Server Error`: falha ao consultar o repository.

### 7.4 `GET /documents/:id/download`

#### Sucesso

Status: `200 OK`

- Corpo: conteúdo binário do arquivo.
- `Content-Disposition`: anexo com o nome original.
- `Content-Type`: tipo MIME registrado ou `application/octet-stream`.

#### Erros

- `400 Bad Request`: identificador ausente ou inválido.
- `404 Not Found`: metadados ou arquivo físico não encontrados.
- `500 Internal Server Error`: falha na leitura do arquivo.

### 7.5 Formato de erro

Todos os erros HTTP devem seguir o formato:

```json
{
	"error": {
		"code": "DOCUMENT_NOT_FOUND",
		"message": "Documento não encontrado."
	}
}
```

Códigos mínimos:

- `FILE_REQUIRED`
- `FILE_TOO_LARGE`
- `INVALID_REQUEST`
- `DOCUMENT_NOT_FOUND`
- `STORAGE_ERROR`
- `INTERNAL_ERROR`

## 8. Arquitetura

### Backend

A dependência entre camadas deve seguir:

```text
routes -> controllers -> services -> repositories
```

Responsabilidades:

- `routes/`: registra endpoints, middleware do upload e encaminha requisições.
- `controllers/`: lê parâmetros, headers e arquivos; valida entrada básica; monta respostas HTTP.
- `services/`: aplica regras de negócio, gera identificadores, define owner, valida operações e coordena repositories.
- `repositories/`: grava arquivos via filesystem, mantém metadados em memória e recupera documentos.

O service não deve depender diretamente de objetos HTTP do Express. O controller não deve conter regras de persistência.

### Frontend

Organização prevista:

- `components/UploadComponent`
- `components/DocumentList`
- `components/DownloadButton`
- `services/` para chamadas `fetch`
- `pages/` para composição da tela principal

O frontend deve consumir:

- `/api/upload`
- `/api/documents`
- `/api/documents/:id/download`

## 9. Plano de execução

### Etapa 1 - Configuração e persistência básica

Arquivos a criar ou alterar:

- `backend/src/config/`
- `backend/src/repositories/documentRepository.js`
- `backend/src/services/`
- `backend/storage/`

Atividades:

- Definir leitura das variáveis de ambiente.
- Garantir a existência do diretório de armazenamento.
- Implementar armazenamento físico com `diskStorage`.
- Implementar registro e consulta de metadados em memória.

Critérios de aceite:

- O diretório local é criado quando necessário.
- Um arquivo pode ser gravado com nome físico seguro.
- Os metadados podem ser registrados e recuperados.
- O nome original nunca é usado diretamente como caminho físico.

### Etapa 2 - Serviços de negócio

Arquivos a criar ou alterar:

- `backend/src/services/documentService.js`
- Testes unitários correspondentes.

Atividades:

- Implementar upload.
- Implementar listagem ordenada.
- Implementar filtro por owner.
- Implementar localização de documento para download.
- Definir comportamento para arquivos e documentos inexistentes.

Critérios de aceite:

- Cada upload gera identificador único.
- Datas são geradas em ISO 8601.
- A listagem retorna os documentos mais recentes primeiro.
- Erros de negócio possuem códigos previsíveis.

### Etapa 3 - Controllers e rotas

Arquivos a criar ou alterar:

- `backend/src/controllers/documentController.js`
- `backend/src/routes/documentRoutes.js`
- `backend/src/app.js`

Atividades:

- Configurar middleware de upload.
- Expor `POST /upload`.
- Expor `GET /documents`.
- Expor `GET /documents/:id/download`.
- Preservar `GET /health`.
- Adicionar tratamento centralizado de erros.

Critérios de aceite:

- Os endpoints retornam os status definidos nesta especificação.
- Respostas de sucesso e erro seguem os contratos.
- Nenhuma regra de persistência fica dentro das rotas ou controllers.

### Etapa 4 - Testes de integração do backend

Arquivos a criar ou alterar:

- `backend/test/app.test.js`
- `backend/test/fixtures/`, se necessário.

Atividades:

- Testar health check.
- Testar upload válido.
- Testar upload sem arquivo.
- Testar limite de tamanho.
- Testar listagem vazia e preenchida.
- Testar filtro por owner.
- Testar download válido.
- Testar documento inexistente.
- Limpar arquivos temporários após os testes.

Critérios de aceite:

- Os testes podem ser executados com `npm test`.
- O teste não depende de serviços externos.
- Os arquivos criados pelos testes não poluem o armazenamento de desenvolvimento.

### Etapa 5 - Serviço e componentes do frontend

Arquivos a criar ou alterar:

- `frontend/src/services/documentService.js`
- `frontend/src/components/UploadComponent.jsx`
- `frontend/src/components/DocumentList.jsx`
- `frontend/src/components/DownloadButton.jsx`

Atividades:

- Implementar chamadas `fetch`.
- Criar formulário de upload.
- Exibir estado de carregamento.
- Exibir mensagens de erro.
- Renderizar metadados.
- Criar ação de download.

Critérios de aceite:

- O formulário envia o campo `file`.
- A lista é carregada pela API.
- Um upload atualiza a lista.
- O download usa o identificador correto.
- Falhas da API são apresentadas ao usuário.

### Etapa 6 - Integração da tela principal

Arquivos a criar ou alterar:

- `frontend/src/App.jsx`
- `frontend/src/pages/`

Atividades:

- Compor upload e listagem.
- Definir estado compartilhado mínimo.
- Integrar refresh após upload.
- Manter a comunicação pelo prefixo `/api`.

Critérios de aceite:

- A aplicação inicia com `npm run dev`.
- O usuário consegue enviar e listar documentos pela interface.
- O usuário consegue iniciar o download de um documento.
- Estados vazios, carregamento e erro são tratados.

### Etapa 7 - Validação final

Arquivos revisados:

- `backend/src/`
- `backend/test/`
- `frontend/src/`
- `README.md`, se necessário.

Atividades:

- Executar testes do backend.
- Executar build do frontend.
- Validar variáveis de ambiente.
- Revisar segurança de caminhos e limites de upload.
- Atualizar documentação de execução.

Critérios de aceite:

- `npm test` do backend passa.
- `npm run build` do frontend passa.
- O fluxo upload, listagem e download funciona localmente.
- Não há dependências de armazenamento externo.
- A estrutura respeita `routes -> controllers -> services -> repositories`.

## 10. Decisões arquiteturais

- O armazenamento será exclusivamente local.
- `multer` usará `diskStorage`.
- Os metadados serão mantidos em memória.
- O identificador será gerado pelo backend.
- O nome físico do arquivo será diferente do nome original.
- A identificação simples do usuário será feita por `X-User-Id`.
- Não será implementada autenticação nesta versão.
- O frontend usará o proxy `/api` já configurado no Vite.
- O backend permanecerá em CommonJS.
- O frontend permanecerá em React com componentes funcionais e Hooks.

## 11. Riscos e mitigação

| Risco | Mitigação |
| --- | --- |
| Perda dos metadados ao reiniciar o backend | Documentar que a persistência em memória é uma limitação desta fase. |
| Arquivo físico sem metadado correspondente | Tratar falhas de registro e definir limpeza do arquivo quando necessário. |
| Traversal de diretórios | Gerar nomes físicos pelo ID e resolver caminhos dentro de `STORAGE_DIR`. |
| Uploads excessivamente grandes | Configurar limite do `multer` por `MAX_FILE_SIZE`. |
| Colisão de nomes | Nunca usar apenas `originalName` como nome físico. |
| Arquivo removido manualmente | Retornar `404` no download e não expor caminho interno. |
| Ausência de autenticação real | Considerar `X-User-Id` apenas uma identificação de demonstração, não um mecanismo de segurança. |

## 12. Critérios gerais de aceite

- O usuário consegue enviar um arquivo válido.
- O arquivo aparece no diretório local configurado.
- Os metadados aparecem na listagem.
- O usuário consegue baixar o arquivo pelo ID.
- Arquivos inexistentes retornam `404`.
- Uploads acima do limite são rejeitados.
- O frontend funciona pelo proxy `/api`.
- O backend mantém a separação entre rotas, controllers, services e repositories.
- Nenhuma implementação utiliza armazenamento externo.
- A execução dos arquivos de backend e frontend não faz parte desta etapa da especificação.
