import { Button } from '@/components/ui/button';
import { ChevronDown, Bot } from 'lucide-react'; // Using Bot icon
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function SidebarHeaderComponent() {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Bot className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Flyin.AI</h1>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground px-2">
            <span className="truncate max-w-[80px] text-xs">Workspace</span> {/* Mock context */}
            <ChevronDown className="h-3 w-3 ml-1 shrink-0" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem>Personal</DropdownMenuItem>
          <DropdownMenuItem>Team A</DropdownMenuItem>
          <DropdownMenuItem>Create New...</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
