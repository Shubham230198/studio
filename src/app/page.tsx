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
import { planItineraryFlow } from '@/ai/flows/plan-itinerary';
import type { TravelQuery } from '@/types/travel';
import { FlightOptions } from '@/components/travel/flight-options';
import { ItinerarySummary } from '@/components/travel/itinerary-summary';

export default function HomePage() {
  const [allConversations, setAllConversations] = useState<Record<string, Message[]>>({});
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();
  const [travelQueries, setTravelQueries] = useState<Record<string, TravelQuery>>({});

  useEffect(() => {
    const loadedSessions = loadChatSessions();
    const loadedConversations = loadConversations();
    const loadedActiveChatId = loadActiveChatId();

    setChatSessions(loadedSessions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    setAllConversations(loadedConversations);

    if (loadedActiveChatId && loadedSessions.find(s => s.id === loadedActiveChatId)) {
      setActiveChatId(loadedActiveChatId);
    } else if (loadedSessions.length > 0) {
      setActiveChatId(loadedSessions[0].id); 
    } else {
      setActiveChatId(null);
    }
  }, []);

  useEffect(() => {
    saveChatSessions(chatSessions);
  }, [chatSessions]);

  useEffect(() => {
    saveConversations(allConversations);
  }, [allConversations]);

  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  const handleNewChatInternal = useCallback(() => {
    setActiveChatId(null);
  }, []);

  const handleSelectChatInternal = useCallback((chatId: string) => {
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
      setChatSessions(prevSessions => 
        prevSessions.map(s => s.id === currentChatId ? {...s, timestamp: new Date()} : s)
        .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      );
    }
    
    try {
      // Check if this is a travel-related query
      const isTravelQuery = promptText.toLowerCase().includes('flight') || 
                           promptText.toLowerCase().includes('travel') ||
                           promptText.toLowerCase().includes('itinerary') ||
                           promptText.toLowerCase().includes('trip');

      if (isTravelQuery) {
        const result = await planItineraryFlow({ 
          userMessage: promptText,
          previousQuery: travelQueries[currentChatId!],
          chatContext: currentChatId ? allConversations[currentChatId].map(msg => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.text,
            timestamp: String(msg.timestamp)
          })) : undefined
        });

        // Update travel query state for this chat
        if ('flights' in result) {
          setTravelQueries(prev => ({
            ...prev,
            [currentChatId!]: {
              //TODO: Isko sahi karo yr
              originAirport: result.flights[0]?.originAirport || null,
              destinationAirport: result.flights[0]?.destinationAirport || null,
              departDate: result.flights[0]?.departTime ? new Date(result.flights[0].departTime).toLocaleDateString('en-GB') : null,
              returnDate: result.flights[1]?.departTime ? new Date(result.flights[1].departTime).toLocaleDateString('en-GB') : null,
              passengerCount: 1, // Default to 1 passenger if not specified
              isRoundTrip: result.flights.length > 1
            }
          }));
        }

        if ('ask' in result) {
          // Handle follow-up question
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: result.ask,
            timestamp: new Date(),
          };
          setAllConversations(prevConversations => ({
            ...prevConversations,
            [currentChatId!]: [...(prevConversations[currentChatId!] || []), aiMessage],
          }));
        } else if ('flights' in result) {
          // Handle direct flights result
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: 'Here are your flight options:',
            timestamp: new Date(),
            components: (
              <FlightOptions flights={result.flights} />
            ),
          };
          setAllConversations(prevConversations => ({
            ...prevConversations,
            [currentChatId!]: [...(prevConversations[currentChatId!] || []), aiMessage],
          }));
        } else {
          // Handle complete plan (legacy)
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            sender: 'ai',
            text: result.plan.summary,
            timestamp: new Date(),
            components: (
              <div className="space-y-6">
                <FlightOptions flights={result.plan.flights} />
                <ItinerarySummary plan={result.plan} />
              </div>
            ),
          };
          setAllConversations(prevConversations => ({
            ...prevConversations,
            [currentChatId!]: [...(prevConversations[currentChatId!] || []), aiMessage],
          }));
        }
      } else {
        // Handle regular chat flow
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
      }
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
        setChatSessions(prev => prev.filter(s => s.id !== currentChatId));
        setAllConversations(prev => {
          const copy = {...prev};
          delete copy[currentChatId!];
          return copy;
        });
        setActiveChatId(null); 
      }
    } finally {
      setIsLoadingAI(false);
    }
  }, [activeChatId, toast, allConversations, chatSessions, travelQueries]);

  const currentConversation = activeChatId ? allConversations[activeChatId] || [] : [];

  return (
    <AppLayout
      sidebar={(closeSheet?: () => void) => (
        <SidebarNavigation 
          sessions={chatSessions}
          activeChatId={activeChatId}
          onSelectChat={(chatId) => {
            handleSelectChatInternal(chatId);
            closeSheet?.(); 
          }}
          onNewChat={() => {
            handleNewChatInternal();
            closeSheet?.(); 
          }}
        />
      )}
      chatWindow={
        <ChatWindow
          conversation={currentConversation}
          isLoadingAI={isLoadingAI && currentConversation.length > 0 && currentConversation[currentConversation.length - 1].sender === 'user'}
          key={activeChatId || 'new-chat'}
        />
      }
      promptComposer={
        <PromptComposer
          onSendMessage={handleSendMessage}
          isLoading={isLoadingAI}
          key={`composer-${activeChatId || 'new'}`}
        />
      }
      onNewChat={handleNewChatInternal} 
    />
  );
}
