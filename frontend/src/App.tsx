import React from "react";
import { Toaster } from "react-hot-toast";
import ChatContainer from "./components/ChatContainer";
import Header from "./components/Header";

function App() {
  return (
    <div className="app-container">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#fff",
            color: "#374151",
            border: "1px solid #e5e7eb",
            borderRadius: "12px",
            boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
          },
        }}
      />

      <div className="chat-container">
        <Header />
        <ChatContainer />
      </div>
    </div>
  );
}

export default App;
