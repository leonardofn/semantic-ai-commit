# AI Agent Instructions - Semantic AI Commit

Este projeto é uma extensão do VS Code que utiliza modelos de IA para gerar mensagens de commit semânticas baseadas nos arquivos alterados (`staged`).

## 🚀 Desenvolvimento e Build

Para manter o projeto e executar verificações, utilize os seguintes comandos:

- **Build**: `npm run compile`
- **Modo Watch**: `npm run watch` (recomendado durante o desenvolvimento)
- **Testes**: `npm run test` (executa lint, build de testes e a suíte de testes)
- **Linting**: `npm run lint`
- **Formatação**: `npm run format`
- **Publicação**: `npm run package` seguido de `npm run publish`

## 🏗️ Arquitetura e Estrutura

O código está organizado em `src/` seguindo o padrão de separação de responsabilidades:

- `commands/`: Orquestradores de entrada. Cada comando registrado no `package.json` tem sua implementação aqui.
- `services/`: Lógica de negócio central.
    - `git.service.ts`: Interação com o Git e extração de diffs.
    - `ai.service.ts`: Integração com modelos de IA.
    - `config.service.ts`: Gestão de configurações da extensão.
- `prompts/`: Templates de prompt (`commit-prompt.md`) e lógica de construção do prompt.
- `interfaces/`, `types/` e `enums/`: Definições de contratos e tipos fortes.
- `constants/`: Mensagens de interface e strings reutilizáveis.

Para mais detalhes sobre a instalação e uso, consulte o [README.md](./README.md).

## 🔄 Fluxo de Geração de Commit

O fluxo principal (`semantic-ai-commit.generateCommitMessage`) segue este caminho:
1. `GitService` $\rightarrow$ Identifica o repositório e obtém o `git diff --staged`.
2. `ConfigService` $\rightarrow$ Valida a `apiKey` de IA.
3. `AIService` $\rightarrow$ Envia o diff + System Instruction (de `commit-prompt.md`) para a API.
4. **Parsing** $\rightarrow$ A resposta JSON da IA é formatada como: `tipo(escopo): assunto\n\ncorpo`.
5. **UI** $\rightarrow$ A mensagem é inserida no `inputBox` de commit do VS Code.

## 📏 Convenções de Código

- **Nomenclatura**:
    - Arquivos: `kebab-case.ts`
    - Classes: `PascalCase`
    - Constantes: `UPPER_SNAKE_CASE`
- **Design Patterns**:
    - **Service Pattern**: Lógica isolada em serviços para facilitar a manutenção e testes.
    - **Dependency Inversion**: Uso de `IAIClient` para abstrair o provedor de IA.
- **Estilo**: Siga rigorosamente o padrão de *Conventional Commits*.

## ⚠️ Pontos de Atenção

- **Filtros de Diff**: Arquivos como `package-lock.json`, `*.svg` e `*.min.js` são explicitamente ignorados no `GitService.getStagedDiff` para evitar ruído.
- **Escopo de Configuração**: As configurações são salvas no nível Global do VS Code.
- **Temperatura da IA**: A temperatura é fixada em $0.1$ para garantir respostas determinísticas e precisas.
