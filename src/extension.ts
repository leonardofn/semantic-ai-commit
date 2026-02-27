import simpleGit, { SimpleGit } from 'simple-git';
import * as vscode from 'vscode';
import { GeminiModel } from './enums/gemini-model';
import { ApiErrorMessage, ApiErrorResponse } from './interfaces/api-error';
import { API, GitExtension } from './types/git';

const extensionName = 'semantic-ai-commit';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Comando para gerar mensagens de commit
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

  // Comando para alterar o idioma das mensagens de commit
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

  // Comando para selecionar o modelo Gemini
  const changeModelCommand = vscode.commands.registerCommand(
    `${extensionName}.changeGeminiModel`,
    async () => {
      const modelOptions = [
        {
          label: 'Gemini 3.1 Pro',
          description:
            'Modelo de raciocínio mais avançado do Gemini, capaz de resolver problemas complexos.',
          value: GeminiModel.GEMINI_3_1_PRO_PREVIEW
        },
        {
          label: 'Gemini 3 Flash',
          description:
            'combina as capacidades de raciocínio do Gemini 3 Pro com os níveis de latência, eficiência e custo da linha Flash.',
          value: GeminiModel.GEMINI_3_FLASH_PREVIEW
        },
        {
          label: 'Gemini 3 Pro',
          description:
            'Modelo de raciocínio mais avançado do Gemini, capaz de resolver problemas complexos.',
          value: GeminiModel.GEMINI_3_PRO_PREVIEW
        },
        {
          label: 'Gemini 2.5 Flash',
          description:
            'Modelo mais rápido e eficiente, ideal para tarefas simples.',
          value: GeminiModel.GEMINI_2_5_FLASH
        },
        {
          label: 'Gemini 2.5 Pro',
          description:
            'Modelo de raciocínio mais avançado do Gemini, capaz de resolver problemas complexos.',
          value: GeminiModel.GEMINI_2_5_PRO
        }
      ];

      const selected = await vscode.window.showQuickPick(modelOptions, {
        placeHolder: 'Selecione o modelo Gemini para gerar commits'
      });

      if (selected) {
        const config = vscode.workspace.getConfiguration(extensionName);
        await config.update(
          'geminiModel',
          selected.value,
          vscode.ConfigurationTarget.Global
        );
        vscode.window.showInformationMessage(
          `Modelo Gemini alterado para: ${selected.label}`
        );
      }
    }
  );

  context.subscriptions.push(
    generateCommand,
    changeLanguageCommand,
    changeModelCommand
  );
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

  // Lendo configurações
  const config = vscode.workspace.getConfiguration(extensionName);
  const language = config.get<string>('language') || 'pt-BR';
  const isEnglish = language === 'en';
  const geminiModel =
    (config.get<string>('geminiModel') as GeminiModel) || GeminiModel.GEMINI_3_FLASH_PREVIEW;

  const {
    GoogleGenAI,
    Type,
    ApiError,
    HarmBlockThreshold,
    HarmCategory,
    ThinkingLevel
  } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    Você é uma IA especialista em gerar mensagens de commit seguindo o padrão Conventional Commits.

    Analise o diff abaixo e gere UMA ÚNICA LINHA de mensagem de commit, curta, clara e objetiva, SEM EXPLICAÇÕES.

    CONTEXTO:
    - O diff representa alterações em um repositório de código.
    - A mensagem deve descrever a intenção principal da mudança, não detalhes técnicos.

    IDIOMA DA RESPOSTA:
    - Responda apenas em ${isEnglish ? 'English' : 'Português do Brasil'}.

    REGRAS OBRIGATÓRIAS:
    - Estrutura: <tipo>(<escopo opcional>): <descrição>
    - Tipos permitidos:
      feat: nova funcionalidade
      fix: correção de bug
      docs: alteração na documentação
      style: alteração de formatação, sem impacto no código
      refactor: refatoração sem mudança de comportamento
      test: adição/modificação de testes
      chore: tarefas de manutenção (build, dependências, etc.)
      perf: melhoria de performance
    - O escopo é opcional, curto e entre parênteses.
    - Máximo de 100 caracteres.
    - Use sempre o modo imperativo.
    - NÃO inclua nomes de arquivos, funções, classes, variáveis, datas, números de ticket ou nomes próprios.
    - NÃO copie nada do diff.
    - NÃO explique, apenas forneça a mensagem.
    - NÃO use frases genéricas como "atualiza código" ou "faz alterações".

    ORIENTAÇÕES:
    - Se o diff for ambíguo, gere a descrição mais provável da intenção.
    - Seja direto e objetivo.
    - NÃO gere markdown, apenas texto puro no campo "commitMessage".

    DIFF PARA ANÁLISE:
    ${diff}
  `;

  try {
    const response = await ai.models.generateContent({
      model: geminiModel,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.MEDIUM
        },
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
          }
        ],
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            commitMessage: {
              type: Type.STRING
            }
          }
        }
      },
      contents: prompt
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
    let errorMessage =
      'Erro ao gerar a mensagem de commit com o Gemini. Por favor, tente novamente.';

    if (error instanceof ApiError) {
      const apiError = error as ApiErrorResponse;
      try {
        const messageParsed: ApiErrorMessage = JSON.parse(apiError.message);
        errorMessage = messageParsed.error?.message || error.message;
      } catch {
        errorMessage = error.message;
      }
    }

    vscode.window.showErrorMessage(errorMessage);

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
export {
  generateCommitMessageWithAI,
  getApiKeyOrPrompt,
  getGitExtensionAPI,
  getStagedDiff,
  removerMarkdown
};

