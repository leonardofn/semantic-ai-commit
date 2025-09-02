// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import simpleGit, { SimpleGit } from 'simple-git';
import * as vscode from 'vscode';
import { API, GitExtension } from './types/git';

const extensionName = 'semantic-ai-commit';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    `${extensionName}.generateCommitMessage`,
    async () => {
      const diff = await getStagedDiff();
      if (!diff) {
        vscode.window.showInformationMessage(
          'Nenhuma alteração preparada (staged) para o commit.'
        );
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.SourceControl,
          title: 'Gerando mensagem de commit com Gemini...',
          cancellable: false,
        },
        async (progress) => {
          const commitMessage = await generateCommitMessageWithAI(diff);

          if (!commitMessage){
            return;
          }

          const gitExtension =
            vscode.extensions.getExtension<GitExtension>('vscode.git');
          const gitApi = gitExtension?.exports?.getAPI(1) ?? ({} as API);
          const { repositories } = gitApi;

          if (repositories && repositories.length > 0) {
            const repo = gitApi.repositories[0];
            repo.inputBox.value = commitMessage;
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

async function getStagedDiff(): Promise<string> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) {
    vscode.window.showErrorMessage('Nenhum espaço de trabalho aberto.');
    return '';
  }

  const git: SimpleGit = simpleGit(workspaceFolders[0].uri.fsPath);
  const diff = await git.diff(['--staged']);
  return diff ?? '';
}

async function generateCommitMessageWithAI(
  diff: string
): Promise<string | null> {
  const apiKey = vscode.workspace
    .getConfiguration('semanticAiCommit')
    .get<string>('apiKey');
  if (!apiKey) {
    vscode.window.showErrorMessage(
      'A chave de API do Gemini não está configurada. Por favor, configure-a nas configurações do VS Code.'
    );
    return null;
  }

  const { GoogleGenAI, Type } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Você é uma IA especializada em gerar mensagens de commit em português do Brasil, seguindo o padrão Conventional Commits. Sua tarefa é criar mensagens curtas, claras e concisas, que descrevam a finalidade da alteração no código.

    ✅ Regras obrigatórias:
    - A mensagem de commit deve seguir este formato:
      <tipo>(<escopo opcional>): <descrição>
    - Use um dos seguintes tipos no início da mensagem:
      - feat(<escopo opcional>): nova funcionalidade.
      - fix(<escopo opcional>): correção de bug.
      - docs(<escopo opcional>): alteração na documentação.
      - style(<escopo opcional>): mudanças de formatação (semântica intacta).
      - refactor(<escopo opcional>): refatoração sem mudança de comportamento.
      - test(<escopo opcional>): adição ou modificação de testes.
      - chore(<escopo opcional>): tarefas de manutenção (build, dependências, etc.).
      - perf(<escopo opcional>): melhorias de performance.

    ✏️ Escreva apenas uma linha.
        - Use sempre o imperativo presente (ex: "adiciona suporte a X", "corrige erro em Y").
        - Foque no propósito da mudança, não nos detalhes técnicos.
        - O escopo é opcional, mas pode ser incluído entre parênteses após o tipo (ex: feat(api): adiciona autenticação JWT).

    ❌ Evite:
        - Mensagens com mais de uma linha.
        - Listar arquivos, funções ou classes modificadas.
        - Incluir datas, nomes de pessoas ou números de tickets.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
            {
              text: 'Dado o seguinte diff do git, gere a mensagem de commit:\n\n',
            },
            {
              text: diff,
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            commitMessage: {
              type: Type.STRING,
            },
          },
        },
      },
    });

    const text = response.text;
    let commitMessage: string = '';

    if (text) {
      commitMessage = (<CommitMessageResponse>JSON.parse(text)).commitMessage;
    }

    return commitMessage ? removerMarkdown(commitMessage) : null;
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage(
      'Erro ao gerar a mensagem de commit com o Gemini.'
    );

    return null;
  }

  function removerMarkdown(markdownString: string) {
    // Regex para remover a formatação Markdown
    const regex = new RegExp(
      [
        // Negrito e itálico: **, **, *, * ou _
        /(\*\*|__)(?=\S)(.+?)(?!\S)\1/g,
        /(\*|_)(?=\S)(.+?)(?!\S)\1/g,

        // Cabeçalhos (h1, h2, etc.)
        /^(#+)\s*(.*)/gm,

        // Citações em bloco (>)
        /^>\s+(.*)/gm,

        // Listas: -, *, 1.
        /^\s*(\*|\-|\+)\s+(.*)/gm,
        /^\s*\d+\.\s+(.*)/gm,

        // Linhas horizontais (---)
        /^\s*([*-_])\s*\1\s*\1(\s*)$/gm,

        // Links: [texto](url)
        /\[(.*?)\]\((.*?)\)/g,

        // Imagens: ![alt](url)
        /!\[(.*?)\]\((.*?)\)/g,

        // Código inline: `código`
        /`([^`]+)`/g,
      ]
        .map((r) => r.source)
        .join('|'),
      'gm'
    );

    // Substitui todas as correspondências por uma string vazia
    const textoLimpo = markdownString.replace(regex, (match, p1, p2, p3) => {
      // Para links e imagens, extrai apenas o texto
      if (match.startsWith('[') || match.startsWith('![')) {
        return p1; // p1 é o conteúdo dentro de []
      }
      // Para cabeçalhos, citações, listas, retorna o segundo grupo de captura
      if (
        match.startsWith('#') ||
        match.startsWith('>') ||
        match.startsWith('-') ||
        match.startsWith('*') ||
        match.startsWith('+') ||
        /^\s*\d+\.\s+/.test(match)
      ) {
        return p2;
      }
      // Para negrito/itálico, retorna o segundo grupo
      if (
        match.startsWith('**') ||
        match.startsWith('__') ||
        match.startsWith('*') ||
        match.startsWith('_')
      ) {
        return p2;
      }
      // Para código inline, retorna o primeiro grupo
      if (match.startsWith('`')) {
        return p1;
      }
      // Para tudo o mais, retorna uma string vazia
      return '';
    });

    return textoLimpo.trim();
  }
}

class CommitMessageResponse {
  commitMessage!: string;
}

// This method is called when your extension is deactivated
export function deactivate() {}
