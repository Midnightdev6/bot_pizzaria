import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import { aiService } from "./aiService";

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

const conversationContexts = new Map();

// Rota raiz
app.get("/", (req, res) => {
  return res.json({
    message: "🍕 AI Agent Pizzaria Backend",
    version: "1.0.0",
    status: "Online",
    aiProvider: "Google Gemini AI",
    endpoints: {
      messages: "/api/messages",
      menu: "/api/menu",
      health: "/health",
    },
  });
});

// Rota de saúde
app.get("/health", (req, res) => {
  return res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: "Connected",
    ai: "Gemini AI Ready",
  });
});

// POST /api/messages - Enviar mensagem para IA REAL
app.post("/api/messages", async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        error: "Message and sessionId are required",
      });
    }

    console.log(
      `🤖 Processando mensagem: "${message}" para sessão: ${sessionId}`
    );

    // Recuperar contexto da conversa
    const context = conversationContexts.get(sessionId);

    // Processar com IA real
    const aiResponse = await aiService.processMessage(
      message,
      sessionId,
      context
    );

    conversationContexts.set(sessionId, aiResponse.context);

    console.log(
      `✅ IA respondeu: "${aiResponse.message.substring(0, 100)}..."`
    );

    return res.json({
      userMessage: {
        id: generateId(),
        message,
        timestamp: new Date().toISOString(),
        sender: "USER",
      },
      aiResponse: {
        id: generateId(),
        message: aiResponse.message,
        timestamp: new Date().toISOString(),
        sender: "AI",
        suggestedProducts: aiResponse.suggestedProducts,
      },
      conversationContext: {
        orderedPizza: aiResponse.context.orderedPizza,
        orderedDrink: aiResponse.context.orderedDrink,
        orderedDessert: aiResponse.context.orderedDessert,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao processar mensagem:", error);

    return res.status(500).json({
      error: "Erro interno do servidor",
      fallback: {
        userMessage: {
          id: generateId(),
          message: req.body.message,
          timestamp: new Date().toISOString(),
          sender: "USER",
        },
        aiResponse: {
          id: generateId(),
          message:
            "Desculpe, tive um problema técnico. Mas posso te ajudar! Que tal experimentar nossa pizza Calabresa? É uma das mais pedidas! 🍕",
          timestamp: new Date().toISOString(),
          sender: "AI",
          suggestedProducts: ["Calabresa", "Margherita", "Coca-Cola"],
        },
      },
    });
  }
});

// GET /api/messages - Buscar histórico (simulado)
app.get("/api/messages", (req, res) => {
  const { sessionId } = req.query;

  if (!sessionId) {
    return res.status(400).json({
      error: "SessionId is required",
    });
  }

  const context = conversationContexts.get(sessionId);

  return res.json({
    messages: [],
    conversationId: null,
    context: context || {
      orderedPizza: false,
      orderedDrink: false,
      orderedDessert: false,
      lastMessages: [],
    },
  });
});

// GET /api/menu - Buscar cardápio
app.get("/api/menu", async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({
      where: { available: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return res.json(menuItems);
  } catch (error) {
    console.error("Erro ao buscar menu:", error);
    return res.status(500).json({
      error: "Erro ao buscar menu",
    });
  }
});

// GET /api/menu/pizzas - Buscar apenas pizzas
app.get("/api/menu/pizzas", async (req, res) => {
  try {
    const pizzas = await prisma.menuItem.findMany({
      where: {
        category: "PIZZA",
        available: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json(pizzas);
  } catch (error) {
    console.error("Erro ao buscar pizzas:", error);
    return res.status(500).json({
      error: "Erro ao buscar pizzas",
    });
  }
});

// GET /api/menu/drinks - Buscar apenas bebidas
app.get("/api/menu/drinks", async (req, res) => {
  try {
    const drinks = await prisma.menuItem.findMany({
      where: {
        category: "BEBIDA",
        available: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json(drinks);
  } catch (error) {
    console.error("Erro ao buscar bebidas:", error);
    return res.status(500).json({
      error: "Erro ao buscar bebidas",
    });
  }
});

// GET /api/menu/desserts - Buscar apenas sobremesas
app.get("/api/menu/desserts", async (req, res) => {
  try {
    const desserts = await prisma.menuItem.findMany({
      where: {
        category: "SOBREMESA",
        available: true,
      },
      orderBy: { name: "asc" },
    });

    return res.json(desserts);
  } catch (error) {
    console.error("Erro ao buscar sobremesas:", error);
    return res.status(500).json({
      error: "Erro ao buscar sobremesas",
    });
  }
});

// Middleware para rotas não encontradas
app.use("*", (req, res) => {
  return res.status(404).json({
    error: "Rota não encontrada",
    path: req.originalUrl,
  });
});

// Função para gerar IDs simples
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

app.listen(PORT, () => {
  console.log("\n🚀 Servidor iniciado com sucesso!");
  console.log(`📍 Servidor rodando em: http://localhost:${PORT}`);
  console.log(
    `🔗 Frontend URL: ${process.env.FRONTEND_URL || "http://localhost:3000"}`
  );
  console.log(`📝 Modo: ${process.env.NODE_ENV || "development"}`);
  console.log(
    `🤖 IA: Google Gemini AI ${process.env.GEMINI_API_KEY ? "✅" : "❌"}`
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

  if (!process.env.GEMINI_API_KEY) {
    console.log("⚠️  AVISO: GEMINI_API_KEY não encontrada no .env");
  }
});

export default app;
