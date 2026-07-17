import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  RefreshCw,
  Activity,
  AlertTriangle,
  Compass,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

interface QuizGuideCardProps {
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

export default function QuizGuideCard({
  question,
  options,
  correctOption,
  userAnswer,
  explanation,
  className,
}: QuizGuideCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("physiology");
  
  // Dynamic Physiological analysis data
  const [analysis, setAnalysis] = useState<{
    pathophysiology: string;
    comparison: string;
    clinicalTakeaway: string;
  } | null>(null);

  // AI chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  const getAnalysisMutation = trpc.aiAssistant.getQuizGuideAnalysis.useMutation();
  const getChatResponseMutation = trpc.aiAssistant.getQuizTutorResponse.useMutation();

  useEffect(() => {
    if (isOpen && activeTab === "chat") {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isOpen, activeTab]);

  const loadAnalysisData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await getAnalysisMutation.mutateAsync({
        question,
        options,
        correctOption,
        userAnswer,
        explanation,
      });

      if (resp.success) {
        setAnalysis({
          pathophysiology: resp.pathophysiology,
          comparison: resp.comparison,
          clinicalTakeaway: resp.clinicalTakeaway,
        });

        // Initialize chat with default welcome message from guide
        setChatMessages([
          {
            role: "assistant",
            content: `Hello! I have analyzed your response. I chose "${correctOption}" as correct. You selected "${userAnswer}".\n\nHow can I clarify the physiology or clinical implications of this question?`,
          },
        ]);
      } else {
        setError("Could not retrieve physiological analysis. Please try again.");
      }
    } catch (err: any) {
      console.error("[QuizGuideCard] Error loading analysis:", err);
      setError(err.message || "Failed to reach AI Guide. Check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    if (!isOpen && !analysis) {
      void loadAnalysisData();
    }
    setIsOpen(!isOpen);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isLoading) return;

    const userText = chatInput.trim();
    const updatedMessages = [...chatMessages, { role: "user" as const, content: userText }];
    
    setChatMessages(updatedMessages);
    setChatInput("");
    setIsLoading(true);
    setError(null);

    try {
      const resp = await getChatResponseMutation.mutateAsync({
        question,
        options,
        correctOption,
        userAnswer,
        explanation,
        messages: chatMessages,
        userQuery: userText,
      });

      if (resp.success) {
        setChatMessages((prev) => [...prev, { role: "assistant", content: resp.response }]);
      } else {
        setError("Error generating response. Please try again.");
      }
    } catch (err: any) {
      console.error("[QuizGuideCard] Chat error:", err);
      setError(err.message || "Failed to get response from AI Guide.");
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
          className="flex items-center gap-2 text-xs border-indigo-600 dark:border-emerald-500 text-indigo-700 dark:text-emerald-400 hover:bg-indigo-50 dark:hover:bg-emerald-500/10 font-bold transition duration-200"
        >
          <Sparkles className="w-3.5 h-3.5 animate-pulse text-indigo-650" />
          Explain Physiology with AI Guide
          <ChevronDown className="w-3 h-3" />
        </Button>
      ) : (
        <Card className="border border-slate-200 dark:border-slate-800 shadow-md overflow-hidden bg-white dark:bg-slate-900 animate-in slide-in-from-top-2 duration-300 rounded-xl">
          {/* Header */}
          <CardHeader className="bg-slate-950 text-white py-3 px-4 flex flex-row items-center justify-between border-b border-slate-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-400">
              <Sparkles className="w-4 h-4 text-indigo-400 fill-indigo-400" />
              Paeds Resus AI Guide — Physiological Expander
            </CardTitle>
            <Button
              onClick={handleToggle}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white hover:bg-slate-900 p-1 h-auto text-xs flex items-center gap-1 font-medium"
            >
              Hide
              <ChevronUp className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {isLoading && !analysis && (
              <div className="flex items-center gap-2 justify-center py-10 text-slate-500 animate-pulse">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="text-xs font-semibold">AI Guide is calculating organ-level pathophysiology...</span>
              </div>
            )}

            {error && !analysis && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl text-red-700 dark:text-red-400 flex flex-col gap-2 animate-in fade-in duration-300">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-xs font-semibold">{error}</span>
                </div>
                <Button
                  onClick={loadAnalysisData}
                  size="sm"
                  variant="outline"
                  className="w-fit text-xs border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 gap-1 self-end"
                >
                  <RefreshCw className="w-3 h-3" />
                  Retry
                </Button>
              </div>
            )}

            {analysis && (
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid grid-cols-3 h-9 bg-slate-100 dark:bg-slate-950 p-1 rounded-lg">
                  <TabsTrigger value="physiology" className="text-[11px] font-bold flex items-center gap-1 py-1">
                    <Activity size={12} />
                    Mechanism
                  </TabsTrigger>
                  <TabsTrigger value="comparison" className="text-[11px] font-bold flex items-center gap-1 py-1">
                    <AlertTriangle size={12} />
                    Traps vs Solutions
                  </TabsTrigger>
                  <TabsTrigger value="chat" className="text-[11px] font-bold flex items-center gap-1 py-1">
                    <Compass size={12} />
                    Follow-up Q&A
                  </TabsTrigger>
                </TabsList>

                {/* Physiology Tab */}
                <TabsContent value="physiology" className="mt-3 space-y-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-150 rounded-xl text-xs leading-relaxed text-slate-700 dark:text-slate-300 prose prose-slate max-w-none">
                    <h4 className="font-bold text-slate-800 dark:text-white mb-2 text-xs uppercase tracking-wider">Pathophysiology:</h4>
                    <p className="whitespace-pre-wrap">{analysis.pathophysiology}</p>
                  </div>
                  <div className="p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl text-xs text-indigo-900 dark:text-indigo-300">
                    <h4 className="font-bold mb-1.5 uppercase tracking-wider text-[10px] text-indigo-800 dark:text-indigo-400">Clinical Pearls:</h4>
                    <p className="whitespace-pre-wrap font-medium">{analysis.clinicalTakeaway}</p>
                  </div>
                </TabsContent>

                {/* Comparison Tab */}
                <TabsContent value="comparison" className="mt-3">
                  <div className="p-3 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/60 dark:border-amber-900/30 rounded-xl text-xs leading-relaxed text-slate-700 dark:text-slate-350">
                    <h4 className="font-bold text-amber-850 dark:text-amber-400 mb-2 text-xs uppercase tracking-wider">Comparison Analysis:</h4>
                    <p className="whitespace-pre-wrap">{analysis.comparison}</p>
                  </div>
                </TabsContent>

                {/* Chat Q&A Tab */}
                <TabsContent value="chat" className="mt-3 space-y-3">
                  <div className="max-h-[220px] overflow-y-auto space-y-3 pr-1 text-xs">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex flex-col max-w-[85%] rounded-2xl p-2.5 leading-relaxed shadow-sm transition-all duration-300",
                          msg.role === "user"
                            ? "bg-slate-900 text-white ml-auto rounded-tr-none"
                            : "bg-slate-50 dark:bg-slate-800 text-slate-850 dark:text-slate-100 border border-slate-200/65 mr-auto rounded-tl-none"
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                    ))}
                    {isLoading && chatMessages.length > 0 && (
                      <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-850 border border-slate-250 rounded-2xl p-2.5 text-xs text-slate-500 mr-auto max-w-[85%] rounded-tl-none shadow-sm animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                        <span>AI Guide is typing...</span>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-slate-150">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                      placeholder="Ask a physiological or clinical follow-up..."
                      disabled={isLoading}
                      className="flex-1 px-3 py-1.5 border border-slate-250 bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-400 text-xs"
                    />
                    <Button
                      onClick={handleSendChatMessage}
                      disabled={!chatInput.trim() || isLoading}
                      className="bg-slate-900 hover:bg-slate-800 text-white p-2 rounded-lg transition"
                      size="icon"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
