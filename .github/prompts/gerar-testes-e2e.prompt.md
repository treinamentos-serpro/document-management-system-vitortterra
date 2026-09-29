---
description: Gera testes end-to-end usando Playwright
name: gerar-testes-e2e
agent: agent
---

# Gerar testes end-to-end

Implemente testes end-to-end automatizados para o Document Management System usando Playwright.

## Antes de implementar

- Consulte as instruções do repositório e verifique a implementação atual da interface, da API e os scripts/dependências existentes. Use o comportamento implementado como referência; não invente contratos nem altere funcionalidades da aplicação apenas para acomodar os testes.
- Confira se o Playwright já está configurado. Se não estiver, adicione apenas as dependências, os scripts e a configuração mínimos para executar os testes.

## Requisitos

- Salve os arquivos de teste em `e2e/test/`, relativo à raiz do repositório. Coloque a configuração e os auxiliares no local apropriado, evitando duplicação.
- Cubra os fluxos essenciais disponíveis: estado inicial da listagem, envio bem-sucedido de um arquivo e sua exibição na lista, download do arquivo e erros relevantes, como envio sem arquivo ou falha da API. Ajuste os cenários às validações e mensagens existentes.
- Inicie frontend e backend localmente durante a execução dos testes, usando a configuração de servidor do Playwright quando apropriado. Não dependa de serviços externos nem de processos iniciados manualmente.
- Isole cada execução: use arquivos de teste criados localmente, evite depender de dados de execuções anteriores e limpe os arquivos temporários ao final. Não apague nem sobrescreva arquivos preexistentes em `backend/storage`.
- Use seletores acessíveis e assertions sobre resultados observáveis na interface ou no download. Evite pausas fixas, dependência da ordem dos testes e estado compartilhado entre casos.
- Mantenha os testes claros e concisos, siga as convenções do projeto e não adicione abstrações ou dependências sem necessidade.
- Execute os testes E2E e informe os comandos usados e o resultado. Se algum cenário não puder ser isolado com a infraestrutura atual, explique a limitação em vez de mascará-la ou enfraquecer a assertion.
