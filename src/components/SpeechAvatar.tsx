import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { 
  Volume2Icon, 
  VolumeXIcon, 
  PauseIcon, 
  PlayIcon, 
  MinimizeIcon, 
  MaximizeIcon, 
  RefreshCwIcon, 
  VideoIcon,
  Headphones 
} from "lucide-react";
import { azureAIServices } from "@/services/azure-ai";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SpeechAvatarProps {
  text: string;
  autoPlay?: boolean;
  onComplete?: () => void;
  avatarType?: string;
  voice?: string;
  showAvatarToggle?: boolean;
  initialAvatarMode?: boolean;
}

const SpeechAvatar: React.FC<SpeechAvatarProps> = ({ 
  text, 
  autoPlay = true, 
  onComplete, 
  avatarType = "lisa",
  voice = "en-US-JennyMultilingualNeural",
  showAvatarToggle = true,
  initialAvatarMode = true
}) => {
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Media State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [useAvatarMode, setUseAvatarMode] = useState(initialAvatarMode);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (text) {
      generateMedia();
    }
  }, [text, useAvatarMode]);
  
  const generateMedia = async () => {
    if (!text.trim()) return;
    
    setIsLoading(true);
    setError(null);
    setAvatarUrl(null);
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
      
      // Display a clear message about the avatar limitations when in avatar mode
      if (useAvatarMode) {
        // Add a clear notification about the avatar limitations
        setError("The Talking Avatars feature requires a server-side implementation. Audio only mode is being used as a fallback.");
        
        const result = await azureAIServices.speech.getAvatarSpeech(truncatedText, avatarType);
        
        if (result.success) {
          if (result.isAvatarVideo && result.avatarUrl) {
            setAvatarUrl(result.avatarUrl);
          } else if (result.audioUrl) {
            setAudioUrl(result.audioUrl);
          }
          
          if (result.fallbackReason) {
            setError(result.fallbackReason);
          }
          
          if (autoPlay) {
            setIsPlaying(true);
          }
          
          setIsLoading(false);
          return;
        }
      }
      
      // Fall through to regular speech if avatar mode failed or is disabled
      const speechResult = await azureAIServices.speech.textToSpeech(truncatedText, voice);
      
      if (speechResult.success) {
        setAudioUrl(speechResult.audioUrl!);
        
        if (autoPlay) {
          setIsPlaying(true);
        }
      } else {
        setError(`Failed to generate speech: ${speechResult.error}`);
      }
    } catch (error) {
      console.error("Media generation error:", error);
      setError("Failed to generate media. Speech synthesis service may be unavailable.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const togglePlayPause = () => {
    if (avatarUrl && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error("Error playing video:", err);
          setError("Could not play video. Try refreshing.");
        });
      }
      setIsPlaying(!isPlaying);
    } else if (audioUrl && audioRef.current) {
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
    if (avatarUrl && videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    } else if (audioUrl && audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
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
  
  const handleAvatarToggle = (checked: boolean) => {
    setUseAvatarMode(checked);
  };
  
  const retryGeneration = () => {
    generateMedia();
  };
  
  return (
    <div className="speech-avatar-component w-full">
      {isLoading ? (
        <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg p-4 min-h-[100px]">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-8 w-8 text-primary mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {useAvatarMode ? "Generating avatar..." : "Generating speech..."}
            </p>
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
      ) : avatarUrl ? (
        <div className={`avatar-container ${isMinimized ? 'w-32' : 'w-full'} transition-all duration-300 ease-in-out`}>
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
        </div>
      ) : audioUrl ? (
        <div className="audio-container">
          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-md p-2">
            <div className="flex gap-2 items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 ${isPlaying ? 'animate-pulse' : ''}`}>
                {isPlaying ? (
                  <PauseIcon className="h-4 w-4 text-primary" />
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
              onEnded={handleMediaEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            <div className="flex gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={togglePlayPause}
              >
                {isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              </Button>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8"
                onClick={toggleMute}
              >
                {isMuted ? <VolumeXIcon className="h-4 w-4" /> : <Volume2Icon className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
      
      {showAvatarToggle && !isLoading && (avatarUrl || audioUrl) && (
        <div className="mt-2 flex items-center gap-2 justify-end">
          <div className="flex items-center space-x-2">
            <Switch
              id="avatar-toggle"
              checked={useAvatarMode}
              onCheckedChange={handleAvatarToggle}
              size="sm"
            />
            <Label htmlFor="avatar-toggle" className="text-xs flex items-center">
              {useAvatarMode ? (
                <>
                  <VideoIcon className="h-3 w-3 mr-1" />
                  <span>Avatar mode</span>
                </>
              ) : (
                <>
                  <Headphones className="h-3 w-3 mr-1" />
                  <span>Audio only</span>
                </>
              )}
            </Label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpeechAvatar;
