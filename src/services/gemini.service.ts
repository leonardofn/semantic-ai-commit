import { GeminiModel } from '../enums/gemini-model';
import {
  AIClientFactory,
  IAIClient,
  IAIGenerateContentConfig,
  IAIGenerateContentParameters
} from '../interfaces/ai-client';
import { IApiErrorMessage } from '../interfaces/api-error';
import { ICommitMessageResponse } from '../interfaces/commit-message';

export class GeminiService {
  constructor(
    private readonly apiKey: string,
    private readonly model: GeminiModel,
    private readonly language: string,
    private readonly clientFactory?: AIClientFactory
  ) {}

  private buildPrompt(diff: string): string {
    const isEnglish = this.language === 'en';

    return `
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
  }

  async generateCommitMessage(diff: string): Promise<string | null> {
    let client: IAIClient;

    if (this.clientFactory) {
      client = this.clientFactory(this.apiKey);
    } else {
      const {
        GoogleGenAI,
        Type,
        HarmBlockThreshold,
        HarmCategory,
        ThinkingLevel
      } = await import('@google/genai');

      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const isGemini3 = this.model.toString().startsWith('gemini-3');
      const config: IAIGenerateContentConfig = {
        thinkingConfig: isGemini3
          ? { thinkingLevel: ThinkingLevel.MEDIUM }
          : undefined,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
          }
        ],
        responseMimeType: 'application/json',
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: { commitMessage: { type: Type.STRING } }
        }
      };

      // Wrap para satisfazer a interface IAIClient
      client = {
        generateContent: (params) => {
          const { contents } = params;
          return ai.models.generateContent({
            model: this.model,
            config,
            contents
          });
        }
      };
    }

    try {
      const response = await client.generateContent({
        contents: this.buildPrompt(diff)
      } as IAIGenerateContentParameters);

      const text = response.text;
      if (!text) return null;

      const commitMessage = (
        JSON.parse(text) as ICommitMessageResponse
      ).commitMessage?.trim();

      return commitMessage || null;
    } catch (error) {
      let errorMessage =
        'Erro ao gerar a mensagem de commit com o Gemini. Por favor, tente novamente.';

      // Tenta extrair mensagem de erro no formato da API do Gemini
      const rawMessage = (error as Error)?.message ?? '';
      try {
        const parsed: IApiErrorMessage = JSON.parse(rawMessage);
        if (parsed.error?.message) {
          errorMessage = parsed.error.message;
        } else if (rawMessage) {
          errorMessage = rawMessage;
        }
      } catch {
        if (rawMessage) errorMessage = rawMessage;
      }

      throw new Error(errorMessage);
    }
  }
}
