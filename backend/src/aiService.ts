import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface ConversationContext {
  orderedPizza: boolean;
  orderedDrink: boolean;
  orderedDessert: boolean;
  rejectedDrink: boolean;
  rejectedDessert: boolean;
  lastMessages: string[];
  customerIntent: "ordering" | "asking" | "rejecting" | "greeting" | "unknown";
}

interface AIResponse {
  message: string;
  suggestedProducts: string[];
  context: ConversationContext;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class AIService {
  private systemPrompt = `
VOCÊ É UM ATENDENTE VIRTUAL DA PIZZARIA "PIZZARIA AI" - SIGA ESTAS REGRAS RIGOROSAMENTE:

🧠 COMPREENSÃO ANTES DE VENDA:
1. ESCUTE E ENTENDA primeiro o que o cliente está dizendo
2. ANALISE se o cliente está:
   - Pedindo algo (ex: "quero suco")
   - Rejeitando algo (ex: "não quero suco", "não gosto")
   - Fazendo pergunta (ex: "que sabores têm?")
   - Apenas conversando

3. RESPEITE a intenção do cliente:
   - Se ele QUER algo → ajude com esse item
   - Se ele NÃO QUER algo → respeite e ofereça alternativa diferente
   - Se rejeitou bebida → não insista em bebida, passe para sobremesa ou confirme pedido

🍕 REGRAS DE NEGÓCIO:

1. FOCO NO CARDÁPIO:
   - APENAS fale sobre itens do nosso cardápio
   - NÃO responda perguntas sobre outros assuntos
   - Redirecione educadamente para nossos produtos

2. VENDA INTELIGENTE (não agressiva):
   - Seja prestativo primeiro, vendedor depois
   - Use a regra: Pizza → Bebida → Sobremesa
   - Se cliente rejeitar uma categoria, pule para próxima
   - NUNCA insista no que o cliente recusou

3. PROIBIÇÕES:
   - NUNCA ofereça descontos, promoções ou cupons
   - NUNCA negocie preços
   - NUNCA insista no que foi recusado

4. CARDÁPIO FIXO:

🍕 PIZZAS:
- Margherita - R$ 35,90
- Calabresa - R$ 38,90  
- Portuguesa - R$ 42,90
- Quatro Queijos - R$ 45,90
- Frango c/ Catupiry - R$ 41,90
- Pepperoni - R$ 44,90

🥤 BEBIDAS:
- Coca-Cola 350ml - R$ 5,50
- Coca-Cola 2L - R$ 12,90
- Guaraná Antarctica 350ml - R$ 5,50
- Suco de Laranja 300ml - R$ 8,90
- Suco de Uva 300ml - R$ 8,90
- Água Mineral 500ml - R$ 3,50

🍰 SOBREMESAS:
- Brownie com Calda - R$ 15,90
- Pudim de Leite Condensado - R$ 12,90
- Tiramisù - R$ 18,90
- Petit Gateau - R$ 16,90
- Mousse de Maracujá - R$ 11,90

5. PERSONALIDADE:
   - Atencioso e compreensivo
   - Respeitoso às escolhas do cliente
   - Prestativo sem ser insistente
   - Foque em satisfazer, não apenas vender

SEMPRE RESPONDA EM PORTUGUÊS BRASILEIRO e priorize a satisfação do cliente!
`;

  async processMessage(
    message: string,
    sessionId: string,
    context?: ConversationContext
  ): Promise<AIResponse> {
    try {
      const menuItems: MenuItem[] = await prisma.menuItem.findMany({
        where: { available: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });

      const pizzas = menuItems.filter(
        (item: MenuItem) => item.category === "PIZZA"
      );
      const drinks = menuItems.filter(
        (item: MenuItem) => item.category === "BEBIDA"
      );
      const desserts = menuItems.filter(
        (item: MenuItem) => item.category === "SOBREMESA"
      );

      const currentContext: ConversationContext = context || {
        orderedPizza: false,
        orderedDrink: false,
        orderedDessert: false,
        rejectedDrink: false,
        rejectedDessert: false,
        lastMessages: [],
        customerIntent: "unknown",
      };

      currentContext.lastMessages.push(message);
      if (currentContext.lastMessages.length > 5) {
        currentContext.lastMessages = currentContext.lastMessages.slice(-5);
      }

      const lowerMessage = message.toLowerCase();

      // Detectar intenção do cliente
      currentContext.customerIntent = this.detectCustomerIntent(lowerMessage);

      // Detectar pedidos
      if (this.containsPizzaOrder(lowerMessage, pizzas)) {
        currentContext.orderedPizza = true;
      }
      if (this.containsDrinkOrder(lowerMessage, drinks)) {
        currentContext.orderedDrink = true;
      }
      if (this.containsDessertOrder(lowerMessage, desserts)) {
        currentContext.orderedDessert = true;
      }

      // Detectar rejeições
      if (this.containsRejection(lowerMessage, "drink")) {
        currentContext.rejectedDrink = true;
      }
      if (this.containsRejection(lowerMessage, "dessert")) {
        currentContext.rejectedDessert = true;
      }

      let contextualPrompt = this.systemPrompt;

      contextualPrompt += `\n\nCONTEXTO DA CONVERSA:`;
      contextualPrompt += `\n- Cliente já pediu pizza: ${
        currentContext.orderedPizza ? "SIM" : "NÃO"
      }`;
      contextualPrompt += `\n- Cliente já pediu bebida: ${
        currentContext.orderedDrink ? "SIM" : "NÃO"
      }`;
      contextualPrompt += `\n- Cliente já pediu sobremesa: ${
        currentContext.orderedDessert ? "SIM" : "NÃO"
      }`;
      contextualPrompt += `\n- Cliente REJEITOU bebida: ${
        currentContext.rejectedDrink ? "SIM (NÃO ofereça mais bebidas!)" : "NÃO"
      }`;
      contextualPrompt += `\n- Cliente REJEITOU sobremesa: ${
        currentContext.rejectedDessert
          ? "SIM (NÃO ofereça mais sobremesas!)"
          : "NÃO"
      }`;
      contextualPrompt += `\n- Intenção atual do cliente: ${currentContext.customerIntent.toUpperCase()}`;

      if (currentContext.lastMessages.length > 1) {
        contextualPrompt += `\n\nMENSAGENS ANTERIORES:`;
        currentContext.lastMessages.slice(-3).forEach((msg, i) => {
          contextualPrompt += `\n${i + 1}. ${msg}`;
        });
      }

      contextualPrompt += `\n\nESTRATÉGIA DE RESPOSTA:`;
      if (currentContext.customerIntent === "rejecting") {
        contextualPrompt += `\n- ATENÇÃO: Cliente está REJEITANDO algo. Seja respeitoso e mude de categoria!`;
      }

      if (!currentContext.orderedPizza) {
        contextualPrompt += `\n- PRIORIDADE: Vender pizza (foque nas mais populares: Calabresa, Margherita)`;
      } else if (
        !currentContext.orderedDrink &&
        !currentContext.rejectedDrink
      ) {
        contextualPrompt += `\n- PRIORIDADE: Oferecer bebida para acompanhar`;
      } else if (
        !currentContext.orderedDessert &&
        !currentContext.rejectedDessert
      ) {
        contextualPrompt += `\n- PRIORIDADE: Oferecer sobremesa para finalizar`;
      } else {
        contextualPrompt += `\n- PRIORIDADE: Confirmar pedido e finalizar atendimento`;
      }

      contextualPrompt += `\n\nMENSAGEM DO CLIENTE: "${message}"`;
      contextualPrompt += `\n\nRESPONDA seguindo as regras e estratégia acima:`;

      const result = await model.generateContent(contextualPrompt);
      const response = await result.response;
      const aiMessage = response.text();

      const suggestedProducts = this.generateSuggestions(
        currentContext,
        pizzas,
        drinks,
        desserts
      );

      return {
        message: aiMessage,
        suggestedProducts,
        context: currentContext,
      };
    } catch (error) {
      console.error("Erro na IA:", error);

      return {
        message:
          "Desculpe, tive um problema técnico. Mas posso te ajudar! Que tal experimentar nossa pizza Calabresa? É uma das mais pedidas! 🍕",
        suggestedProducts: ["Calabresa", "Margherita", "Coca-Cola"],
        context: context || {
          orderedPizza: false,
          orderedDrink: false,
          orderedDessert: false,
          rejectedDrink: false,
          rejectedDessert: false,
          lastMessages: [message],
          customerIntent: "unknown",
        },
      };
    }
  }

  private containsPizzaOrder(message: string, pizzas: MenuItem[]): boolean {
    const lowerMessage = message.toLowerCase();

    // Palavras que indicam negação - se presentes, não é um pedido
    const negativeWords = [
      "não",
      "nao",
      "nunca",
      "jamais",
      "recuso",
      "dispenso",
      "sem",
    ];
    if (negativeWords.some((word) => lowerMessage.includes(word))) {
      return false;
    }

    const positiveKeywords = [
      "quero",
      "gostaria",
      "vou levar",
      "pode ser",
      "vou querer",
      "me dá",
      "aceito",
      "sim",
      "ok",
      "beleza",
      "fechado",
    ];
    const pizzaNames = pizzas.map((p) => p.name.toLowerCase());
    const pizzaWords = ["pizza"];

    // Verifica se há intenção positiva + menção a pizza
    const hasPositiveIntent = positiveKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    const mentionsPizza =
      pizzaWords.some((word) => lowerMessage.includes(word)) ||
      pizzaNames.some((name) => lowerMessage.includes(name));

    return hasPositiveIntent && mentionsPizza;
  }

  private containsDrinkOrder(message: string, drinks: MenuItem[]): boolean {
    const lowerMessage = message.toLowerCase();

    // Palavras que indicam negação
    const negativeWords = [
      "não",
      "nao",
      "nunca",
      "jamais",
      "recuso",
      "dispenso",
      "sem",
    ];
    if (negativeWords.some((word) => lowerMessage.includes(word))) {
      return false;
    }

    const positiveKeywords = [
      "quero",
      "gostaria",
      "vou levar",
      "pode ser",
      "vou querer",
      "me dá",
      "aceito",
      "sim",
      "ok",
      "beleza",
      "fechado",
    ];
    const drinkKeywords = [
      "coca",
      "guaraná",
      "suco",
      "água",
      "bebida",
      "refrigerante",
    ];
    const drinkNames = drinks.map((d) => d.name.toLowerCase());

    const hasPositiveIntent = positiveKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    const mentionsDrink =
      drinkKeywords.some((keyword) => lowerMessage.includes(keyword)) ||
      drinkNames.some((name) => lowerMessage.includes(name));

    return hasPositiveIntent && mentionsDrink;
  }

  private containsDessertOrder(message: string, desserts: MenuItem[]): boolean {
    const lowerMessage = message.toLowerCase();

    // Palavras que indicam negação
    const negativeWords = [
      "não",
      "nao",
      "nunca",
      "jamais",
      "recuso",
      "dispenso",
      "sem",
    ];
    if (negativeWords.some((word) => lowerMessage.includes(word))) {
      return false;
    }

    const positiveKeywords = [
      "quero",
      "gostaria",
      "vou levar",
      "pode ser",
      "vou querer",
      "me dá",
      "aceito",
      "sim",
      "ok",
      "beleza",
      "fechado",
    ];
    const dessertKeywords = [
      "brownie",
      "pudim",
      "mousse",
      "sobremesa",
      "doce",
      "tiramisù",
      "petit",
    ];
    const dessertNames = desserts.map((d) => d.name.toLowerCase());

    const hasPositiveIntent = positiveKeywords.some((keyword) =>
      lowerMessage.includes(keyword)
    );
    const mentionsDessert =
      dessertKeywords.some((keyword) => lowerMessage.includes(keyword)) ||
      dessertNames.some((name) => lowerMessage.includes(name));

    return hasPositiveIntent && mentionsDessert;
  }

  // Nova função para detectar rejeições
  private containsRejection(message: string, category: string): boolean {
    const lowerMessage = message.toLowerCase();
    const negativeWords = [
      "não",
      "nao",
      "nunca",
      "jamais",
      "recuso",
      "dispenso",
      "sem",
      "obrigado",
    ];

    const categoryWords: { [key: string]: string[] } = {
      drink: ["bebida", "suco", "refrigerante", "coca", "guaraná", "água"],
      dessert: ["sobremesa", "doce", "brownie", "pudim", "mousse"],
      pizza: ["pizza"],
    };

    const hasNegation = negativeWords.some((word) =>
      lowerMessage.includes(word)
    );
    const mentionsCategory =
      categoryWords[category]?.some((word) => lowerMessage.includes(word)) ||
      false;

    return (
      hasNegation && (mentionsCategory || lowerMessage.includes("obrigado"))
    );
  }

  // Detectar intenção do cliente
  private detectCustomerIntent(
    message: string
  ): "ordering" | "asking" | "rejecting" | "greeting" | "unknown" {
    const lowerMessage = message.toLowerCase();

    // Palavras de cumprimento
    const greetingWords = [
      "oi",
      "olá",
      "bom dia",
      "boa tarde",
      "boa noite",
      "hello",
    ];
    if (greetingWords.some((word) => lowerMessage.includes(word))) {
      return "greeting";
    }

    // Palavras de rejeição
    const rejectionWords = ["não", "nao", "nunca", "obrigado", "dispenso"];
    if (rejectionWords.some((word) => lowerMessage.includes(word))) {
      return "rejecting";
    }

    // Palavras de pergunta
    const questionWords = [
      "que",
      "qual",
      "como",
      "quanto",
      "onde",
      "?",
      "tem",
      "têm",
    ];
    if (questionWords.some((word) => lowerMessage.includes(word))) {
      return "asking";
    }

    // Palavras de pedido
    const orderWords = [
      "quero",
      "gostaria",
      "vou levar",
      "pode ser",
      "aceito",
      "sim",
    ];
    if (orderWords.some((word) => lowerMessage.includes(word))) {
      return "ordering";
    }

    return "unknown";
  }

  private generateSuggestions(
    context: ConversationContext,
    pizzas: MenuItem[],
    drinks: MenuItem[],
    desserts: MenuItem[]
  ): string[] {
    const suggestions: string[] = [];

    if (!context.orderedPizza) {
      suggestions.push("Calabresa", "Margherita", "Quatro Queijos");
    } else if (!context.orderedDrink && !context.rejectedDrink) {
      suggestions.push("Coca-Cola", "Guaraná", "Suco de Laranja");
    } else if (!context.orderedDessert && !context.rejectedDessert) {
      suggestions.push("Brownie", "Pudim", "Mousse de Maracujá");
    } else {
      // Se tudo foi pedido ou rejeitado, sugira mais pizzas ou finalize
      if (!context.rejectedDrink && !context.rejectedDessert) {
        suggestions.push("Portuguesa", "Pepperoni", "Frango c/ Catupiry");
      } else {
        suggestions.push("Pedido Confirmado", "Finalizar", "Obrigado");
      }
    }

    return suggestions.slice(0, 3); // Máximo 3 sugestões
  }
}

export const aiService = new AIService();
