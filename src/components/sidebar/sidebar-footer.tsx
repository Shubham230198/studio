
'use client';

import { Button } from '@/components/ui/button';
import { Settings, LogOut, UserCircle, HelpCircle, LogIn, User } from 'lucide-react';
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
import { useAuth } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

export default function SidebarFooterComponent() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-start px-2 py-1.5 h-auto hover:bg-sidebar-accent">
            <Avatar className="h-7 w-7 mr-2">
              {user && user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName || 'User Avatar'} />}
              <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                {user ? (user.displayName?.charAt(0).toUpperCase() || 'U') : <User className="h-4 w-4" />}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-sidebar-foreground truncate">
              {user ? (user.displayName || 'User Account') : 'Account'}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-60 mb-1 ml-1" side="top" align="start">
          {user ? (
            <>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none text-foreground">{user.displayName || 'Authenticated User'}</p>
                  {user.email && <p className="text-xs leading-none text-muted-foreground">{user.email}</p>}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem disabled> {/* Feature not implemented */}
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled> {/* Feature not implemented */}
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled> {/* Feature not implemented */}
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>Help & FAQ</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem onClick={signInWithGoogle}>
                <LogIn className="mr-2 h-4 w-4" />
                <span>Sign in with Google</span>
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <span className="text-xs text-muted-foreground">Flyin.AI v0.1.0</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
