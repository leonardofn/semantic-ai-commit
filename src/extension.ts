import simpleGit, { SimpleGit } from 'simple-git';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { API, GitExtension } from './types/git';

const extensionName = 'semantic-ai-commit';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const generateCommand = vscode.commands.registerCommand(
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

  const changeLanguageCommand = vscode.commands.registerCommand(
    `${extensionName}.changeLanguage`,
    async () => {
      const options = [
        {
          label: 'Português do Brasil',
          value: 'pt-BR',
          description: 'Mensagens em Português'
        },
        { label: 'English', value: 'en', description: 'Messages in English' }
      ];

      const selected = await vscode.window.showQuickPick(options, {
        placeHolder: 'Selecione o idioma das mensagens de commit'
      });

      if (selected) {
        const config = vscode.workspace.getConfiguration(extensionName);
        // Atualiza a configuração globalmente
        await config.update(
          'language',
          selected.value,
          vscode.ConfigurationTarget.Global
        );

        vscode.window.showInformationMessage(
          `Idioma do Semantic AI Commit alterado para: ${selected.label}`
        );
      }
    }
  );

  context.subscriptions.push(generateCommand, changeLanguageCommand);
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

function removerMarkdown(markdownString: string) {
  let textoLimpo = markdownString;

  // Remove negrito e itálico
  textoLimpo = textoLimpo.replace(/\*\*(.*?)\*\*/g, '$1');
  textoLimpo = textoLimpo.replace(/__(.*?)__/g, '$1');
  textoLimpo = textoLimpo.replace(/\*(.*?)\*/g, '$1');
  textoLimpo = textoLimpo.replace(/_(.*?)_/g, '$1');

  // Remove cabeçalhos
  textoLimpo = textoLimpo.replace(/^#+\s*(.*)$/gm, '$1');

  // Remove citações
  textoLimpo = textoLimpo.replace(/^>\s+(.*)$/gm, '$1');

  // Remove listas
  textoLimpo = textoLimpo.replace(/^\s*[\*\-\+]\s+(.*)$/gm, '$1');
  textoLimpo = textoLimpo.replace(/^\s*\d+\.\s+(.*)$/gm, '$1');

  // Remove linhas horizontais
  textoLimpo = textoLimpo.replace(/^\s*[\*\-_]{3,}\s*$/gm, '');

  // Remove links e imagens
  textoLimpo = textoLimpo.replace(/!\[.*?\]\(.*?\)/g, '');
  textoLimpo = textoLimpo.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // Remove código inline e blocos
  textoLimpo = textoLimpo.replace(/```([\s\S]*?)```/g, '$1');
  textoLimpo = textoLimpo.replace(/`([^`]+)`/g, '$1');

  return textoLimpo.trim();
}

// This method is called when your extension is deactivated
export function deactivate() {}

// Export functions for testing
export { generateCommitMessageWithAI, getApiKeyOrPrompt, getGitExtensionAPI, getStagedDiff, removerMarkdown };

