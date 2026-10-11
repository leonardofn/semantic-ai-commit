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
    label: 'Gemini 3.8 Flash',
    description:
      'Modelo Flash mais inteligente, projetado para engenharia de software de longo prazo, agentes autônomos e fluxos de trabalho corporativos complexos.',
    value: AIModel.GEMINI_3_8_FLASH
  },
  {
    label: 'Gemini 3.6 Flash',
    description:
      'Modelo Flash da geração anterior, que equilibra velocidade e recursos multimodais em tarefas agênticas gerais e cotidianas.',
    value: AIModel.GEMINI_3_6_FLASH
  },
  {
    label: 'Gemini 3.5 Flash Lite',
    description:
      'Modelo 3.5 mais rápido e econômico para execução de alta capacidade de processamento.',
    value: AIModel.GEMINI_3_5_FLASH_LITE
  },
  {
    label: 'Gemini 3.1 Flash Lite',
    description:
      'Modelo multimodal econômico e de baixa latência otimizado para tarefas leves e de alta frequência.',
    value: AIModel.GEMINI_3_1_FLASH_LITE
  },
  {
    label: 'Gemini 3 Flash',
    description: 'O poder do Pro com a velocidade e eficiência do Flash.',
    value: AIModel.GEMINI_3_FLASH_PREVIEW
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
