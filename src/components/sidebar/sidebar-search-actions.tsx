import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Edit3 } from 'lucide-react';

export default function SidebarSearchActions() {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          type="search" 
          placeholder="Search chats..." 
          className="pl-8 w-full h-9 bg-input text-sm placeholder:text-muted-foreground rounded-md" 
          aria-label="Search past chats"
        />
      </div>
      <Button variant="outline" className="w-full justify-start border-sidebar-border hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-9 text-sm">
        <Edit3 className="h-4 w-4 mr-2" />
        New Chat
      </Button>
    </div>
  );
}
