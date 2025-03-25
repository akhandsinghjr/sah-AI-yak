import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Volume2Icon, VolumeXIcon, PauseIcon, PlayIcon, MinimizeIcon, MaximizeIcon, RefreshCwIcon } from "lucide-react";
import { azureAIServices } from "@/services/azure-ai";

interface AvatarSpeakerProps {
  text: string;
  autoPlay?: boolean;
  onComplete?: () => void;
  avatarType?: string;
}

const AvatarSpeaker: React.FC<AvatarSpeakerProps> = ({ 
  text, 
  autoPlay = true, 
  onComplete, 
  avatarType = "lisa" 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSpeechOnly, setIsSpeechOnly] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (text) {
      generateAvatar();
    }
  }, [text]);
  
  const generateAvatar = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAvatarUrl(null);
    setAudioUrl(null);
    setIsSpeechOnly(false);
    
    try {
      // Process the text to make it more suited for speaking
      // Remove any markdown formatting, code blocks, excessive newlines, etc.
      const processedText = text
        .replace(/```[\s\S]*?```/g, "I've included some code in my response.")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\n\n+/g, "\n")
        .trim();
      
      // If text is too long, truncate it for the avatar to prevent excessive speaking
      const maxLength = 500;
      const truncatedText = processedText.length > maxLength 
        ? processedText.substring(0, maxLength) + "... I'll let you read the rest of my response."
        : processedText;
      
      // Generate the talking avatar
      const result = await azureAIServices.speech.getAvatarSpeech(truncatedText, avatarType);
      
      if (result.success) {
        if (result.isAvatarVideo) {
          // We got a video avatar
          setAvatarUrl(result.avatarUrl!);
          setIsSpeechOnly(false);
        } else {
          // Fallback to audio-only
          setAudioUrl(result.audioUrl!);
          setIsSpeechOnly(true);
          setError(`Using audio-only mode: ${result.fallbackReason}`);
        }
        
        // Automatically play the media if autoPlay is true
        if (autoPlay) {
          setIsPlaying(true);
        }
      } else {
        setError(`Failed to generate avatar or speech: ${result.error}`);
      }
    } catch (error) {
      console.error("Avatar generation error:", error);
      setError("Failed to generate avatar or speech");
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePlayPause = () => {
    if (isSpeechOnly && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.error("Error playing audio:", err);
          setError("Could not play audio. Try refreshing.");
        });
      }
      setIsPlaying(!isPlaying);
    } else if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setError("Could not play video. Try refreshing.");
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (isSpeechOnly && audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(!isMuted);
    } else if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };
  
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };
  
  const handleMediaEnded = () => {
    setIsPlaying(false);
    if (onComplete) {
      onComplete();
    }
  };
  
  const retryGeneration = () => {
    generateAvatar();
  };
  
  return (
    <div className={`avatar-speaker ${isMinimized ? 'w-32' : 'w-full'} transition-all duration-300 ease-in-out`}>
      {isLoading ? (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[200px]">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-300">Generating avatar...</p>
          </div>
        </div>
      ) : error && (!avatarUrl && !audioUrl) ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-3 rounded-md text-sm">
          <p className="mb-2">{error}</p>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={retryGeneration} 
            className="mt-2 flex items-center gap-1"
          >
            <RefreshCwIcon className="h-3 w-3" />
            <span>Retry</span>
          </Button>
        </div>
      ) : isSpeechOnly && audioUrl ? (
        <div className="relative rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex gap-2 items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 ${isPlaying ? 'animate-pulse' : ''}`}>
                  {isPlaying ? (
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.5 8.5V15.5M14.5 8.5V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.5 8.5L15.5 12L8.5 15.5V8.5Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div className="text-sm font-medium">Audio Playback</div>
              </div>
              {error && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">{error}</p>
              )}
            </div>
            
            <audio 
              ref={audioRef}
              src={audioUrl}
              className="hidden"
              autoPlay={autoPlay}
              onEnded={handleMediaEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            <div className="flex gap-1">
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 bg-gray-200/70 dark:bg-gray-700/70 hover:bg-gray-300/90 dark:hover:bg-gray-600/90"
                onClick={togglePlayPause}
              >
                {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              </Button>
              <Button 
                size="icon" 
                variant="secondary" 
                className="h-8 w-8 bg-gray-200/70 dark:bg-gray-700/70 hover:bg-gray-300/90 dark:hover:bg-gray-600/90"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      ) : avatarUrl ? (
        <div className="relative rounded-lg overflow-hidden">
          <video 
            ref={videoRef}
            src={avatarUrl}
            className={`w-full rounded-lg ${isMinimized ? 'h-32 object-cover' : ''}`}
            controls={false}
            autoPlay={autoPlay}
            onEnded={handleMediaEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          
          {error && (
            <div className="absolute top-0 left-0 right-0 bg-amber-500/90 text-white text-xs p-1">
              {error}
            </div>
          )}
          
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 bg-gray-800/70 hover:bg-gray-700/90"
              onClick={togglePlayPause}
            >
              {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 bg-gray-800/70 hover:bg-gray-700/90"
              onClick={toggleMute}
            >
              {isMuted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
            </Button>
            <Button 
              size="icon" 
              variant="secondary" 
              className="h-8 w-8 bg-gray-800/70 hover:bg-gray-700/90"
              onClick={toggleMinimize}
            >
              {isMinimized ? <MaximizeIcon className="h-4 w-4" /> : <MinimizeIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AvatarSpeaker;