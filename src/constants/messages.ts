export const Messages = {
  git: {
    apiNotFound: 'A API do Git não foi encontrada.',
    noRepoFound: 'Nenhum repositório Git encontrado.',
    unknownRepo: 'Repositório desconhecido',
    selectRepo: 'Selecione o repositório para gerar o commit',
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
  }
};
