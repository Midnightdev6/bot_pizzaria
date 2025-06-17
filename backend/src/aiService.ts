import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

interface ConversationContext {
  orderedPizza: boolean;
  orderedDrink: boolean;
  orderedDessert: boolean;
  lastMessages: string[];
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

🍕 REGRAS DE NEGÓCIO OBRIGATÓRIAS:

1. FOCO EXCLUSIVO EM PIZZA:
   - APENAS fale sobre itens do nosso cardápio
   - NÃO responda perguntas sobre outros assuntos
   - Redirecione SEMPRE para pizzas se fugir do assunto

2. FORÇA DE VENDA (EDUCADA MAS INSISTENTE):
   - Seu objetivo é VENDER pizzas
   - Sempre tente convencer o cliente a pedir
   - Use técnicas de persuasão suaves
   - Destaque benefícios e qualidade

3. OFERTAS CONDICIONAIS:
   - SE cliente não tem bebida → ofereça bebida
   - SE cliente tem bebida → ofereça sobremesa
   - Sempre tente fazer upsell

4. PROIBIÇÕES ABSOLUTAS:
   - NUNCA ofereça descontos
   - NUNCA ofereça promoções
   - NUNCA ofereça cupons
   - NUNCA negocie preços

5. CARDÁPIO FIXO (não invente itens):

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

6. TRATAMENTO DE REJEIÇÃO:
   - Se cliente recusar, ofereça alternativas do mesmo tipo
   - Seja persistente mas educado
   - Use frases como "que tal experimentar..." 
   - Nunca desista facilmente

7. PERSONALIDADE:
   - Simpático e acolhedor
   - Entusiasmado com as pizzas
   - Conhecedor do produto
   - Foque em criar desejo pelo produto

RESPONDA SEMPRE EM PORTUGUÊS BRASILEIRO, seja direto e mantenha foco total em vendas!
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
        lastMessages: [],
      };

      currentContext.lastMessages.push(message);
      if (currentContext.lastMessages.length > 5) {
        currentContext.lastMessages = currentContext.lastMessages.slice(-5);
      }

      const lowerMessage = message.toLowerCase();
      if (this.containsPizzaOrder(lowerMessage, pizzas)) {
        currentContext.orderedPizza = true;
      }
      if (this.containsDrinkOrder(lowerMessage, drinks)) {
        currentContext.orderedDrink = true;
      }
      if (this.containsDessertOrder(lowerMessage, desserts)) {
        currentContext.orderedDessert = true;
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

      if (currentContext.lastMessages.length > 1) {
        contextualPrompt += `\n\nMENSAGENS ANTERIORES:`;
        currentContext.lastMessages.slice(-3).forEach((msg, i) => {
          contextualPrompt += `\n${i + 1}. ${msg}`;
        });
      }

      contextualPrompt += `\n\nESTRATÉGIA DE RESPOSTA:`;
      if (!currentContext.orderedPizza) {
        contextualPrompt += `\n- PRIORIDADE: Vender pizza (foque nas mais populares: Calabresa, Margherita)`;
      } else if (!currentContext.orderedDrink) {
        contextualPrompt += `\n- PRIORIDADE: Oferecer bebida para acompanhar`;
      } else if (!currentContext.orderedDessert) {
        contextualPrompt += `\n- PRIORIDADE: Oferecer sobremesa para finalizar`;
      } else {
        contextualPrompt += `\n- PRIORIDADE: Confirmar pedido e oferecer algo mais`;
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
          lastMessages: [message],
        },
      };
    }
  }

  private containsPizzaOrder(message: string, pizzas: MenuItem[]): boolean {
    const pizzaKeywords = ["pizza", "quero", "gostaria", "vou levar"];
    const pizzaNames = pizzas.map((p) => p.name.toLowerCase());

    return (
      pizzaKeywords.some((keyword) => message.includes(keyword)) ||
      pizzaNames.some((name) => message.includes(name))
    );
  }

  private containsDrinkOrder(message: string, drinks: MenuItem[]): boolean {
    const drinkKeywords = ["coca", "guaraná", "suco", "água", "bebida"];
    const drinkNames = drinks.map((d) => d.name.toLowerCase());

    return (
      drinkKeywords.some((keyword) => message.includes(keyword)) ||
      drinkNames.some((name) => message.includes(name))
    );
  }

  private containsDessertOrder(message: string, desserts: MenuItem[]): boolean {
    const dessertKeywords = ["brownie", "pudim", "mousse", "sobremesa", "doce"];
    const dessertNames = desserts.map((d) => d.name.toLowerCase());

    return (
      dessertKeywords.some((keyword) => message.includes(keyword)) ||
      dessertNames.some((name) => message.includes(name))
    );
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
    } else if (!context.orderedDrink) {
      suggestions.push("Coca-Cola", "Guaraná", "Suco de Laranja");
    } else if (!context.orderedDessert) {
      suggestions.push("Brownie", "Pudim", "Mousse de Maracujá");
    } else {
      suggestions.push("Portuguesa", "Pepperoni", "Tiramisù");
    }

    return suggestions.slice(0, 3); // Máximo 3 sugestões
  }
}

export const aiService = new AIService();
