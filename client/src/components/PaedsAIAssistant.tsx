import { useState, useEffect, useRef } from "react";
import { X, Send, Loader, Sparkles, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  helpful?: boolean;
}

export default function PaedsAIAssistant() {
  const { isAuthenticated } = useAuth();
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isExamActive, setIsExamActive] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [context, setContext] = useState<"onboarding" | "clinical" | "troubleshooting" | "general">("general");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor DOM body attributes to hide tutor during summative exams/quizzes
  useEffect(() => {
    const checkExam = () => {
      const hasExamAttr = document.body.getAttribute("data-active-exam") === "true";
      const isExamPath =
        location.includes("/assessment") ||
        location.includes("/exam") ||
        location.includes("/capstone");
      setIsExamActive(hasExamAttr || isExamPath);
    };

    checkExam();

    const observer = new MutationObserver(checkExam);
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-active-exam"] });

    return () => observer.disconnect();
  }, [location]);

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
            "👋 Hello! I'm your Paeds Resus AI Guide. I can help you with:\n\n• Explaining medical concepts and protocols\n• Platform onboarding and troubleshooting\n• Answering course content questions\n\nWhat can I clarify for you today?",
          sender: "assistant",
          timestamp: new Date(),
        },
      ]);
    }
    setIsOpen(true);
  };

  const sendMessageMutation = trpc.aiAssistant.sendMessage.useMutation();

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !isAuthenticated) return;

    const userMessageContent = inputValue;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      content: userMessageContent,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await sendMessageMutation.mutateAsync({
        message: userMessageContent,
        context: context,
        conversationId: conversationId || undefined,
        messages: messages.map((m) => ({
          role: m.sender === "assistant" ? ("assistant" as const) : ("user" as const),
          content: m.content,
        })),
        pageContext: location,
      });

      if (response.success) {
        if (response.conversationId && response.conversationId !== conversationId) {
          setConversationId(response.conversationId);
        }
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          content: response.response,
          sender: "assistant",
          timestamp: new Date(response.timestamp),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        content: "Sorry, I had trouble reaching the AI Guide. Please check your connection and try again.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
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

  // Hide the floating widget entirely if an exam is active
  if (isExamActive || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* AI Guide Button */}
      {!isOpen && (
        <button
          onClick={handleOpenAssistant}
          className="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 bg-gradient-to-tr from-[#1a4d4d] to-[#2e7d7d] hover:to-[#1a4d4d] hover:shadow-xl text-white rounded-full shadow-[0_4px_20px_rgba(26,77,77,0.3)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.5)] border border-teal-700/30 flex items-center justify-center transition-all duration-300 hover:scale-105 z-40 group"
          title="Paeds Resus AI Guide"
        >
          <Sparkles className="w-6 h-6 animate-pulse" />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></div>
        </button>
      )}

      {/* AI Guide Window */}
      {isOpen && (
        <div className="fixed z-50 flex flex-col bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-[0_10px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-5 duration-300 bottom-36 left-3 right-3 w-auto h-[65vh] max-h-[580px] md:bottom-24 md:left-auto md:right-6 md:w-[380px] md:h-[580px]">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white p-4 rounded-t-2xl flex items-center justify-between border-b border-teal-800/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#ff6633] rounded-full flex items-center justify-center shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm tracking-tight text-white">Paeds Resus AI Guide</h3>
                <p className="text-xs text-teal-200">Contextual Learning Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Selector */}
          <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex gap-1.5 overflow-x-auto">
            {([
              { key: "general", label: "General", icon: "💬" },
              { key: "clinical", label: "Clinical", icon: "🏥" },
              { key: "troubleshooting", label: "Help", icon: "🔧" },
              { key: "onboarding", label: "Onboarding", icon: "🚀" }
            ] as const).map((ctx) => (
              <button
                key={ctx.key}
                onClick={() => setContext(ctx.key)}
                className={`px-2.5 py-1 rounded-lg text-xs whitespace-nowrap transition flex items-center gap-1 border ${
                  context === ctx.key
                    ? "bg-[#ff6633] text-white border-transparent shadow-sm"
                    : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-[#ff6633]"
                }`}
              >
                <span>{ctx.icon}</span>
                <span>{ctx.label}</span>
              </button>
            ))}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/20">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-gradient-to-br from-[#ff6633] to-[#e55a22] text-white rounded-2xl rounded-tr-none px-4 py-2 text-sm shadow-sm"
                      : "bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/10 text-[10px] opacity-75">
                    <span>
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>

                    {/* Actions for assistant messages */}
                    {msg.sender === "assistant" && msg.id !== "welcome" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleFeedback(msg.id, true)}
                          className={`p-0.5 rounded transition ${
                            msg.helpful === true
                              ? "text-emerald-500"
                              : "text-slate-400 hover:text-emerald-500"
                          }`}
                          title="Helpful"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, false)}
                          className={`p-0.5 rounded transition ${
                            msg.helpful === false
                              ? "text-rose-500"
                              : "text-slate-400 hover:text-rose-500"
                          }`}
                          title="Not helpful"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleCopyMessage(msg.content)}
                          className="p-0.5 rounded text-slate-400 hover:text-blue-500 transition"
                          title="Copy"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-slate-800/90 border border-slate-200/50 dark:border-slate-700/50 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
                  <div className="flex gap-1.5 items-center h-4">
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                    <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-100 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 rounded-b-2xl">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask the AI Guide anything..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#ff6633] focus:border-transparent text-slate-800 dark:text-slate-100 text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                className="bg-[#ff6633] hover:bg-[#e55a22] disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white p-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center shrink-0"
              >
                {isLoading ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
              <span className="flex items-center gap-1">
                🤖 Powered by Paeds Resus AI
              </span>
              <span>
                Evidence-based guidance 24/7
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
