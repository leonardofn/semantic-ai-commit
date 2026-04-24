import assert from 'assert';
import * as sinon from 'sinon';
import { Messages } from '../../constants/messages';
import { GeminiModel } from '../../enums/gemini-model';
import { IAIClient, ICommitMessageResponse } from '../../interfaces/ai-client';
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

/** Cria um ICommitMessageResponse com valores padrão */
function makeCommitData(
  overrides: Partial<ICommitMessageResponse> = {}
): ICommitMessageResponse {
  return { type: 'feat', scope: '', subject: 'add feature', body: '', ...overrides };
}

suite('GeminiService', function () {
  teardown(function () {
    sinon.restore();
  });

  test('lança erro se a resposta não tiver texto', async function () {
    const stub = sinon.stub().resolves({ text: undefined });
    const service = makeService(stub);

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(err.message, Messages.commit.noValidResponse);
        return true;
      }
    );
  });

  test('retorna a mensagem de commit sem escopo', async function () {
    const stub = sinon
      .stub()
      .resolves({ text: makeCommitData({ type: 'feat', subject: 'add new feature', scope: '' }) });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'feat: add new feature');
  });

  test('retorna a mensagem de commit com escopo', async function () {
    const stub = sinon
      .stub()
      .resolves({ text: makeCommitData({ type: 'feat', scope: 'auth', subject: 'add login' }) });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'feat(auth): add login');
  });

  test('retorna a mensagem de commit com body', async function () {
    const stub = sinon
      .stub()
      .resolves({ text: makeCommitData({ type: 'fix', subject: 'correct bug', body: 'explains why' }) });
    const service = makeService(stub);

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'fix: correct bug\n\nexplains why');
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

  test('passa o diff para o client', async function () {
    const stub = sinon
      .stub()
      .resolves({ text: makeCommitData({ type: 'chore', subject: 'update deps' }) });
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
