
"use client";

import { useState, useRef, useEffect, type FormEvent, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, SendHorizonal, Sparkles, Search as SearchIcon, Brain, Loader2 } from 'lucide-react';
import SuggestionBar from './suggestion-bar';
import { generateSuggestions, type AdaptiveSuggestionsOutput } from '@/ai/flows/adaptive-suggestions';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const suggestionIcons: { [key: string]: React.ElementType } = {
  Search: SearchIcon,
  Reason: Brain,
  'Deep Research': Sparkles,
  Summarize: Brain,
  Translate: Sparkles,
};

interface PromptComposerProps {
  onSendMessage: (promptText: string) => Promise<void>;
  isLoading: boolean;
}

export default function PromptComposer({ onSendMessage, isLoading }: PromptComposerProps) {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleSubmit = useCallback(async (event?: FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    event?.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    
    const submittedValue = inputValue;
    await onSendMessage(submittedValue);
    
    setInputValue(''); 
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; // Reset height after sending
    }
    setSuggestions([]); // Clear suggestions after sending
  }, [inputValue, isLoading, onSendMessage]);
  
  const fetchAdaptiveSuggestions = useCallback(async (currentInput: string) => {
    if (!currentInput.trim()) {
        setSuggestions([]);
        return;
    }
    setIsGeneratingSuggestions(true);
    try {
      const result: AdaptiveSuggestionsOutput = await generateSuggestions({ userInput: currentInput });
      setSuggestions(result.suggestions || []);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      setSuggestions([]); 
      // Do not toast here by default as it can be noisy if API has transient issues.
      // Consider a more subtle indicator or logging.
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, []); // Removed toast from dependencies as it doesn't change

  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }
    // Only fetch suggestions if input is reasonably long or contains a space
    if (inputValue.length < 5 && !inputValue.includes(' ')) {
        return;
    }
    const handler = setTimeout(() => {
      fetchAdaptiveSuggestions(inputValue);
    }, 750); 

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchAdaptiveSuggestions]);

  // Effect to focus and adjust height on initial render or when inputValue becomes empty (e.g. new chat)
  useEffect(() => {
    if (textareaRef.current) {
      if (inputValue === '') { // Reset height if input is cleared (new chat)
          textareaRef.current.style.height = 'auto';
      }
      // textareaRef.current.focus(); // Optionally focus on mount/reset
    }
  }, [inputValue]);


  return (
    <div className="w-full max-w-3xl mx-auto">
      <SuggestionBar 
        suggestions={suggestions} 
        onSuggestionClick={(suggestion) => {
          setInputValue(prev => prev ? `${prev} ${suggestion}` : suggestion); 
          textareaRef.current?.focus();
          // Let handleInputChange adjust height
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
            if (e.key === 'Enter' && !e.shiftKey && !isLoading) { 
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          aria-label="Chat input"
          disabled={isLoading} 
        />
        <div className="absolute right-3 bottom-[9px] flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" aria-label="Voice input" disabled={isLoading}>
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
                  disabled={!inputValue.trim() || isLoading} 
                  aria-label="Send message"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>{isLoading ? "Processing..." : "Send message"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>
    </div>
  );
}
