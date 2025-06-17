import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Message } from "../types";
import { v4 as uuidv4 } from "uuid";

interface ChatState {
  messages: Message[];
  isConnected: boolean;
  sessionId: string | null;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;
  startNewSession: () => void;
  setConnectionStatus: (status: boolean) => void;
  setSessionId: (sessionId: string) => void;
}

const ensureDateTimestamp = (message: any): Message => ({
  ...message,
  timestamp:
    typeof message.timestamp === "string"
      ? new Date(message.timestamp)
      : message.timestamp instanceof Date
      ? message.timestamp
      : new Date(),
});

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      isConnected: false,
      sessionId: null,

      addMessage: (message: Message) => {
        const processedMessage = ensureDateTimestamp(message);
        set((state) => ({
          messages: [...state.messages, processedMessage],
        }));
      },

      setMessages: (messages: Message[]) => {
        const processedMessages = messages.map(ensureDateTimestamp);
        set({ messages: processedMessages });
      },

      clearMessages: () => {
        set({ messages: [] });
      },

      startNewSession: () => {
        const newSessionId = uuidv4();
        set({
          messages: [],
          sessionId: newSessionId,
        });
      },

      setConnectionStatus: (status: boolean) => {
        set({ isConnected: status });
      },

      setSessionId: (sessionId: string) => {
        set({ sessionId });
      },
    }),
    {
      name: "chat-storage",
      partialize: (state) => ({
        messages: state.messages,
        sessionId: state.sessionId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.messages) {
          state.messages = state.messages.map(ensureDateTimestamp);
        }
      },
    }
  )
);
