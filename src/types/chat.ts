
export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isLoading?: boolean;
}

export interface ChatSession {
  id:string;
  title: string;
  timestamp: Date;
  // lastMessagePreview?: string; // Optional: for showing a snippet in the sidebar
}
