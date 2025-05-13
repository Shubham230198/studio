
import SidebarHeaderComponent from './sidebar-header';
import SidebarSearchActions from './sidebar-search-actions';
import SidebarHistorySection from './sidebar-history-section';
import SidebarFooterComponent from './sidebar-footer';
import type { ChatSession } from '@/types/chat';
import { subDays, isToday, isYesterday } from 'date-fns';

interface SidebarNavigationProps {
  sessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export default function SidebarNavigation({ 
  sessions, 
  activeChatId, 
  onSelectChat, 
  onNewChat 
}: SidebarNavigationProps) {
  
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const todaySessions = sessions.filter(s => isToday(new Date(s.timestamp)));
  const yesterdaySessions = sessions.filter(s => isYesterday(new Date(s.timestamp)) && !isToday(new Date(s.timestamp)));
  const prev7DaysSessions = sessions.filter(s => 
    new Date(s.timestamp) >= sevenDaysAgo && 
    new Date(s.timestamp) < subDays(now,1) && // up to yesterday, not including today/yesterday handled above
    !isYesterday(new Date(s.timestamp)) && !isToday(new Date(s.timestamp))
  );
  const prev30DaysSessions = sessions.filter(s => 
    new Date(s.timestamp) >= thirtyDaysAgo && 
    new Date(s.timestamp) < sevenDaysAgo
  );
   const olderSessions = sessions.filter(s => new Date(s.timestamp) < thirtyDaysAgo);


  return (
    <aside 
      className="w-[240px] bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border h-full"
      aria-label="Main Navigation"
    >
      <div className="p-4 border-b border-sidebar-border">
        <SidebarHeaderComponent />
      </div>
      
      <div className="p-4">
        <SidebarSearchActions onNewChatClick={onNewChat} />
      </div>
      
      <nav className="flex-1 overflow-y-auto px-2 space-y-4 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-sidebar">
        {todaySessions.length > 0 && (
          <SidebarHistorySection 
            title="Today" 
            items={todaySessions} 
            activeChatId={activeChatId}
            onItemClick={onSelectChat} 
          />
        )}
        {yesterdaySessions.length > 0 && (
          <SidebarHistorySection 
            title="Yesterday" 
            items={yesterdaySessions} 
            activeChatId={activeChatId}
            onItemClick={onSelectChat} 
          />
        )}
        {prev7DaysSessions.length > 0 && (
          <SidebarHistorySection 
            title="Previous 7 Days" 
            items={prev7DaysSessions} 
            activeChatId={activeChatId}
            onItemClick={onSelectChat} 
          />
        )}
        {prev30DaysSessions.length > 0 && (
           <SidebarHistorySection 
            title="Previous 30 Days" 
            items={prev30DaysSessions} 
            activeChatId={activeChatId}
            onItemClick={onSelectChat} 
          />
        )}
        {olderSessions.length > 0 && (
            <SidebarHistorySection
            title="Older"
            items={olderSessions}
            activeChatId={activeChatId}
            onItemClick={onSelectChat}
            />
        )}
         {sessions.length === 0 && (
          <p className="px-2 text-sm text-muted-foreground">No chat history yet.</p>
        )}
      </nav>
      
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <SidebarFooterComponent />
      </div>
    </aside>
  );
}
