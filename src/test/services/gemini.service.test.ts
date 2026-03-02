import assert from 'assert';
import * as sinon from 'sinon';
import { GeminiModel } from '../../enums/gemini-model';
import { IAIClient } from '../../interfaces/ai-client';
import { GeminiService } from '../../services/gemini.service';

/** Cria um GeminiService com um client mockado */
function makeService(generateContent: sinon.SinonStub): GeminiService {
  const mockClient: IAIClient = { generateContent };
  return new GeminiService(
    'fake-api-key',
    GeminiModel.GEMINI_3_FLASH_PREVIEW,
    'pt-BR',
    () => mockClient
  );
}

suite('GeminiService', function () {
  teardown(function () {
    sinon.restore();
  });

  test('retorna null se a resposta não tiver texto', async function () {
    const stub = sinon.stub().resolves({ text: '' });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, null);
  });

  test('retorna null se o JSON não contiver commitMessage', async function () {
    const stub = sinon.stub().resolves({ text: '{}' });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, null);
  });

  test('retorna null se commitMessage for string vazia', async function () {
    const stub = sinon.stub().resolves({ text: '{"commitMessage":""}' });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, null);
  });

  test('retorna a mensagem de commit corretamente', async function () {
    const stub = sinon
      .stub()
      .resolves({ text: '{"commitMessage":"feat: add new feature"}' });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'feat: add new feature');
  });

  test('faz trim na mensagem de commit retornada', async function () {
    const stub = sinon
      .stub()
      .resolves({ text: '{"commitMessage":"  feat: trimmed  "}' });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'feat: trimmed');
  });

  test('lança erro com mensagem amigável quando o client rejeita', async function () {
    const stub = sinon.stub().rejects(new Error('network failure'));
    const service = makeService(stub);

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(err.message, 'network failure');
        return true;
      }
    );
  });

  test('lança erro com mensagem extraída do JSON de erro da API', async function () {
    const apiErrorBody = JSON.stringify({
      error: { message: 'API key inválida', status: 'INVALID_ARGUMENT' }
    });
    const stub = sinon.stub().rejects(new Error(apiErrorBody));
    const service = makeService(stub);

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(err.message, 'API key inválida');
        return true;
      }
    );
  });

  test('passa o prompt construído para o client', async function () {
    const stub = sinon
      .stub()
      .resolves({ text: '{"commitMessage":"chore: update deps"}' });
    const service = makeService(stub);

    await service.generateCommitMessage('my diff');

    assert.ok(stub.calledOnce, 'generateContent deve ser chamado uma vez');
    const callArg = stub.firstCall.args[0] as { contents: string };
    assert.ok(
      callArg.contents.includes('my diff'),
      'O prompt deve conter o diff'
    );
  });
});
