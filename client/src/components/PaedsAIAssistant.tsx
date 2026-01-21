import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Loader, Sparkles, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  helpful?: boolean;
}

export default function PaedsAIAssistant() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<"onboarding" | "clinical" | "troubleshooting" | "general">("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize conversation
  const handleOpenAssistant = () => {
    if (!conversationId) {
      setConversationId(`conv-${Date.now()}`);
      setMessages([
        {
          id: "welcome",
          content:
            "👋 Hello! I'm Paeds Resus AI, your clinical decision support assistant. I can help you with:\n\n• Clinical guidance and protocols\n• Troubleshooting platform issues\n• Onboarding assistance\n• Real-time clinical support\n\nWhat can I help you with today?",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
    }
    setIsOpen(true);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isAuthenticated) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Simulate AI response with typing delay
      setTimeout(() => {
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          content:
            "I understand your question. Based on Paeds Resus protocols and best practices, here's what I recommend:\n\n1. **Immediate Action**: Follow the evidence-based guidelines for your specific scenario.\n\n2. **Key Considerations**: Always prioritize patient safety and refer to the relevant clinical protocols.\n\n3. **Next Steps**: If you need more detailed guidance, I can provide protocol references or connect you with a support specialist.\n\nWould you like more specific information about any aspect of this guidance?",
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
    }
  };

  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const handleFeedback = (messageId: string, helpful: boolean) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, helpful } : msg))
    );
  };

  if (!isAuthenticated) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-[#1a4d4d] to-[#0d3333] hover:shadow-lg text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 group"
        title="Paeds Resus AI Assistant"
      >
        <Sparkles className="w-6 h-6" />
        <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#ff6633] rounded-full border-2 border-white animate-pulse"></div>
      </button>
    );
  }

  return (
    <>
      {/* AI Assistant Button */}
      {!isOpen && (
        <button
          onClick={handleOpenAssistant}
          className="fixed bottom-6 left-6 w-14 h-14 bg-gradient-to-br from-[#1a4d4d] to-[#0d3333] hover:shadow-lg text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 z-40 group"
          title="Paeds Resus AI Assistant"
        >
          <Sparkles className="w-6 h-6" />
          <div className="absolute bottom-0 right-0 w-4 h-4 bg-[#ff6633] rounded-full border-2 border-white animate-pulse"></div>
        </button>
      )}

      {/* AI Assistant Window */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff6633] rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">Paeds Resus AI</h3>
                <p className="text-xs text-gray-200">Clinical Decision Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 p-1 rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Selector */}
          <div className="px-4 py-2 bg-gray-50 border-b flex gap-2 overflow-x-auto">
            {(["general", "clinical", "troubleshooting", "onboarding"] as const).map((ctx) => (
              <button
                key={ctx}
                onClick={() => setContext(ctx)}
                className={`px-2 py-1 rounded text-xs whitespace-nowrap transition ${
                  context === ctx
                    ? "bg-[#ff6633] text-white"
                    : "bg-white border border-gray-300 text-gray-700 hover:border-[#ff6633]"
                }`}
              >
                {ctx === "general" && "💬"}
                {ctx === "clinical" && "🏥"}
                {ctx === "troubleshooting" && "🔧"}
                {ctx === "onboarding" && "🚀"}
                {" " + ctx}
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-xs ${
                    msg.sender === "user"
                      ? "bg-[#ff6633] text-white rounded-lg rounded-br-none"
                      : "bg-white text-gray-900 border border-gray-200 rounded-lg rounded-bl-none"
                  } px-4 py-2`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs mt-1 opacity-70">
                    {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>

                  {/* Feedback for assistant messages */}
                  {msg.sender === "assistant" && msg.id !== "welcome" && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleFeedback(msg.id, true)}
                        className={`p-1 rounded transition ${
                          msg.helpful === true
                            ? "bg-green-200 text-green-700"
                            : "text-gray-400 hover:text-green-600"
                        }`}
                        title="Helpful"
                      >
                        <ThumbsUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleFeedback(msg.id, false)}
                        className={`p-1 rounded transition ${
                          msg.helpful === false
                            ? "bg-red-200 text-red-700"
                            : "text-gray-400 hover:text-red-600"
                        }`}
                        title="Not helpful"
                      >
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleCopyMessage(msg.content)}
                        className="p-1 rounded text-gray-400 hover:text-blue-600 transition"
                        title="Copy"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
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
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask me anything..."
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
            <p className="text-xs text-gray-500">
              🤖 Powered by Paeds Resus AI • Evidence-based guidance 24/7
            </p>
          </div>
        </div>
      )}
    </>
  );
}
