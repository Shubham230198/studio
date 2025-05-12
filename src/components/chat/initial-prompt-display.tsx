import { Bot } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

export default function InitialPromptDisplay() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-10">
      <Bot className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
        What can I help with?
      </h1>
      <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8">
        Ask me anything, or try one of the example prompts or suggestions that appear below the input bar.
      </p>
      
      {/* Optional: Example prompt cards, as in some ChatGPT UIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">Plan a trip</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">to see the Northern Lights</CardDescription>
        </Card>
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">Write a story</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">about a friendly robot</CardDescription>
        </Card>
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">Explain a concept</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">like it's for a 5-year-old</CardDescription>
        </Card>
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">Debug my code</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">show me the error in this Python snippet</CardDescription>
        </Card>
      </div>
    </div>
  );
}
