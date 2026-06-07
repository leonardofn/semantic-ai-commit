import * as vscode from 'vscode';
import { EXTENSION_NAME, EXTENSION_PUBLISHER } from '../constants/extension';
import { AIModel } from '../enums/ai-model';

export class ConfigService {
  private get config(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration(EXTENSION_NAME);
  }

  getApiKey(): string | undefined {
    return this.config.get<string>('apiKey');
  }

  getLanguage(): string {
    return this.config.get<string>('language') ?? 'pt-BR';
  }

  getAIModel(): AIModel {
    return this.config.get<AIModel>('aiModel') ?? AIModel.GEMINI_3_FLASH_PREVIEW;
  }

  async updateLanguage(value: string): Promise<void> {
    await this.config.update('language', value, vscode.ConfigurationTarget.Global);
  }

  async updateAIModel(value: AIModel): Promise<void> {
    await this.config.update('aiModel', value, vscode.ConfigurationTarget.Global);
  }

  async openSettings(): Promise<void> {
    await vscode.commands.executeCommand(
      'workbench.action.openSettings',
      `@ext:${EXTENSION_PUBLISHER}.${EXTENSION_NAME}`
    );
  }
}
