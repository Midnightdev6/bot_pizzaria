import { Request, Response } from "express";
import { aiService } from "../services/aiService";
import { generateId } from "../utils/idGenerator";
import { ConversationContext } from "../types";

// Armazenar contextos de conversa (em produção, usar Redis ou banco)
const conversationContexts = new Map();

export class MessageController {
  async sendMessage(req: Request, res: Response) {
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
  }

  async getMessages(req: Request, res: Response) {
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
        rejectedDrink: false,
        rejectedDessert: false,
        lastMessages: [],
        customerIntent: "unknown",
        selectedItems: {},
        orderPhase: "pizza",
        orderTotal: 0,
        needsAddress: false,
      },
    });
  }
}

export const messageController = new MessageController();
