# Instruction: Test Patterns - Semantic AI Commit

Este documento define as convenções e padrões para a escrita de testes unitários e de integração no projeto.

## 🧪 Estratégia de Testes

O foco principal são os **testes unitários para a camada de serviços**, onde reside a lógica de negócio complexa.

### 1. Testando Serviços (`src/services/`)

Todos os serviços devem ter um arquivo de teste correspondente em `src/test/services/` (ex: `git.service.test.ts`).

#### Mocking de Dependências

Para evitar efeitos colaterais e tornar os testes determinísticos, utilize mocks para:

- **VS Code API**: Use mocks para `vscode.window`, `vscode.workspace` e `vscode.commands`.
- **API de IA**: Nunca faça chamadas reais à API durante os testes. Implemente um mock do `IAIClient` ou utilize bibliotecas de mock para interceptar as requisições.
- **Git**: Use mocks para a biblioteca `simple-git` para simular diferentes saídas de `git diff --staged`.

### 2. Padrões de Escrita (Given/When/Then)

Siga a estrutura para clareza dos cenários:

- **Given** (Dado que): Configuração do estado inicial e mocks.
- **When** (Quando): A execução da ação que está sendo testada.
- **Then** (Então): A verificação do resultado esperado (assertions).

### 3. Cenários Obrigatórios

Para cada serviço, garanta a cobertura dos seguintes casos:

- **Caminho Feliz (Happy Path)**: O input é válido e o serviço retorna o resultado esperado.
- **Tratamento de Erros**:
  - O que acontece se a API de IA retornar um erro 500?
  - O que acontece se o `git diff` retornar vazio?
  - O que acontece se a `apiKey` estiver ausente?
- **Casos de Borda (Edge Cases)**: Arquivos excessivamente grandes no diff, caracteres especiais no escopo, etc.

## 🛠️ Ferramentas

- Framework: VS Code Extension Testing Framework.
- Assertion Library: `mocha` / `chai` (ou as inclusas no ambiente de teste do VS Code).
- Execução: `npm run test`.
