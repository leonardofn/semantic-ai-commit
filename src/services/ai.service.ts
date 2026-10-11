import { Messages } from '../constants/messages';
import { AIModel } from '../enums/ai-model';
import type { ICommitResponse } from '../interfaces/ai-client';
import commitPromptTemplate from '../prompts/commit-prompt';

export class AIService {
  constructor(
    private readonly apiKey: string,
    private readonly model: AIModel,
    private readonly language: string
  ) {}

  async generateCommitMessage(diff: string): Promise<string | null> {
    const { GoogleGenAI, ApiError } = await import('@google/genai');

    try {
      const ai = new GoogleGenAI({ apiKey: this.apiKey });

      const interaction = await ai.interactions.create({
        model: this.model,
        generation_config: {
          thinking_level: 'low',
          temperature: 0.2, // Baixa criatividade, alta precisão
          max_output_tokens: 5000
        },
        system_instruction: this.buildPrompt(),
        input: `Aqui está o diff para análise:\n\n${diff}`,
        store: false,
        response_format: {
          type: 'text',
          mime_type: 'application/json',
          schema: {
            type: 'object',
            properties: {
              type: { type: 'string', description: Messages.schema.typeDescription },
              scope: { type: 'string', description: Messages.schema.scopeDescription },
              subject: { type: 'string', description: Messages.schema.subjectDescription },
              body: { type: 'string', description: Messages.schema.bodyDescription }
            },
            required: ['type', 'subject']
          }
        }
      });

      // Validação do Status da Interação
      if (interaction.status !== 'completed') {
        switch (interaction.status) {
          case 'incomplete':
            // Ocorre principalmente quando max_output_tokens é atingido
            // ou se filtros de segurança cortaram a resposta
            throw new Error(
              Messages.ai.interactionIncomplete(interaction.usage?.total_output_tokens ?? 0)
            );
          case 'failed':
            throw new Error(Messages.ai.interactionFailed);
          case 'cancelled':
            throw new Error(Messages.ai.interactionCancelled);
          default:
            throw new Error(Messages.ai.unexpectedStatus(interaction.status));
        }
      }

      // Parse e Integridade dos Dados
      if (!interaction.output_text) {
        throw new Error(Messages.ai.invalidOutputText);
      }

      try {
        const data: ICommitResponse = JSON.parse(interaction.output_text);

        if (!data.type || !data.subject) {
          throw new Error(Messages.ai.missingRequiredFields);
        }

        const { type, scope, subject, body } = data;
        const header = `${type}${scope ? `(${scope})` : ''}: ${subject}`;
        const fullCommit = body ? `${header}\n\n${body}` : header;
        return fullCommit;
      } catch (parseError) {
        throw new Error(Messages.ai.invalidJson((parseError as Error).message));
      }
    } catch (error: unknown) {
      // Tratamento de Erros da API / SDK
      if (error instanceof ApiError) {
        // Erros específicos do SDK da Google
        console.error(`[Gemini ApiError] Status HTTP: ${error.status}`);
        console.error(`Mensagem: ${error.message}`);

        switch (error.status) {
          case 400:
            throw new Error(Messages.ai.invalidApiParams);
          case 401:
            throw new Error(Messages.ai.invalidApiKey);
          case 403:
            throw new Error(Messages.ai.forbiddenAccess);
          case 404:
            throw new Error(Messages.ai.modelNotFound);
          case 429:
            // Rate Limit / Quota esgotada
            throw new Error(Messages.ai.rateLimitExceeded);
          case 500:
          case 503:
            throw new Error(Messages.ai.serviceUnavailable);
          default:
            throw new Error(Messages.ai.apiError(error.status, error.message));
        }
      }

      throw new Error(Messages.ai.unexpectedError((error as Error).message));
    }
  }

  private buildPrompt(): string {
    const language =
      this.language === 'en' ? Messages.language.english : Messages.language.portuguese;

    return commitPromptTemplate.replace('{{LANGUAGE}}', language);
  }
}
