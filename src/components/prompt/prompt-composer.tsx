
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
  const inputValueRef = useRef(inputValue); // Ref to hold current inputValue for callbacks
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);
  const { toast, dismiss: dismissToast } = useToast();
  const [activeToastId, setActiveToastId] = useState<string | null>(null);


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
    // adjustTextareaHeight will be called by useEffect watching inputValue for typed input
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
    // Only fetch suggestions if input is non-trivial
    if (currentInput.length < 3 && !currentInput.includes(' ')) {
        return;
    }
    const handler = setTimeout(() => {
      fetchAdaptiveSuggestions(currentInput);
    }, 750); 

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, fetchAdaptiveSuggestions]); // Depend on inputValue to re-trigger debounced fetch

  // Speech Recognition Logic
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      return;
    }

    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    speechRecognitionRef.current = recognition;
    recognition.continuous = false; // Important for hold-to-talk: stops on silence or .stop()
    recognition.interimResults = true; 
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setInputValue(transcript); // Update input value with interim/final transcript
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error', event.error);
      let errorMsg = 'Speech recognition error. Please try again.';
      if (event.error === 'no-speech') {
        errorMsg = 'No speech was detected. Try holding the button and speaking clearly.';
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
      if (activeToastId) {
        dismissToast(activeToastId);
        setActiveToastId(null);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (activeToastId) {
        dismissToast(activeToastId);
        setActiveToastId(null);
      }

      const finalTranscript = inputValueRef.current.trim();

      if (finalTranscript && !isLoading) {
        onSendMessage(finalTranscript).then(() => {
          setInputValue('');
          // adjustTextareaHeight will be called by useEffect due to inputValue change
          setSuggestions([]);
        }).catch(error => {
            console.error("Error sending voice message:", error);
            // Optionally, restore transcript to input if send fails or show error toast.
            // For now, error is logged, input is cleared by .then() on success.
        });
      } else {
        // If no transcript or AI is busy, just clear input if it was only for speech
        setInputValue(''); // Ensure cleared
        // adjustTextareaHeight will be called by useEffect
      }
    };

    return () => {
      if (recognition) {
        recognition.stop(); // Ensure recognition is stopped on component unmount
      }
      if (activeToastId) {
        dismissToast(activeToastId); // Clean up toast on unmount
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, dismissToast, isLoading, onSendMessage]); // activeToastId not needed in deps


  const handleMicButtonDown = useCallback(async (event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent any default browser action like text selection
    if (isLoading || isListening) return;

    if (!speechRecognitionRef.current) {
      toast({
        title: "Voice Input Not Supported",
        description: "Your browser does not support speech recognition.",
        variant: "destructive",
      });
      return;
    }

    setInputValue(''); // Clear previous input for new speech message
    setSuggestions([]); // Clear suggestions for new speech

    try {
      speechRecognitionRef.current.start();
      setIsListening(true);
      const { id: newToastId } = toast({
        title: "Listening...",
        description: "Hold the button and speak. Release to send.",
      });
      setActiveToastId(newToastId);
    } catch (error) {
      console.error("Error starting speech recognition:", error);
      toast({
        title: "Could Not Start Voice Input",
        description: "Please ensure your microphone is connected and permission is granted.",
        variant: "destructive",
      });
      setIsListening(false);
    }
  }, [isLoading, isListening, toast, setActiveToastId]);

  const handleMicButtonUp = useCallback(async (event: MouseEvent<HTMLButtonElement> | TouchEvent<HTMLButtonElement>) => {
    event.preventDefault();
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop(); 
      // isListening and toast dismissal will be handled by recognition.onend()
    }
    // If recognition wasn't active (e.g. quick click without hold), ensure UI reset
    if (!isListening && activeToastId) {
        dismissToast(activeToastId);
        setActiveToastId(null);
    }
  }, [isListening, activeToastId, dismissToast, setActiveToastId]);


  return (
    <div className="w-full max-w-3xl mx-auto">
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
          className="flex-1 resize-none min-h-[44px] max-h-[200px] rounded-xl py-2.5 pr-20 pl-4 border-border focus-visible:ring-primary/80 text-base bg-input placeholder:text-muted-foreground shadow-sm"
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
        <div className="absolute right-3 bottom-[9px] flex items-center gap-1">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "text-muted-foreground hover:text-primary h-8 w-8 cursor-pointer",
                    isListening && "text-primary animate-pulse"
                  )} 
                  aria-label={isListening ? "Recording... Release to send" : "Hold to talk"} 
                  onMouseDown={handleMicButtonDown}
                  onMouseUp={handleMicButtonUp}
                  onMouseLeave={handleMicButtonUp} // Stop if mouse leaves button while pressed
                  onTouchStart={handleMicButtonDown}
                  onTouchEnd={handleMicButtonUp}
                  disabled={isLoading}
                >
                  <Mic className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>{isListening ? "Recording... Release to send" : "Hold to talk"}</p>
              </TooltipContent>
            </Tooltip>
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
    </div>
  );
}

