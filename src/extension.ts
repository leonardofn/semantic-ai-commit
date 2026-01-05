import simpleGit, { SimpleGit } from 'simple-git';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { API, GitExtension } from './types/git';

const extensionName = 'semantic-ai-commit';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    `${extensionName}.generateCommitMessage`,
    async (sourceControl?: any) => {
      // Recebe o argumento do VS Code
      const gitApi = getGitExtensionAPI();
      if (!gitApi) {
        vscode.window.showErrorMessage('A API do Git não foi encontrada.');
        return;
      }

      // Identificar qual repositório usar
      let repo = gitApi.repositories[0];

      if (sourceControl) {
        // Se o comando veio do ícone no menu SCM, procuramos o repositório correspondente
        const uri = sourceControl._rootUri || sourceControl.rootUri;
        if (uri) {
          const repoSCM = gitApi.repositories.find(
            (r) => r.rootUri.toString() === uri.toString()
          );
          repo = repoSCM || repo;
        }
      } else if (gitApi.repositories.length > 1) {
        // Se o comando veio pelo Ctrl+Shift+P e houver mais de um repo, pergunta qual usar
        const items = gitApi.repositories.map((r) => ({
          label: r.rootUri.fsPath.split('/').pop() || 'Repositório',
          description: r.rootUri.fsPath,
          repo: r
        }));

        const selected = await vscode.window.showQuickPick(items, {
          placeHolder: 'Selecione o repositório para gerar o commit'
        });

        if (!selected) return;
        repo = selected.repo;
      }

      if (!repo) {
        vscode.window.showErrorMessage('Nenhum repositório Git encontrado.');
        return;
      }

      // Passar o caminho do repositório específico para pegar o diff
      const repoPath = repo.rootUri.fsPath;
      const diff = await getStagedDiff(repoPath);

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
          cancellable: false
        },
        async () => {
          const commitMessage = await generateCommitMessageWithAI(diff);
          if (commitMessage) {
            repo.inputBox.value = commitMessage;
          }
        }
      );
    }
  );

  context.subscriptions.push(disposable);
}

async function getStagedDiff(repoPath: string): Promise<string | null> {
  try {
    const git: SimpleGit = simpleGit(repoPath);
    const diff = await git.diff(['--staged']);
    return diff || null;
  } catch (error) {
    vscode.window.showErrorMessage('Erro ao obter diff.');
    console.error('Erro ao obter diff:', error);
    return null;
  }
}

function getGitExtensionAPI(): API | undefined {
  const extensions = vscode.extensions;
  const gitExtension = extensions.getExtension<GitExtension>('vscode.git');

  return gitExtension?.exports?.getAPI(1);
}

async function generateCommitMessageWithAI(
  diff: string
): Promise<string | null> {
  const apiKey = await getApiKeyOrPrompt();
  if (!apiKey) return null;

  // Lendo a configuração de idioma
  const config = vscode.workspace.getConfiguration(extensionName);
  const language = config.get<string>('language') || 'pt-BR';

  const isEnglish = language === 'en';

  const { GoogleGenAI, Type } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `
    Você é uma IA especializada em gerar mensagens de commit, seguindo o padrão Conventional Commits. Sua tarefa é criar mensagens curtas, claras e concisas, que descrevam a finalidade da alteração no código.

    O idioma da resposta deve ser: ${
      isEnglish ? 'Inglês (English)' : 'Português do Brasil'
    }.

    ✅ Regras obrigatórias:
      - A mensagem de commit deve seguir o formato:
        <tipo>(<escopo opcional>): <descrição>

      - Utilize um dos seguintes tipos no início da mensagem:
        - feat: nova funcionalidade.
        - fix: correção de bug.
        - docs: alteração na documentação.
        - style: alteração que não afeta o significado (espaços em branco, formatação, ponto-e-vírgulas ausentes, etc.).
        - refactor: refatoração sem mudança de comportamento.
        - test: adição ou modificação de testes.
        - chore: tarefas de manutenção (build, dependências, etc.).
        - perf: melhorias de performance.

      - O escopo é opcional, mas pode ser incluído para dar contexto adicional. Deve estar entre parênteses, por exemplo:
        feat(parser): adiciona suporte a arrays

    ✏️ Diretrizes de escrita:
      - Escreva apenas uma linha com menos de 80 caracteres.
      - ${
        isEnglish
          ? 'Exemplo: "add support for X", "fix bug in Y"'
          : 'Exemplo: "adiciona suporte a X", "corrige erro em Y"'
      }.
      - Foque no propósito da mudança, não nos detalhes técnicos.
      - Evite nomes de arquivos, funções, classes, datas, nomes de pessoas ou números de tickets.

    ❌ Evite:
      - Mensagens com mais de uma linha.
      - Listar arquivos, funções ou classes modificadas.
      - Incluir datas, nomes próprios ou números de tickets.

    📎 Entrada esperada
      Você receberá um trecho de código (diff) como entrada. Analise-o e gere uma mensagem de commit apropriada conforme as regras acima.

    Aqui está o diff do código para analisar:
    ${diff};
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            commitMessage: {
              type: Type.STRING
            }
          }
        }
      }
    });

    const text = response.text;
    let commitMessage: string = '';

    if (text) {
      commitMessage = (<CommitMessageResponse>JSON.parse(text)).commitMessage;
    }

    if (!commitMessage) {
      vscode.window.showErrorMessage(
        'Não foi possível gerar a mensagem de commit. Por favor, tente novamente.'
      );

      return null;
    }

    return removerMarkdown(commitMessage);
  } catch (error) {
    console.error(error);
    vscode.window.showErrorMessage(
      'Erro ao gerar a mensagem de commit com o Gemini. Por favor, tente novamente.'
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
        /`([^`]+)`/g
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

async function getApiKeyOrPrompt(): Promise<string | null> {
  const config = vscode.workspace.getConfiguration(extensionName);
  const apiKey = config.get<string>('apiKey');

  if (!apiKey) {
    const action = 'Configurar Chave de API';
    const result = await vscode.window.showErrorMessage(
      'A chave de API do Google Gemini não está configurada. Por favor, configure-a nas configurações da extensão.',
      action
    );

    if (result === action) {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        `@ext:leodev.${extensionName}`
      );
    }

    return null;
  }

  return apiKey;
}

class CommitMessageResponse {
  commitMessage!: string;
}

// This method is called when your extension is deactivated
export function deactivate() {}
