import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SuggestionBarProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
  iconMap?: { [key: string]: React.ElementType }; // Optional map for icons based on suggestion text
}

export default function SuggestionBar({ suggestions, onSuggestionClick, isLoading, iconMap }: SuggestionBarProps) {
  const barHeight = "h-9"; // Consistent height for the bar area

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center gap-2 mb-2 ${barHeight} animate-pulse`}>
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Generating suggestions...</span>
      </div>
    );
  }

  if (!suggestions || suggestions.length === 0) {
    return <div className={`mb-2 ${barHeight}`}></div>; // Reserve space to prevent layout shifts
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 mb-2 min-h-[${barHeight}]`}> {/* Ensure min height */}
      {suggestions.map((suggestion, index) => {
        const IconComponent = iconMap && suggestionIcons[suggestion as keyof typeof suggestionIcons];
        return (
          <Button
            key={`${suggestion}-${index}`} // More unique key
            variant="outline"
            size="sm"
            className="rounded-full text-xs sm:text-sm font-normal border-border hover:bg-accent/10 hover:border-accent/70 text-foreground shadow-sm h-8 px-3"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {IconComponent && <IconComponent className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />}
            {suggestion}
          </Button>
        );
      })}
    </div>
  );
}

// Define suggestionIcons here or import if it's shared and large
const SearchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-4 w-4"}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
);
const BrainIcon = ({ className }: { className?: string }) => (
 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-4 w-4"}><path d="M12 2a4.5 4.5 0 0 0-4.5 4.5c0 1.08.37 2.08.99 2.86V12H6.5A2.5 2.5 0 0 0 4 14.5V16a2 2 0 0 0 2 2h2.53a5.52 5.52 0 0 0 10.94 0H18a2 2 0 0 0 2-2v-1.5A2.5 2.5 0 0 0 17.5 12H15.51V9.36c.62-.78.99-1.78.99-2.86A4.5 4.5 0 0 0 12 2Z"></path><path d="M12 12v2.5"></path><path d="M10.03 18.97c-.2-.06-.4-.1-.6-.12"></path><path d="M14.57 18.85c-.2-.06-.4-.1-.6-.12"></path><path d="M6.5 12H8"></path><path d="M16 12h1.5"></path></svg>
);
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className || "h-4 w-4"}><path d="M12 2L9.15 9.15L2 12l7.15 2.85L12 22l2.85-7.15L22 12l-7.15-2.85L12 2z"></path><path d="M6.343 6.343l1.414 1.414"></path><path d="M16.243 16.243l1.414 1.414"></path><path d="M6.343 17.657l1.414-1.414"></path><path d="M17.657 6.343l-1.414 1.414"></path></svg>
);

const suggestionIcons: { [key: string]: React.ElementType } = {
  Search: SearchIcon,
  Reason: BrainIcon,
  'Deep Research': SparklesIcon,
  "Summarize": BrainIcon,
  "Translate": SparklesIcon,
};
