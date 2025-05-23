"use client";

import type { ReactNode } from "react";
import { useState, useCallback, useEffect, useRef } from "react";
import AppLayout from "@/components/layout/app-layout";
import SidebarNavigation from "@/components/sidebar/sidebar-navigation";
import ChatWindow from "@/components/chat/chat-window";
import PromptComposer from "@/components/prompt/prompt-composer";
import { chatFlow, type ChatFlowOutput } from "@/ai/flows/chat-flow";
import { useToast } from "@/hooks/use-toast";
import type { Message, ChatSession } from "@/types/chat";
import {
  loadChatSessions,
  saveChatSessions,
  loadConversations,
  saveConversations,
  loadActiveChatId,
  saveActiveChatId,
} from "@/lib/storage";
import { planItineraryFlow } from "@/ai/flows/plan-itinerary";
import type { TravelQuery } from "@/types/travel";
import { FlightOptions } from "@/components/travel/flight-options";

export default function HomePage() {
  const [allConversations, setAllConversations] = useState<
    Record<string, Message[]>
  >({});
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const { toast } = useToast();
  const [travelQueries, setTravelQueries] = useState<
    Record<string, TravelQuery>
  >({});

  useEffect(() => {
    // Skip loading saved chats on page refresh
    setChatSessions([]);
    setAllConversations({});
    setActiveChatId(null);
  }, []);

  // useEffect(() => {
  //   const loadedSessions = loadChatSessions();
  //   const loadedConversations = loadConversations();
  //   const loadedActiveChatId = loadActiveChatId();

  //   const processedConversations = { ...loadedConversations };
  //   Object.entries(processedConversations).forEach(([chatId, messages]) => {
  //     processedConversations[chatId] = messages.map((message) => {
  //       const session = loadedSessions.find((s) => s.id === chatId);
  //       if (
  //         session?.flightData &&
  //         message.text.includes(
  //           "Here are best selected flight options for you:"
  //         )
  //       ) {
  //         const flightData = session.flightData;
  //         console.log("Processing flight data for chat:", chatId, flightData);
  //         return {
  //           ...message,
  //           components: (
  //             <FlightOptions
  //               key={`flight-options-${chatId}`}
  //               flights={flightData.flights}
  //               searchQuery={flightData.searchQuery}
  //               chatId={chatId}
  //             />
  //           ),
  //         };
  //       }
  //       return message;
  //     });
  //   });

  //   const sortedSessions = loadedSessions.sort(
  //     (a, b) =>
  //       new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  //   );

  //   setChatSessions(sortedSessions);
  //   setAllConversations(processedConversations);

  //   if (
  //     loadedActiveChatId &&
  //     sortedSessions.find((s) => s.id === loadedActiveChatId)
  //   ) {
  //     setActiveChatId(loadedActiveChatId);
  //   } else if (sortedSessions.length > 0) {
  //     setActiveChatId(sortedSessions[0].id);
  //   } else {
  //     setActiveChatId(null);
  //   }
  // }, []);

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

  const handleSendMessage = useCallback(
    async (promptText: string) => {
      if (!promptText.trim()) return;

      setIsLoadingAI(true);
      let currentChatId = activeChatId;
      let newSessionCreated = false;

      const userMessage: Message = {
        id: crypto.randomUUID(),
        sender: "user",
        text: promptText,
        timestamp: new Date(),
      };

      if (!currentChatId) {
        currentChatId = crypto.randomUUID();
        const newSession: ChatSession = {
          id: currentChatId,
          title:
            promptText.substring(0, 40) + (promptText.length > 40 ? "..." : ""),
          timestamp: new Date(),
        };
        setChatSessions((prevSessions) =>
          [newSession, ...prevSessions].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )
        );
        setActiveChatId(currentChatId);
        setAllConversations((prevConversations) => ({
          ...prevConversations,
          [currentChatId!]: [userMessage],
        }));
        newSessionCreated = true;
      } else {
        setAllConversations((prevConversations) => ({
          ...prevConversations,
          [currentChatId!]: [
            ...(prevConversations[currentChatId!] || []),
            userMessage,
          ],
        }));
        setChatSessions((prevSessions) =>
          prevSessions
            .map((s) =>
              s.id === currentChatId ? { ...s, timestamp: new Date() } : s
            )
            .sort(
              (a, b) =>
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
            )
        );
      }

      try {
        const result = await planItineraryFlow({
          userMessage: promptText,
          previousQuery: travelQueries[currentChatId!],
          chatContext:
            currentChatId && allConversations[currentChatId]
              ? allConversations[currentChatId].map((msg) => ({
                  id: msg.id,
                  sender: msg.sender,
                  text: msg.text,
                  timestamp: String(msg.timestamp),
                }))
              : undefined,
        });

        console.log("result --> ", JSON.stringify(result));

        // Update travel query state for this chat
        if ("flights" in result) {
          console.log("Previous travel queries:", travelQueries);
          console.log("Updating travel query for chat:", currentChatId);
          console.log("New flight data:", result.flights);

          setTravelQueries((prev) => {
            const newQueries = {
              ...prev,
              [currentChatId!]: {
                originAirport: result.validQuery.originAirport || "",
                destinationAirport: result.validQuery.destinationAirport || "",
                departDate: result.validQuery.departDate || "",
                returnDate: result.validQuery.returnDate || undefined,
                passengerCount: result.validQuery.passengerCount || 1,
                isRoundTrip: result.validQuery.isRoundTrip || false,
              },
            };
            console.log("Updated travel queries:", newQueries);
            return newQueries;
          });
        }

        if ("ask" in result) {
          // Handle follow-up question
          const aiMessage: Message = {
            id: crypto.randomUUID(),
            sender: "ai",
            text: result.ask,
            timestamp: new Date(),
          };
          setAllConversations((prevConversations) => ({
            ...prevConversations,
            [currentChatId!]: [
              ...(prevConversations[currentChatId!] || []),
              aiMessage,
            ],
          }));
        } else if ("flights" in result) {
          // Handle direct flights result

          // Save flight data to chat session
          setChatSessions((prevSessions) => {
            const updatedSessions = prevSessions.map((session) => {
              if (session.id === currentChatId) {
                return {
                  ...session,
                  flightData: {
                    flights: result.flights,
                    searchQuery: result.validQuery,
                    timestamp: new Date(),
                  },
                };
              }
              return session;
            });
            return updatedSessions;
          });

          const aiMessage: Message = {
            id: crypto.randomUUID(),
            sender: "ai",
            text:
              result.flights.length > 0
                ? "Redirecting you to Search Page"
                : "No flights found",
            timestamp: new Date(),
            components: (
              <FlightOptions
                key={`flight-options-${currentChatId}`}
                flights={result.flights}
                searchQuery={result.validQuery}
                chatId={currentChatId!}
              />
            ),
          };
          setAllConversations((prevConversations) => ({
            ...prevConversations,
            [currentChatId!]: [
              ...(prevConversations[currentChatId!] || []),
              aiMessage,
            ],
          }));
        }
      } catch (error) {
        console.error("Error getting AI response:", error);
        toast({
          title: "Error",
          description:
            "Failed to get a response from the AI. Please try again.",
          variant: "destructive",
        });
        const errorMessage: Message = {
          id: crypto.randomUUID(),
          sender: "ai",
          text: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        };
        setAllConversations((prevConversations) => ({
          ...prevConversations,
          [currentChatId!]: [
            ...(prevConversations[currentChatId!] || []),
            errorMessage,
          ],
        }));
        if (newSessionCreated && currentChatId) {
          setChatSessions((prev) => prev.filter((s) => s.id !== currentChatId));
          setAllConversations((prev) => {
            const copy = { ...prev };
            delete copy[currentChatId!];
            return copy;
          });
          setActiveChatId(null);
        }
      } finally {
        setIsLoadingAI(false);
      }
    },
    [activeChatId, toast, allConversations, chatSessions, travelQueries]
  );

  const currentConversation = activeChatId
    ? allConversations[activeChatId] || []
    : [];

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
          isLoadingAI={
            isLoadingAI &&
            currentConversation.length > 0 &&
            currentConversation[currentConversation.length - 1].sender ===
              "user"
          }
          key={activeChatId || "new-chat"}
        />
      }
      promptComposer={
        <PromptComposer
          onSendMessage={handleSendMessage}
          isLoading={isLoadingAI}
          key={`composer-${activeChatId || "new"}`}
        />
      }
      onNewChat={handleNewChatInternal}
    />
  );
}
