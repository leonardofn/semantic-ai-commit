import assert from 'assert';
import 'mocha';
import * as vscode from 'vscode';
import * as myExtension from '../extension';

// 1. MUDANÇA: Substitua '() =>' por 'function ()' para ter acesso ao 'this' do Mocha
suite('Extension Test Suite', function () {
  // Define o tempo limite de 15 segundos para toda esta suite de testes
  this.timeout(1200000);

  // Executa uma vez antes de todos os testes começarem
  suiteSetup(() => {
    vscode.window.showInformationMessage('Start all tests.');
  });

  suite('Activation', function () {
    test('should register commands on activation', () => {
      const context = { subscriptions: [] } as any;
      myExtension.activate(context);

      assert.strictEqual(context.subscriptions.length, 3);
      context.subscriptions.forEach((sub: any) => {
        assert.ok(sub.dispose, 'A subscrição deve possuir o método dispose');
      });
    });
  });

  suite('Funções Exportadas', function () {
    test('getGitExtensionAPI deve retornar undefined se não houver extensão git', () => {
      const originalGetExtension = vscode.extensions.getExtension;

      try {
        // Mock
        vscode.extensions.getExtension = () => undefined;
        const api = myExtension.getGitExtensionAPI();
        assert.strictEqual(api, undefined);
      } finally {
        // 2. MUDANÇA: O 'finally' garante que a restauração ocorra MESMO se o assert falhar
        vscode.extensions.getExtension = originalGetExtension;
      }
    });

    test('getApiKeyOrPrompt retorna null se não houver apiKey', async () => {
      const originalGetConfiguration = vscode.workspace.getConfiguration;

      try {
        vscode.workspace.getConfiguration = () =>
          ({
            get: () => undefined,
            update: async () => {}
          }) as any;

        const apiKey = await myExtension.getApiKeyOrPrompt();
        assert.strictEqual(apiKey, null);
      } finally {
        vscode.workspace.getConfiguration = originalGetConfiguration;
      }
    });

    test('getStagedDiff retorna null se ocorrer erro', async () => {
      const originalSimpleGit = require('simple-git');
      const moduleCache = require.cache[require.resolve('simple-git')];

      try {
        if (moduleCache) {
          moduleCache.exports = () => {
            throw new Error('Erro simulado');
          };
        }
        const diff = await myExtension.getStagedDiff('fake-path');
        assert.strictEqual(diff, null);
      } finally {
        if (moduleCache) {
          moduleCache.exports = originalSimpleGit;
        }
      }
    });

    test('generateCommitMessageWithAI retorna null se não houver apiKey', async () => {
      const originalGetApiKeyOrPrompt = myExtension.getApiKeyOrPrompt;

      try {
        (myExtension as any).getApiKeyOrPrompt = async () => null;
        const result = await myExtension.generateCommitMessageWithAI('diff');
        assert.strictEqual(result, null);
      } finally {
        (myExtension as any).getApiKeyOrPrompt = originalGetApiKeyOrPrompt;
      }
    });
  });
});
