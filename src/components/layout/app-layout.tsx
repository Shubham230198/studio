import type { ReactNode } from 'react';

interface AppLayoutProps {
  sidebar: ReactNode;
  chatWindow: ReactNode;
  promptComposer: ReactNode;
}

export default function AppLayout({ sidebar, chatWindow, promptComposer }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar: hidden on mobile (md:flex), fixed width on desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        {sidebar} 
      </div>
      
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat window: takes up available space, scrollable */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {chatWindow}
        </main>
        
        {/* Prompt composer: sticky to the bottom of this column */}
        {/* The p-4 here matches the request for Input Toolbar spacing */}
        <div className="sticky bottom-0 bg-background border-t border-border p-4 z-10">
          {promptComposer}
        </div>
      </div>
      {/* TODO: Implement mobile navigation (e.g., drawer for sidebar content if Sidebar component is not used) */}
    </div>
  );
}
