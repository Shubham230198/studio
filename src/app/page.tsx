
'use client';

import type { ReactNode } from 'react';
import { useState, useCallback, useEffect, useRef } from 'react';
import AppLayout from '@/components/layout/app-layout';
import SidebarNavigation from '@/components/sidebar/sidebar-navigation';
import ChatWindow from '@/components/chat/chat-window';
import PromptComposer from '@/components/prompt/prompt-composer';
import { chatFlow, type ChatFlowOutput } from '@/ai/flows/chat-flow';
import { useToast } from "@/hooks/use-toast";
import type { Message, ChatSession } from '@/types/chat';
import { 
  loadChatSessions, 
  saveChatSessions, 
  loadConversations, 
  saveConversations,
  loadActiveChatId,
  saveActiveChatId
} from '@/lib/storage';

// Message interface moved to @/types/chat

export default function HomePage() {
  const [allConversations, setAllConversations] = useState<Record<string, Message[]>>({});
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();

  // Load data from localStorage on initial mount
  useEffect(() => {
    const loadedSessions = loadChatSessions();
    const loadedConversations = loadConversations();
    const loadedActiveChatId = loadActiveChatId();

    setChatSessions(loadedSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setAllConversations(loadedConversations);

    if (loadedActiveChatId && loadedSessions.find(s => s.id === loadedActiveChatId)) {
      setActiveChatId(loadedActiveChatId);
    } else if (loadedSessions.length > 0) {
      setActiveChatId(loadedSessions[0].id); // Default to the most recent session if active one is invalid
    } else {
      setActiveChatId(null);
    }
  }, []);

  // Save to localStorage whenever relevant state changes
  useEffect(() => {
    saveChatSessions(chatSessions);
  }, [chatSessions]);

  useEffect(() => {
    saveConversations(allConversations);
  }, [allConversations]);

  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  const handleNewChat = useCallback(() => {
    setActiveChatId(null);
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setActiveChatId(chatId);
  }, []);

  const handleSendMessage = useCallback(async (promptText: string) => {
    if (!promptText.trim()) return;

    setIsLoadingAI(true);
    let currentChatId = activeChatId;
    let newSessionCreated = false;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      sender: 'user',
      text: promptText,
      timestamp: new Date(),
    };

    if (!currentChatId) {
      // Start a new chat session
      currentChatId = crypto.randomUUID();
      const newSession: ChatSession = {
        id: currentChatId,
        title: promptText.substring(0, 40) + (promptText.length > 40 ? '...' : ''),
        timestamp: new Date(),
      };
      setChatSessions(prevSessions => [newSession, ...prevSessions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setActiveChatId(currentChatId);
      setAllConversations(prevConversations => ({
        ...prevConversations,
        [currentChatId!]: [userMessage],
      }));
      newSessionCreated = true;
    } else {
      setAllConversations(prevConversations => ({
        ...prevConversations,
        [currentChatId!]: [...(prevConversations[currentChatId!] || []), userMessage],
      }));
      // Update timestamp of existing session to bring it to top
      setChatSessions(prevSessions => 
        prevSessions.map(s => s.id === currentChatId ? {...s, timestamp: new Date()} : s)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      );
    }
    
    try {
      const aiResponse: ChatFlowOutput = await chatFlow({ prompt: promptText });
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: aiResponse.response,
        timestamp: new Date(),
      };
      setAllConversations(prevConversations => ({
        ...prevConversations,
        [currentChatId!]: [...(prevConversations[currentChatId!] || []), aiMessage],
      }));
    } catch (error) {
      console.error("Error getting AI response:", error);
      toast({
        title: "Error",
        description: "Failed to get a response from the AI. Please try again.",
        variant: "destructive",
      });
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        sender: 'ai',
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setAllConversations(prevConversations => ({
        ...prevConversations,
        [currentChatId!]: [...(prevConversations[currentChatId!] || []), errorMessage],
      }));
       if (newSessionCreated && currentChatId) {
        // If session creation failed with AI, remove the session
        // This is a simple rollback, more sophisticated logic might be needed
        setChatSessions(prev => prev.filter(s => s.id !== currentChatId));
        setAllConversations(prev => {
            const copy = {...prev};
            delete copy[currentChatId!];
            return copy;
        });
        setActiveChatId(null); // Go back to new chat state
      }
    } finally {
      setIsLoadingAI(false);
    }
  }, [activeChatId, toast, allConversations, chatSessions]);

  const currentConversation = activeChatId ? allConversations[activeChatId] || [] : [];

  return (
    <AppLayout
      sidebar={
        <SidebarNavigation 
          sessions={chatSessions}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
        />
      }
      chatWindow={
        <ChatWindow
          conversation={currentConversation}
          isLoadingAI={isLoadingAI && currentConversation.length > 0 && currentConversation[currentConversation.length - 1].sender === 'user'}
          key={activeChatId || 'new-chat'} // Add key to re-mount ChatWindow on chat change
        />
      }
      promptComposer={
        <PromptComposer
          onSendMessage={handleSendMessage}
          isLoading={isLoadingAI}
          key={`composer-${activeChatId || 'new'}`} // Add key to reset composer on new chat
        />
      }
    />
  );
}
