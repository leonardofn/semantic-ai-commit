const { execSync } = require('child_process');

// Configurações
const PUBLISHER_ID = 'leofndev';
const TOKEN = process.env.AZURE_TOKEN;

if (!PUBLISHER_ID || !TOKEN) {
  console.error(
    '❌ PUBLISHER_ID ou TOKEN não definidos nas variáveis de ambiente'
  );
  process.exit(1);
}

try {
  console.log('🔐 Autenticando publisher...');
  execSync(`npx vsce login ${PUBLISHER_ID}`, { stdio: 'inherit' });

  console.log('📦 Empacotando extensão...');
  execSync(`npx vsce package`, { stdio: 'inherit' });

  console.log('🚀 Publicando extensão...');
  execSync(`npx vsce publish`, { stdio: 'inherit' });

  console.log('✅ Extensão publicada com sucesso!');
} catch (error) {
  console.error('❌ Erro ao publicar extensão:', error.message);
}
