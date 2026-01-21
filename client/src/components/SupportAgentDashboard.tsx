import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  Users,
  TrendingUp,
  Send,
  Phone,
  Mail,
} from "lucide-react";
import { useState } from "react";

interface Conversation {
  id: number;
  providerId: number;
  providerName: string;
  providerEmail: string;
  topic: string;
  status: "waiting" | "active" | "resolved";
  priority: "low" | "medium" | "high" | "urgent";
  waitTime: number; // seconds
  messageCount: number;
  lastMessage: string;
  createdAt: Date;
}

export default function SupportAgentDashboard() {
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [agentStatus, setAgentStatus] = useState<"online" | "away" | "offline">("online");
  const [messageInput, setMessageInput] = useState("");
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 1,
      providerId: 101,
      providerName: "Dr. John Doe",
      providerEmail: "john@hospital.com",
      topic: "activation_help",
      status: "waiting",
      priority: "high",
      waitTime: 145,
      messageCount: 2,
      lastMessage: "I haven't received my activation email",
      createdAt: new Date(Date.now() - 145000),
    },
    {
      id: 2,
      providerId: 102,
      providerName: "Jane Smith",
      providerEmail: "jane@hospital.com",
      topic: "course_enrollment",
      status: "active",
      priority: "medium",
      waitTime: 0,
      messageCount: 5,
      lastMessage: "Can I enroll in multiple courses at once?",
      createdAt: new Date(Date.now() - 300000),
    },
    {
      id: 3,
      providerId: 103,
      providerName: "Peter Mwangi",
      providerEmail: "peter@hospital.com",
      topic: "password_reset",
      status: "resolved",
      priority: "medium",
      waitTime: 0,
      messageCount: 3,
      lastMessage: "Password reset successful, thank you!",
      createdAt: new Date(Date.now() - 600000),
    },
  ]);

  const activeCount = conversations.filter((c) => c.status === "active" || c.status === "waiting").length;
  const resolvedCount = conversations.filter((c) => c.status === "resolved").length;
  const avgWaitTime = Math.round(
    conversations.filter((c) => c.waitTime > 0).reduce((sum, c) => sum + c.waitTime, 0) /
      Math.max(conversations.filter((c) => c.waitTime > 0).length, 1)
  );

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;
    // TODO: Send message via tRPC
    setMessageInput("");
  };

  const formatWaitTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    return `${Math.floor(seconds / 60)}m`;
  };

  return (
    <div className="grid grid-cols-4 gap-6 h-screen bg-gray-50 p-6">
      {/* Sidebar - Metrics */}
      <div className="col-span-1 space-y-4 overflow-y-auto">
        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Your Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  agentStatus === "online"
                    ? "bg-green-500"
                    : agentStatus === "away"
                      ? "bg-yellow-500"
                      : "bg-gray-500"
                }`}
              ></div>
              <span className="text-sm font-medium capitalize">{agentStatus}</span>
            </div>
            <div className="space-y-2">
              <Button
                size="sm"
                variant={agentStatus === "online" ? "default" : "outline"}
                onClick={() => setAgentStatus("online")}
                className="w-full text-xs"
              >
                Online
              </Button>
              <Button
                size="sm"
                variant={agentStatus === "away" ? "default" : "outline"}
                onClick={() => setAgentStatus("away")}
                className="w-full text-xs"
              >
                Away
              </Button>
              <Button
                size="sm"
                variant={agentStatus === "offline" ? "default" : "outline"}
                onClick={() => setAgentStatus("offline")}
                className="w-full text-xs"
              >
                Offline
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Today's Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-gray-600">Active Conversations</p>
              <p className="text-2xl font-bold text-[#1a4d4d]">{activeCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Avg Wait Time</p>
              <p className="text-2xl font-bold text-orange-600">{formatWaitTime(avgWaitTime)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Canned Responses */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Quick Responses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <button className="w-full text-left text-xs p-2 hover:bg-gray-100 rounded border border-gray-200">
              /activate - Activation help
            </button>
            <button className="w-full text-left text-xs p-2 hover:bg-gray-100 rounded border border-gray-200">
              /password - Password reset
            </button>
            <button className="w-full text-left text-xs p-2 hover:bg-gray-100 rounded border border-gray-200">
              /enroll - Course enrollment
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Main - Conversations List */}
      <div className="col-span-1 space-y-4 overflow-y-auto">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-sm">Conversations ({conversations.length})</CardTitle>
            <CardDescription className="text-xs">
              {activeCount} active • {resolvedCount} resolved
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`w-full text-left p-3 rounded-lg border-2 transition ${
                  selectedConversation?.id === conv.id
                    ? "border-[#ff6633] bg-orange-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900">{conv.providerName}</p>
                  <Badge
                    variant="outline"
                    className={`text-xs ${
                      conv.status === "waiting"
                        ? "bg-yellow-100 text-yellow-800"
                        : conv.status === "active"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
                    }`}
                  >
                    {conv.status}
                  </Badge>
                </div>
                <p className="text-xs text-gray-600 truncate">{conv.lastMessage}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-gray-500">{formatWaitTime(conv.waitTime)}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Center - Conversation View */}
      <div className="col-span-2 space-y-4 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Header */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">{selectedConversation.providerName}</CardTitle>
                    <CardDescription className="text-xs">
                      {selectedConversation.providerEmail} • {selectedConversation.topic.replace(/_/g, " ")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-xs">
                      <Phone className="w-3 h-3 mr-1" /> Call
                    </Button>
                    <Button size="sm" variant="outline" className="text-xs">
                      <Mail className="w-3 h-3 mr-1" /> Email
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Messages */}
            <Card className="flex-1 flex flex-col">
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-start">
                  <div className="bg-gray-100 px-4 py-2 rounded-lg max-w-xs">
                    <p className="text-sm text-gray-900">{selectedConversation.lastMessage}</p>
                    <p className="text-xs text-gray-500 mt-1">2:35 PM</p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#ff6633] text-white px-4 py-2 rounded-lg max-w-xs">
                    <p className="text-sm">How can I help you today?</p>
                    <p className="text-xs opacity-70 mt-1">2:36 PM</p>
                  </div>
                </div>
              </CardContent>

              {/* Input */}
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type your response..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff6633] text-sm"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="bg-[#ff6633] hover:bg-[#e55a22]"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </>
        ) : (
          <Card className="flex items-center justify-center h-full">
            <CardContent className="text-center">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a conversation to start</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
