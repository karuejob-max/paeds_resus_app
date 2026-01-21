import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, index } from "drizzle-orm/mysql-core";

/**
 * Chat Support System Schema
 * Enables real-time messaging between providers and support agents during onboarding
 */

// Chat conversations table
export const chatConversations = mysqlTable(
  "chat_conversations",
  {
    id: int("id").autoincrement().primaryKey(),
    providerId: int("providerId").notNull(), // Provider initiating chat
    agentId: int("agentId"), // Support agent assigned (null if unassigned)
    institutionId: int("institutionId"), // Institution context
    status: mysqlEnum("status", ["active", "waiting", "assigned", "resolved", "closed"]).default("waiting").notNull(),
    topic: varchar("topic", { length: 255 }), // e.g., "activation_help", "password_reset", "course_enrollment"
    priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium"),
    messageCount: int("messageCount").default(0),
    lastMessageAt: timestamp("lastMessageAt"),
    resolvedAt: timestamp("resolvedAt"),
    satisfactionRating: int("satisfactionRating"), // 1-5 star rating
    notes: text("notes"), // Agent notes
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    providerIdx: index("provider_idx").on(table.providerId),
    agentIdx: index("agent_idx").on(table.agentId),
    statusIdx: index("status_idx").on(table.status),
    institutionIdx: index("institution_idx").on(table.institutionId),
  })
);

export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;

// Chat messages table
export const chatMessages = mysqlTable(
  "chat_messages",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    senderId: int("senderId").notNull(), // Provider or Agent ID
    senderType: mysqlEnum("senderType", ["provider", "agent", "system"]).notNull(),
    messageType: mysqlEnum("messageType", ["text", "file", "system", "automated"]).default("text"),
    content: text("content").notNull(),
    fileUrl: text("fileUrl"), // For file attachments
    fileName: varchar("fileName", { length: 255 }),
    mimeType: varchar("mimeType", { length: 100 }),
    isRead: boolean("isRead").default(false),
    readAt: timestamp("readAt"),
    isEdited: boolean("isEdited").default(false),
    editedAt: timestamp("editedAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("conversation_idx").on(table.conversationId),
    senderIdx: index("sender_idx").on(table.senderId),
    createdAtIdx: index("created_at_idx").on(table.createdAt),
  })
);

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;

// Support agents table
export const supportAgents = mysqlTable(
  "support_agents",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId").notNull(), // Reference to users table
    name: varchar("name", { length: 255 }).notNull(),
    email: varchar("email", { length: 320 }).notNull(),
    phone: varchar("phone", { length: 20 }),
    status: mysqlEnum("status", ["online", "offline", "away", "busy"]).default("offline"),
    currentConversationCount: int("currentConversationCount").default(0),
    maxConcurrentConversations: int("maxConcurrentConversations").default(5),
    department: varchar("department", { length: 255 }), // e.g., "onboarding", "technical", "billing"
    specialties: varchar("specialties", { length: 500 }), // Comma-separated: "activation,enrollment,payment"
    responseTimeAverage: int("responseTimeAverage"), // milliseconds
    satisfactionRating: int("satisfactionRating"), // Average rating (1-5)
    totalConversations: int("totalConversations").default(0),
    resolvedConversations: int("resolvedConversations").default(0),
    lastActiveAt: timestamp("lastActiveAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    userIdx: index("user_idx").on(table.userId),
    statusIdx: index("agent_status_idx").on(table.status),
    departmentIdx: index("department_idx").on(table.department),
  })
);

export type SupportAgent = typeof supportAgents.$inferSelect;
export type InsertSupportAgent = typeof supportAgents.$inferInsert;

// Chat typing indicators (ephemeral, not persisted long-term)
export const typingIndicators = mysqlTable(
  "typing_indicators",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    userId: int("userId").notNull(),
    userType: mysqlEnum("userType", ["provider", "agent"]).notNull(),
    expiresAt: timestamp("expiresAt").notNull(), // Auto-cleanup after 5 seconds
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("typing_conversation_idx").on(table.conversationId),
    expiresAtIdx: index("typing_expires_idx").on(table.expiresAt),
  })
);

export type TypingIndicator = typeof typingIndicators.$inferSelect;
export type InsertTypingIndicator = typeof typingIndicators.$inferInsert;

// Canned responses for agents
export const cannedResponses = mysqlTable(
  "canned_responses",
  {
    id: int("id").autoincrement().primaryKey(),
    agentId: int("agentId"), // Null = global
    category: varchar("category", { length: 255 }).notNull(), // e.g., "activation", "password", "enrollment"
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    shortcut: varchar("shortcut", { length: 50 }), // e.g., "/activate"
    usageCount: int("usageCount").default(0),
    isActive: boolean("isActive").default(true),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  (table) => ({
    agentIdx: index("canned_agent_idx").on(table.agentId),
    categoryIdx: index("canned_category_idx").on(table.category),
  })
);

export type CannedResponse = typeof cannedResponses.$inferSelect;
export type InsertCannedResponse = typeof cannedResponses.$inferInsert;

// Chat analytics/metrics
export const chatMetrics = mysqlTable(
  "chat_metrics",
  {
    id: int("id").autoincrement().primaryKey(),
    conversationId: int("conversationId").notNull(),
    agentId: int("agentId"),
    responseTime: int("responseTime"), // milliseconds
    resolutionTime: int("resolutionTime"), // milliseconds
    messageCount: int("messageCount").default(0),
    satisfactionScore: int("satisfactionScore"), // 1-5
    wasResolved: boolean("wasResolved").default(false),
    topic: varchar("topic", { length: 255 }),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
  },
  (table) => ({
    conversationIdx: index("metrics_conversation_idx").on(table.conversationId),
    agentIdx: index("metrics_agent_idx").on(table.agentId),
  })
);

export type ChatMetric = typeof chatMetrics.$inferSelect;
export type InsertChatMetric = typeof chatMetrics.$inferInsert;
