import React from "react";
import { Bot, User } from "lucide-react";
import { Message } from "../types";

interface MessageBubbleProps {
  message: Message;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;

    if (isNaN(dateObj.getTime())) {
      return new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return dateObj.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUser = message.sender === "USER";

  return (
    <div className={`message-group ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`flex items-end space-x-2 ${
          isUser ? "flex-row-reverse space-x-reverse" : "flex-row"
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"
          }`}
        >
          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
        </div>

        {/* Message Bubble */}
        <div
          className={`message ${
            isUser ? "message-user" : "message-ai"
          } animate-slide-up`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.message}
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div
        className={`message-timestamp mt-1 ${
          isUser ? "text-right" : "text-left"
        }`}
      >
        <span className="text-xs text-gray-400">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
};

export default MessageBubble;
