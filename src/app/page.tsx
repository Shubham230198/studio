import AppLayout from '@/components/layout/app-layout';
import SidebarNavigation from '@/components/sidebar/sidebar-navigation';
import ChatWindow from '@/components/chat/chat-window';
import PromptComposer from '@/components/prompt/prompt-composer';

export default function HomePage() {
  return (
    <AppLayout
      sidebar={<SidebarNavigation />}
      chatWindow={<ChatWindow />}
      promptComposer={<PromptComposer />}
    />
  );
}
