
import { Button } from '@/components/ui/button';
import { MessageSquareText } from 'lucide-react';
import type { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';

interface SidebarHistorySectionProps {
  title: string;
  items: ChatSession[];
  activeChatId: string | null;
  onItemClick: (chatId: string) => void;
}

export default function SidebarHistorySection({ title, items, activeChatId, onItemClick }: SidebarHistorySectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={`history-section-${title.replace(/\s+/g, '-')}`}>
      <h2 
        id={`history-section-${title.replace(/\s+/g, '-')}`}
        className="px-2 mb-1.5 text-xs font-semibold text-muted-foreground tracking-wide uppercase" // Adjusted styling
      >
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.id}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-sm font-normal h-auto py-1.5 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md",
                item.id === activeChatId && "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
              )}
              title={item.title}
              onClick={() => onItemClick(item.id)}
            >
              <MessageSquareText className="h-4 w-4 mr-2.5 shrink-0 opacity-75" />
              <span className="truncate flex-1 text-left">{item.title}</span>
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
