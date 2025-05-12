'use client';

import type { ReactNode } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/app-layout';
import SidebarNavigation from '@/components/sidebar/sidebar-navigation';
import ChatWindow from '@/components/chat/chat-window';
import PromptComposer from '@/components/prompt/prompt-composer';
import { chatFlow, type ChatFlowOutput } from '@/ai/flows/chat-flow'; // Import the new chat flow
import { useToast } from "@/hooks/use-toast"; // Import useToast

// Define the Message interface
export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function HomePage() {
  const [conversation, setConversation] = useState<Message[]>([]);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  const handleSendMessage = useCallback(async (promptText: string) => {
    if (!promptText.trim()) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: promptText,
      timestamp: new Date(),
    };
    setConversation(prev => [...prev, userMessage]);
    setIsLoadingAI(true);

    try {
      const aiResponse: ChatFlowOutput = await chatFlow({ prompt: promptText });
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: aiResponse.response,
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from the AI. Please try again.",
        variant: "destructive",
      });
      // Optionally, add an error message to the chat
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setConversation(prev => [...prev, errorMessage]);
    } finally {
      setIsLoadingAI(false);
    }
  }, [toast]);

  return (
    <AppLayout
      sidebar={<SidebarNavigation />}
      chatWindow={
        <ChatWindow
          conversation={conversation}
          isLoadingAI={isLoadingAI}
        />
      }
      promptComposer={
        <PromptComposer
          onSendMessage={handleSendMessage}
          isLoading={isLoadingAI}
        />
      }
    />
  );
}
