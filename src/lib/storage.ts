import type { ChatSession, Message } from "@/types/chat";

const CHAT_SESSIONS_KEY = "chatSessions";
const CONVERSATIONS_KEY = "chatConversations";
const ACTIVE_CHAT_ID_KEY = "activeChatId";

// Helper to safely parse JSON from localStorage
function safeJsonParse<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (item) {
      const parsed = JSON.parse(item);
      // Revive dates if necessary (example for ChatSession and Message)
      if (key === CHAT_SESSIONS_KEY && Array.isArray(parsed)) {
        return parsed.map((session) => ({
          ...session,
          timestamp: new Date(session.timestamp),
        })) as T;
      }
      if (
        key === CONVERSATIONS_KEY &&
        typeof parsed === "object" &&
        parsed !== null
      ) {
        const conversations = parsed as Record<string, Message[]>;
        Object.keys(conversations).forEach((chatId) => {
          conversations[chatId] = conversations[chatId].map((message) => ({
            ...message,
            timestamp: new Date(message.timestamp),
          }));
        });
        return conversations as T;
      }
      return parsed;
    }
  } catch (error) {
    console.error(`Error parsing localStorage key "${key}":`, error);
    localStorage.removeItem(key); // Clear corrupted data
  }
  return defaultValue;
}

// Chat Sessions
export function saveChatSessions(sessions: ChatSession[]): void {
  try {
    localStorage.setItem(CHAT_SESSIONS_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving chat sessions to localStorage:", error);
  }
}

export function loadChatSessions(): ChatSession[] {
  return safeJsonParse<ChatSession[]>(CHAT_SESSIONS_KEY, []);
}

// Conversations
export function saveConversations(
  conversations: Record<string, Message[]>
): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Error saving conversations to localStorage:", error);
  }
}

export function loadConversations(): Record<string, Message[]> {
  return safeJsonParse<Record<string, Message[]>>(CONVERSATIONS_KEY, {});
}

// Active Chat ID
export function saveActiveChatId(chatId: string | null): void {
  try {
    if (chatId === null) {
      localStorage.removeItem(ACTIVE_CHAT_ID_KEY);
    } else {
      localStorage.setItem(ACTIVE_CHAT_ID_KEY, chatId);
    }
  } catch (error) {
    console.error("Error saving active chat ID to localStorage:", error);
  }
}

export function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CHAT_ID_KEY);
  } catch (error) {
    console.error("Error loading active chat ID from localStorage:", error);
    return null;
  }
}

export function saveFlightData(
  chatId: string,
  flights: any[],
  searchQuery: any
) {
  try {
    const sessions = loadChatSessions();
    const sessionIndex = sessions.findIndex((session) => session.id === chatId);

    if (sessionIndex !== -1) {
      sessions[sessionIndex].flightData = {
        flights,
        searchQuery,
        timestamp: new Date(),
      };
      saveChatSessions(sessions);
    }
  } catch (error) {
    console.error("Error saving flight data to chat session:", error);
  }
}

export function loadFlightData(chatId: string) {
  try {
    const sessions = loadChatSessions();
    const session = sessions.find((session) => session.id === chatId);

    if (session?.flightData) {
      // Check if the data is less than 1 hour old
      const timestamp = new Date(session.flightData.timestamp);
      const now = new Date();
      const hoursDiff =
        (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff < 1) {
        return session.flightData;
      }
    }
  } catch (error) {
    console.error("Error loading flight data from chat session:", error);
  }
  return null;
}

export function clearFlightData(chatId: string) {
  try {
    const sessions = loadChatSessions();
    const sessionIndex = sessions.findIndex((session) => session.id === chatId);

    if (sessionIndex !== -1) {
      delete sessions[sessionIndex].flightData;
      saveChatSessions(sessions);
    }
  } catch (error) {
    console.error("Error clearing flight data from chat session:", error);
  }
}
