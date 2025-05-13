
import { Bot } from 'lucide-react'; // Using Bot icon

export default function SidebarHeaderComponent() {
  return (
    <div className="flex items-center justify-start"> {/* Removed justify-between and the DropdownMenu */}
      <div className="flex items-center gap-2">
        <Bot className="h-7 w-7 text-primary" />
        <h1 className="text-xl font-semibold text-foreground">Flyin.AI</h1>
      </div>
      {/* Workspace DropdownMenu removed */}
    </div>
  );
}
