import { Button } from '@/components/ui/button';
import { Edit3 } from 'lucide-react';

interface SidebarSearchActionsProps {
  onNewChatClick: () => void;
}

export default function SidebarSearchActions({ onNewChatClick }: SidebarSearchActionsProps) {
  return (
    <div className="space-y-3">
      <Button 
        variant="outline" 
        className="w-full justify-start border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 text-sm"
        onClick={onNewChatClick}
      >
        <Edit3 className="h-4 w-4 mr-2" />
        New Chat
      </Button>
    </div>
  );
}
