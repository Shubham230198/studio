"use client";

import { useState, useRef, useEffect, type FormEvent, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, SendHorizonal, Sparkles, Search as SearchIcon, Brain } from 'lucide-react'; // Renamed Search to SearchIcon
import SuggestionBar from './suggestion-bar';
import { generateSuggestions, type AdaptiveSuggestionsOutput } from '@/ai/flows/adaptive-suggestions';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


// Icon mapping for suggestions - keys should match possible suggestion strings from AI
const suggestionIcons: { [key: string]: React.ElementType } = {
  Search: SearchIcon,
  Reason: Brain,
  'Deep Research': Sparkles,
  // Add more icons as your AI might suggest different actions
  "Summarize": Brain, // Example
  "Translate": Sparkles, // Example
};

export default function PromptComposer() {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'; // Reset height to shrink if text is deleted
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`; // Max height 200px
    }
  };

  const handleSubmit = useCallback(async (event?: FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    event?.preventDefault();
    if (!inputValue.trim()) return;
    
    // Placeholder for actual message sending logic
    console.log('Sending prompt:', inputValue);
    toast({
      title: "Prompt Sent",
      description: `Your prompt: "${inputValue.substring(0,30)}..." is being processed.`,
    });
    
    // In a real app, you would handle the conversation flow here.
    // For this example, we clear input and fetch new suggestions based on the submitted input.
    const submittedValue = inputValue;
    setInputValue(''); 
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height
    }
    // Fetch suggestions for the submitted input
    fetchAdaptiveSuggestions(submittedValue);
  }, [inputValue, toast]);
  
  const fetchAdaptiveSuggestions = useCallback(async (currentInput: string) => {
    if (!currentInput.trim()) {
        setSuggestions([]);
        return;
    }
    setIsGeneratingSuggestions(true);
    try {
      const result: AdaptiveSuggestionsOutput = await generateSuggestions({ userInput: currentInput });
      setSuggestions(result.suggestions || []); // Ensure suggestions is always an array
    } catch (error) {
      console.error("Error generating suggestions:", error);
      setSuggestions([]); // Clear suggestions on error or show an error suggestion
      toast({
        title: "Suggestion Error",
        description: "Could not generate follow-up suggestions.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, [toast]);

  // Debounce fetching suggestions as user types
  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]); // Clear suggestions if input is empty
      return;
    }
    // Only fetch suggestions if user has typed something significant
    if (inputValue.length < 3 && !inputValue.includes(' ')) { // Basic heuristic
        return;
    }

    const handler = setTimeout(() => {
      fetchAdaptiveSuggestions(inputValue);
    }, 750); // Debounce time: 750ms

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchAdaptiveSuggestions]);


  return (
    <div className="w-full max-w-3xl mx-auto"> {/* Max width for composer area */}
      <SuggestionBar 
        suggestions={suggestions} 
        onSuggestionClick={(suggestion) => {
          setInputValue(prev => prev ? `${prev} ${suggestion}` : suggestion); // Append suggestion or set if empty
          textareaRef.current?.focus();
          // Wait for state update then resize
          setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
            }
          }, 0);
        }}
        isLoading={isGeneratingSuggestions}
        iconMap={suggestionIcons}
      />
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2 mt-2">
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder="What can I help with?"
          className="flex-1 resize-none min-h-[44px] max-h-[200px] rounded-xl py-2.5 pr-20 pl-4 border-border focus-visible:ring-primary/80 text-base bg-input placeholder:text-muted-foreground shadow-sm"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          aria-label="Chat input"
        />
        <div className="absolute right-3 bottom-[9px] flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" aria-label="Voice input">
                  <Mic className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Voice input (not implemented)</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  size="icon" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 rounded-lg disabled:bg-muted disabled:text-muted-foreground" 
                  disabled={!inputValue.trim()} 
                  aria-label="Send message"
                >
                  <SendHorizonal className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Send message</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
}
