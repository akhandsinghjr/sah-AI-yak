import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2Icon, VolumeXIcon, PauseIcon, PlayIcon, RefreshCwIcon } from "lucide-react";
import { azureAIServices } from "@/services/azure-ai";

interface SpeechPlaybackProps {
  text: string;
  autoPlay?: boolean;
  onComplete?: () => void;
  voice?: string;
}

const SpeechPlayback: React.FC<SpeechPlaybackProps> = ({ 
  text, 
  autoPlay = true, 
  onComplete, 
  voice = "en-US-JennyMultilingualNeural" 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (text) {
      generateSpeech();
    }
  }, [text]);
  
  const generateSpeech = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);
    
    try {
      // Process the text to make it more suited for speaking
      // Remove any markdown formatting, code blocks, excessive newlines, etc.
      const processedText = text
        .replace(/```[\s\S]*?```/g, "I've included some code in my response.")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\n\n+/g, "\n")
        .trim();
      
      // If text is too long, truncate it for better speech
      const maxLength = 500;
      const truncatedText = processedText.length > maxLength 
        ? processedText.substring(0, maxLength) + "... I'll let you read the rest of my response."
        : processedText;
      
      // Generate the speech
      const result = await azureAIServices.speech.textToSpeech(truncatedText, voice);
      
      if (result.success) {
        setAudioUrl(result.audioUrl!);
        
        // Automatically play audio if autoPlay is true
        if (autoPlay) {
          setIsPlaying(true);
        }
      } else {
        setError(`Failed to generate speech: ${result.error}`);
      }
    } catch (error) {
      console.error("Speech generation error:", error);
      setError("Failed to generate speech audio");
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          setError("Could not play audio. Try refreshing.");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (onComplete) {
      onComplete();
    }
  };
  
  const retryGeneration = () => {
    generateSpeech();
  };
  
  return (
    <div className="speech-playback w-full">
      {isLoading ? (
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-md p-2">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-300">Generating speech...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-2 rounded-md text-sm flex justify-between items-center">
          <p>{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={retryGeneration}
            className="flex items-center gap-1"
          >
            <RefreshCwIcon className="h-3 w-3" />
            <span>Retry</span>
          </Button>
        </div>
      ) : audioUrl ? (
        <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-md p-2">
          <div className="flex gap-2 items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 relative ${isPlaying ? 'animate-pulse' : ''}`}>
              {isPlaying ? (
                <>
                  <PauseIcon className="h-4 w-4 text-primary" />
                  {/* Sound wave animation */}
                  <div className="absolute -right-4 top-1 flex items-end h-6 overflow-hidden">
                    <div className={`w-1 mx-px bg-primary rounded-full ${isPlaying ? 'animate-sound-wave-1' : 'h-1'}`}></div>
                    <div className={`w-1 mx-px bg-primary rounded-full ${isPlaying ? 'animate-sound-wave-2' : 'h-1'}`}></div>
                    <div className={`w-1 mx-px bg-primary rounded-full ${isPlaying ? 'animate-sound-wave-3' : 'h-1'}`}></div>
                    <div className={`w-1 mx-px bg-primary rounded-full ${isPlaying ? 'animate-sound-wave-4' : 'h-1'}`}></div>
                  </div>
                </>
              ) : (
                <PlayIcon className="h-4 w-4 text-primary" />
              )}
            </div>
            <span className="text-sm">
              {isPlaying ? "Playing audio..." : "Audio ready"}
            </span>
          </div>
          
          <audio 
            ref={audioRef}
            src={audioUrl}
            className="hidden"
            autoPlay={autoPlay}
            onEnded={handleAudioEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          <div className="flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={togglePlayPause}
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            </Button>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default SpeechPlayback;
