import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Loader2, MessageSquare, ChevronDown, ChevronUp, AlertCircle, RefreshCw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface QuizTutorCardProps {
  question: string;
  options: string[];
  correctOption: string;
  userAnswer: string;
  explanation: string;
  className?: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function QuizTutorCard({
  question,
  options,
  correctOption,
  userAnswer,
  explanation,
  className,
}: QuizTutorCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getTutorResponseMutation = trpc.aiAssistant.getQuizTutorResponse.useMutation();

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const loadInitialExplanation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getTutorResponseMutation.mutateAsync({
        question,
        options,
        correctOption,
        userAnswer,
        explanation,
        messages: [],
      });

      if (response.success) {
        setMessages([
          {
            role: "assistant",
            content: response.response,
          },
        ]);
      } else {
        setError("Could not retrieve tutoring feedback. Please try again.");
      }
    } catch (err: any) {
      console.error("[QuizTutor] Initial load error:", err);
      setError(err.message || "Failed to reach AI tutor. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && messages.length === 0) {
      void loadInitialExplanation();
    }
    setIsOpen(!isOpen);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessageText = inputValue.trim();
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessageText }];
    
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Send message history along with the new user message query
      const response = await getTutorResponseMutation.mutateAsync({
        question,
        options,
        correctOption,
        userAnswer,
        explanation,
        messages: messages, // History before the new query
        userQuery: userMessageText,
      });

      if (response.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: response.response }]);
      } else {
        setError("Error generating response. Please try again.");
      }
    } catch (err: any) {
      console.error("[QuizTutor] Send error:", err);
      setError(err.message || "Failed to get response from AI tutor.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("mt-3", className)}>
      {!isOpen ? (
        <Button
          onClick={handleToggle}
          variant="outline"
          size="sm"
          className="flex items-center gap-2 text-xs border-[#1a4d4d] dark:border-emerald-500 text-[#1a4d4d] dark:text-emerald-400 hover:bg-[#1a4d4d]/5 dark:hover:bg-emerald-500/10 font-semibold transition duration-200"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Explain with AI Tutor
          <ChevronDown className="w-3 h-3" />
        </Button>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-slate-50 dark:bg-slate-900/90 animate-in slide-in-from-top-2 duration-300">
          <CardHeader className="bg-gradient-to-r from-[#1a4d4d] to-[#0d3333] text-white py-3 px-4 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff6633] fill-[#ff6633]" />
              AI Learning Tutor
            </CardTitle>
            <Button
              onClick={handleToggle}
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/20 p-1 h-auto text-xs flex items-center gap-1 font-medium"
            >
              Hide
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          
          <CardContent className="p-4 space-y-4">
            {/* Chat Messages */}
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-1 text-sm">
              {messages.length === 0 && isLoading && (
                <div className="flex items-center gap-2 justify-center py-6 text-slate-500 dark:text-slate-400 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-[#ff6633]" />
                  <span>AI Tutor is analyzing the question...</span>
                </div>
              )}

              {error && messages.length === 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400 flex flex-col gap-2 animate-in fade-in duration-300">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="text-xs font-semibold">{error}</span>
                  </div>
                  <Button
                    onClick={loadInitialExplanation}
                    size="sm"
                    variant="outline"
                    className="w-fit text-xs border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 gap-1 self-end"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry
                  </Button>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-2xl p-3 text-sm leading-relaxed shadow-sm transition-all duration-300",
                    msg.role === "user"
                      ? "bg-[#ff6633] text-white ml-auto rounded-tr-none"
                      : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 mr-auto rounded-tl-none"
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}

              {messages.length > 0 && isLoading && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-sm text-slate-500 dark:text-slate-400 mr-auto max-w-[85%] rounded-tl-none shadow-sm animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff6633]" />
                  <span>Tutor is writing...</span>
                </div>
              )}

              {error && messages.length > 0 && (
                <div className="p-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg text-red-700 dark:text-red-400 text-xs flex items-center gap-2 animate-in fade-in duration-300">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Ask the AI Tutor a follow-up question..."
                disabled={isLoading || messages.length === 0}
                className="flex-1 px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a4d4d] dark:focus:ring-emerald-600 text-sm disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:text-slate-400 dark:disabled:text-slate-600"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || messages.length === 0}
                className="bg-[#1a4d4d] dark:bg-emerald-600 hover:bg-[#0d3333] dark:hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white p-2 rounded-lg transition"
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
