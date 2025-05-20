'use client';

import type { Message } from '@/types/chat'; // Updated import path
import { useEffect, useRef } from 'react';
import InitialPromptDisplay from './initial-prompt-display';
import ChatMessage from './chat-message';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ChatWindowProps {
  conversation: Message[];
  isLoadingAI: boolean;
}

export default function ChatWindow({ conversation, isLoadingAI }: ChatWindowProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [conversation, isLoadingAI]);


  if (conversation.length === 0 && !isLoadingAI) {
    return (
      <div className="h-full p-4 md:p-8"> {/* Added padding here */}
        <InitialPromptDisplay />
      </div>
    );
  }

  return (
    <ScrollArea className="h-full flex-grow" ref={scrollAreaRef}>
      <div className="flex flex-col space-y-4 p-4 md:p-8"> {/* Added padding here */}
        {conversation.map((msg) => {
          // Ensure components is a valid React node
          const components = msg.components && typeof msg.components === 'object' ? msg.components : null;
          
          return (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              message={msg.text}
              timestamp={new Date(msg.timestamp)} // Ensure timestamp is a Date object
              isLoading={msg.isLoading}
              components={components}
            />
          );
        })}
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
  );
}
