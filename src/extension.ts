import * as vscode from 'vscode';
import { registerChangeLanguageCommand } from './commands/change-language';
import { registerChangeModelCommand } from './commands/change-model';
import { registerGenerateCommitCommand } from './commands/generate-commit';

// This method is called when your extension is activated
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    registerGenerateCommitCommand(),
    registerChangeLanguageCommand(),
    registerChangeModelCommand()
  );
}

// This method is called when your extension is deactivated
export function deactivate(): void {}
