import React, { useState, useEffect, useRef } from "react";
import { Send, Loader2 } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import toast from "react-hot-toast";
import MessageBubble from "./MessageBubble";
import ProductSuggestions from "./ProductSuggestions";
import { useChatStore } from "../stores/chatStore";
import { chatService } from "../services/chatService";
import { Message } from "../types";

const ChatContainer: React.FC = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const { messages, sessionId, addMessage, setSessionId } = useChatStore();

  const currentSessionId = sessionId || uuidv4();

  useEffect(() => {
    if (!sessionId) {
      setSessionId(currentSessionId);
    }
  }, [sessionId, currentSessionId, setSessionId]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setTimeout(() => {
        sendWelcomeMessage();
      }, 1000);
    }
  }, [messages.length]);

  const sendWelcomeMessage = () => {
    const welcomeMessage: Message = {
      id: uuidv4(),
      message:
        "Olá! Bem-vindo à nossa pizzaria! 🍕\n\nEstou aqui para te ajudar a encontrar a pizza perfeita. Que tal começar vendo nossos sabores mais populares?",
      sender: "AI",
      timestamp: new Date(),
      suggestedProducts: ["Calabresa", "Margherita", "Portuguesa"],
    };
    addMessage(welcomeMessage);
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: uuidv4(),
      message: inputMessage.trim(),
      sender: "USER",
      timestamp: new Date(),
    };

    addMessage(userMessage);
    const currentMessage = inputMessage.trim();
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await chatService.sendMessage({
        message: currentMessage,
        sessionId: currentSessionId,
      });

      const aiMessage: Message = {
        id: response.aiResponse.id,
        message: response.aiResponse.message,
        sender: "AI",
        timestamp: new Date(response.aiResponse.timestamp),
        suggestedProducts: response.aiResponse.suggestedProducts,
      };

      addMessage(aiMessage);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");

      const errorMessage: Message = {
        id: uuidv4(),
        message:
          "Desculpe, ocorreu um erro. Por favor, tente novamente em alguns instantes.",
        sender: "AI",
        timestamp: new Date(),
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Lista de Mensagens */}
      <div ref={chatMessagesRef} className="chat-messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="text-gray-400 text-lg mb-2">🍕</div>
            <p className="text-gray-500">Iniciando conversa...</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={message.id} className="animate-slide-up">
            <MessageBubble message={message} />
            {message.suggestedProducts &&
              message.suggestedProducts.length > 0 && (
                <div className="mt-2">
                  <ProductSuggestions
                    products={message.suggestedProducts}
                    onProductClick={handleSuggestionClick}
                  />
                </div>
              )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-bounce-in">
            <div className="typing-indicator">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">IA está digitando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input de Mensagem */}
      <div className="chat-input">
        <div className="flex space-x-3">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem..."
            className="input-field"
            disabled={isLoading}
            rows={1}
            style={{ resize: "none" }}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="send-button flex items-center space-x-2"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </>
            )}
          </button>
        </div>

        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400">
            Pressione Enter para enviar • Shift + Enter para nova linha
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatContainer;
