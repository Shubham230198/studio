import type { ReactNode } from "react";

export interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: Date;
  isLoading?: boolean;
  components?: ReactNode;
}

export interface ChatSession {
  id: string;
  title: string;
  timestamp: Date;
  // lastMessagePreview?: string; // Optional: for showing a snippet in the sidebar
}

export interface ChatSessionMemory {
  id: string;
  messages: Message[];
  originAirport?: string;
  destinationAirport?: string;
  departureDate?: string;
  passengerCount?: number;
  chatContext?: string[];
}
