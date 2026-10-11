import assert from 'assert';
import * as sinon from 'sinon';
import { Messages } from '../../constants/messages';
import { AIModel } from '../../enums/ai-model';
import { ICommitResponse } from '../../interfaces/ai-client';
import { AIService } from '../../services/ai.service';

async function makeService(
  response: unknown
): Promise<{ service: AIService; createStub: sinon.SinonStub }> {
  const { GoogleGenAI } = await import('@google/genai');
  const interactions = new GoogleGenAI({ apiKey: 'fake-api-key' }).interactions;
  const createStub = sinon.stub(Object.getPrototypeOf(interactions), 'create').resolves(response);

  return {
    service: new AIService('fake-api-key', AIModel.GEMINI_3_FLASH_PREVIEW, 'pt-BR'),
    createStub
  };
}

function makeCommitData(overrides: Partial<ICommitResponse> = {}): ICommitResponse {
  return {
    type: 'feat',
    scope: '',
    subject: 'add feature',
    body: '',
    ...overrides
  };
}

suite('AIService', function () {
  teardown(function () {
    sinon.restore();
  });

  test('lança erro se a resposta não tiver texto', async function () {
    const { service } = await makeService({ status: 'completed', output_text: undefined });

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(
          err.message,
          'Erro inesperado: O modelo completou a execução, mas nenhum texto foi emitido.'
        );
        return true;
      }
    );
  });

  test('retorna a mensagem de commit sem escopo', async function () {
    const { service } = await makeService({
      status: 'completed',
      output_text: JSON.stringify(
        makeCommitData({
          type: 'feat',
          subject: 'add new feature',
          scope: ''
        })
      )
    });

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'feat: add new feature');
  });

  test('retorna a mensagem de commit com escopo', async function () {
    const { service } = await makeService({
      status: 'completed',
      output_text: JSON.stringify(
        makeCommitData({
          type: 'feat',
          scope: 'auth',
          subject: 'add login'
        })
      )
    });

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'feat(auth): add login');
  });

  test('retorna a mensagem de commit com body', async function () {
    const { service } = await makeService({
      status: 'completed',
      output_text: JSON.stringify(
        makeCommitData({
          type: 'fix',
          subject: 'correct bug',
          body: 'explains why'
        })
      )
    });

    const result = await service.generateCommitMessage('diff content');
    assert.strictEqual(result, 'fix: correct bug\n\nexplains why');
  });

  test('lança erro contextualizado quando a interação falha', async function () {
    const { service } = await makeService({ status: 'failed' });

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(
          err.message,
          'Erro inesperado: A interação falhou internamente no servidor do Gemini.'
        );
        return true;
      }
    );
  });

  test('inclui o total de tokens quando a interação fica incompleta', async function () {
    const { service } = await makeService({
      status: 'incomplete',
      usage: { total_output_tokens: 5000 }
    });

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(
          err.message,
          'Erro inesperado: A geração foi incompleta (tokens insuficientes ou corte de segurança). Tokens gerados: 5000'
        );
        return true;
      }
    );
  });

  test('lança erro quando o JSON retornado é inválido', async function () {
    const { service } = await makeService({ status: 'completed', output_text: '{invalid json' });

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.ok(
          err.message.startsWith('Erro inesperado: Falha ao decodificar o JSON retornado:')
        );
        return true;
      }
    );
  });

  test('lança erro quando faltam os campos obrigatórios', async function () {
    const { service } = await makeService({
      status: 'completed',
      output_text: JSON.stringify({ type: 'feat', subject: '' })
    });

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(
          err.message,
          'Erro inesperado: Falha ao decodificar o JSON retornado: JSON retornado não cumpre os campos obrigatórios.'
        );
        return true;
      }
    );
  });

  test('converte erros HTTP do SDK em mensagens específicas', async function () {
    const { ApiError } = await import('@google/genai');
    const { service, createStub } = await makeService({ status: 'completed', output_text: '{}' });
    createStub.rejects(new ApiError({ status: 401, message: 'Unauthorized' }));

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(err.message, 'Chave de API inválida ou ausente (GEMINI_API_KEY).');
        return true;
      }
    );
  });

  test('envolve erros comuns da chamada ao SDK', async function () {
    const { service, createStub } = await makeService({ status: 'completed', output_text: '{}' });
    createStub.rejects(new Error('network failure'));

    await assert.rejects(
      () => service.generateCommitMessage('diff content'),
      (err: Error) => {
        assert.strictEqual(err.message, 'Erro inesperado: network failure');
        return true;
      }
    );
  });

  test('envia o modelo, o diff e as configurações esperadas para o SDK', async function () {
    const { service, createStub } = await makeService({
      status: 'completed',
      output_text: JSON.stringify(makeCommitData({ type: 'chore', subject: 'update deps' }))
    });

    await service.generateCommitMessage('my diff');

    assert.ok(createStub.calledOnce, 'interactions.create deve ser chamado uma vez');
    const callArg = createStub.firstCall.args[0] as {
      model: AIModel;
      input: string;
      system_instruction: string;
      generation_config: { temperature: number; max_output_tokens: number };
      store: boolean;
    };
    assert.strictEqual(callArg.model, AIModel.GEMINI_3_FLASH_PREVIEW);
    assert.ok(callArg.input.includes('my diff'), 'A entrada deve conter o diff');
    assert.ok(callArg.system_instruction.includes(Messages.language.portuguese));
    assert.strictEqual(callArg.generation_config.temperature, 0.2);
    assert.strictEqual(callArg.generation_config.max_output_tokens, 5000);
    assert.strictEqual(callArg.store, false);
  });
});
