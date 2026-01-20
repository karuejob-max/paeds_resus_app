/**
 * Real-Time Collaboration Features Service
 * WebRTC for live group study, peer mentoring, instructor office hours
 */

export interface LiveSession {
  id: string;
  hostId: number;
  title: string;
  description: string;
  type: "study_group" | "mentoring" | "office_hours" | "webinar";
  topic: string;
  maxParticipants: number;
  currentParticipants: number;
  status: "scheduled" | "live" | "ended";
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  recordingUrl?: string;
  breakoutRooms: BreakoutRoom[];
  participants: SessionParticipant[];
  createdAt: Date;
}

export interface BreakoutRoom {
  id: string;
  sessionId: string;
  name: string;
  maxParticipants: number;
  currentParticipants: number;
  facilitatorId: number;
  participants: SessionParticipant[];
  createdAt: Date;
}

export interface SessionParticipant {
  id: string;
  userId: number;
  name: string;
  email: string;
  role: "host" | "facilitator" | "participant";
  joinedAt: Date;
  leftAt?: Date;
  status: "active" | "idle" | "away";
  videoEnabled: boolean;
  audioEnabled: boolean;
  screenSharing: boolean;
  raiseHand: boolean;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: number;
  userName: string;
  message: string;
  timestamp: Date;
  type: "text" | "system" | "announcement";
  reactions?: Record<string, number>;
}

export interface SharedResource {
  id: string;
  sessionId: string;
  uploadedBy: number;
  name: string;
  type: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  recordingUrl: string;
  duration: number; // seconds
  fileSize: number; // bytes
  status: "processing" | "ready" | "failed";
  createdAt: Date;
  expiresAt: Date;
}

export interface PeerMentoringMatch {
  id: string;
  mentorId: number;
  menteeId: number;
  topic: string;
  status: "pending" | "active" | "completed";
  matchedAt: Date;
  startDate?: Date;
  endDate?: Date;
  sessionsCompleted: number;
  rating?: number;
  feedback?: string;
}

export interface LiveSessionAnalytics {
  sessionId: string;
  totalParticipants: number;
  averageSessionDuration: number;
  engagementScore: number;
  messageCount: number;
  questionsAsked: number;
  screenShareCount: number;
  recordingViews: number;
}

/**
 * Create live session
 */
export function createLiveSession(
  hostId: number,
  title: string,
  type: "study_group" | "mentoring" | "office_hours" | "webinar",
  topic: string,
  startTime: Date,
  duration: number,
  maxParticipants: number = 50
): LiveSession {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    hostId,
    title,
    description: `${type.replace("_", " ")} session on ${topic}`,
    type,
    topic,
    maxParticipants,
    currentParticipants: 1,
    status: "scheduled",
    startTime,
    duration,
    breakoutRooms: [],
    participants: [
      {
        id: `part_${hostId}`,
        userId: hostId,
        name: "Host",
        email: "host@example.com",
        role: "host",
        joinedAt: new Date(),
        status: "active",
        videoEnabled: true,
        audioEnabled: true,
        screenSharing: false,
        raiseHand: false,
      },
    ],
    createdAt: new Date(),
  };
}

/**
 * Join live session
 */
export function joinLiveSession(session: LiveSession, userId: number, userName: string, email: string): boolean {
  if (session.currentParticipants >= session.maxParticipants) {
    return false;
  }

  const participant: SessionParticipant = {
    id: `part_${userId}`,
    userId,
    name: userName,
    email,
    role: "participant",
    joinedAt: new Date(),
    status: "active",
    videoEnabled: true,
    audioEnabled: true,
    screenSharing: false,
    raiseHand: false,
  };

  session.participants.push(participant);
  session.currentParticipants++;
  return true;
}

/**
 * Create breakout room
 */
export function createBreakoutRoom(
  session: LiveSession,
  name: string,
  facilitatorId: number,
  maxParticipants: number = 5
): BreakoutRoom {
  const room: BreakoutRoom = {
    id: `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId: session.id,
    name,
    maxParticipants,
    currentParticipants: 1,
    facilitatorId,
    participants: [
      {
        id: `part_${facilitatorId}`,
        userId: facilitatorId,
        name: "Facilitator",
        email: "facilitator@example.com",
        role: "facilitator",
        joinedAt: new Date(),
        status: "active",
        videoEnabled: true,
        audioEnabled: true,
        screenSharing: false,
        raiseHand: false,
      },
    ],
    createdAt: new Date(),
  };

  session.breakoutRooms.push(room);
  return room;
}

/**
 * Send chat message
 */
export function sendChatMessage(
  sessionId: string,
  userId: number,
  userName: string,
  message: string
): ChatMessage {
  return {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    userId,
    userName,
    message,
    timestamp: new Date(),
    type: "text",
    reactions: {},
  };
}

/**
 * Start screen sharing
 */
export function startScreenSharing(session: LiveSession, userId: number): boolean {
  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) return false;

  participant.screenSharing = true;
  return true;
}

/**
 * Stop screen sharing
 */
export function stopScreenSharing(session: LiveSession, userId: number): boolean {
  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) return false;

  participant.screenSharing = false;
  return true;
}

/**
 * Raise hand
 */
export function raiseHand(session: LiveSession, userId: number): boolean {
  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) return false;

  participant.raiseHand = true;
  return true;
}

/**
 * Lower hand
 */
export function lowerHand(session: LiveSession, userId: number): boolean {
  const participant = session.participants.find((p) => p.userId === userId);
  if (!participant) return false;

  participant.raiseHand = false;
  return true;
}

/**
 * Upload shared resource
 */
export function uploadSharedResource(
  sessionId: string,
  uploadedBy: number,
  name: string,
  type: string,
  url: string,
  size: number
): SharedResource {
  return {
    id: `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    uploadedBy,
    name,
    type,
    url,
    size,
    uploadedAt: new Date(),
  };
}

/**
 * Start session recording
 */
export function startSessionRecording(session: LiveSession): SessionRecording {
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

  return {
    id: `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId: session.id,
    recordingUrl: `https://recordings.paeds-resus.com/${session.id}/recording.mp4`,
    duration: 0,
    fileSize: 0,
    status: "processing",
    createdAt: new Date(),
    expiresAt,
  };
}

/**
 * Create peer mentoring match
 */
export function createPeerMentoringMatch(
  mentorId: number,
  menteeId: number,
  topic: string
): PeerMentoringMatch {
  return {
    id: `match_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    mentorId,
    menteeId,
    topic,
    status: "pending",
    matchedAt: new Date(),
    sessionsCompleted: 0,
  };
}

/**
 * Get live sessions
 */
export function getLiveSessions() {
  return {
    upcomingSessions: [
      {
        id: "session_1",
        title: "ACLS Study Group",
        type: "study_group",
        topic: "Advanced Cardiac Life Support",
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        participants: 12,
        maxParticipants: 50,
        host: "Dr. Sarah Kipchoge",
      },
      {
        id: "session_2",
        title: "Pediatric Resuscitation Mentoring",
        type: "mentoring",
        topic: "Pediatric Emergency Care",
        startTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        duration: 45,
        participants: 5,
        maxParticipants: 10,
        host: "Dr. James Mwangi",
      },
      {
        id: "session_3",
        title: "Instructor Office Hours",
        type: "office_hours",
        topic: "Q&A Session",
        startTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 90,
        participants: 0,
        maxParticipants: 100,
        host: "Dr. Maria Kariuki",
      },
    ],
    liveSessions: [
      {
        id: "session_live_1",
        title: "PALS Webinar",
        type: "webinar",
        topic: "Pediatric Advanced Life Support",
        startTime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        participants: 45,
        maxParticipants: 100,
        host: "Dr. John Smith",
        recordingAvailable: false,
      },
    ],
    recentRecordings: [
      {
        id: "rec_1",
        title: "BLS Fundamentals",
        topic: "Basic Life Support",
        recordedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: 120,
        views: 234,
        url: "https://recordings.paeds-resus.com/bls-fundamentals.mp4",
      },
      {
        id: "rec_2",
        title: "Neonatal Emergency Care",
        topic: "Neonatal Resuscitation",
        recordedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        duration: 150,
        views: 156,
        url: "https://recordings.paeds-resus.com/neonatal-care.mp4",
      },
    ],
  };
}

/**
 * Get session analytics
 */
export function getSessionAnalytics(sessionId: string): LiveSessionAnalytics {
  return {
    sessionId,
    totalParticipants: Math.floor(Math.random() * 50) + 10,
    averageSessionDuration: Math.floor(Math.random() * 60) + 30,
    engagementScore: Math.floor(Math.random() * 30) + 70,
    messageCount: Math.floor(Math.random() * 200) + 50,
    questionsAsked: Math.floor(Math.random() * 30) + 5,
    screenShareCount: Math.floor(Math.random() * 10) + 2,
    recordingViews: Math.floor(Math.random() * 500) + 100,
  };
}

/**
 * Get mentoring dashboard
 */
export function getMentoringDashboard(userId: number) {
  return {
    userId,
    activeMentorships: Math.floor(Math.random() * 5) + 1,
    completedSessions: Math.floor(Math.random() * 20) + 5,
    averageRating: (Math.random() * 2 + 3).toFixed(1),
    totalMenteesSupported: Math.floor(Math.random() * 50) + 10,
    upcomingSessions: [
      {
        id: "session_1",
        menteeName: "John Doe",
        topic: "ACLS Techniques",
        scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "session_2",
        menteeName: "Jane Smith",
        topic: "Pediatric Protocols",
        scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    recentFeedback: [
      { menteeName: "Alice Johnson", rating: 5, comment: "Excellent mentor, very helpful!" },
      { menteeName: "Bob Wilson", rating: 4, comment: "Great session, learned a lot" },
    ],
  };
}
