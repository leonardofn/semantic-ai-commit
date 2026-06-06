import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants/extension';
import { Messages } from '../constants/messages';
import { ConfigService } from '../services/config.service';

const LANGUAGE_OPTIONS = [
  {
    label: 'Português do Brasil',
    value: 'pt-BR',
    description: 'Mensagens em Português'
  },
  {
    label: 'English',
    value: 'en',
    description: 'Messages in English'
  }
];

export function registerChangeLanguageCommand(): vscode.Disposable {
  const configService = new ConfigService();

  return vscode.commands.registerCommand(`${EXTENSION_NAME}.changeLanguage`, async () => {
    const currentLanguage = configService.getLanguage();

    const items = LANGUAGE_OPTIONS.map(opt => ({
      ...opt,
      picked: opt.value === currentLanguage
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: Messages.language.selectPlaceholder
    });

    if (!selected) return;

    await configService.updateLanguage(selected.value);
    vscode.window.showInformationMessage(Messages.language.changed(selected.label));
  });
}
