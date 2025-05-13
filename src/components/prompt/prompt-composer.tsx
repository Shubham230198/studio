"use client";

import { useState, useRef, useEffect, type FormEvent, useCallback, type MouseEvent, type TouchEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mic, SendHorizonal, Sparkles, Search as SearchIcon, Brain, Loader2 } from 'lucide-react';
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
  const inputValueRef = useRef(inputValue); 
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast } = useToast();


  useEffect(() => {
    inputValueRef.current = inputValue;
  }, [inputValue]);

  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, []);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(event.target.value);
  };
  
  useEffect(() => {
    adjustTextareaHeight();
  }, [inputValue, adjustTextareaHeight]);


  const handleSubmit = useCallback(async (event?: FormEvent<HTMLFormElement> | React.KeyboardEvent<HTMLTextAreaElement>) => {
    event?.preventDefault();
    const currentInput = inputValueRef.current.trim();
    if (!currentInput || isLoading) return;
    
    await onSendMessage(currentInput);
    
    setInputValue(''); 
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'; 
    }
    setSuggestions([]); 
  }, [isLoading, onSendMessage]);
  
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
    const currentInput = inputValueRef.current;
    if (!currentInput.trim()) {
      setSuggestions([]);
      return;
    }
    if (currentInput.length < 3 && !currentInput.includes(' ')) {
        return;
    }
    const handler = setTimeout(() => {
      fetchAdaptiveSuggestions(currentInput);
    }, 750); 

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchAdaptiveSuggestions]); 

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    speechRecognitionRef.current = recognition;
    recognition.continuous = false; 
    recognition.interimResults = true; 
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(transcript); 
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      const finalTranscript = inputValueRef.current.trim();

      if (finalTranscript && !isLoading) {
        onSendMessage(finalTranscript).then(() => {
          setInputValue('');
          setSuggestions([]);
        }).catch(error => {
            console.error("Error sending voice message:", error);
        });
      } else if (!finalTranscript) { // Clear input if transcript was empty (e.g. mic released without speech)
        setInputValue(''); 
      }
    };

    return () => {
      if (recognition && isListening) { // Ensure to stop recognition if component unmounts while listening
        recognition.stop(); 
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, onSendMessage, toast]);


  const handleMicButtonDown = useCallback(async (event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
    event.preventDefault(); 
    if (isLoading || isListening) return;

    if (!speechRecognitionRef.current) {
      console.error("Speech recognition not supported or not initialized.");
      return;
    }

    setInputValue(''); 
    setSuggestions([]); 

    try {
      speechRecognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      setIsListening(false);
    }
  }, [isLoading, isListening]);

  const handleMicButtonUp = useCallback(async (event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop(); 
      // onend will handle sending the message
    }
  }, [isListening]);


  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <SuggestionBar 
        suggestions={suggestions} 
        onSuggestionClick={(suggestion) => {
          setInputValue(prev => prev ? `${prev} ${suggestion}` : suggestion); 
          textareaRef.current?.focus();
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
          className="flex-1 resize-none min-h-[44px] max-h-[200px] rounded-xl py-2.5 pr-12 pl-4 border-border focus-visible:ring-primary/80 text-base bg-input placeholder:text-muted-foreground shadow-sm"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isLoading && !isListening) { 
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          aria-label="Chat input"
          disabled={isLoading} 
        />
        <div className="absolute right-3 bottom-[9px] flex items-center">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="submit" 
                  size="icon" 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 w-8 rounded-lg disabled:bg-muted disabled:text-muted-foreground" 
                  disabled={!inputValue.trim() || isLoading || isListening} 
                  aria-label="Send message"
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <SendHorizonal className="h-5 w-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>{(isLoading || isListening) ? "Processing..." : "Send message"}</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </form>

      {/* Mic Button - Floating Action Button style */}
      <div className="absolute right-2 bottom-[calc(44px+16px)] z-20 md:right-4 md:bottom-[calc(44px+20px)]">
         <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="default" 
                  size="icon" 
                  className={cn(
                    "rounded-full h-14 w-14 shadow-xl bg-primary hover:bg-primary/80 text-primary-foreground flex items-center justify-center",
                    isListening && "animate-pulse ring-4 ring-primary/50 ring-offset-2 ring-offset-background"
                  )} 
                  aria-label={isListening ? "Recording... Release to send" : "Hold to talk"} 
                  onMouseDown={handleMicButtonDown}
                  onMouseUp={handleMicButtonUp}
                  onMouseLeave={handleMicButtonUp} 
                  onTouchStart={handleMicButtonDown}
                  onTouchEnd={handleMicButtonUp}
                  disabled={isLoading}
                >
                  <Mic className="h-6 w-6" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" align="center">
                <p>{isListening ? "Recording... Release to send" : "Hold to talk"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
      </div>
    </div>
  );
}
