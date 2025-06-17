import React from "react";
import { Pizza, Bot, RefreshCw } from "lucide-react";
import { useChatStore } from "../stores/chatStore";
import toast from "react-hot-toast";

const Header: React.FC = () => {
  const { startNewSession } = useChatStore();

  const handleNewChat = () => {
    // Confirmar antes de limpar
    const confirmed = window.confirm(
      "Tem certeza que deseja iniciar uma nova conversa? O histórico atual será perdido."
    );

    if (confirmed) {
      // Iniciar nova sessão (limpa mensagens e gera novo sessionId)
      startNewSession();

      // Mostrar feedback para o usuário
      toast.success("Nova conversa iniciada! 🍕", {
        duration: 2000,
        position: "top-center",
      });
    }
  };

  return (
    <div className="chat-header">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Pizza className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">🍕 Pizzaria AI</h1>
            <p className="text-orange-100 text-sm">
              Atendimento virtual especializado
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Botão Novo Chat */}
          <button
            onClick={handleNewChat}
            className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-3 py-2 rounded-full transition-all duration-200 text-sm font-medium hover:scale-105"
            title="Iniciar nova conversa"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Novo Chat</span>
          </button>

          {/* Status Online */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-white/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Online</span>
            </div>
            <Bot className="w-5 h-5 text-orange-200" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;
