import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

export const serverConfig = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  geminiApiKey: process.env.GEMINI_API_KEY,
};

/**
 * Função para exibir informações do servidor no startup
 */
export function logServerInfo(port: string | number) {
  console.log("\n🚀 Servidor iniciado com sucesso!");
  console.log(`📍 Servidor rodando em: http://localhost:${port}`);
  console.log(`🔗 Frontend URL: ${serverConfig.frontendUrl}`);
  console.log(`📝 Modo: ${serverConfig.nodeEnv}`);
  console.log(
    `🤖 IA: Google Gemini AI ${serverConfig.geminiApiKey ? "✅" : "❌"}`
  );
  console.log("\n📋 Endpoints disponíveis:");
  console.log(`   GET  / - Informações da API`);
  console.log(`   GET  /health - Status do servidor`);
  console.log(`   POST /api/messages - Enviar mensagem para IA REAL`);
  console.log(`   GET  /api/messages - Buscar histórico de mensagens`);
  console.log(`   GET  /api/menu - Buscar cardápio completo`);
  console.log(`   GET  /api/menu/pizzas - Buscar apenas pizzas`);
  console.log(`   GET  /api/menu/drinks - Buscar apenas bebidas`);
  console.log(`   GET  /api/menu/desserts - Buscar apenas sobremesas\n`);

  if (!serverConfig.geminiApiKey) {
    console.log("⚠️  AVISO: GEMINI_API_KEY não encontrada no .env");
  }
}
