import { Button } from '@/components/ui/button';
import { MessageSquareText } from 'lucide-react';

interface HistoryItem {
  id: string;
  title: string;
  timestamp?: string;
}

interface SidebarHistorySectionProps {
  title: string;
  items: HistoryItem[];
}

export default function SidebarHistorySection({ title, items }: SidebarHistorySectionProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={`history-section-${title.replace(/\s+/g, '-')}`}>
      <h2 
        id={`history-section-${title.replace(/\s+/g, '-')}`}
        className="px-2 mb-2 text-xs font-medium text-muted-foreground tracking-wide"
      >
        {title}
      </h2>
      <ul className="space-y-1">
        {items.map(item => (
          <li key={item.id}>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm font-normal h-auto py-1.5 px-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md"
              title={item.title}
            >
              <MessageSquareText className="h-4 w-4 mr-2.5 shrink-0 opacity-75" />
              <span className="truncate flex-1 text-left">{item.title}</span>
              {/* Optional: Could add a small timestamp or actions on hover */}
            </Button>
          </li>
        ))}
      </ul>
    </section>
  );
}
