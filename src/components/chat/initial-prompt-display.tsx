import { Bot } from 'lucide-react';
import { Card, CardTitle, CardDescription } from '@/components/ui/card';

export default function InitialPromptDisplay() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center py-10">
      <Bot className="h-16 w-16 text-primary mb-6" />
      <h1 className="text-3xl md:text-4xl font-semibold text-foreground mb-3">
        Welcome to Flyin.AI!
      </h1>
      <p className="text-base md:text-lg text-muted-foreground max-w-md mb-8">
        Your personal AI travel assistant. Ask me anything about flights, destinations, or planning your next trip.
      </p>
      
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl w-full">
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">Find cheap flights</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">to Paris for next month</CardDescription>
        </Card>
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">Plan an itinerary</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">for a 7-day trip to Bali</CardDescription>
        </Card>
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">What to pack</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">for a 2-week hiking trip in Patagonia</CardDescription>
        </Card>
        <Card className="p-4 hover:bg-muted/30 cursor-pointer transition-colors duration-150 rounded-lg shadow-sm border-border/70">
          <CardTitle className="text-md font-medium text-foreground">Best time to visit</CardTitle>
          <CardDescription className="text-sm text-muted-foreground mt-1">the cherry blossoms in Japan</CardDescription>
        </Card>
      </div> */}
    </div>
  );
}

