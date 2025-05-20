'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useChatSession } from '@/contexts/ChatSessionContext';
import { processUserMessage } from '@/lib/chat-processor';

export default function ChatInput() {
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { currentSessionId, addMessage, updateSessionMemory, getCurrentSession } = useChatSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !currentSessionId || isProcessing) return;
    
    const currentSession = getCurrentSession();
    if (!currentSession) return;
    
    setIsProcessing(true);
    
    // Add user message to the conversation
    const userMessage = {
      sender: 'user' as const,
      text: message.trim(),
      timestamp: new Date(),
    };
    
    addMessage(currentSessionId, userMessage);
    setMessage('');
    
    try {
      // Add initial AI response to show loading state
      const loadingMessage = {
        sender: 'ai' as const,
        text: 'I am processing your request...',
        timestamp: new Date(),
        isLoading: true
      };
      
      addMessage(currentSessionId, loadingMessage);
      
      // Process the message using our chat processor
      const { aiResponse, updatedMemory, components } = await processUserMessage(message, currentSession);
      
      // Update session memory if needed
      if (updatedMemory) {
        updateSessionMemory(currentSessionId, updatedMemory);
      }
      
      // Add the actual AI response
      const aiMessage = {
        sender: 'ai' as const,
        text: aiResponse,
        timestamp: new Date(),
        components
      };
      
      // Replace the loading message with the actual response
      addMessage(currentSessionId, aiMessage);
      
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      addMessage(currentSessionId, {
        sender: 'ai' as const,
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
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
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
          }
        }}
        disabled={isProcessing}
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