# Semantic AI Commit

![](https://img.shields.io/badge/version-0.0.1-blue.svg) ![VS Code](https://img.shields.io/badge/VS%20Code-1.91.0%2B-blue.svg) ![License](https://img.shields.io/badge/license-MIT-green.svg) ![Contributors](https://img.shields.io/badge/contributors-1-orange.svg)

![Logo](https://raw.githubusercontent.com/leonardofn/semantic-ai-commit/main/assets/logo.png)

Gere mensagens de commit semânticas automaticamente, seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/), com o poder da IA Gemini do Google. Esta extensão integra-se ao VS Code e ao Git para facilitar a criação de mensagens de commit claras, concisas e padronizadas, em português do Brasil.

## Funcionalidades

- Geração automática de mensagens de commit semânticas com IA (Gemini).
- Segue o padrão Conventional Commits.
- Mensagens em português do Brasil, com foco em clareza e concisão.
- Comando disponível na barra de ações do Git (SCM) e paleta de comandos.

## Requisitos

- VS Code v1.91.0 ou superior
- Conta e chave de API do [Google Gemini](https://aistudio.google.com/app/apikey)

## Configuração da Extensão

Esta extensão contribui com a seguinte configuração:

- `semantic-ai-commit.apiKey`: **Chave de API do Gemini**. Defina sua chave de API do Gemini para habilitar a geração de mensagens de commit.

Para configurar, acesse as configurações do VS Code e procure por "Semantic AI Commit" ou adicione no `settings.json`:

```json
{
 "semantic-ai-commit.apiKey": "SUA_CHAVE_AQUI"
}
```

## Como Usar

1. Faça alterações e prepare (stage) os arquivos no Git.
2. Clique no botão "Semantic AI Commit: Gerar Mensagem de Commit" na barra do SCM ou execute o comando pela paleta (`Ctrl+Shift+P` > "Semantic AI Commit: Gerar Mensagem de Commit").
3. A mensagem gerada será preenchida automaticamente no campo de commit.

## Comandos Disponíveis

- `Semantic AI Commit: Gerar Mensagem de Commit`: Gera uma mensagem de commit semântica usando IA e preenche o campo de commit automaticamente.

O comando também está disponível no menu do SCM quando o provedor Git está ativo.

---

## Contribuindo

Pull requests são bem-vindos! Para sugestões, abra uma issue.

---

**Desfrute de commits mais inteligentes!**
