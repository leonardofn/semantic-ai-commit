import assert from 'assert';
import 'mocha';
import { SimpleGit } from 'simple-git';
import * as vscode from 'vscode';
import * as myExtension from '../extension';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  suite('Activation', () => {
    test('should register commands on activation', () => {
      const context = { subscriptions: [] } as any;
      myExtension.activate(context);

      // São 3 comandos registrados
      assert.strictEqual(context.subscriptions.length, 3);
      // Verificar se são disposables (comandos registrados)
      context.subscriptions.forEach((sub: any) => {
        assert(sub.dispose);
      });
    });
  });

  suite('Funções Exportadas', () => {
    test('getGitExtensionAPI deve retornar undefined se não houver extensão git', () => {
      // Mock: Remove extensão git
      const originalGetExtension = vscode.extensions.getExtension;
      vscode.extensions.getExtension = () => undefined;
      const api = myExtension.getGitExtensionAPI();
      assert.strictEqual(api, undefined);
      vscode.extensions.getExtension = originalGetExtension;
    });

    test('getApiKeyOrPrompt retorna null se não houver apiKey', async () => {
      // Mock configuração
      const originalGetConfiguration = vscode.workspace.getConfiguration;
      vscode.workspace.getConfiguration = () =>
        ({
          get: () => undefined,
          update: async () => {}
        }) as any;
      const apiKey = await myExtension.getApiKeyOrPrompt();
      assert.strictEqual(apiKey, null);
      vscode.workspace.getConfiguration = originalGetConfiguration;
    });

    test('getStagedDiff retorna null se ocorrer erro', async () => {
      // Mock simpleGit para lançar erro
      const originalSimpleGit: SimpleGit = require('simple-git');
      const moduleCache = require.cache[require.resolve('simple-git')];
      if (moduleCache) {
        moduleCache.exports = () => {
          throw new Error('Erro simulado');
        };
      }
      const diff = await myExtension.getStagedDiff('fake-path');
      assert.strictEqual(diff, null);
      if (moduleCache) {
        moduleCache.exports = originalSimpleGit;
      }
    });

    test('generateCommitMessageWithAI retorna null se não houver apiKey', async () => {
      // Mock getApiKeyOrPrompt para retornar null
      const originalGetApiKeyOrPrompt = myExtension.getApiKeyOrPrompt;
      (myExtension as any).getApiKeyOrPrompt = async () => null;
      const result = await myExtension.generateCommitMessageWithAI('diff');
      assert.strictEqual(result, null);
      (myExtension as any).getApiKeyOrPrompt = originalGetApiKeyOrPrompt;
    });
  });
});
