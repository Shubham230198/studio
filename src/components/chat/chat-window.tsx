'use client';

import type { Message } from '@/app/page'; // Import Message interface
import { useEffect, useRef } from 'react';
import InitialPromptDisplay from './initial-prompt-display';
import ChatMessage from './chat-message'; // Import ChatMessage component
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
    return <InitialPromptDisplay />;
  }

  return (
    <ScrollArea className="h-full flex-grow" ref={scrollAreaRef}>
      <div className="flex flex-col space-y-4 p-4">
        {conversation.map((msg) => (
          <ChatMessage
            key={msg.id}
            sender={msg.sender}
            message={msg.text}
            timestamp={msg.timestamp}
            isLoading={msg.isLoading}
          />
        ))}
        {isLoadingAI &&
          conversation.length > 0 &&
          conversation[conversation.length - 1].sender === 'user' && (
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
