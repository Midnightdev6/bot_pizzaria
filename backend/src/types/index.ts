export interface ConversationContext {
  orderedPizza: boolean;
  orderedDrink: boolean;
  orderedDessert: boolean;
  rejectedDrink: boolean;
  rejectedDessert: boolean;
  lastMessages: string[];
  customerIntent:
    | "ordering"
    | "asking"
    | "rejecting"
    | "greeting"
    | "menu_question"
    | "unknown";
  selectedItems: {
    pizza?: string;
    drink?: string;
    dessert?: string;
  };
  orderPhase: "pizza" | "drink" | "dessert" | "finalizing" | "completed";
  orderTotal: number;
  needsAddress: boolean;
}

export interface AIResponse {
  message: string;
  suggestedProducts: string[];
  context: ConversationContext;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  available: boolean;
  createdAt: Date;
  updatedAt: Date;
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
