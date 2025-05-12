import SidebarHeaderComponent from './sidebar-header';
import SidebarSearchActions from './sidebar-search-actions';
import SidebarHistorySection from './sidebar-history-section';
import SidebarFooterComponent from './sidebar-footer';

// Mock data for conversation history
const MOCK_HISTORY_7_DAYS = [
  { id: 'chat1', title: 'Exploring Quantum Physics', timestamp: '2 hours ago' },
  { id: 'chat2', title: 'Recipe for Sourdough Bread', timestamp: 'Yesterday' },
  { id: 'chat3', title: 'Python Async Fundamentals', timestamp: '3 days ago' },
];

const MOCK_HISTORY_30_DAYS = [
  { id: 'chat4', title: 'Vacation Planning: Italy Trip', timestamp: '2 weeks ago' },
  { id: 'chat5', title: 'Learning Next.js App Router', timestamp: '3 weeks ago' },
  { id: 'chat6', title: 'Book Summary: Atomic Habits', timestamp: 'Last month' },
];

export default function SidebarNavigation() {
  return (
    <aside 
      className="w-[240px] bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border h-full"
      aria-label="Main Navigation"
    >
      <div className="p-4 border-b border-sidebar-border">
        <SidebarHeaderComponent />
      </div>
      
      <div className="p-4">
        <SidebarSearchActions />
      </div>
      
      <nav className="flex-1 overflow-y-auto px-2 space-y-6 scrollbar-thin scrollbar-thumb-sidebar-accent scrollbar-track-sidebar">
        <SidebarHistorySection title="Previous 7 Days" items={MOCK_HISTORY_7_DAYS} />
        <SidebarHistorySection title="Previous 30 Days" items={MOCK_HISTORY_30_DAYS} />
      </nav>
      
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <SidebarFooterComponent />
      </div>
    </aside>
  );
}
