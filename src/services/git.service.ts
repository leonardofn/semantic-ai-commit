import simpleGit, { SimpleGit } from 'simple-git';
import * as vscode from 'vscode';
import { Messages } from '../constants/messages';
import { API, GitExtension, Repository } from '../types/git';

const MAX_DIFF_CHARS = 25000;

export class GitService {
  static getAPI(): API | undefined {
    const extension = vscode.extensions.getExtension<GitExtension>('vscode.git');
    return extension?.exports?.getAPI(1);
  }

  static async getStagedDiff(repoPath: string): Promise<string | null> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      let diff = await git.diff([
        '--staged',
        '--',
        ':(exclude)*.lock',
        ':(exclude)*-lock.*',
        ':(exclude)*.min.*',
        ':(exclude)dist/*'
      ]);

      if (!diff || diff.trim() === '') return null;

      // Remove arquivos binários do diff para que a IA não os analise
      diff = diff.replace(/^Binary files .*(\r?\n|$)/gm, '').trim();

      // Trunca o diff se ele exceder o tamanho máximo permitido para evitar problemas de desempenho e consumo alto de tokens.
      if (diff.length > MAX_DIFF_CHARS) {
        vscode.window.showWarningMessage(Messages.git.diffTooLarge);
        return diff.slice(0, MAX_DIFF_CHARS) + '\n\n... [diff truncado por tamanho]';
      }

      return diff;
    } catch (error) {
      vscode.window.showErrorMessage(Messages.git.diffError);
      process.stderr.write(`${Messages.git.diffErrorLog}: ${error}\n`);
      return null;
    }
  }

  static resolveRepositoryFromSourceControl(
    sourceControl: any,
    repositories: Repository[]
  ): Repository | undefined {
    const uri = sourceControl._rootUri || sourceControl.rootUri;
    if (!uri) return undefined;

    return repositories.find(r => r.rootUri.toString() === uri.toString());
  }

  static async selectRepository(repositories: Repository[]): Promise<Repository | null> {
    if (repositories.length === 0) return null;
    if (repositories.length === 1) return repositories[0];

    const items = repositories.map(repo => ({
      label: repo.rootUri.fsPath.split(/[\\/]/).pop() ?? Messages.git.unknownRepo,
      description: repo.rootUri.fsPath,
      repo
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: Messages.git.selectRepo
    });

    return selected?.repo ?? null;
  }
}
