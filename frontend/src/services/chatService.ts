import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface MessageRequest {
  message: string;
  sessionId: string;
}

export interface MessageResponse {
  id: string;
  message: string;
  timestamp: string;
  sender: "USER" | "AI";
  suggestedProducts?: string[];
}

export interface ChatResponse {
  userMessage: MessageResponse;
  aiResponse: MessageResponse;
}

export interface MessagesHistoryResponse {
  messages: MessageResponse[];
  conversationId: string | null;
}

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "PIZZA" | "BEBIDA" | "SOBREMESA";
  available: boolean;
}

class ChatService {
  async sendMessage(request: MessageRequest): Promise<ChatResponse> {
    try {
      const response = await api.post("/messages", request);
      return response.data;
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      throw new Error("Falha ao enviar mensagem");
    }
  }

  async getMessages(sessionId: string): Promise<MessagesHistoryResponse> {
    try {
      const response = await api.get("/messages", {
        params: { sessionId },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error);
      throw new Error("Falha ao buscar histórico");
    }
  }

  async getMenu(): Promise<MenuItemResponse[]> {
    try {
      const response = await api.get("/menu");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar menu:", error);
      throw new Error("Falha ao buscar menu");
    }
  }

  async getPizzas(): Promise<MenuItemResponse[]> {
    try {
      const response = await api.get("/menu/pizzas");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar pizzas:", error);
      throw new Error("Falha ao buscar pizzas");
    }
  }

  async getDrinks(): Promise<MenuItemResponse[]> {
    try {
      const response = await api.get("/menu/drinks");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar bebidas:", error);
      throw new Error("Falha ao buscar bebidas");
    }
  }

  async getDesserts(): Promise<MenuItemResponse[]> {
    try {
      const response = await api.get("/menu/desserts");
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar sobremesas:", error);
      throw new Error("Falha ao buscar sobremesas");
    }
  }

  async searchMenu(query: string): Promise<MenuItemResponse[]> {
    try {
      const response = await api.get("/menu/search", {
        params: { q: query },
      });
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      throw new Error("Falha ao buscar itens");
    }
  }
}

export const chatService = new ChatService();
