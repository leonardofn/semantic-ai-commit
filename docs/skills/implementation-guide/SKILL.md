# Skill: Implementation Guide - Semantic AI Commit

Esta skill fornece as diretrizes para a implementação de novas funcionalidades, garantindo a manutenção da arquitetura de separação de responsabilidades.

## 🛠️ Padrão de Implementação

Sempre que adicionar uma nova funcionalidade, siga a hierarquia:
`Comando (UI/Orquestração)` $\rightarrow$ `Serviço (Lógica de Negócio)` $\rightarrow$ `Interface/Tipo (Contrato)`.

### 1. Adicionando um novo Comando

Os comandos são a porta de entrada da extensão.

- **Local**: `src/commands/`
- **Responsabilidade**:
  - Registrar o comando no `package.json`.
  - Capturar inputs do usuário (ex: `vscode.window.showInputBox`).
  - Chamar os serviços necessários.
  - Tratar erros de alto nível e exibir notificações ao usuário.
- **O que NÃO fazer**: Não implemente lógica de negócio, chamadas de API ou manipulação de arquivos Git diretamente no comando.

### 2. Adicionando um novo Serviço

Os serviços contêm a "verdade" da aplicação.

- **Local**: `src/services/`
- **Responsabilidade**:
  - Implementar a lógica específica (ex: processamento de texto, requisições HTTP, comandos shell).
  - Ser agnóstico à UI do VS Code sempre que possível (receba parâmetros simples em vez de objetos do `vscode`).
  - Retornar tipos fortes definidos em `src/types/` ou `src/interfaces/`.
- **O que NÃO fazer**: Não exiba mensagens de erro via `vscode.window.showErrorMessage` dentro do serviço; lance exceções ou retorne objetos de erro para que o Comando decida como notificar o usuário.

### 3. Definição de Contratos

- **Local**: `src/interfaces/` ou `src/types/`
- **Regra**: Toda comunicação entre Comando e Serviço deve ser tipada. Evite o uso de `any`.

## 📋 Checklist de Verificação

- [ ] O comando apenas orquestra?
- [ ] A lógica de negócio está isolada em um serviço?
- [ ] Foram criados tipos/interfaces para as novas entradas e saídas?
- [ ] O arquivo segue a nomenclatura `kebab-case.ts`?
- [ ] O código foi formatado com `npm run format`?
