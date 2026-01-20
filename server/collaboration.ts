/**
 * Real-Time Collaboration & Communication Service
 * Enables live messaging, video calls, screen sharing, and collaborative workspaces
 */

import { EventEmitter } from "events";

export type MessageType = "text" | "file" | "image" | "video" | "system";
export type ChannelType = "direct" | "group" | "institutional" | "public";
export type UserStatus = "online" | "away" | "offline" | "in_call";

export interface Message {
  id: string;
  senderId: number;
  senderName: string;
  channelId: string;
  type: MessageType;
  content: string;
  attachments?: Array<{
    url: string;
    filename: string;
    mimeType: string;
    size: number;
  }>;
  reactions: Map<string, number>; // emoji -> count
  replies: Message[];
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  isPinned: boolean;
}

export interface Channel {
  id: string;
  name: string;
  description: string;
  type: ChannelType;
  members: number[];
  admins: number[];
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
  isArchived: boolean;
}

export interface DirectMessage {
  id: string;
  participantIds: number[];
  messages: Message[];
  createdAt: Date;
  lastMessageAt: Date;
  isArchived: boolean;
}

export interface UserPresence {
  userId: number;
  status: UserStatus;
  lastSeen: Date;
  currentChannel?: string;
}

export interface VideoCall {
  id: string;
  initiatorId: number;
  participantIds: number[];
  channelId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  recordingUrl?: string;
  status: "ringing" | "active" | "ended";
}

class CollaborationService extends EventEmitter {
  private channels: Map<string, Channel> = new Map();
  private messages: Map<string, Message[]> = new Map();
  private directMessages: Map<string, DirectMessage> = new Map();
  private userPresence: Map<number, UserPresence> = new Map();
  private videoCalls: Map<string, VideoCall> = new Map();
  private typingIndicators: Map<string, Set<number>> = new Map();

  /**
   * Create a channel
   */
  createChannel(
    name: string,
    description: string,
    type: ChannelType,
    createdBy: number,
    members: number[] = [],
    metadata: Record<string, unknown> = {}
  ): Channel {
    const channelId = `ch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const channel: Channel = {
      id: channelId,
      name,
      description,
      type,
      members: Array.from(new Set([createdBy, ...members])),
      admins: [createdBy],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata,
      isArchived: false,
    };

    this.channels.set(channelId, channel);
    this.messages.set(channelId, []);

    this.emit("channel.created", channel);

    return channel;
  }

  /**
   * Send message to channel
   */
  sendMessage(
    channelId: string,
    senderId: number,
    senderName: string,
    content: string,
    type: MessageType = "text",
    attachments: Message["attachments"] = []
  ): Message | null {
    const channel = this.channels.get(channelId);
    if (!channel) return null;

    if (!channel.members.includes(senderId)) {
      return null;
    }

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: Message = {
      id: messageId,
      senderId,
      senderName,
      channelId,
      type,
      content,
      attachments,
      reactions: new Map(),
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
      isPinned: false,
    };

    const channelMessages = this.messages.get(channelId) || [];
    channelMessages.push(message);
    this.messages.set(channelId, channelMessages);

    this.emit("message.sent", message);

    return message;
  }

  /**
   * Edit message
   */
  editMessage(messageId: string, channelId: string, newContent: string): Message | null {
    const messages = this.messages.get(channelId);
    if (!messages) return null;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return null;

    message.content = newContent;
    message.updatedAt = new Date();
    message.isEdited = true;

    this.emit("message.edited", message);

    return message;
  }

  /**
   * Delete message
   */
  deleteMessage(messageId: string, channelId: string): boolean {
    const messages = this.messages.get(channelId);
    if (!messages) return false;

    const index = messages.findIndex((m) => m.id === messageId);
    if (index === -1) return false;

    const deletedMessage = messages.splice(index, 1)[0];
    this.emit("message.deleted", deletedMessage);

    return true;
  }

  /**
   * React to message
   */
  addReaction(messageId: string, channelId: string, emoji: string, userId: number): boolean {
    const messages = this.messages.get(channelId);
    if (!messages) return false;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return false;

    const currentCount = message.reactions.get(emoji) || 0;
    message.reactions.set(emoji, currentCount + 1);

    this.emit("reaction.added", { messageId, emoji, userId });

    return true;
  }

  /**
   * Pin message
   */
  pinMessage(messageId: string, channelId: string): boolean {
    const messages = this.messages.get(channelId);
    if (!messages) return false;

    const message = messages.find((m) => m.id === messageId);
    if (!message) return false;

    message.isPinned = true;
    this.emit("message.pinned", message);

    return true;
  }

  /**
   * Get channel messages
   */
  getChannelMessages(channelId: string, limit: number = 50): Message[] {
    const messages = this.messages.get(channelId) || [];
    return messages.slice(-limit);
  }

  /**
   * Create direct message conversation
   */
  createDirectMessage(participantIds: number[]): DirectMessage {
    const sortedIds = participantIds.sort().join("-");
    const dmId = `dm-${sortedIds}`;

    let dm = this.directMessages.get(dmId);

    if (!dm) {
      dm = {
        id: dmId,
        participantIds,
        messages: [],
        createdAt: new Date(),
        lastMessageAt: new Date(),
        isArchived: false,
      };

      this.directMessages.set(dmId, dm);
    }

    return dm;
  }

  /**
   * Send direct message
   */
  sendDirectMessage(
    senderId: number,
    senderName: string,
    recipientId: number,
    content: string,
    attachments: Message["attachments"] = []
  ): Message | null {
    const dm = this.createDirectMessage([senderId, recipientId]);

    const messageId = `dm-msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const message: Message = {
      id: messageId,
      senderId,
      senderName,
      channelId: dm.id,
      type: "text",
      content,
      attachments,
      reactions: new Map(),
      replies: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
      isPinned: false,
    };

    dm.messages.push(message);
    dm.lastMessageAt = new Date();

    this.emit("direct_message.sent", message);

    return message;
  }

  /**
   * Update user presence
   */
  updateUserPresence(userId: number, status: UserStatus, currentChannel?: string): UserPresence {
    const presence: UserPresence = {
      userId,
      status,
      lastSeen: new Date(),
      currentChannel,
    };

    this.userPresence.set(userId, presence);
    this.emit("user.presence_changed", presence);

    return presence;
  }

  /**
   * Get user presence
   */
  getUserPresence(userId: number): UserPresence | null {
    return this.userPresence.get(userId) || null;
  }

  /**
   * Get channel members presence
   */
  getChannelMembersPresence(channelId: string): UserPresence[] {
    const channel = this.channels.get(channelId);
    if (!channel) return [];

    const result: UserPresence[] = [];
    for (const memberId of channel.members) {
      const presence = this.userPresence.get(memberId);
      if (presence) {
        result.push(presence);
      }
    }
    return result;
  }

  /**
   * Start typing indicator
   */
  startTyping(channelId: string, userId: number): void {
    if (!this.typingIndicators.has(channelId)) {
      this.typingIndicators.set(channelId, new Set<number>());
    }

    const typingSet = this.typingIndicators.get(channelId);
    if (typingSet) {
      typingSet.add(userId);
    }
    this.emit("typing.started", { channelId, userId });

    // Auto-clear after 3 seconds
    setTimeout(() => {
      this.stopTyping(channelId, userId);
    }, 3000);
  }

  /**
   * Stop typing indicator
   */
  stopTyping(channelId: string, userId: number): void {
    const typingUsers = this.typingIndicators.get(channelId);
    if (typingUsers) {
      typingUsers.delete(userId);
      this.emit("typing.stopped", { channelId, userId });
    }
  }

  /**
   * Get typing users
   */
  getTypingUsers(channelId: string): number[] {
    const typingSet = this.typingIndicators.get(channelId) || new Set<number>();
    const result: number[] = [];
    typingSet.forEach((userId) => {
      result.push(userId);
    });
    return result;
  }

  /**
   * Initiate video call
   */
  initiateVideoCall(initiatorId: number, participantIds: number[], channelId?: string): VideoCall {
    const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const call: VideoCall = {
      id: callId,
      initiatorId,
      participantIds: [initiatorId, ...participantIds],
      channelId,
      startTime: new Date(),
      status: "ringing",
    };

    this.videoCalls.set(callId, call);
    this.emit("video_call.initiated", call);

    return call;
  }

  /**
   * Accept video call
   */
  acceptVideoCall(callId: string, userId: number): VideoCall | null {
    const call = this.videoCalls.get(callId);
    if (!call || !call.participantIds.includes(userId)) return null;

    call.status = "active";
    this.emit("video_call.accepted", call);

    return call;
  }

  /**
   * End video call
   */
  endVideoCall(callId: string, recordingUrl?: string): VideoCall | null {
    const call = this.videoCalls.get(callId);
    if (!call) return null;

    call.status = "ended";
    call.endTime = new Date();
    call.duration = Math.floor((call.endTime.getTime() - call.startTime.getTime()) / 1000);

    if (recordingUrl) {
      call.recordingUrl = recordingUrl;
    }

    this.emit("video_call.ended", call);

    return call;
  }

  /**
   * Add member to channel
   */
  addChannelMember(channelId: string, userId: number): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    if (!channel.members.includes(userId)) {
      channel.members.push(userId);
      channel.updatedAt = new Date();
      this.emit("channel.member_added", { channelId, userId });
    }

    return true;
  }

  /**
   * Remove member from channel
   */
  removeChannelMember(channelId: string, userId: number): boolean {
    const channel = this.channels.get(channelId);
    if (!channel) return false;

    const index = channel.members.indexOf(userId);
    if (index !== -1) {
      channel.members.splice(index, 1);
      channel.updatedAt = new Date();
      this.emit("channel.member_removed", { channelId, userId });
    }

    return true;
  }

  /**
   * Get channel
   */
  getChannel(channelId: string): Channel | null {
    return this.channels.get(channelId) || null;
  }

  /**
   * Get user channels
   */
  getUserChannels(userId: number): Channel[] {
    return Array.from(this.channels.values()).filter((ch) => ch.members.includes(userId));
  }

  /**
   * Get collaboration statistics
   */
  getStatistics(): {
    totalChannels: number;
    totalMessages: number;
    activeUsers: number;
    activeCalls: number;
  } {
    let totalMessages = 0;
    this.messages.forEach((msgs) => {
      totalMessages += msgs.length;
    });

    const activeUsers = Array.from(this.userPresence.values()).filter(
      (p) => p.status === "online" || p.status === "in_call"
    ).length;

    const activeCalls = Array.from(this.videoCalls.values()).filter((c) => c.status === "active").length;

    return {
      totalChannels: this.channels.size,
      totalMessages,
      activeUsers,
      activeCalls,
    };
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
