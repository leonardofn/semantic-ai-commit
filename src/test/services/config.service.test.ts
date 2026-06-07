import assert from 'assert';
import * as sinon from 'sinon';
import * as vscode from 'vscode';
import { AIModel } from '../../enums/ai-model';
import { ConfigService } from '../../services/config.service';

suite('ConfigService', function () {
  let configService: ConfigService;
  let configStub: { get: sinon.SinonStub; update: sinon.SinonStub };

  setup(function () {
    configStub = {
      get: sinon.stub(),
      update: sinon.stub().resolves()
    };
    sinon
      .stub(vscode.workspace, 'getConfiguration')
      .returns(configStub as unknown as vscode.WorkspaceConfiguration);

    configService = new ConfigService();
  });

  teardown(function () {
    sinon.restore();
  });

  test('getApiKey retorna a chave configurada', function () {
    configStub.get.withArgs('apiKey').returns('my-api-key');
    assert.strictEqual(configService.getApiKey(), 'my-api-key');
  });

  test('getApiKey retorna undefined se não configurada', function () {
    configStub.get.withArgs('apiKey').returns(undefined);
    assert.strictEqual(configService.getApiKey(), undefined);
  });

  test('getLanguage retorna pt-BR por padrão', function () {
    configStub.get.withArgs('language').returns(undefined);
    assert.strictEqual(configService.getLanguage(), 'pt-BR');
  });

  test('getLanguage retorna o idioma configurado', function () {
    configStub.get.withArgs('language').returns('en');
    assert.strictEqual(configService.getLanguage(), 'en');
  });

  test('getAIModel retorna o modelo padrão se não configurado', function () {
    configStub.get.withArgs('aiModel').returns(undefined);
    assert.strictEqual(configService.getAIModel(), AIModel.GEMINI_3_FLASH_PREVIEW);
  });

  test('getAIModel retorna o modelo configurado', function () {
    configStub.get.withArgs('aiModel').returns(AIModel.GEMINI_2_5_PRO);
    assert.strictEqual(configService.getAIModel(), AIModel.GEMINI_2_5_PRO);
  });

  test('updateLanguage chama config.update com os parâmetros corretos', async function () {
    await configService.updateLanguage('en');
    assert.ok(configStub.update.calledWith('language', 'en', vscode.ConfigurationTarget.Global));
  });

  test('updateAIModel chama config.update com os parâmetros corretos', async function () {
    await configService.updateAIModel(AIModel.GEMINI_3_PRO_PREVIEW);
    assert.ok(
      configStub.update.calledWith(
        'aiModel',
        AIModel.GEMINI_3_PRO_PREVIEW,
        vscode.ConfigurationTarget.Global
      )
    );
  });
});
