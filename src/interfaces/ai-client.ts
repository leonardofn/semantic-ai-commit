export interface IAIGenerateResponse {
  text: string | undefined;
}

export interface IAIClient {
  generateContent(params: unknown): Promise<IAIGenerateResponse>;
}

export type AIClientFactory = (apiKey: string) => IAIClient;
