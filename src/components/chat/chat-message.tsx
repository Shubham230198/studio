'use client';

import type { Message } from '@/app/page';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';


interface ChatMessageProps {
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
  isLoading?: boolean;
}

export default function ChatMessage({ sender, message, timestamp, isLoading }: ChatMessageProps) {
  const isUser = sender === 'user';
  
  const formattedTimestamp = timestamp ? formatDistanceToNow(timestamp, { addSuffix: true }) : '';

  return (
    <div className={cn('flex items-start gap-3', isUser ? 'justify-end' : 'justify-start')}>
      {!isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="" alt="AI Avatar" /> {/* Placeholder for AI avatar if any */}
          <AvatarFallback className="bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')} style={{ maxWidth: '80%' }}>
        <Card 
          className={cn(
            'rounded-xl shadow-sm', 
            isUser ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-card text-card-foreground rounded-bl-none border-border/70'
          )}
        >
          <CardContent className="p-3 text-sm break-words whitespace-pre-wrap">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            ) : (
              message
            )}
          </CardContent>
        </Card>
        {timestamp && !isLoading && (
          <p className="text-xs text-muted-foreground px-1">
            {formattedTimestamp}
          </p>
        )}
      </div>
      {isUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src="" alt="User Avatar" /> {/* Placeholder for user avatar if any */}
          <AvatarFallback className="bg-secondary text-secondary-foreground">
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
