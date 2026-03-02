import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants/extension';
import { GeminiModel } from '../enums/gemini-model';
import { ConfigService } from '../services/config.service';

const MODEL_OPTIONS: {
  label: string;
  description: string;
  value: GeminiModel;
}[] = [
  {
    label: 'Gemini 3.1 Pro',
    description: 'O modelo mais avançado para problemas altamente complexos.',
    value: GeminiModel.GEMINI_3_1_PRO_PREVIEW
  },
  {
    label: 'Gemini 3 Flash',
    description: 'O poder do Pro com a velocidade e eficiência do Flash.',
    value: GeminiModel.GEMINI_3_FLASH_PREVIEW
  },
  {
    label: 'Gemini 3 Pro',
    description: 'Raciocínio de alto desempenho para tarefas complexas.',
    value: GeminiModel.GEMINI_3_PRO_PREVIEW
  },
  {
    label: 'Gemini 2.5 Flash',
    description: 'Rápido e eficiente, ideal para tarefas simples.',
    value: GeminiModel.GEMINI_2_5_FLASH
  },
  {
    label: 'Gemini 2.5 Pro',
    description: 'Raciocínio avançado para resolução de problemas.',
    value: GeminiModel.GEMINI_2_5_PRO
  }
];

export function registerChangeModelCommand(): vscode.Disposable {
  const configService = new ConfigService();

  return vscode.commands.registerCommand(
    `${EXTENSION_NAME}.changeGeminiModel`,
    async () => {
      const currentModel = configService.getGeminiModel();

      const items = MODEL_OPTIONS.map((opt) => ({
        ...opt,
        picked: opt.value === currentModel
      }));

      const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Selecione o modelo Gemini para gerar commits'
      });

      if (!selected) return;

      await configService.updateGeminiModel(selected.value);
      vscode.window.showInformationMessage(
        `Modelo Gemini alterado para: ${selected.label}`
      );
    }
  );
}
