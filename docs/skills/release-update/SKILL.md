# Release Update Skill

Esta skill automatiza o processo de atualizar o arquivo `CHANGELOG.md` do projeto, analisando os commits realizados desde a última versão registrada.

## 🎯 Objetivo

Gerar a entrada de uma nova versão no `CHANGELOG.md`, atualizar a versão no `package.json` e revisar a documentação no `README.md` baseando-se no histórico de commits do Git, mantendo a consistência de formato e estilo do projeto.

## 🛠️ Fluxo de Execução

1. **Identificar a Última Versão**:

- Ler o arquivo `CHANGELOG.md`.
- Identificar a versão mais recente listada (ex: `v0.2.2`).

2. **Extrair Commits**:

- Utilizar a ferramenta de git log (`mcp_gitkraken_cli_git_log_or_diff` com `action='log'`).
- Buscar commits no intervalo entre a última versão identificada e o `HEAD` (ex: `v0.2.2..HEAD`).

3. **Analisar e Categorizar**:

- Analisar as mensagens de commit.
- Agrupar as alterações por tipo (baseado em Conventional Commits):
  - `feat`: Novas funcionalidades.
  - `fix`: Correções de bugs.
  - `refactor`: Mudanças de código que não corrigem bugs nem adicionam funcionalidades.
  - `chore`, `style`, `docs`: Outras melhorias e manutenções.
- Filtrar commits irrelevantes (ex: merges simples ou ajustes triviais de formatação) se necessário.

4. **Sintetizar Mudanças**:

- Transformar os commits técnicos em descrições claras e concisas para o usuário final.
- Manter o tom impessoal e direto.

5. **Atualizar o Arquivo**:

- Inserir a nova versão (ex: `v0.3.0`) no topo da lista de versões do `CHANGELOG.md`.
- Incluir a data atual no formato `DD/MM/AAAA`.
- Listar as funcionalidades sintetizadas em tópicos.
- Garantir que a indentação e o estilo de Markdown correspondam ao resto do arquivo.

6. **Atualizar Versão do Projeto**:

- Abrir o arquivo `package.json`.
- Localizar o campo `"version"`.
- Atualizar o valor para a nova versão definida (ex: `0.3.0`).

7. **Revisar Documentação Principal**:

- Analisar as mudanças sintetizadas no passo 4.
- Verificar se alguma `feat` (funcionalidade) altera a forma de uso, a instalação ou as capacidades descritas no `README.md`.
- Se houver impacto, atualizar as seções correspondentes do `README.md` para refletir as novas capacidades do projeto.

## 📖 Como Usar (Para o Usuário)

Se você estiver utilizando o GitHub Copilot ou outro assistente de IA, pode disparar esta skill de três formas:

1. **Referência Direta**:

> _"Execute a skill em `docs/skills/release-update/SKILL.md` para preparar a versão X.X.X do projeto."_

2. **Referência via @workspace**:

> _"@workspace Use a skill `release-update` para atualizar a versão do projeto com base nos commits atuais."_

3. **Referência por Objetivo**:

> _"Prepare o projeto para o próximo release: atualize o versionamento no `package.json`, gere o `CHANGELOG.md` e revise o `README.md` seguindo as skills do projeto."_

## ⚠️ Considerações Importantes

- **Data**: Sempre utilize a data atual do sistema.
- **Estilo**: Não altere a estrutura global do `CHANGELOG.md`, apenas adicione a nova entrada.
- **Sincronização**: a versão no `package.json` deve ser identica à versão adicionada no `CHANGELOG.md` (sem o prefixo 'v').
- **Impacto no README**: Não atualize o `README.md` para mudanças triviais (como `chore` ou `style`), apenas para alterações que impactem a experiência do usuário ou funcionalidades do software.
- **Precisão**: Certifique-se de que todas as funcionalidades principais foram capturadas.
