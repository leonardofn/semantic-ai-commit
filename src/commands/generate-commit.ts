import * as vscode from 'vscode';
import { EXTENSION_NAME } from '../constants/extension';
import { Messages } from '../constants/messages';
import { ConfigService } from '../services/config.service';
import { GeminiService } from '../services/gemini.service';
import { GitService } from '../services/git.service';

export function registerGenerateCommitCommand(): vscode.Disposable {
  const configService = new ConfigService();

  return vscode.commands.registerCommand(
    `${EXTENSION_NAME}.generateCommitMessage`,
    async (sourceControl?: any) => {
      const gitApi = GitService.getAPI();
      if (!gitApi) {
        vscode.window.showErrorMessage(Messages.git.apiNotFound);
        return;
      }

      // Resolve o repositório: via SCM, seleção manual ou único disponível
      let repo = gitApi.repositories[0];

      if (sourceControl) {
        const resolved = GitService.resolveRepositoryFromSourceControl(
          sourceControl,
          gitApi.repositories
        );
        repo = resolved ?? repo;
      } else if (gitApi.repositories.length > 1) {
        const selected = await GitService.selectRepository(gitApi.repositories);
        if (!selected) return;
        repo = selected;
      }

      if (!repo) {
        vscode.window.showErrorMessage(Messages.git.noRepoFound);
        return;
      }

      const apiKey = configService.getApiKey();
      if (!apiKey) {
        const action = Messages.apiKey.configureAction;
        const result = await vscode.window.showErrorMessage(Messages.apiKey.notConfigured, action);
        if (result === action) {
          await configService.openSettings();
        }
        return;
      }

      const diff = await GitService.getStagedDiff(repo.rootUri.fsPath);
      if (!diff) {
        vscode.window.showInformationMessage(Messages.commit.noStagedChanges);
        return;
      }

      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.SourceControl,
          title: Messages.commit.generating,
          cancellable: false
        },
        async () => {
          try {
            const geminiService = new GeminiService(
              apiKey,
              configService.getGeminiModel(),
              configService.getLanguage()
            );

            const commitMessage = await geminiService.generateCommitMessage(diff);
            if (commitMessage) {
              repo.inputBox.value = commitMessage;
            } else {
              vscode.window.showErrorMessage(Messages.commit.generateFailed);
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : Messages.commit.unknownError;
            vscode.window.showErrorMessage(message);
          }
        }
      );
    }
  );
}
