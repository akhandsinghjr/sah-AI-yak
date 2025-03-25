import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MicIcon, StopCircleIcon } from "lucide-react";
import { azureAIServices } from "@/services/azure-ai";

interface SpeechInputProps {
  onSpeechResult: (text: string) => void;
  isDisabled?: boolean;
}

const SpeechInput: React.FC<SpeechInputProps> = ({ 
  onSpeechResult, 
  isDisabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  
  useEffect(() => {
    // Setup speech recognition when component mounts
    setupSpeechRecognition();
    
    // Cleanup on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);
  
  const setupSpeechRecognition = () => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError("Speech recognition is not supported in your browser.");
      return;
    }
    
    try {
      const recognition = new SpeechRecognition();
      
      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      // Store current transcript
      let finalTranscript = '';
      
      // Handle results
      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }
        
        // If we have a final transcript, send it to the parent component
        if (finalTranscript.trim()) {
          onSpeechResult(finalTranscript.trim());
          finalTranscript = '';
        }
      };
      
      // Handle errors
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        stopListening();
      };
      
      // Handle end of recognition
      recognition.onend = () => {
        if (isListening) {
          // If we're still supposed to be listening, restart
          try {
            recognition.start();
          } catch (e) {
            console.error("Failed to restart recognition:", e);
            setIsListening(false);
          }
        }
      };
      
      recognitionRef.current = recognition;
    } catch (error) {
      console.error("Error setting up speech recognition:", error);
      setError("Failed to set up speech recognition");
    }
  };
  
  const startListening = () => {
    setError(null);
    
    if (!recognitionRef.current) {
      setupSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
        setError("Failed to start listening");
      }
    }
  };
  
  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error("Error stopping speech recognition:", error);
      }
    }
    
    setIsListening(false);
  };
  
  return (
    <div className="speech-input">
      <Button
        type="button"
        size="icon"
        variant={isListening ? "default" : "outline"}
        onClick={isListening ? stopListening : startListening}
        disabled={isDisabled}
        className={`h-10 w-10 ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
        title={isListening ? "Stop listening" : "Start voice input"}
      >
        {isListening ? (
          <StopCircleIcon className="h-5 w-5" />
        ) : (
          <MicIcon className="h-5 w-5" />
        )}
      </Button>
      
      {error && (
        <div className="text-xs text-red-500 mt-1">
          {error}
        </div>
      )}
      
      {isListening && (
        <div className="text-xs text-green-500 mt-1 animate-pulse">
          Listening...
        </div>
      )}
    </div>
  );
};

export default SpeechInput;
