# Semantic AI Commit

![Version](https://img.shields.io/badge/version-0.2.2-blue.svg) ![VS Code](https://img.shields.io/badge/VS%20Code-1.91.0%2B-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Contributors](https://img.shields.io/badge/contributors-1-orange.svg)

![Logo](https://raw.githubusercontent.com/leonardofn/semantic-ai-commit/main/assets/images/logo.png)

Gere mensagens de commit semânticas automaticamente, seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), com o poder da IA. Esta extensão integra-se ao VS Code e ao Git para facilitar a criação de mensagens de commit claras, concisas e padronizadas.

## Funcionalidades

- Geração automática de mensagens de commit semânticas com a IA.
- Suporte à seleção do modelo de IA nas configurações.
- Segue o padrão Conventional Commits.
- Suporte para mensagens em português do Brasil e inglês, com foco em clareza e concisão.
- Comando disponível na barra de ações do Git (SCM) e paleta de comandos.

## Requisitos

- VS Code v1.91.0 ou superior
- Conta e chave de API de IA

## Configuração da Extensão

Esta extensão contribui com as seguintes configurações:

- `semantic-ai-commit.apiKey`: **Chave de API de IA**. Defina sua chave de API de IA para habilitar a geração de mensagens de commit.
- `semantic-ai-commit.aiModel`: **Modelo de IA**. Permite selecionar o modelo de IA a ser utilizado.

Para configurar, acesse as configurações do VS Code e procure por "Semantic AI Commit" ou adicione no `settings.json`:

```json
{
  "semantic-ai-commit.apiKey": "SUA_CHAVE_AQUI",
  "semantic-ai-commit.aiModel": "gemini-3-flash-preview" // Padrão
}
```

## Como Usar

1. Faça alterações e prepare (stage) os arquivos no Git.
2. Clique no botão "Semantic AI Commit: Gerar Mensagem de Commit" na barra do SCM ou execute o comando pela paleta (`Ctrl+Shift+P` > "Semantic AI Commit: Gerar Mensagem de Commit").
3. A mensagem gerada será preenchida automaticamente no campo de commit.

### Menu SCM

![Demo SCM](https://raw.githubusercontent.com/leonardofn/semantic-ai-commit/main/assets/demos/scm.gif)

### Paleta de Comandos

![Demo Command Palette](https://raw.githubusercontent.com/leonardofn/semantic-ai-commit/main/assets/demos/command-palette.gif)

## Comandos Disponíveis

- `Semantic AI Commit: Gerar Mensagem de Commit`: Gera uma mensagem de commit semântica usando IA e preenche o campo de commit automaticamente. O comando também está disponível no menu do SCM quando o provedor Git está ativo.
- `Semantic AI Commit: Alterar Idioma`: Alterna entre português do Brasil e inglês para as mensagens de commit geradas.
- `Semantic AI Commit: Alterar Modelo de IA`: Permite escolher o modelo de IA a ser utilizado para geração das mensagens.

---

## Contribuindo

Pull requests são bem-vindos! Para sugestões, abra uma issue.

---

## Testes

O projeto conta com testes automatizados para as principais funcionalidades e utilitários exportados. Para rodar os testes:

```bash
npm run test
```

---

**Desfrute de commits mais inteligentes!**
