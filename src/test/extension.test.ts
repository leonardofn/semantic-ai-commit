import assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import * as myExtension from '../extension';

suite('Extension - Smoke Tests', function () {
  this.timeout(30000);

  suiteSetup(() => {
    vscode.window.showInformationMessage('Iniciando testes da extensão.');
  });

  teardown(function () {
    sinon.restore();
  });

  suite('Activation', function () {
    test('registra os 3 comandos ao ativar', function () {
      const context = { subscriptions: [] } as any;
      myExtension.activate(context);

      assert.strictEqual(
        context.subscriptions.length,
        3,
        'Deve haver exatamente 3 comandos registrados'
      );
      context.subscriptions.forEach((sub: any) => {
        assert.ok(sub.dispose, 'Cada subscrição deve ter o método dispose');
      });
    });

    test('deactivate não lança erros', function () {
      assert.doesNotThrow(() => myExtension.deactivate());
    });
  });
});
