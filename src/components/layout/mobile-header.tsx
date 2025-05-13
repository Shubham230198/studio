
'use client';

import { Menu, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileHeaderProps {
  title: string;
  onToggleSidebar: () => void;
  onNewChat: () => void;
}

export default function MobileHeader({ title, onToggleSidebar, onNewChat }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-4 border-b bg-background px-4 sm:px-6">
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="shrink-0">
        <Menu className="h-6 w-6" />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="flex-1 text-center"> {/* Centering the title */}
        <h1 className="text-lg font-semibold text-foreground truncate">{title}</h1>
      </div>
      <Button variant="ghost" size="icon" onClick={onNewChat} className="shrink-0">
        <Edit3 className="h-5 w-5" />
        <span className="sr-only">New Chat</span>
      </Button>
    </header>
  );
}
