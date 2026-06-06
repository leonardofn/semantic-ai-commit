import type {
  GenerateContentConfig,
  GenerateContentParameters,
  SchemaUnion
} from '@google/genai' with { 'resolution-mode': 'import' };

export interface IAIGenerateContentConfig extends GenerateContentConfig {}

export interface IAIGenerateContentParameters extends GenerateContentParameters {}

export interface IAIGenerateResponse {
  text: ICommitMessageResponse | undefined;
}

export interface ICommitMessageResponse {
  type: string;
  subject: string;
  body: string;
  scope: string;
}

export type AIResponseSchema = SchemaUnion;

export interface IAIClient {
  generateContent(params: IAIGenerateContentParameters): Promise<IAIGenerateResponse>;
}

export type AIClientFactory = (apiKey: string) => IAIClient;
