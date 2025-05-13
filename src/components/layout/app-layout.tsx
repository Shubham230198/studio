
'use client';

import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import MobileHeader from './mobile-header';

interface AppLayoutProps {
  sidebar: (closeSheet?: () => void) => ReactNode;
  chatWindow: ReactNode;
  promptComposer: ReactNode;
  onNewChat: () => void; 
}

export default function AppLayout({ sidebar, chatWindow, promptComposer, onNewChat }: AppLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);


  const closeMobileSheet = () => setMobileSheetOpen(false);

  const handleMobileHeaderNewChat = () => {
    onNewChat();
    closeMobileSheet();
  };

  if (!isMounted) {
    // Avoid rendering mismatched UI during hydration
    // You can render a loader here if needed
    return null; 
  }

  if (isMobile) {
    return (
      <div className="flex h-screen flex-col bg-background text-foreground">
        <MobileHeader
          title="Flyin.AI"
          onToggleSidebar={() => setMobileSheetOpen(true)}
          onNewChat={handleMobileHeaderNewChat}
        />
        <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
          <SheetContent 
            side="left" 
            className="w-[240px] p-0 bg-sidebar text-sidebar-foreground border-r-0"
            onOpenAutoFocus={(e) => e.preventDefault()} // Prevents auto-focus on sheet open for better UX
          >
            {sidebar(closeMobileSheet)}
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {chatWindow}
          </main>
          <div className="sticky bottom-0 bg-background border-t border-border p-4 z-10 mt-2">
            {promptComposer}
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-background text-foreground">
      <div className="flex-shrink-0 w-[240px]"> {/* Desktop Sidebar container */}
        {sidebar()} {/* Call without closeSheet for desktop */}
      </div>
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {chatWindow}
        </main>
        <div className="sticky bottom-0 bg-background border-t border-border p-4 z-10 mt-2">
          {promptComposer}
        </div>
      </div>
    </div>
  );
}

