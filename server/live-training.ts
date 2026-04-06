/**
 * Live Training Sessions Service
 * WebRTC video conferencing, breakout rooms, recording, and analytics
 */

export interface LiveSession {
  id: string;
  title: string;
  description: string;
  instructorId: number;
  startTime: number;
  endTime: number;
  maxParticipants: number;
  status: "scheduled" | "live" | "ended" | "cancelled";
  recordingUrl?: string;
  breakoutRooms: BreakoutRoom[];
  participants: SessionParticipant[];
  metadata: Record<string, unknown>;
}

export interface BreakoutRoom {
  id: string;
  name: string;
  sessionId: string;
  participants: SessionParticipant[];
  createdAt: number;
}

export interface SessionParticipant {
  userId: number;
  name: string;
  email: string;
  joinedAt: number;
  leftAt?: number;
  role: "instructor" | "participant";
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  screenShareActive: boolean;
}

export interface SessionRecording {
  id: string;
  sessionId: string;
  url: string;
  duration: number;
  size: number;
  createdAt: number;
  transcription?: string;
}

export interface SessionAnalytics {
  sessionId: string;
  totalParticipants: number;
  averageAttendanceDuration: number;
  engagementScore: number;
  questionsAsked: number;
  chatMessages: number;
  recordingWatches: number;
  completionRate: number;
}

class LiveTrainingService {
  private sessions: Map<string, LiveSession> = new Map();
  private recordings: Map<string, SessionRecording> = new Map();
  private analytics: Map<string, SessionAnalytics> = new Map();
  private breakoutRooms: Map<string, BreakoutRoom> = new Map();

  /**
   * Create a new live session
   */
  createSession(session: Omit<LiveSession, "id" | "participants" | "breakoutRooms">): LiveSession {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const newSession: LiveSession = {
      ...session,
      id,
      participants: [],
      breakoutRooms: [],
    };

    this.sessions.set(id, newSession);

    // Initialize analytics
    this.analytics.set(id, {
      sessionId: id,
      totalParticipants: 0,
      averageAttendanceDuration: 0,
      engagementScore: 0,
      questionsAsked: 0,
      chatMessages: 0,
      recordingWatches: 0,
      completionRate: 0,
    });

    return newSession;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): LiveSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Add participant to session
   */
  addParticipant(sessionId: string, participant: SessionParticipant): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    if (session.participants.length >= session.maxParticipants) {
      return false;
    }

    session.participants.push(participant);

    // Update analytics
    const analytics = this.analytics.get(sessionId);
    if (analytics) {
      analytics.totalParticipants = session.participants.length;
    }

    return true;
  }

  /**
   * Remove participant from session
   */
  removeParticipant(sessionId: string, userId: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const index = session.participants.findIndex((p) => p.userId === userId);
    if (index === -1) return false;

    const participant = session.participants[index];
    participant.leftAt = Date.now();

    return true;
  }

  /**
   * Create breakout room
   */
  createBreakoutRoom(sessionId: string, name: string): BreakoutRoom | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const roomId = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const room: BreakoutRoom = {
      id: roomId,
      name,
      sessionId,
      participants: [],
      createdAt: Date.now(),
    };

    this.breakoutRooms.set(roomId, room);
    session.breakoutRooms.push(room);

    return room;
  }

  /**
   * Move participant to breakout room
   */
  moveToBreakoutRoom(sessionId: string, userId: number, roomId: string): boolean {
    const session = this.sessions.get(sessionId);
    const room = this.breakoutRooms.get(roomId);

    if (!session || !room) return false;

    const participant = session.participants.find((p) => p.userId === userId);
    if (!participant) return false;

    // Remove from main session
    const mainIndex = session.participants.findIndex((p) => p.userId === userId);
    if (mainIndex !== -1) {
      session.participants.splice(mainIndex, 1);
    }

    // Add to breakout room
    room.participants.push(participant);

    return true;
  }

  /**
   * Start recording
   */
  startRecording(sessionId: string): string | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const recordingId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const recording: SessionRecording = {
      id: recordingId,
      sessionId,
      url: `https://recordings.paeds-resus.com/${recordingId}`,
      duration: 0,
      size: 0,
      createdAt: Date.now(),
    };

    this.recordings.set(recordingId, recording);
    session.recordingUrl = recording.url;

    return recordingId;
  }

  /**
   * End recording
   */
  endRecording(recordingId: string, duration: number, size: number): boolean {
    const recording = this.recordings.get(recordingId);
    if (!recording) return false;

    recording.duration = duration;
    recording.size = size;

    return true;
  }

  /**
   * Get session analytics
   */
  getSessionAnalytics(sessionId: string): SessionAnalytics | null {
    return this.analytics.get(sessionId) || null;
  }

  /**
   * Update engagement score
   */
  updateEngagementScore(sessionId: string, score: number): boolean {
    const analytics = this.analytics.get(sessionId);
    if (!analytics) return false;

    analytics.engagementScore = Math.min(100, score);
    return true;
  }

  /**
   * Record question
   */
  recordQuestion(sessionId: string): boolean {
    const analytics = this.analytics.get(sessionId);
    if (!analytics) return false;

    analytics.questionsAsked += 1;
    return true;
  }

  /**
   * Record chat message
   */
  recordChatMessage(sessionId: string): boolean {
    const analytics = this.analytics.get(sessionId);
    if (!analytics) return false;

    analytics.chatMessages += 1;
    return true;
  }

  /**
   * End session
   */
  endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = "ended";
    session.endTime = Date.now();

    // Calculate completion rate
    const analytics = this.analytics.get(sessionId);
    if (analytics && session.participants.length > 0) {
      const completedCount = session.participants.filter((p) => p.leftAt).length;
      analytics.completionRate = (completedCount / session.participants.length) * 100;
    }

    return true;
  }

  /**
   * Get upcoming sessions
   */
  getUpcomingSessions(limit: number = 10): LiveSession[] {
    const now = Date.now();
    return Array.from(this.sessions.values())
      .filter((s) => s.startTime > now && s.status === "scheduled")
      .sort((a, b) => a.startTime - b.startTime)
      .slice(0, limit);
  }

  /**
   * Get past sessions
   */
  getPastSessions(limit: number = 10): LiveSession[] {
    return Array.from(this.sessions.values())
      .filter((s) => s.status === "ended")
      .sort((a, b) => b.endTime! - a.endTime!)
      .slice(0, limit);
  }

  /**
   * Get session by instructor
   */
  getSessionsByInstructor(instructorId: number): LiveSession[] {
    return Array.from(this.sessions.values()).filter((s) => s.instructorId === instructorId);
  }

  /**
   * Get recording
   */
  getRecording(recordingId: string): SessionRecording | null {
    return this.recordings.get(recordingId) || null;
  }

  /**
   * Get session recordings
   */
  getSessionRecordings(sessionId: string): SessionRecording[] {
    return Array.from(this.recordings.values()).filter((r) => r.sessionId === sessionId);
  }

  /**
   * Transcribe recording
   */
  async transcribeRecording(recordingId: string, audioUrl: string): Promise<string | null> {
    const recording = this.recordings.get(recordingId);
    if (!recording) return null;

    // In production, this would call Whisper API or similar
    // For now, return placeholder
    recording.transcription = "Transcription would be generated here";
    return recording.transcription;
  }

  /**
   * Get session statistics
   */
  getSessionStatistics(): {
    totalSessions: number;
    activeSessions: number;
    totalParticipants: number;
    totalRecordings: number;
    averageEngagement: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const activeSessions = sessions.filter((s) => s.status === "live").length;
    const totalParticipants = sessions.reduce((sum, s) => sum + s.participants.length, 0);
    const recordings = Array.from(this.recordings.values());

    const avgEngagement =
      Array.from(this.analytics.values()).reduce((sum, a) => sum + a.engagementScore, 0) /
        this.analytics.size || 0;

    return {
      totalSessions: sessions.length,
      activeSessions,
      totalParticipants,
      totalRecordings: recordings.length,
      averageEngagement: Math.round(avgEngagement),
    };
  }
}

export const liveTrainingService = new LiveTrainingService();
