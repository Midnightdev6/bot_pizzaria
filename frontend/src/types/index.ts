export interface Message {
  id: string;
  message: string;
  sender: "USER" | "AI";
  timestamp: Date | string;
  suggestedProducts?: string[];
  metadata?: any;
}

export interface ChatState {
  messages: Message[];
  isConnected: boolean;
  sessionId: string | null;
  isLoading: boolean;
}

export interface MenuItemResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "PIZZA" | "BEBIDA" | "SOBREMESA";
  available: boolean;
}

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

export interface ConversationState {
  sessionId: string;
  hasOrderedPizza: boolean;
  hasOrderedDrink: boolean;
  hasOrderedDessert: boolean;
  offeredDrinks: string[];
  offeredDesserts: string[];
  currentOrder: OrderItem[];
}

export interface OrderItem {
  id: string;
  name: string;
  category: "PIZZA" | "BEBIDA" | "SOBREMESA";
  quantity: number;
  price: number;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: any;
}

export interface SocketEvents {
  connect: () => void;
  disconnect: () => void;
  join_session: (sessionId: string) => void;
  send_message: (data: { message: string; sessionId: string }) => void;
  message_response: (data: MessageResponse) => void;
  error: (data: { message: string }) => void;
}
