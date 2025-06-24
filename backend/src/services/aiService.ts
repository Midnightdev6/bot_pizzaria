import { GoogleGenerativeAI } from "@google/generative-ai";
import { PrismaClient } from "@prisma/client";
import { ConversationContext, AIResponse, MenuItem } from "../types";
import dotenv from "dotenv";

// Garantir que as variáveis de ambiente sejam carregadas
dotenv.config();

const prisma = new PrismaClient();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

🍕 REGRAS DE NEGÓCIO E FLUXO:

1. FLUXO OBRIGATÓRIO: Pizza → Bebida → Sobremesa → Finalização
   - NUNCA volte para uma etapa já concluída
   - SEMPRE respeite a ordem sequencial
   - Quando um item é escolhido, PASSE para o próximo tipo

2. FOCO NO CARDÁPIO:
   - APENAS fale sobre itens do nosso cardápio
   - NÃO responda perguntas sobre outros assuntos
   - Redirecione educadamente para nossos produtos

3. VENDA INTELIGENTE (não agressiva):
   - Seja prestativo primeiro, vendedor depois
   - Use a regra: Pizza → Bebida → Sobremesa → Finalização
   - Se cliente rejeitar uma categoria, pule para próxima
   - NUNCA insista no que o cliente recusou
   - NUNCA volte para categoria já escolhida

4. FINALIZAÇÃO DO PEDIDO:
   - Após pizza + bebida + (sobremesa OU rejeição de sobremesa):
   - Calcular valor total
   - Informar resumo do pedido
   - Perguntar endereço de entrega
   - Informar tempo estimado de 35-45 minutos

5. PROIBIÇÕES:
   - NUNCA ofereça descontos, promoções ou cupons
   - NUNCA negocie preços
   - NUNCA insista no que foi recusado
   - NUNCA volte para categoria já escolhida

6. CARDÁPIO FIXO:

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

7. PERSONALIDADE:
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
        selectedItems: {},
        orderPhase: "pizza",
        orderTotal: 0,
        needsAddress: false,
      };

      currentContext.lastMessages.push(message);
      if (currentContext.lastMessages.length > 5) {
        currentContext.lastMessages = currentContext.lastMessages.slice(-5);
      }

      const lowerMessage = message.toLowerCase();

      // Detectar intenção do cliente
      currentContext.customerIntent = this.detectCustomerIntent(lowerMessage);

      // Verificar se é pergunta específica sobre cardápio
      const menuQuestionType = this.detectMenuQuestion(lowerMessage);

      // Detectar pedidos e itens específicos
      if (this.containsPizzaOrder(lowerMessage, pizzas)) {
        currentContext.orderedPizza = true;
        currentContext.orderPhase = "drink";
        const pizzaItem = this.detectSpecificItem(lowerMessage, pizzas);
        if (pizzaItem) {
          currentContext.selectedItems.pizza = pizzaItem.name;
          currentContext.orderTotal += pizzaItem.price;
        }
      }
      if (this.containsDrinkOrder(lowerMessage, drinks)) {
        currentContext.orderedDrink = true;
        currentContext.orderPhase = "dessert";
        const drinkItem = this.detectSpecificItem(lowerMessage, drinks);
        if (drinkItem) {
          currentContext.selectedItems.drink = drinkItem.name;
          currentContext.orderTotal += drinkItem.price;
        }
      }
      if (this.containsDessertOrder(lowerMessage, desserts)) {
        currentContext.orderedDessert = true;
        currentContext.orderPhase = "finalizing";
        const dessertItem = this.detectSpecificItem(lowerMessage, desserts);
        if (dessertItem) {
          currentContext.selectedItems.dessert = dessertItem.name;
          currentContext.orderTotal += dessertItem.price;
        }
      }

      // Detectar rejeições e ajustar fase
      if (this.containsRejection(lowerMessage, "drink")) {
        currentContext.rejectedDrink = true;
        if (currentContext.orderPhase === "drink") {
          currentContext.orderPhase = "dessert";
        }
      }
      if (this.containsRejection(lowerMessage, "dessert")) {
        currentContext.rejectedDessert = true;
        currentContext.orderPhase = "finalizing";
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

      contextualPrompt += `\n- Fase atual do pedido: ${currentContext.orderPhase.toUpperCase()}`;
      if (currentContext.selectedItems.pizza) {
        contextualPrompt += `\n- Pizza escolhida: ${currentContext.selectedItems.pizza}`;
      }
      if (currentContext.selectedItems.drink) {
        contextualPrompt += `\n- Bebida escolhida: ${currentContext.selectedItems.drink}`;
      }
      if (currentContext.selectedItems.dessert) {
        contextualPrompt += `\n- Sobremesa escolhida: ${currentContext.selectedItems.dessert}`;
      }
      contextualPrompt += `\n- Total atual: R$ ${currentContext.orderTotal.toFixed(
        2
      )}`;

      contextualPrompt += `\n\nESTRATÉGIA DE RESPOSTA:`;

      // PRIORIDADE MÁXIMA: Se é pergunta sobre cardápio, responder com lista formatada
      if (
        currentContext.customerIntent === "menu_question" &&
        menuQuestionType
      ) {
        contextualPrompt += `\n\n🚨 ATENÇÃO ESPECIAL: Cliente está perguntando sobre ${menuQuestionType.toUpperCase()}!`;
        contextualPrompt += `\n- RESPONDA IMEDIATAMENTE com uma LISTA FORMATADA e ORGANIZADA`;
        contextualPrompt += `\n- Use emojis e formatação markdown para deixar visualmente atrativo`;
        contextualPrompt += `\n- Inclua nome e preço de cada item`;
        contextualPrompt += `\n- NÃO faça perguntas adicionais, apenas apresente a lista solicitada`;

        if (menuQuestionType === "pizzas") {
          contextualPrompt += `\n- RESPONDA com lista completa de PIZZAS no formato:`;
          contextualPrompt += `\n  🍕 **PIZZAS DISPONÍVEIS:**\n  • Nome - R$ XX,XX`;
        } else if (menuQuestionType === "drinks") {
          contextualPrompt += `\n- RESPONDA com lista completa de BEBIDAS no formato:`;
          contextualPrompt += `\n  🥤 **BEBIDAS DISPONÍVEIS:**\n  • Nome - R$ XX,XX`;
        } else if (menuQuestionType === "desserts") {
          contextualPrompt += `\n- RESPONDA com lista completa de SOBREMESAS no formato:`;
          contextualPrompt += `\n  🍰 **SOBREMESAS DISPONÍVEIS:**\n  • Nome - R$ XX,XX`;
        } else if (menuQuestionType === "all") {
          contextualPrompt += `\n- RESPONDA com cardápio COMPLETO organizado por categorias`;
        }
        contextualPrompt += `\n- Após a lista, pergunte qual item desperta mais interesse`;
      } else if (currentContext.customerIntent === "rejecting") {
        contextualPrompt += `\n- ATENÇÃO: Cliente está REJEITANDO algo. Seja respeitoso e mude de categoria!`;
      } else {
        // Estratégia baseada na fase do pedido
        switch (currentContext.orderPhase) {
          case "pizza":
            contextualPrompt += `\n- PRIORIDADE: Vender pizza (foque nas mais populares: Calabresa, Margherita, Frango c/ Catupiry)`;
            break;
          case "drink":
            contextualPrompt += `\n- PRIORIDADE: Oferecer bebida para acompanhar a pizza`;
            contextualPrompt += `\n- NUNCA volte para oferecer pizza novamente`;
            break;
          case "dessert":
            contextualPrompt += `\n- PRIORIDADE: Oferecer sobremesa para finalizar`;
            contextualPrompt += `\n- NUNCA volte para pizza ou bebida`;
            break;
          case "finalizing":
            contextualPrompt += `\n- PRIORIDADE: FINALIZAR O PEDIDO`;
            contextualPrompt += `\n- Informar resumo do pedido com total`;
            contextualPrompt += `\n- Perguntar endereço de entrega`;
            contextualPrompt += `\n- Informar tempo estimado de 35-45 minutos`;
            contextualPrompt += `\n- NUNCA ofereça mais itens, apenas finalize`;
            break;
          case "completed":
            contextualPrompt += `\n- Pedido finalizado. Agradecer e confirmar entrega`;
            break;
        }
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
          selectedItems: {},
          orderPhase: "pizza",
          orderTotal: 0,
          needsAddress: false,
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

  // Detectar item específico mencionado na mensagem
  private detectSpecificItem(
    message: string,
    items: MenuItem[]
  ): MenuItem | null {
    const lowerMessage = message.toLowerCase();

    // Procurar por nomes exatos de itens
    for (const item of items) {
      const itemNameLower = item.name.toLowerCase();
      if (lowerMessage.includes(itemNameLower)) {
        return item;
      }

      // Verificar palavras-chave específicas para cada item
      if (item.name.includes("Calabresa") && lowerMessage.includes("calabresa"))
        return item;
      if (
        item.name.includes("Margherita") &&
        lowerMessage.includes("margherita")
      )
        return item;
      if (
        item.name.includes("Portuguesa") &&
        lowerMessage.includes("portuguesa")
      )
        return item;
      if (
        item.name.includes("Quatro Queijos") &&
        (lowerMessage.includes("quatro queijos") ||
          lowerMessage.includes("4 queijos"))
      )
        return item;
      if (
        item.name.includes("Frango") &&
        (lowerMessage.includes("frango") || lowerMessage.includes("catupiry"))
      )
        return item;
      if (item.name.includes("Pepperoni") && lowerMessage.includes("pepperoni"))
        return item;
      if (item.name.includes("Coca-Cola") && lowerMessage.includes("coca"))
        return item;
      if (item.name.includes("Guaraná") && lowerMessage.includes("guaraná"))
        return item;
      if (
        item.name.includes("Suco de Laranja") &&
        lowerMessage.includes("laranja")
      )
        return item;
      if (item.name.includes("Suco de Uva") && lowerMessage.includes("uva"))
        return item;
      if (item.name.includes("Água") && lowerMessage.includes("água"))
        return item;
      if (item.name.includes("Brownie") && lowerMessage.includes("brownie"))
        return item;
      if (item.name.includes("Pudim") && lowerMessage.includes("pudim"))
        return item;
      if (item.name.includes("Tiramisù") && lowerMessage.includes("tiramisù"))
        return item;
      if (
        item.name.includes("Petit Gateau") &&
        (lowerMessage.includes("petit") || lowerMessage.includes("gateau"))
      )
        return item;
      if (item.name.includes("Mousse") && lowerMessage.includes("mousse"))
        return item;
    }

    // Se não encontrou item específico, retorna o primeiro da categoria (padrão)
    return items.length > 0 ? items[0] : null;
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

  // Detectar se cliente está perguntando sobre cardápio específico
  private detectMenuQuestion(
    message: string
  ): "pizzas" | "drinks" | "desserts" | "all" | null {
    const lowerMessage = message.toLowerCase();

    // Palavras que indicam pergunta sobre cardápio
    const menuQuestionIndicators = [
      "que",
      "qual",
      "quais",
      "tem",
      "têm",
      "temos",
      "vocês têm",
      "sabores",
      "opções",
      "opcoes",
      "lista",
      "cardápio",
      "menu",
      "disponível",
      "disponivel",
    ];

    const isMenuQuestion = menuQuestionIndicators.some((word) =>
      lowerMessage.includes(word)
    );
    if (!isMenuQuestion) return null;

    // Específico para pizzas
    const pizzaWords = ["pizza", "sabor", "sabores", "massa"];
    if (pizzaWords.some((word) => lowerMessage.includes(word))) {
      return "pizzas";
    }

    // Específico para bebidas
    const drinkWords = [
      "bebida",
      "bebidas",
      "suco",
      "sucos",
      "refrigerante",
      "beber",
      "tomar",
    ];
    if (drinkWords.some((word) => lowerMessage.includes(word))) {
      return "drinks";
    }

    // Específico para sobremesas
    const dessertWords = ["sobremesa", "sobremesas", "doce", "doces", "açucar"];
    if (dessertWords.some((word) => lowerMessage.includes(word))) {
      return "desserts";
    }

    // Se menciona "todas", "tudo", "completo" = cardápio completo
    const allWords = [
      "todas",
      "todos",
      "tudo",
      "completo",
      "completa",
      "tudo que",
    ];
    if (allWords.some((word) => lowerMessage.includes(word))) {
      return "all";
    }

    // Se é pergunta sobre cardápio mas não especifica categoria, assume pizzas (principal)
    return "pizzas";
  }

  // Detectar intenção do cliente
  private detectCustomerIntent(
    message: string
  ):
    | "ordering"
    | "asking"
    | "rejecting"
    | "greeting"
    | "menu_question"
    | "unknown" {
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

    // Verificar se é pergunta específica sobre cardápio
    if (this.detectMenuQuestion(message) !== null) {
      return "menu_question";
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

  // IA SIMULADA INTELIGENTE
  private generateIntelligentResponse(
    message: string,
    context: ConversationContext,
    pizzas: MenuItem[],
    drinks: MenuItem[],
    desserts: MenuItem[]
  ): string {
    const lowerMessage = message.toLowerCase();

    // Respostas baseadas na intenção detectada e contexto
    switch (context.customerIntent) {
      case "greeting":
        return "Olá! Bem-vindo à Pizzaria AI! 🍕 Sou seu atendente virtual especializado. Que tal começar com uma deliciosa pizza? Temos Calabresa, Margherita, Portuguesa e muito mais!";

      case "asking":
        if (lowerMessage.includes("sabor") || lowerMessage.includes("pizza")) {
          return `Temos deliciosas opções de pizzas:\n\n🍕 **PIZZAS DISPONÍVEIS:**\n• Margherita - R$ 35,90\n• Calabresa - R$ 38,90\n• Portuguesa - R$ 42,90\n• Quatro Queijos - R$ 45,90\n• Frango c/ Catupiry - R$ 41,90\n• Pepperoni - R$ 44,90\n\nQual desperta seu interesse?`;
        }
        if (lowerMessage.includes("bebida") || lowerMessage.includes("suco")) {
          return `Temos ótimas bebidas para acompanhar:\n\n🥤 **BEBIDAS:**\n• Coca-Cola 350ml - R$ 5,50\n• Guaraná Antarctica 350ml - R$ 5,50\n• Suco de Laranja 300ml - R$ 8,90\n• Suco de Uva 300ml - R$ 8,90\n• Água Mineral 500ml - R$ 3,50\n\nQual você gostaria?`;
        }
        return "Posso te ajudar com nosso cardápio! Temos pizzas deliciosas, bebidas refrescantes e sobremesas irresistíveis. O que você gostaria de saber?";

      case "rejecting":
        if (context.rejectedDrink && !context.orderedDessert) {
          return "Sem problemas! Que tal uma sobremesa para finalizar? Temos Brownie com Calda (R$ 15,90), Pudim de Leite Condensado (R$ 12,90) ou Tiramisù (R$ 18,90).";
        }
        if (context.rejectedDessert) {
          return "Perfeito! Então vamos finalizar seu pedido. Você escolheu uma ótima combinação! Posso confirmar seu pedido?";
        }
        return "Tudo bem! Cada pessoa tem suas preferências. O que posso oferecer que seria do seu interesse?";

      case "ordering":
        if (!context.orderedPizza) {
          return "Excelente escolha! Nossa pizza é preparada com ingredientes frescos e massa artesanal. Para acompanhar, que tal uma bebida gelada? Temos Coca-Cola, Guaraná ou sucos naturais!";
        }
        if (!context.orderedDrink && !context.rejectedDrink) {
          return "Perfeita combinação! Para acompanhar sua pizza, recomendo uma Coca-Cola gelada ou um de nossos sucos naturais. O que acha?";
        }
        if (!context.orderedDessert && !context.rejectedDessert) {
          return "Ótima pedida! Para finalizar com chave de ouro, que tal nossa sobremesa especial? O Brownie com Calda é irresistível!";
        }
        return "Perfeito! Seu pedido está ficando delicioso. Mais alguma coisa que posso adicionar?";

      default:
        if (!context.orderedPizza) {
          return "Que tal começar com uma de nossas pizzas mais populares? A Calabresa é um clássico que todo mundo adora, ou a Margherita para quem gosta de sabores tradicionais!";
        }
        if (!context.orderedDrink && !context.rejectedDrink) {
          return "Sua pizza está garantida! Para acompanhar, posso sugerir uma bebida? Uma Coca-Cola gelada combina perfeitamente!";
        }
        if (!context.orderedDessert && !context.rejectedDessert) {
          return "Que tal finalizar com uma sobremesa? Nosso Pudim de Leite Condensado é a pedida perfeita para encerrar sua refeição!";
        }
        return "Seu pedido está completo! Foi um prazer atendê-lo. Sua pizza chegará quentinha e deliciosa em breve! 🍕";
    }
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
