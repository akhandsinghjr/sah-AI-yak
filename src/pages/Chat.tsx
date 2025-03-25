import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { UploadIcon, CameraIcon, XIcon, ArrowRightIcon, HeartPulseIcon, ImageIcon, Volume2Icon, MicIcon } from "lucide-react";
import { azureAIServices } from "@/services/azure-ai";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import SpeechPlayback from "@/components/SpeechPlayback";
import SpeechInput from "@/components/SpeechInput";

const Chat = () => {
  // State for chat functionality
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string, timestamp?: Date, hasImage?: boolean, pendingImage?: boolean, imageUrl?: string}>>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const chatImageFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // State for camera functionality
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // New state for auto-capture functionality
  const [isAutoCaptureInProgress, setIsAutoCaptureInProgress] = useState(false);
  const [shouldSendAfterCapture, setShouldSendAfterCapture] = useState(false);
  const [pendingMessage, setPendingMessage] = useState("");

  // Add state for speech functionality
  const [useSpeech, setUseSpeech] = useState(true);
  const [activeAudioMessage, setActiveAudioMessage] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<string>("en-US-JennyMultilingualNeural");

  // Add new state for expanded images
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Add a rate limiting state to track cooldown periods
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [rateLimitCooldown, setRateLimitCooldown] = useState(0);
  const rateLimitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Start the mental health assessment
  const startChat = async () => {
    setLoading(true);
    try {
      const initialResponse = await azureAIServices.mentalHealth.startConversation();
      
      setChatMessages([
        {
          role: "assistant",
          content: initialResponse.messages[0].content,
          timestamp: new Date(),
        }
      ]);
      
      setIsStarted(true);
      
      toast({
        title: "Mental Health Assistant Activated",
        description: "You're now chatting with a mental health assessment AI. This is not a substitute for professional care.",
      });
    } catch (error) {
      console.error("Error starting mental health chat:", error);
      toast({
        title: "Service Error",
        description: "Could not start the mental health assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced sendMessage with rate limit awareness
  const sendMessage = async () => {
    // Don't send if we're in a rate limit cooldown
    if (isRateLimited) {
      toast({
        title: "Service Cooling Down",
        description: `Please wait ${rateLimitCooldown} seconds before sending another message.`,
        variant: "destructive",
      });
      return;
    }

    if (!currentMessage.trim() && !chatImage) {
      toast({
        title: "Empty Message",
        description: "Please enter a message to send.",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple clicks while processing
    if (loading || isAutoCaptureInProgress) {
      return;
    }

    // Save the current message text before clearing input
    const messageToSend = currentMessage.trim();
    
    // Add user message to UI immediately so user sees it right away
    const userMessage = {
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
      hasImage: !!chatImage, // Will be false for auto-capture initially
      pendingImage: !chatImage // Mark that we're waiting for an image if not manually uploaded
    };
    
    setChatMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Clear input field
    setCurrentMessage("");

    // If we already have a manually captured image, send directly
    if (chatImage) {
      sendMessageWithImage(messageToSend, chatImage);
    } else {
      // Show that we're starting the capture process
      setIsAutoCaptureInProgress(true);
      setPendingMessage(messageToSend);
      
      // Start the auto-capture process
      autoCaptureThenSend(messageToSend);
    }
  };

  // Improved auto-capture function with messageText parameter
  const autoCaptureThenSend = async (messageText: string) => {
    try {
      // Close any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Get camera stream
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.setAttribute('playsinline', 'true');
        
        // Create a promise to wait for the video to be ready
        const videoReadyPromise = new Promise<void>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error("Camera initialization timed out"));
          }, 5000);
          
          videoRef.current!.oncanplay = () => {
            clearTimeout(timeoutId);
            resolve();
          };
          
          videoRef.current!.onerror = () => {
            clearTimeout(timeoutId);
            reject(new Error("Video error occurred"));
          };
        });
        
        // Start playing the video
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
        }
        
        // Wait for the video to be ready
        await videoReadyPromise;
        
        // Short delay to ensure good frame
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Now capture the photo
        if (!videoRef.current || !canvasRef.current) {
          throw new Error("Camera elements not found");
        }
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Set canvas dimensions to match video
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Draw the current video frame to the canvas
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error("Could not get canvas context");
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert the canvas to blob and send the message
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/jpeg", 0.95);
        });
        
        if (!blob) {
          throw new Error("Failed to create image blob");
        }
        
        // Create a File object from the blob
        const file = new File([blob], "auto-emotion-capture.jpg", { type: "image/jpeg" });
        
        // Create a URL for preview
        const imageUrl = URL.createObjectURL(blob);
        
        // Update the last user message to show it has an image
        setChatMessages(prevMessages => {
          const newMessages = [...prevMessages];
          // Find the last user message and update it
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === 'user' && newMessages[i].pendingImage) {
              newMessages[i].hasImage = true;
              newMessages[i].pendingImage = false;
              newMessages[i].imageUrl = imageUrl;  // Add the image URL right away
              break;
            }
          }
          return newMessages;
        });
        
        // Clean up the camera stream
        cleanupCameraStream();
        
        // Send the message with the captured image
        await sendMessageWithImage(messageText, file);
      } else {
        throw new Error("Video element not found");
      }
    } catch (error) {
      console.error("Error in auto-capture:", error);
      handleCaptureFailed(error instanceof Error ? error.message : "Unknown error", messageText);
    }
  };

  // Improved error handling that passes the message text
  const handleCaptureFailed = (errorMessage: string, messageText: string) => {
    console.error(`Auto-capture failed: ${errorMessage}`);
    
    toast({
      title: "Photo Capture Failed",
      description: `${errorMessage}. Sending message without photo.`,
      variant: "destructive",
    });
    
    cleanupCameraStream();
    
    // Update UI to remove pending state
    setChatMessages(prevMessages => {
      const newMessages = [...prevMessages];
      // Find the last user message and update it
      for (let i = newMessages.length - 1; i >= 0; i--) {
        if (newMessages[i].role === 'user' && newMessages[i].pendingImage) {
          newMessages[i].pendingImage = false;
          break;
        }
      }
      return newMessages;
    });
    
    // Still send the message, just without the image
    sendMessageWithImage(messageText, null);
  };

  // Improved sendMessageWithImage function with retry handling for rate limits
  const sendMessageWithImage = async (messageText: string, imageFile: File | null) => {
    setLoading(true);
    
    try {
      // Convert messages to the format expected by the API
      const apiMessages = chatMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Add enhanced special instructions for the AI to check for inconsistencies 
      // between the text and facial expression
      if (imageFile) {
        apiMessages.push({
          role: "system",
          content: `For this message, the user has shared both text and a facial image. 
            The user's message was: "${messageText}"
            
            IMPORTANT INSTRUCTIONS FOR EMOTIONAL ANALYSIS:
            
            1. Carefully analyze the user's facial expression, looking for signs of:
               - Sadness (downturned mouth, drooping eyelids, furrowed brow)
               - Anxiety (tense features, worried eyes, tight jaw)
               - Fatigue (dark circles, slow blinking, lack of energy)
               - Forced happiness (smile that doesn't reach the eyes)
               - Emotional flatness (blank expression, minimal movement)
            
            2. Compare these visual cues with the emotional tone of their text message
            
            3. Be particularly vigilant if:
               - They claim to be "fine" or "okay" but look troubled
               - They minimize problems while showing signs of distress
               - Their emotional expression doesn't match their words
               - They use positive language but appear exhausted or sad
            
            4. When you detect such inconsistencies (and assume they often exist),
               gently acknowledge this in your response without directly stating
               you're analyzing their photo. Use phrases like:
               
               "I sense there might be more to what you're feeling..."
               "I'm noticing some additional emotions that might be worth exploring..."
               "Your experience seems more complex than words alone can express..."
               
            Aim to create a safe space for them to express their true feelings.`
        });
      }
      
      // Send message and image to the mental health service
      let response;
      try {
        response = await azureAIServices.mentalHealth.continueConversation(
          apiMessages, 
          imageFile
        );
      } catch (error) {
        // For rate limiting errors, show a special message and add a placeholder response
        if (error instanceof Error && (error.message.includes('429') || error.message.includes('529'))) {
          // Set a cooldown period of 10 seconds
          setIsRateLimited(true);
          setRateLimitCooldown(10);
          
          // Start countdown timer
          if (rateLimitTimerRef.current) {
            clearInterval(rateLimitTimerRef.current);
          }
          
          rateLimitTimerRef.current = setInterval(() => {
            setRateLimitCooldown(prev => {
              if (prev <= 1) {
                clearInterval(rateLimitTimerRef.current!);
                setIsRateLimited(false);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          // Add a placeholder assistant message to maintain conversation flow
          setChatMessages(prevMessages => [
            ...prevMessages,
            {
              role: "assistant",
              content: "I apologize, but our service is experiencing high demand right now. Please wait about 10 seconds before sending another message. Your previous message has been received, but we need to space out requests to the AI service.",
              timestamp: new Date(),
            }
          ]);
          
          // Re-throw to be caught by outer catch
          throw error;
        }
        // For other errors, re-throw to be caught by outer catch
        throw error;
      }
      
      // If we have a valid image, update the last user message with the image URL
      if (imageFile && response.imageUrl) {
        setChatMessages(prevMessages => {
          const newMessages = [...prevMessages];
          // Find the last user message with pendingImage or hasImage
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].role === 'user' && (newMessages[i].pendingImage || newMessages[i].hasImage)) {
              newMessages[i].imageUrl = response.imageUrl;
              newMessages[i].hasImage = true;
              newMessages[i].pendingImage = false;
              break;
            }
          }
          return newMessages;
        });
      }
      
      // Add assistant's response to chat
      const assistantResponse = response.message;
      setChatMessages(prevMessages => [
        ...prevMessages,
        {
          role: "assistant",
          content: assistantResponse,
          timestamp: new Date(),
        }
      ]);
      
      // If speech is enabled, set the message to be spoken
      if (useSpeech) {
        setActiveAudioMessage(assistantResponse);
      }
      
      // Clear any uploaded image after sending
      setChatImage(null);
      setChatImagePreview(null);
      
    } catch (error) {
      console.error("Error in mental health conversation:", error);
      
      // We already handle rate limiting in the service, so we only need to handle other errors here
      if (!(error instanceof Error && (error.message.includes('429') || error.message.includes('529')))) {
        toast({
          title: "Conversation Error",
          description: "There was an error processing your message. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setPendingMessage("");
    }
  };

  // Improved cleanup function
  const cleanupCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsAutoCaptureInProgress(false);
  };

  // Image upload handling
  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setChatImage(file);
      setChatImagePreview(URL.createObjectURL(file));
    }
  };

  const openChatFileSelector = () => {
    if (chatImageFileRef.current) {
      chatImageFileRef.current.click();
    }
  };

  // Camera functionality
  const openCamera = async () => {
    try {
      // Clear any previous error
      setCameraError(null);

      // Close any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => stop());
      }
      
      // Reset video ready state
      setIsVideoReady(false);
      
      // Set a timeout to detect if camera initialization stalls
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      timeoutRef.current = setTimeout(() => {
        console.warn("Camera initialization timeout");
        if (!isVideoReady && isCameraOpen) {
          setCameraError("Camera initialization timed out. Please try again or use image upload instead.");
        }
      }, 10000); // 10 second timeout
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: "user", // Use front camera for mental health assessment
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      console.log("Camera stream obtained successfully");
      streamRef.current = stream;
      
      // Set camera open state first, ensuring dialog is open for video element to be available
      setIsCameraOpen(true);
      
      // Use a small timeout to ensure the video element is rendered in the DOM
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Setting video srcObject and attempting to play");
          videoRef.current.srcObject = stream;
          
          const playPromise = videoRef.current.play();
          
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Video playing successfully");
              })
              .catch(err => {
                console.error("Error playing video:", err);
                // Try manual initialization if autoplay fails
                manuallyInitializeVideo();
              });
          } else {
            // Older browsers might not return a promise
            console.log("Video play() did not return a promise, checking state manually");
            // Check video state after a short delay
            setTimeout(checkVideoState, 1000);
          }
        } else {
          console.error("Video element ref is null");
          setCameraError("Could not access video element. Please try again.");
        }
      }, 100);
      
    } catch (error) {
      console.error("Error accessing camera:", error);
      setCameraError("Unable to access camera. Please check your camera permissions.");
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check your camera permissions.",
        variant: "destructive",
      });
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };
  
  // Function to manually check if video is playing
  const checkVideoState = () => {
    if (videoRef.current) {
      if (videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or better
        console.log("Video has enough data to play");
        handleVideoReady();
      } else {
        console.log("Video not ready yet, rechecking...");
        setTimeout(checkVideoState, 500);
      }
    }
  };
  
  // Function to manually initialize video if autoplay fails
  const manuallyInitializeVideo = () => {
    console.log("Attempting manual video initialization");
    if (videoRef.current && streamRef.current) {
      // Re-assign the stream
      videoRef.current.srcObject = null;
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.muted = true;
          videoRef.current.setAttribute('playsinline', 'true');
          videoRef.current.setAttribute('autoplay', 'true');
          
          // Add click-to-play instructions if all else fails
          setCameraError("Please tap on the video to start the camera");
          
          // Add click handler to start video
          const handleVideoClick = () => {
            videoRef.current?.play()
              .then(() => {
                console.log("Video started on click");
                setCameraError(null);
                handleVideoReady();
              })
              .catch(err => {
                console.error("Failed to play on click:", err);
              });
          };
          
          videoRef.current.addEventListener('click', handleVideoClick);
          
          // Check if video starts playing without click
          setTimeout(checkVideoState, 1000);
        }
      }, 100);
    }
  };

  // Handle video ready state
  const handleVideoReady = () => {
    console.log("Video is ready for capture");
    setIsVideoReady(true);
    setCameraError(null);
    
    // Clear timeout when video is ready
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  // Function to close camera
  const closeCamera = () => {
    console.log("Closing camera");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setIsCameraOpen(false);
    setIsVideoReady(false);
    setCameraError(null);
  };

  // Function to capture photo
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast({
        title: "Capture Error",
        description: "Video or canvas element not found.",
        variant: "destructive",
      });
      return;
    }
    
    if (!isVideoReady) {
      toast({
        title: "Camera Not Ready",
        description: "Please wait for the camera to initialize fully.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      
      // Draw the current video frame to the canvas
      const context = canvas.getContext('2d');
      if (!context) {
        throw new Error("Could not get canvas context");
      }
      
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert the canvas to blob/file
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a File object from the blob
          const file = new File([blob], "mental-health-capture.jpg", { type: "image/jpeg" });
          
          // Update state with the file
          setChatImage(file);
          setChatImagePreview(URL.createObjectURL(blob));
          
          // Close the camera
          closeCamera();
          
          toast({
            title: "Photo Captured",
            description: "The photo has been captured and is ready to be sent.",
          });
        } else {
          throw new Error("Failed to create image blob");
        }
      }, "image/jpeg", 0.95);
    } catch (error) {
      console.error("Error capturing photo:", error);
      toast({
        title: "Capture Failed",
        description: "Unable to capture photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (rateLimitTimerRef.current) {
        clearInterval(rateLimitTimerRef.current);
      }
    };
  }, []);

  // Handle speech input from user
  const handleSpeechInput = (text: string) => {
    if (text.trim()) {
      setCurrentMessage(text);
    }
  };

  // Add this new function to handle image expansion
  const handleImageClick = (imageSrc: string) => {
    setExpandedImage(imageSrc);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-7xl font-bold mb-4 text-gray-900 dark:text-gray-50">सह-<span className="text-yellow-500">AI</span>-यक</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
            Because mental health matters—<span className="text-yellow-500 font-bold">let's talk!</span>
          </p>
          <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-gray-50 flex items-center justify-center gap-2">
            <HeartPulseIcon className="h-8 w-8 text-red-500" />
            Mental Health Assistant
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Have a supportive conversation with our AI assistant that can help assess your mental well-being.
          </p>
        </div>

        {!isStarted ? (
          <Card className="max-w-2xl mx-auto backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle>Mental Health Check-In</CardTitle>
              <CardDescription>
                Start a conversation with our AI assistant to discuss your mental well-being. This assistant can provide initial assessment and wellness advice.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This assistant uses Azure AI services to provide a supportive conversation about your mental health. It can:
                </p>
                <ul className="list-disc pl-5 text-sm text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Ask questions about how you're feeling</li>
                  <li>Provide initial assessment of your emotional state</li>
                  <li>Suggest coping strategies and mindfulness techniques</li>
                  <li>Analyze facial expressions and emotional cues from photos</li>
                </ul>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md border border-blue-200 dark:border-blue-900 mt-4">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Sharing Photos Improves Analysis</p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    For more accurate emotional assessment, try sharing a photo of yourself along with your messages. 
                    This helps the assistant better understand your emotional state.
                  </p>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-md border border-amber-200 dark:border-amber-900">
                  <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">Important Notice</p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    This AI assistant is not a replacement for professional mental health services. 
                    If you're experiencing a mental health crisis, please contact a qualified healthcare provider or emergency services.
                  </p>
                </div>
                {/* Replace avatar toggle with speech toggle */}
                <div className="flex items-center space-x-2 mt-3">
                  <Switch 
                    id="speech-mode" 
                    checked={useSpeech} 
                    onCheckedChange={setUseSpeech} 
                  />
                  <Label htmlFor="speech-mode">Enable voice responses</Label>
                </div>
                
                {/* Voice selection if enabled */}
                {useSpeech && (
                  <div className="mt-1">
                    <Label htmlFor="voice-selection" className="text-sm block mb-1">Select voice:</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "en-US-JennyMultilingualNeural", name: "Jenny (Female)" },
                        { id: "en-US-GuyMultilingualNeural", name: "Guy (Male)" }
                      ].map(voice => (
                        <Button 
                          key={voice.id}
                          variant={selectedVoice === voice.id ? "default" : "outline"}
                          className="text-xs py-1 h-auto"
                          onClick={() => setSelectedVoice(voice.id)}
                        >
                          {voice.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={startChat} 
                disabled={loading} 
                className="w-full"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Initializing Assistant...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <ArrowRightIcon className="h-4 w-4" />
                    Start Conversation
                  </span>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <Card className="max-w-4xl mx-auto backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700 shadow-lg">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Mental Health Assessment</CardTitle>
                  <CardDescription>
                    Chat with our AI assistant about how you're feeling. Photos are analyzed to detect potential inconsistencies between your expressions and words.
                  </CardDescription>
                </div>
                {isAutoCaptureInProgress && (
                  <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-900/50 px-3 py-1 rounded-full text-xs text-amber-800 dark:text-amber-200 animate-pulse">
                    <CameraIcon className="h-3 w-3" />
                    <span>Capturing photo...</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Hidden video and canvas elements for auto-capture */}
              <div className="hidden">
                <video ref={videoRef} autoPlay playsInline muted />
                <canvas ref={canvasRef} />
              </div>
              
              {/* Speech playback when active */}
              {useSpeech && activeAudioMessage && (
                <div className="mb-4">
                  <SpeechPlayback 
                    text={activeAudioMessage}
                    voice={selectedVoice}
                    autoPlay={true}
                    onComplete={() => setActiveAudioMessage(null)}
                  />
                </div>
              )}
              
              {/* Chat Messages Display - Updated with loading indicators */}
              <div className="h-[400px] overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-4">
                {chatMessages.map((message, index) => (
                  <div 
                    key={index} 
                    className={`mb-4 ${
                      message.role === 'assistant' 
                        ? 'pl-2 border-l-2 border-primary' 
                        : 'pl-2 border-l-2 border-emerald-400 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-r-md'
                    }`}
                  >
                    <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
                      <div className="flex items-center">
                        {message.role === 'assistant' ? 'Mental Health Assistant' : 'You'} 
                        {message.timestamp && ` • ${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                        {message.hasImage && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                            <ImageIcon className="h-3 w-3 mr-1" />
                            Photo shared
                          </span>
                        )}
                        {message.pendingImage && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 animate-pulse">
                            <CameraIcon className="h-3 w-3 mr-1" />
                            Taking photo...
                          </span>
                        )}
                      </div>
                      
                      {/* Add speak button for assistant messages */}
                      {useSpeech && message.role === 'assistant' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6"
                          onClick={() => setActiveAudioMessage(message.content)}
                        >
                          <Volume2Icon className="h-3 w-3 mr-1" />
                          <span className="text-xs">Speak</span>
                        </Button>
                      )}
                    </div>
                    <div className="text-sm whitespace-pre-wrap font-medium relative">
                      {message.content}
                      
                      {/* Add speaking animation indicator */}
                      {message.role === 'assistant' && activeAudioMessage === message.content && (
                        <div className="absolute top-0 -left-4 flex items-end space-x-px h-5 opacity-70">
                          <div className="w-1 bg-primary rounded-full animate-sound-wave-1"></div>
                          <div className="w-1 bg-primary rounded-full animate-sound-wave-2"></div>
                          <div className="w-1 bg-primary rounded-full animate-sound-wave-3"></div>
                        </div>
                      )}
                    </div>
                    
                    {/* Add image thumbnail if this message has an associated image */}
                    {message.hasImage && message.role === 'user' && message.imageUrl && (
                      <div 
                        className="mt-2 w-20 h-20 rounded overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => handleImageClick(message.imageUrl || '')}
                      >
                        <div className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs text-gray-500">
                          <img 
                            src={message.imageUrl} 
                            alt="Shared" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If the image fails to load, show a placeholder
                              (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {loading && (
                  <div className="flex items-center pl-2 border-l-2 border-primary animate-pulse">
                    <div className="text-xs text-gray-500">Assistant is analyzing...</div>
                  </div>
                )}
                {isAutoCaptureInProgress && (
                  <div className="flex justify-center my-2">
                    <div className="flex flex-col items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-full">
                      <div className="flex gap-2 items-center">
                        <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xs text-blue-600 dark:text-blue-300">
                          Capturing your photo...
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Enhanced image preview with loading indicator */}
              
              {/* Speech Toggle and Voice Selection */}
              {!activeAudioMessage && (
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="speech-toggle"
                      checked={useSpeech}
                      onCheckedChange={setUseSpeech}
                      size="sm"
                    />
                    <Label htmlFor="speech-toggle" className="text-xs">Voice responses</Label>
                  </div>
                  
                  {useSpeech && (
                    <div className="flex gap-1">
                      {[
                        { id: "en-US-JennyMultilingualNeural", name: "Jenny" },
                        { id: "en-US-GuyMultilingualNeural", name: "Guy" }
                      ].map(voice => (
                        <Button 
                          key={voice.id}
                          variant={selectedVoice === voice.id ? "default" : "outline"}
                          size="sm"
                          className="text-xs py-0 h-6"
                          onClick={() => setSelectedVoice(voice.id)}
                        >
                          {voice.name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Input Area with Speech-to-Text */}
              <div className="flex items-end gap-2">
                <div className="flex-1 flex flex-col gap-1">
                  <Textarea
                    placeholder={
                      isAutoCaptureInProgress 
                        ? "Taking your photo... Please wait..." 
                        : loading 
                          ? "Processing your message..." 
                          : "Type your message here..."
                    }
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    className="flex-1 min-h-[80px] resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading || isAutoCaptureInProgress}
                  />
                  <div className="text-xs text-gray-500">
                    {chatImage 
                      ? "A photo is already attached to this message" 
                      : isAutoCaptureInProgress
                        ? "Taking your photo to analyze with your message..."
                        : "A photo will be captured automatically when you send a message"}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <SpeechInput
                    onSpeechResult={handleSpeechInput}
                    isDisabled={loading || isAutoCaptureInProgress}
                  />
                  <Button 
                    type="button" 
                    size="icon"
                    variant="outline"
                    onClick={openChatFileSelector}
                    title="Upload Custom Image"
                    disabled={loading || isAutoCaptureInProgress}
                  >
                    <UploadIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    size="icon"
                    variant="outline"
                    onClick={openCamera}
                    title="Take Custom Photo"
                    disabled={loading || isAutoCaptureInProgress}
                  >
                    <CameraIcon className="h-4 w-4" />
                  </Button>
                  <Button 
                    type="button" 
                    size="icon"
                    onClick={sendMessage}
                    disabled={loading || isAutoCaptureInProgress || !currentMessage.trim()}
                    title={
                      loading 
                        ? "Processing..." 
                        : isAutoCaptureInProgress 
                          ? "Taking photo..." 
                          : "Send Message"
                    }
                  >
                    {loading || isAutoCaptureInProgress ? (
                      <div className="relative">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {isAutoCaptureInProgress && (
                          <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                          </span>
                        )}
                      </div>
                    ) : (
                      <ArrowRightIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <input
                  type="file"
                  ref={chatImageFileRef}
                  onChange={handleChatImageSelect}
                  accept="image/*"
                  className="hidden"
                />
              </div>
              
              {/* Updated disclaimer to better explain the emotion analysis */}
              <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 italic border-t pt-4 border-gray-200 dark:border-gray-700">
                <p>
                  <strong>Note:</strong> This AI assistant is not a substitute for professional mental health care. 
                  For serious concerns, please consult a qualified healthcare provider or emergency services.
                </p>
                <p className="mt-1">
                  Your conversation is processed by Azure AI services to provide personalized support. 
                  Photos are automatically captured with each message for thorough facial expression analysis.
                  The assistant is designed to detect potential discrepancies between your words and emotional state,
                  helping provide more accurate emotional support.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
            <DialogDescription>
              Photos can help the assistant better understand your current emotional state.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              onCanPlay={handleVideoReady}
              onClick={() => {
                // Attempt to play on click for mobile browsers
                if (!isVideoReady && videoRef.current) {
                  videoRef.current.play()
                    .then(() => console.log("Video started by click"))
                    .catch(e => console.error("Click to play failed:", e));
                }
              }}
              className="w-full rounded-md overflow-hidden bg-gray-900"
              style={{ maxHeight: "60vh", minHeight: "200px" }}
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera status indicator */}
            {!isVideoReady && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                <div className="flex flex-col items-center text-center p-4">
                  <svg className="animate-spin h-8 w-8 text-white mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-white">Initializing camera...</p>
                  {cameraError && (
                    <p className="mt-2 text-red-300 text-sm">{cameraError}</p>
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex justify-between items-center">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeCamera}
              className="flex items-center gap-2"
            >
              <XIcon className="h-4 w-4" />
              Cancel
            </Button>
            <Button 
              type="button" 
              onClick={capturePhoto}
              disabled={!isVideoReady}
              className="flex items-center gap-2"
            >
              <CameraIcon className="h-4 w-4" />
              Capture
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image preview modal */}
      <Dialog open={!!expandedImage} onOpenChange={(open) => !open && setExpandedImage(null)}>
        <DialogContent className="sm:max-w-lg p-1">
          <div className="relative">
            <img 
              src={expandedImage || ''} 
              alt="Enlarged" 
              className="w-full rounded"
              onError={(e) => {
                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23cccccc' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
              }}
            />
            <Button 
              className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-black/70"
              size="icon"
              variant="ghost"
              onClick={() => setExpandedImage(null)}
            >
              <XIcon className="h-4 w-4 text-white" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Chat;
