import { Messages } from '../constants/messages';
import { GeminiModel } from '../enums/gemini-model';
import {
  AIClientFactory,
  AIResponseSchema,
  IAIClient,
  IAIGenerateContentConfig
} from '../interfaces/ai-client';
import { IApiErrorMessage } from '../interfaces/api-error';
import commitPromptTemplate from '../prompts/commit-prompt';

export class GeminiService {
  constructor(
    private readonly apiKey: string,
    private readonly model: GeminiModel,
    private readonly language: string,
    private readonly clientFactory?: AIClientFactory
  ) {}

  async generateCommitMessage(diff: string): Promise<string | null> {
    let client: IAIClient;

    if (this.clientFactory) {
      client = this.clientFactory(this.apiKey);
    } else {
      const { GoogleGenAI, HarmBlockThreshold, HarmCategory, ThinkingLevel } =
        await import('@google/genai');

      const isGemini3 = this.model.toString().startsWith('gemini-3');

      const config: IAIGenerateContentConfig = {
        thinkingConfig: isGemini3 ? { thinkingLevel: ThinkingLevel.MEDIUM } : undefined,
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
          }
        ],
        systemInstruction: this.buildPrompt(),
        temperature: 0.1, // Baixa criatividade, alta precisão
        responseMimeType: 'application/json',
        responseSchema: this.createCommitSchema()
      };

      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      // Wrap para satisfazer a interface IAIClient
      client = {
        generateContent: async params => {
          const { model, contents } = params;
          const response = await ai.models.generateContent({
            config,
            model,
            contents
          });
          return {
            text: response.text ? JSON.parse(response.text) : null
          };
        }
      };
    }

    try {
      const response = await client.generateContent({
        model: this.model,
        contents: diff
      });

      const commitData = response.text;

      if (!commitData) {
        throw new Error(Messages.commit.noValidResponse);
      }

      const { type, scope, subject, body } = commitData;
      let commitMessage = type;

      if (scope) commitMessage += `(${scope})`;
      commitMessage += `: ${subject}`;
      if (body) commitMessage += `\n\n${body}`;

      return commitMessage;
    } catch (error) {
      let errorMessage = Messages.commit.geminiError;

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

  private buildPrompt(): string {
    const language =
      this.language === 'en' ? Messages.language.english : Messages.language.portuguese;

    return commitPromptTemplate.replace('{{LANGUAGE}}', language);
  }

  private createCommitSchema(): AIResponseSchema {
    return {
      type: 'OBJECT',
      properties: {
        type: {
          type: 'STRING',
          description: Messages.schema.typeDescription
        },
        scope: {
          type: 'STRING',
          description: Messages.schema.scopeDescription
        },
        subject: {
          type: 'STRING',
          description: Messages.schema.subjectDescription
        },
        body: {
          type: 'STRING',
          description: Messages.schema.bodyDescription
        }
      },
      required: ['type', 'subject']
    };
  }
}
