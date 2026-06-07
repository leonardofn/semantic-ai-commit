import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants/extension';
import { Messages } from '../constants/messages';
import { AIModel } from '../enums/ai-model';
import { ConfigService } from '../services/config.service';

const MODEL_OPTIONS: {
  label: string;
  description: string;
  value: AIModel;
}[] = [
  {
    label: 'Gemini 3.1 Pro',
    description: 'O modelo mais avançado para problemas altamente complexos.',
    value: AIModel.GEMINI_3_1_PRO_PREVIEW
  },
  {
    label: 'Gemini 3 Flash',
    description: 'O poder do Pro com a velocidade e eficiência do Flash.',
    value: AIModel.GEMINI_3_FLASH_PREVIEW
  },
  {
    label: 'Gemini 3 Pro',
    description: 'Raciocínio de alto desempenho para tarefas complexas.',
    value: AIModel.GEMINI_3_PRO_PREVIEW
  },
  {
    label: 'Gemini 2.5 Flash',
    description: 'Rápido e eficiente, ideal para tarefas simples.',
    value: AIModel.GEMINI_2_5_FLASH
  },
  {
    label: 'Gemini 2.5 Pro',
    description: 'Raciocínio avançado para resolução de problemas.',
    value: AIModel.GEMINI_2_5_PRO
  },
  {
    label: 'Gemma 4 26B A4B IT',
    description: 'Modelo Gemma 4 otimizado para eficiência e desempenho.',
    value: AIModel.GEMMA_4_26B_A4B_IT
  },
  {
    label: 'Gemma 4 31B',
    description: 'Modelo Gemma 4 de alta performance para raciocínio complexo.',
    value: AIModel.GEMMA_4_31B_IT
  }
];

export function registerChangeModelCommand(): vscode.Disposable {
  const configService = new ConfigService();

  return vscode.commands.registerCommand(`${EXTENSION_NAME}.changeAIModel`, async () => {
    const currentModel = configService.getAIModel();

    const items = MODEL_OPTIONS.map(opt => ({
      ...opt,
      picked: opt.value === currentModel
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: Messages.model.selectPlaceholder
    });

    if (!selected) return;

    await configService.updateAIModel(selected.value);
    vscode.window.showInformationMessage(Messages.model.changed(selected.label));
  });
}
