import type {
  GenerateContentConfig,
  GenerateContentParameters
} from '@google/genai' with { 'resolution-mode': 'import' };

export interface IAIGenerateContentConfig extends GenerateContentConfig {}

export interface IAIGenerateContentParameters extends GenerateContentParameters {}

export interface IAIGenerateResponse {
  text: string | undefined;
}

export interface IAIClient {
  generateContent(
    params: IAIGenerateContentParameters
  ): Promise<IAIGenerateResponse>;
}

export type AIClientFactory = (apiKey: string) => IAIClient;
