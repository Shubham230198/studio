
"use client";

import { useState, useRef, useEffect, type FormEvent, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, SendHorizonal, Sparkles, Search as SearchIcon, Brain, Loader2, MicOff } from 'lucide-react';
import SuggestionBar from './suggestion-bar';
import { generateSuggestions, type AdaptiveSuggestionsOutput } from '@/ai/flows/adaptive-suggestions';
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

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
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
    adjustTextareaHeight();
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
    } finally {
      setIsGeneratingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    if (!inputValue.trim()) {
      setSuggestions([]);
      return;
    }
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

  useEffect(() => {
    if (textareaRef.current) {
      if (inputValue === '') { 
          textareaRef.current.style.height = 'auto';
      }
    }
  }, [inputValue]);

  // Speech Recognition Logic
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      // Speech recognition not supported
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    speechRecognitionRef.current = new SpeechRecognitionAPI();
    const recognition = speechRecognitionRef.current;
    recognition.continuous = false;
    recognition.interimResults = true; 
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Show interim results, append final transcript
      setInputValue(prev => {
        // If there's a final transcript, replace the last interim part with it.
        // This logic can be tricky. A simpler approach for now is to just append or replace.
        // For this implementation, we'll just use the final transcript if available,
        // or the interim one. When final, it replaces the input.
        if (finalTranscript) {
          return prev + (prev.endsWith(' ') || prev === '' ? '' : ' ') + finalTranscript.trim() + ' ';
        }
        // If only interim, we might want to show it temporarily without committing to state changes that trigger other effects
        // For now, let's update with interim to give feedback, but this can cause rapid suggestion fetching.
        // A better UX might be to display interim in a different way.
        // Simple approach for now: only update with final or when recognition ends
        return prev; 
      });
      if (finalTranscript) adjustTextareaHeight();
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      let errorMsg = 'Speech recognition error. Please try again.';
      if (event.error === 'no-speech') {
        errorMsg = 'No speech was detected. Please try again.';
      } else if (event.error === 'audio-capture') {
        errorMsg = 'Microphone problem. Please ensure it is enabled and working.';
      } else if (event.error === 'not-allowed') {
        errorMsg = 'Permission to use microphone was denied. Please enable it in your browser settings.';
      }
      toast({
        title: "Voice Input Error",
        description: errorMsg,
        variant: "destructive",
      });
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Ensure final adjustment of textarea height after speech ends
      // and input value is set with the final transcript.
      setTimeout(adjustTextareaHeight, 0);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [toast, adjustTextareaHeight]);

  const toggleListening = async () => {
    if (!speechRecognitionRef.current) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      speechRecognitionRef.current.stop();
    } else {
      try {
        // Check for microphone permission implicitly by trying to start
        // Or explicitly: navigator.permissions.query({ name: 'microphone' })
        // For simplicity, direct start attempt is used. Error handling will catch permission issues.
        speechRecognitionRef.current.start();
        setIsListening(true);
        toast({
          title: "Listening...",
          description: "Speak now. Click the mic again to stop.",
        });
      } catch (error) {
         // This catch might not always fire for permission issues immediately,
         // as start() can be async and errors handled by recognition.onerror
        console.error("Error starting speech recognition:", error);
        toast({
          title: "Could Not Start Voice Input",
          description: "Please ensure your microphone is connected and permission is granted.",
          variant: "destructive",
        });
        setIsListening(false); // Ensure state is correct
      }
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <SuggestionBar 
        suggestions={suggestions} 
        onSuggestionClick={(suggestion) => {
          setInputValue(prev => prev ? `${prev} ${suggestion}` : suggestion); 
          textareaRef.current?.focus();
          setTimeout(adjustTextareaHeight, 0);
        }}
        isLoading={isGeneratingSuggestions}
        iconMap={suggestionIcons}
      />
      <form onSubmit={handleSubmit} className="relative flex items-end gap-2 mt-2">
        <Textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleInputChange}
          placeholder={isListening ? "Listening..." : "What can I help with?"}
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
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "text-muted-foreground hover:text-primary h-8 w-8",
                    isListening && "text-primary animate-pulse"
                  )} 
                  aria-label={isListening ? "Stop listening" : "Voice input"} 
                  onClick={toggleListening}
                  disabled={isLoading} // Disable while main AI is processing
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isListening ? "Stop listening" : "Start voice input"}</p>
              </TooltipContent>
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
