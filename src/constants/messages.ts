export const Messages = {
  git: {
    apiNotFound: 'A API do Git não foi encontrada.',
    noRepoFound: 'Nenhum repositório Git encontrado.',
    unknownRepo: 'Repositório desconhecido',
    selectRepo: 'Selecione o repositório para gerar o commit',
    diffTooLarge: 'Diff muito grande. Truncando para não exceder limites de contexto.',
    diffError: 'Erro ao obter diff.',
    diffErrorLog: 'Erro ao obter diff:'
  },
  commit: {
    noStagedChanges: 'Nenhuma alteração preparada (staged) para o commit.',
    generating: 'Gerando mensagem de commit com IA...',
    generateFailed: 'Não foi possível gerar a mensagem de commit. Por favor, tente novamente.',
    unknownError: 'Erro desconhecido ao gerar commit.',
    noValidResponse: 'O modelo não retornou uma resposta válida. Por favor, tente novamente.',
    aiError: 'Erro ao gerar a mensagem de commit com a IA. Por favor, tente novamente.'
  },
  apiKey: {
    notConfigured:
      'A chave de API de IA não está configurada. Por favor, configure-a nas configurações da extensão.',
    configureAction: 'Configurar Chave de API'
  },
  language: {
    selectPlaceholder: 'Selecione o idioma das mensagens de commit',
    changed: (label: string) => `Idioma do Semantic AI Commit alterado para: ${label}`,
    english: 'Inglês',
    portuguese: 'Português do Brasil'
  },
  model: {
    selectPlaceholder: 'Selecione o modelo de IA para gerar commits',
    changed: (label: string) => `Modelo de IA alterado para: ${label}`
  },
  schema: {
    typeDescription: 'O tipo do commit: feat, fix, chore, docs, refactor, style, test ou perf.',
    scopeDescription:
      'O escopo da mudança (opcional, em letras minúsculas). Deixe vazio se não houver um claro.',
    subjectDescription: 'A descrição curta e imperativa do commit (máx. 50 caracteres).',
    bodyDescription: 'Uma descrição mais detalhada explicando o PORQUÊ da mudança (opcional).'
  },
  ai: {
    invalidOutputText: 'O modelo completou a execução, mas nenhum texto foi emitido.',
    interactionFailed: 'A interação falhou internamente no servidor do Gemini.',
    interactionCancelled: 'A interação foi cancelada antes de concluir.',
    interactionIncomplete: (tokens: number) =>
      `A geração foi incompleta (tokens insuficientes ou corte de segurança). Tokens gerados: ${tokens}`,
    unexpectedStatus: (status: string) => `Status inesperado recebido: ${status}`,
    invalidJson: (message: string) => `Falha ao decodificar o JSON retornado: ${message}`,
    missingRequiredFields: 'JSON retornado não cumpre os campos obrigatórios.',
    invalidApiParams:
      'Parâmetros inválidos enviados para a API (ex: schema ou configs incorretas).',
    invalidApiKey: 'Chave de API inválida ou ausente (GEMINI_API_KEY).',
    forbiddenAccess: 'Acesso negado ao modelo ou projeto especificado.',
    modelNotFound: 'Modelo não encontrado ou ID de interação anterior inválido.',
    rateLimitExceeded:
      'Limite de requisições excedido (Rate limit/Quota). Tente novamente mais tarde.',
    serviceUnavailable:
      'Serviço do Google temporariamente indisponível. Aplique retry exponencial.',
    apiError: (status: number, message: string) => `Erro na API Gemini (${status}): ${message}`,
    unexpectedError: (message: string) => `Erro inesperado: ${message}`
  }
};
