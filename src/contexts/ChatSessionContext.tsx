'use client';

import React, { createContext, useContext, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { Message, ChatSessionMemory } from "@/types/chat";

interface ChatContextProviderProps {
  children: React.ReactNode;
}

interface ChatContextState {
  sessions: ChatSessionMemory[];
  currentSessionId: string | null;
  createNewSession: () => string;
  switchSession: (sessionId: string) => void;
  updateSessionMemory: (sessionId: string, updates: Partial<Omit<ChatSessionMemory, "id">>) => void;
  addMessage: (sessionId: string, message: Omit<Message, "id">) => void;
  getCurrentSession: () => ChatSessionMemory | null;
}

const ChatSessionContext = createContext<ChatContextState | undefined>(undefined);

export function ChatSessionProvider({ children }: ChatContextProviderProps) {
  const [sessions, setSessions] = useState<ChatSessionMemory[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on initial render
  useEffect(() => {
    const savedSessions = localStorage.getItem("chatSessions");
    if (savedSessions) {
      setSessions(JSON.parse(savedSessions));
    }
    
    const savedCurrentId = localStorage.getItem("currentSessionId");
    if (savedCurrentId) {
      setCurrentSessionId(savedCurrentId);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("chatSessions", JSON.stringify(sessions));
  }, [sessions]);
  
  // Save current session ID to localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("currentSessionId", currentSessionId);
    }
  }, [currentSessionId]);

  const createNewSession = () => {
    const newId = uuidv4();
    const newSession: ChatSessionMemory = {
      id: newId,
      originAirport: null,
      destinationAirport: null,
      departureDate: null,
      passengerCount: null,
      chatContext: [],
      messages: []
    };
    
    setSessions(prevSessions => [...prevSessions, newSession]);
    setCurrentSessionId(newId);
    return newId;
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
  };

  const updateSessionMemory = (
    sessionId: string,
    updates: Partial<Omit<ChatSessionMemory, "id">>
  ) => {
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  };

  const addMessage = (sessionId: string, message: Omit<Message, "id">) => {
    const newMessage: Message = {
      ...message,
      id: uuidv4()
    };
    
    setSessions(prevSessions => 
      prevSessions.map(session => 
        session.id === sessionId 
          ? { ...session, messages: [...session.messages, newMessage] } 
          : session
      )
    );
  };

  const getCurrentSession = () => {
    return sessions.find(session => session.id === currentSessionId) || null;
  };

  return (
    <ChatSessionContext.Provider
      value={{
        sessions,
        currentSessionId,
        createNewSession,
        switchSession,
        updateSessionMemory,
        addMessage,
        getCurrentSession
      }}
    >
      {children}
    </ChatSessionContext.Provider>
  );
}

export const useChatSession = () => {
  const context = useContext(ChatSessionContext);
  if (context === undefined) {
    throw new Error("useChatSession must be used within a ChatSessionProvider");
  }
  return context;
}; 