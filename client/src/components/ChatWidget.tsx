import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, X, Send, Loader, AlertCircle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender: "provider" | "agent" | "system";
  timestamp: Date;
  isRead?: boolean;
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [agentStatus, setAgentStatus] = useState<"online" | "offline" | "waiting">("waiting");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize chat
  const handleOpenChat = async () => {
    if (!conversationId) {
      setIsLoading(true);
      try {
        // Simulate creating conversation
        const newConvId = Math.floor(Math.random() * 1000000);
        setConversationId(newConvId);
        setAgentStatus("waiting");

        // Add system message
        setMessages([
          {
            id: "system-1",
            content: "Welcome to Paeds Resus Support! A support agent will be with you shortly. In the meantime, feel free to describe your issue.",
            sender: "system",
            timestamp: new Date(),
          },
        ]);

        // Simulate agent joining after 2 seconds
        setTimeout(() => {
          setAgentStatus("online");
          setMessages((prev) => [
            ...prev,
            {
              id: "system-2",
              content: "Sarah from Support has joined the conversation 👋",
              sender: "system",
              timestamp: new Date(),
            },
          ]);
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    }
    setIsOpen(true);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !conversationId) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: "provider",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          content: "Thank you for your message. Let me help you with that right away!",
          sender: "agent",
          timestamp: new Date(),
        },
      ]);
    }, 1500);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Widget Button */}
      {!isOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-6 right-6 w-14 h-14 bg-[#ff6633] hover:bg-[#e55a22] text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 group"
          title="Open chat support"
        >
          <MessageCircle className="w-6 h-6" />
          {agentStatus === "online" && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
          )}
          {agentStatus === "waiting" && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-yellow-500 rounded-full border-2 border-white animate-pulse"></div>
          )}
          {agentStatus === "offline" && (
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-gray-500 rounded-full border-2 border-white"></div>
          )}
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff6633] rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Paeds Resus Support</h3>
                <p className="text-xs text-gray-200">
                  {agentStatus === "online" && "Sarah is online"}
                  {agentStatus === "waiting" && "Connecting..."}
                  {agentStatus === "offline" && "Support offline"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "provider" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === "provider"
                      ? "bg-[#ff6633] text-white rounded-br-none"
                      : msg.sender === "system"
                        ? "bg-gray-200 text-gray-800 text-sm italic rounded-lg"
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 px-4 py-2 rounded-lg rounded-bl-none">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6633] text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-[#ff6633] hover:bg-[#e55a22] disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition flex items-center gap-1"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 Typical response time: 2-3 minutes during business hours
            </p>
          </div>
        </div>
      )}
    </>
  );
}
