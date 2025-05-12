import { Button } from '@/components/ui/button';
import { Zap, Info, Settings, LogOut, UserCircle, HelpCircle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SidebarFooterComponent() {
  return (
    <div className="space-y-2">
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" className="w-full justify-start text-primary border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary/50 h-9 text-sm">
              <Zap className="h-4 w-4 mr-2" />
              Upgrade plan
              <Info className="h-3.5 w-3.5 ml-auto text-muted-foreground" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" align="center" className="bg-popover text-popover-foreground">
            <p className="text-xs">Unlock premium features and more!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start px-2 py-1.5 h-auto hover:bg-sidebar-accent">
            <Avatar className="h-7 w-7 mr-2">
              <AvatarImage src="https://picsum.photos/id/237/40/40" alt="User Avatar" data-ai-hint="user avatar" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-sidebar-foreground truncate">User Name</span> {/* Mock user */}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 mb-1 ml-1" side="top" align="start">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none text-foreground">User Name</p>
              <p className="text-xs leading-none text-muted-foreground">user@example.com</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & FAQ</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <span className="text-xs text-muted-foreground">PromptFlow v0.1.0</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
