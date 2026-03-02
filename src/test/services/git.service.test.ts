import assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { GitService } from '../../services/git.service';

suite('GitService', function () {
  teardown(function () {
    sinon.restore();
  });

  suite('getAPI', function () {
    test('retorna undefined se a extensão git não estiver disponível', function () {
      sinon.stub(vscode.extensions, 'getExtension').returns(undefined);
      assert.strictEqual(GitService.getAPI(), undefined);
    });

    test('retorna a API se a extensão estiver disponível', function () {
      const mockAPI = { repositories: [] };
      const mockExtension = {
        exports: { getAPI: sinon.stub().returns(mockAPI) }
      };
      sinon
        .stub(vscode.extensions, 'getExtension')
        .returns(mockExtension as unknown as vscode.Extension<any>);

      assert.deepStrictEqual(GitService.getAPI(), mockAPI);
    });
  });

  suite('selectRepository', function () {
    test('retorna null se não houver repositórios', async function () {
      const result = await GitService.selectRepository([]);
      assert.strictEqual(result, null);
    });

    test('retorna o único repositório sem exibir QuickPick', async function () {
      const showQuickPickStub = sinon.stub(vscode.window, 'showQuickPick');
      const mockRepo = { rootUri: { fsPath: '/project' } } as any;

      const result = await GitService.selectRepository([mockRepo]);

      assert.strictEqual(result, mockRepo);
      assert.ok(showQuickPickStub.notCalled, 'QuickPick não deve ser exibido');
    });

    test('exibe QuickPick quando há múltiplos repositórios e retorna o selecionado', async function () {
      const repos = [
        { rootUri: { fsPath: '/project-a' } },
        { rootUri: { fsPath: '/project-b' } }
      ] as any[];

      const selectedItem = { label: 'project-b', repo: repos[1] };
      sinon.stub(vscode.window, 'showQuickPick').resolves(selectedItem as any);

      const result = await GitService.selectRepository(repos);
      assert.strictEqual(result, repos[1]);
    });

    test('retorna null se o usuário cancelar o QuickPick', async function () {
      const repos = [
        { rootUri: { fsPath: '/project-a' } },
        { rootUri: { fsPath: '/project-b' } }
      ] as any[];

      sinon.stub(vscode.window, 'showQuickPick').resolves(undefined);

      const result = await GitService.selectRepository(repos);
      assert.strictEqual(result, null);
    });
  });

  suite('resolveRepositoryFromSourceControl', function () {
    test('retorna o repositório cujo rootUri bate com o sourceControl', function () {
      const repos = [
        { rootUri: { fsPath: '/a', toString: () => 'file:///a' } },
        { rootUri: { fsPath: '/b', toString: () => 'file:///b' } }
      ] as any[];

      const sourceControl = { rootUri: { toString: () => 'file:///b' } };
      const result = GitService.resolveRepositoryFromSourceControl(
        sourceControl,
        repos
      );

      assert.strictEqual(result, repos[1]);
    });

    test('retorna undefined se nenhum repositório bater', function () {
      const repos = [
        { rootUri: { fsPath: '/a', toString: () => 'file:///a' } }
      ] as any[];

      const sourceControl = { rootUri: { toString: () => 'file:///z' } };
      const result = GitService.resolveRepositoryFromSourceControl(
        sourceControl,
        repos
      );

      assert.strictEqual(result, undefined);
    });
  });
});
