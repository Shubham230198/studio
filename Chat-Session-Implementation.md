# Chat Session Memory Implementation

## Overview

This document outlines the implementation plan for adding chat session memory and context awareness to the travel assistant chat application. Each chat window will maintain its own memory, track travel-related information, and provide appropriate responses based on the context.

## Key Components

### 1. ChatSessionMemory Interface

```typescript
// src/types/chat.ts
export interface ChatSessionMemory {
  id: string;
  originAirport: string | null;
  destinationAirport: string | null;
  departureDate: string | null;
  passengerCount: number | null;
  chatContext: string[]; // Important context extracted from conversation
  messages: Message[]; // Complete conversation history
}
```

### 2. Chat Context Provider

```typescript
// src/contexts/ChatSessionContext.tsx
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
  updateSessionMemory: (
    sessionId: string,
    updates: Partial<Omit<ChatSessionMemory, "id">>
  ) => void;
  addMessage: (sessionId: string, message: Omit<Message, "id">) => void;
  getCurrentSession: () => ChatSessionMemory | null;
}

const ChatSessionContext = createContext<ChatContextState | undefined>(
  undefined
);

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
      messages: [],
    };

    setSessions((prevSessions) => [...prevSessions, newSession]);
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
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
  };

  const addMessage = (sessionId: string, message: Omit<Message, "id">) => {
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
    };

    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId
          ? { ...session, messages: [...session.messages, newMessage] }
          : session
      )
    );
  };

  const getCurrentSession = () => {
    return sessions.find((session) => session.id === currentSessionId) || null;
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
        getCurrentSession,
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
```

### 3. Updated Chat Component

```typescript
// src/components/chat/chat-window.tsx
"use client";

import { useEffect, useRef } from "react";
import { useChatSession } from "@/contexts/ChatSessionContext";
import InitialPromptDisplay from "./initial-prompt-display";
import ChatMessage from "./chat-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import ChatInput from "./chat-input";

interface ChatWindowProps {
  sessionId?: string;
  isLoadingAI: boolean;
}

export default function ChatWindow({
  sessionId,
  isLoadingAI,
}: ChatWindowProps) {
  const { getCurrentSession, createNewSession, currentSessionId } =
    useChatSession();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Create a new session if none is provided
  useEffect(() => {
    if (!sessionId && !currentSessionId) {
      createNewSession();
    }
  }, [sessionId, currentSessionId, createNewSession]);

  const session = getCurrentSession();
  const conversation = session?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isLoadingAI]);

  if (conversation.length === 0 && !isLoadingAI) {
    return (
      <div className="h-full p-4 md:p-8 flex flex-col">
        <InitialPromptDisplay />
        <div className="mt-auto">
          <ChatInput />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        <div className="flex flex-col space-y-4 p-4 md:p-8">
          {conversation.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              message={msg.text}
              timestamp={new Date(msg.timestamp)}
              isLoading={msg.isLoading}
              components={msg.components}
            />
          ))}
          {isLoadingAI && (
            <ChatMessage
              key="ai-loading-indicator"
              sender="ai"
              message=""
              isLoading={true}
              timestamp={new Date()}
            />
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <ChatInput />
      </div>
    </div>
  );
}
```

### 4. Chat Input Component

```typescript
// src/components/chat/chat-input.tsx
"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useChatSession } from "@/contexts/ChatSessionContext";
import { processUserMessage } from "@/lib/chat-processor";

export default function ChatInput() {
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const {
    currentSessionId,
    addMessage,
    updateSessionMemory,
    getCurrentSession,
  } = useChatSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() || !currentSessionId || isProcessing) return;

    const currentSession = getCurrentSession();
    if (!currentSession) return;

    setIsProcessing(true);

    // Add user message to the conversation
    const userMessage = {
      sender: "user" as const,
      text: message,
      timestamp: new Date(),
    };

    addMessage(currentSessionId, userMessage);
    setMessage("");

    try {
      // Process the message and get AI response
      const { aiResponse, updatedMemory, components } =
        await processUserMessage(message, currentSession);

      // Update session memory with any extracted information
      if (updatedMemory) {
        updateSessionMemory(currentSessionId, updatedMemory);
      }

      // Add AI response to the conversation
      const aiMessage = {
        sender: "ai" as const,
        text: aiResponse,
        timestamp: new Date(),
        components,
      };

      addMessage(currentSessionId, aiMessage);
    } catch (error) {
      console.error("Error processing message:", error);

      // Add error message
      addMessage(currentSessionId, {
        sender: "ai" as const,
        text: "Sorry, I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message..."
        className="resize-none min-h-[60px]"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
      />
      <Button
        type="submit"
        size="icon"
        disabled={!message.trim() || isProcessing}
        className="shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}
```

### 5. Message Processing Logic

```typescript
// src/lib/chat-processor.ts
import { ai } from "@/ai/genkit";
import { ChatSessionMemory } from "@/types/chat";
import { extractTravelInfo } from "./travel-info-extractor";
import { searchFlights } from "./flight-search";
import { FlightOptions } from "@/components/travel/flight-options";
import { ItinerarySummary } from "@/components/travel/itinerary-summary";
import { FlightOption, TravelQuery, ItineraryPlan } from "@/types/travel";
import { generateItinerary } from "./itinerary-generator";

interface ProcessResult {
  aiResponse: string;
  updatedMemory?: Partial<Omit<ChatSessionMemory, "id" | "messages">>;
  components?: React.ReactNode;
}

export async function processUserMessage(
  message: string,
  session: ChatSessionMemory
): Promise<ProcessResult> {
  // Extract conversation history for context
  const conversationHistory = formatConversationForAI(session.messages);

  // Step 1: Extract travel information from the message if any
  const travelInfo = await extractTravelInfo(message, session);

  // Step 2: Determine if this is a travel-related query
  const isTravelQuery = travelInfo.isTravelQuery;

  // Step 3: Update session memory with any new travel information
  const updatedMemory: Partial<Omit<ChatSessionMemory, "id" | "messages">> = {};

  if (travelInfo.originAirport) {
    updatedMemory.originAirport = travelInfo.originAirport;
  }

  if (travelInfo.destinationAirport) {
    updatedMemory.destinationAirport = travelInfo.destinationAirport;
  }

  if (travelInfo.departureDate) {
    updatedMemory.departureDate = travelInfo.departureDate;
  }

  if (travelInfo.passengerCount) {
    updatedMemory.passengerCount = travelInfo.passengerCount;
  }

  if (travelInfo.context) {
    updatedMemory.chatContext = [
      ...(session.chatContext || []),
      travelInfo.context,
    ];
  }

  // Step 4: Generate appropriate response based on query type
  if (isTravelQuery) {
    // For travel queries, try to provide flight options and itinerary
    const travelQuery: TravelQuery = {
      originAirport: updatedMemory.originAirport || session.originAirport,
      destinationAirport:
        updatedMemory.destinationAirport || session.destinationAirport,
      departDate: updatedMemory.departureDate || session.departureDate,
      passengerCount:
        updatedMemory.passengerCount || session.passengerCount || 1,
    };

    // Check if we have enough information to search for flights
    if (
      travelQuery.originAirport &&
      travelQuery.destinationAirport &&
      travelQuery.departDate
    ) {
      try {
        // Search for flights
        const flights = await searchFlights(travelQuery);

        // Generate itinerary if flights are found
        let itinerary: ItineraryPlan | null = null;
        if (flights.length > 0) {
          itinerary = await generateItinerary(travelQuery, flights);
        }

        // Generate AI response with context
        const promptForTravelResponse = `
          User is planning a trip from ${travelQuery.originAirport} to ${
          travelQuery.destinationAirport
        } 
          on ${travelQuery.departDate} for ${
          travelQuery.passengerCount
        } passenger(s).
          
          They said: "${message}"
          
          Previous conversation: ${conversationHistory}
          
          ${
            flights.length > 0
              ? `I found ${flights.length} flights. The cheapest one costs ${flights[0].price} ${flights[0].currency}.`
              : "I could not find any flights matching this criteria."
          }
          
          ${
            itinerary
              ? `I've created an itinerary suggestion: ${itinerary.summary}`
              : ""
          }
          
          Write a helpful, concise response acknowledging their travel plans and the flight options. 
          Be conversational but direct.
        `;

        const aiResponse = await ai.generateText(promptForTravelResponse);

        // Return response with components
        return {
          aiResponse: aiResponse.text,
          updatedMemory,
          components:
            flights.length > 0 ? (
              <>
                {itinerary && <ItinerarySummary itinerary={itinerary} />}
                <FlightOptions flights={flights} />
              </>
            ) : undefined,
        };
      } catch (error) {
        console.error("Error searching flights:", error);
      }
    } else {
      // We don't have enough information for flights, ask for missing details
      const missingFields = [];
      if (!travelQuery.originAirport) missingFields.push("departure city");
      if (!travelQuery.destinationAirport) missingFields.push("destination");
      if (!travelQuery.departDate) missingFields.push("travel date");

      const promptForMoreInfo = `
        User said: "${message}"
        
        Previous conversation: ${conversationHistory}
        
        The user seems to be planning a trip but I'm missing the following information: ${missingFields.join(
          ", "
        )}.
        
        Write a helpful, concise response asking for the missing information in a conversational way.
        Be friendly but direct.
      `;

      const aiResponse = await ai.generateText(promptForMoreInfo);

      return {
        aiResponse: aiResponse.text,
        updatedMemory,
      };
    }
  }

  // For non-travel queries or if flight search failed, provide a general response
  const promptForGeneralResponse = `
    User said: "${message}"
    
    Previous conversation: ${conversationHistory}
    
    Travel context: ${session.chatContext.join(" ")}
    Origin: ${session.originAirport || "unknown"}
    Destination: ${session.destinationAirport || "unknown"}
    Date: ${session.departureDate || "unknown"}
    Passengers: ${session.passengerCount || "unknown"}
    
    Respond conversationally to the user's message. If they're asking about travel but we don't have enough information,
    politely ask for the details needed. If they're asking about something unrelated to travel, provide a helpful response.
    Keep your answer concise and friendly.
  `;

  const aiResponse = await ai.generateText(promptForGeneralResponse);

  return {
    aiResponse: aiResponse.text,
    updatedMemory,
  };
}

// Helper function to format conversation history for the AI
function formatConversationForAI(messages: any[]) {
  return messages
    .slice(-10) // Get last 10 messages for context
    .map(
      (msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`
    )
    .join("\n");
}
```

### 6. Travel Information Extractor

```typescript
// src/lib/travel-info-extractor.ts
export async function extractTravelInfo(
  message: string,
  session: ChatSessionMemory
) {
  // Use existing Gemini integration to extract travel info from message
  const prompt = `Extract travel information from: "${message}"...`;
  // Implementation using existing Gemini integration
}
```

## Implementation Steps

1. **Create New Types**:

   - Update `src/types/chat.ts` with the new `ChatSessionMemory` interface
   - Ensure all types are properly imported and used throughout the application

2. **Create Context Provider**:

   - Implement the `ChatSessionContext` and provider component
   - Add proper storage and retrieval from localStorage for persistence

3. **Update Chat Components**:

   - Modify the chat window to use the new session context
   - Create the chat input component with message handling
   - Update the chat message components to work with the new structure

4. **Create Processing Logic**:

   - Implement the message processing logic
   - Create the travel information extractor
   - Connect to existing flight search and itinerary functionality

5. **Add to App**:
   - Wrap the application with the `ChatSessionProvider` in the layout
   - Ensure all components have access to the chat session context

## Data Flow

1. User sends a message via ChatInput
2. Message is processed by chat-processor.ts:
   - Extract travel information
   - Update session memory
   - Search for flights if applicable
   - Generate itinerary if flights are found
   - Generate AI response with context
3. AI response and any components (flight options, itinerary) are displayed
4. Session memory is updated with new information

## Testing

- Test different travel queries to ensure proper extraction
- Test non-travel queries to ensure appropriate responses
- Test session persistence across page refreshes
- Test multiple chat sessions simultaneously

## Future Enhancements

- Add ability to clear chat history
- Implement chat session naming and management
- Add support for more complex travel planning (multi-city, round trips)
- Improve travel information extraction with more nuanced understanding
