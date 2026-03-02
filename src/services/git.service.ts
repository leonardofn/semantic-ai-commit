import simpleGit, { SimpleGit } from 'simple-git';
import * as vscode from 'vscode';
import { API, GitExtension, Repository } from '../types/git';

export class GitService {
  static getAPI(): API | undefined {
    const extension =
      vscode.extensions.getExtension<GitExtension>('vscode.git');
    return extension?.exports?.getAPI(1);
  }

  static async getStagedDiff(repoPath: string): Promise<string | null> {
    try {
      const git: SimpleGit = simpleGit(repoPath);
      const diff = await git.diff(['--staged']);
      return diff || null;
    } catch (error) {
      vscode.window.showErrorMessage('Erro ao obter diff.');
      console.error('Erro ao obter diff:', error);
      return null;
    }
  }

  static resolveRepositoryFromSourceControl(
    sourceControl: any,
    repositories: Repository[]
  ): Repository | undefined {
    const uri = sourceControl._rootUri || sourceControl.rootUri;
    if (!uri) return undefined;

    return repositories.find((r) => r.rootUri.toString() === uri.toString());
  }

  static async selectRepository(
    repositories: Repository[]
  ): Promise<Repository | null> {
    if (repositories.length === 0) return null;
    if (repositories.length === 1) return repositories[0];

    const items = repositories.map((repo) => ({
      label:
        repo.rootUri.fsPath.split(/[\\/]/).pop() ?? 'Repositório desconhecido',
      description: repo.rootUri.fsPath,
      repo
    }));

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: 'Selecione o repositório para gerar o commit'
    });

    return selected?.repo ?? null;
  }
}
