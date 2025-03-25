import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MicIcon, ImageIcon, FileTextIcon, GlobeIcon, BrainIcon, CheckIcon, UploadIcon, ShieldCheckIcon, SparklesIcon, CameraIcon, XIcon } from "lucide-react";
import { azureAIServices } from "@/services/azure-ai";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const Index = () => {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentUrl, setDocumentUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [gptModel, setGptModel] = useState<"gpt-35-turbo" | "gpt-4">("gpt-35-turbo");
  const [imagePrompt, setImagePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isApiValid, setIsApiValid] = useState<boolean | null>(null);
  const { toast } = useToast();
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isMentalHealthMode, setIsMentalHealthMode] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{role: string, content: string, timestamp?: Date}>>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [chatImage, setChatImage] = useState<File | null>(null);
  const [chatImagePreview, setChatImagePreview] = useState<string | null>(null);
  const [isChatCameraOpen, setIsChatCameraOpen] = useState(false);
  const chatImageFileRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const verifyApiConnection = async () => {
    setVerifying(true);
    try {
      const isValid = await azureAIServices.validateApiConnection();
      setIsApiValid(isValid);
    } catch (error) {
      console.error("Connection verification error:", error);
      setIsApiValid(false);
    } finally {
      setVerifying(false);
    }
  };

  // Attempt to verify connection once on component mount
  useEffect(() => {
    verifyApiConnection();
  }, []);

  const analyzeText = async () => {
    if (!text) {
      toast({
        title: "Error",
        description: "Please enter some text to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const sentimentResult = await azureAIServices.language.analyzeSentiment(text);
      setResult(sentimentResult);
      toast({
        title: "Analysis Complete",
        description: "Text sentiment analysis finished successfully",
      });
    } catch (error) {
      console.error("Error analyzing text:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the text. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create a preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(previewUrl);
      
      // Clear the URL input since we're using a file now
      setImageUrl("");
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const analyzeImage = async () => {
    if (!imageFile && !imageUrl) {
      toast({
        title: "Error",
        description: "Please upload an image or enter an image URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      let analysisResult;
      
      if (imageFile) {
        // Use the combined sentiment + vision analysis
        analysisResult = await azureAIServices.imageAnalysis.analyzeImageSentiment(imageFile);
      } else if (imageUrl) {
        // Use the combined sentiment + vision analysis
        analysisResult = await azureAIServices.imageAnalysis.analyzeImageSentiment(imageUrl);
      }
      
      setResult(analysisResult);
      
      toast({
        title: "Analysis Complete",
        description: "Image and sentiment analysis finished successfully",
      });
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeDocument = async () => {
    if (!documentUrl) {
      toast({
        title: "Error",
        description: "Please enter a document URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const docResult = await azureAIServices.documentIntelligence.analyzeDocument(documentUrl);
      setResult(docResult);
      toast({
        title: "Analysis Complete",
        description: "Document analysis finished successfully",
      });
    } catch (error) {
      console.error("Error analyzing document:", error);
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing the document. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateGptResponse = async () => {
    if (!prompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt for GPT",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const gptResult = await azureAIServices.gpt.chat(prompt, gptModel);
      setResult(gptResult);
      toast({
        title: "GPT Response Complete",
        description: `${gptModel} generated a response successfully`,
      });
    } catch (error) {
      console.error("Error generating GPT response:", error);
      toast({
        title: "GPT Response Failed",
        description: "There was an error generating the response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!imagePrompt) {
      toast({
        title: "Error",
        description: "Please enter a prompt for image generation",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const imageResult = await azureAIServices.gpt.generateImage(imagePrompt);
      setResult(imageResult);
      toast({
        title: "Image Generation Complete",
        description: "DALL-E generated an image successfully",
      });
    } catch (error) {
      console.error("Error generating image:", error);
      toast({
        title: "Image Generation Failed",
        description: "There was an error generating the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = () => {
    switch (activeTab) {
      case "text":
        analyzeText();
        break;
      case "image":
        analyzeImage();
        break;
      case "document":
        analyzeDocument();
        break;
      case "gpt":
        handleGptSubmit();
        break;
      case "dalle":
        generateImage();
        break;
      default:
        break;
    }
  };

  // Function to open camera
  const openCamera = async () => {
    try {
      // Clear any previous error
      setCameraError(null);

      // Close any existing stream first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
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
          facingMode: "environment",
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
          const file = new File([blob], "camera-capture.jpg", { type: "image/jpeg" });
          
          // Update state with the file
          setImageFile(file);
          setImagePreviewUrl(URL.createObjectURL(blob));
          setImageUrl("");
          
          // Close the camera
          closeCamera();
          
          toast({
            title: "Photo Captured",
            description: "The photo has been captured and is ready for analysis.",
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

  // Clean up camera resources when component unmounts
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Start mental health assessment mode
  const startMentalHealthMode = async () => {
    setLoading(true);
    try {
      const initialResponse = await azureAIServices.mentalHealth.startConversation();
      
      // Initialize chat with the assistant's greeting
      setChatMessages([
        {
          role: "assistant",
          content: initialResponse.messages[0].content,
          timestamp: new Date(),
        }
      ]);
      
      setIsMentalHealthMode(true);
      setResult(null); // Clear any previous results
      
      toast({
        title: "Mental Health Assistant Activated",
        description: "You're now chatting with a mental health assessment AI. This is not a substitute for professional care.",
      });
    } catch (error) {
      console.error("Error starting mental health mode:", error);
      toast({
        title: "Service Error",
        description: "Could not start the mental health assistant. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Send a message in the mental health chat
  const sendMessage = async () => {
    if (!currentMessage.trim() && !chatImage) {
      toast({
        title: "Empty Message",
        description: "Please enter a message or share an image.",
        variant: "destructive",
      });
      return;
    }

    // Add user message to chat
    const userMessage = {
      role: "user",
      content: currentMessage.trim(),
      timestamp: new Date(),
    };
    
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    setCurrentMessage("");
    
    // Indicate loading state
    setLoading(true);
    
    try {
      // Convert messages to the format expected by the API
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Send message and image (if any) to the mental health service
      const response = await azureAIServices.mentalHealth.continueConversation(
        apiMessages, 
        chatImage
      );
      
      // Add assistant's response to chat
      setChatMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: response.message,
          timestamp: new Date(),
        }
      ]);
      
      // Clear any uploaded image after sending
      setChatImage(null);
      setChatImagePreview(null);
      
    } catch (error) {
      console.error("Error in mental health conversation:", error);
      toast({
        title: "Conversation Error",
        description: "There was an error processing your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle chat file selection
  const handleChatImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setChatImage(file);
      setChatImagePreview(URL.createObjectURL(file));
    }
  };

  // Open file selector for chat
  const openChatFileSelector = () => {
    if (chatImageFileRef.current) {
      chatImageFileRef.current.click();
    }
  };
  
  // Function to open camera for chat
  const openChatCamera = () => {
    setIsChatCameraOpen(true);
  };
  
  // Function to capture photo for chat
  const captureChatPhoto = () => {
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
          const file = new File([blob], "chat-camera-capture.jpg", { type: "image/jpeg" });
          
          // Update state with the file
          setChatImage(file);
          setChatImagePreview(URL.createObjectURL(blob));
          
          // Close the camera
          closeCamera();
          setIsChatCameraOpen(false);
          
          toast({
            title: "Photo Captured",
            description: "The photo has been captured and is ready to send with your message.",
          });
        } else {
          throw new Error("Failed to create image blob");
        }
      }, "image/jpeg", 0.95);
    } catch (error) {
      console.error("Error capturing photo for chat:", error);
      toast({
        title: "Capture Failed",
        description: "Unable to capture photo. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Scroll to bottom of messages when chat updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // Add a separate function for the GPT analyze button click
  const handleGptSubmit = () => {
    if (isMentalHealthMode) {
      sendMessage();
    } else {
      generateGptResponse();
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
          <h1 className="text-7xl font-bold mb-4 text-gray-900 dark:text-gray-50">सह-<span className="text-yellow-500">AI</span>-यक</h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10">
          Because mental health matters—<span className="text-yellow-500 font-bold">let's talk!</span></p>

            
           
            
            
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {/* Input Card */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Input</CardTitle>
                <CardDescription>
                  Select the type of content you want to analyze using Azure AI services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="text" onValueChange={setActiveTab} value={activeTab}>
                  <TabsList className="grid grid-cols-5 mb-4">
                    <TabsTrigger value="text" className="flex items-center gap-2">
                      <BrainIcon className="h-4 w-4" />
                      <span>Text</span>
                    </TabsTrigger>
                    <TabsTrigger value="image" className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      <span>Image</span>
                    </TabsTrigger>
                    <TabsTrigger value="document" className="flex items-center gap-2">
                      <FileTextIcon className="h-4 w-4" />
                      <span>Document</span>
                    </TabsTrigger>
                    <TabsTrigger value="gpt" className="flex items-center gap-2">
                      <SparklesIcon className="h-4 w-4" />
                      <span>GPT</span>
                    </TabsTrigger>
                    <TabsTrigger value="dalle" className="flex items-center gap-2">
                      <GlobeIcon className="h-4 w-4" />
                      <span>DALL-E</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-4">
                    <Textarea
                      placeholder="Enter text to analyze sentiment, extract key phrases, or recognize entities..."
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </TabsContent>

                  <TabsContent value="image" className="space-y-4">
                    <div className="space-y-4">
                      {/* Updated image input options with camera button */}
                      <div className="flex flex-col space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex gap-2">
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={openFileSelector}
                              className="flex items-center gap-2"
                            >
                              <UploadIcon className="h-4 w-4" />
                              Upload
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={openCamera}
                              className="flex items-center gap-2"
                            >
                              <CameraIcon className="h-4 w-4" />
                              Camera
                            </Button>
                          </div>
                          <span className="text-sm text-gray-500">or</span>
                          <Input
                            placeholder="Enter image URL..."
                            value={imageUrl}
                            onChange={(e) => {
                              setImageUrl(e.target.value);
                              setImageFile(null);
                              setImagePreviewUrl(null);
                            }}
                            className="flex-1"
                          />
                        </div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>
                      
                      {/* Image preview */}
                      {(imagePreviewUrl || imageUrl) && (
                        <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                          <img 
                            src={imagePreviewUrl || imageUrl} 
                            alt="Preview" 
                            className="max-h-[200px] w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "https://placehold.co/600x400?text=Image+Preview+Error";
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="document" className="space-y-4">
                    <Input
                      placeholder="Enter document URL for analysis (PDF, DOCX, etc.)..."
                      value={documentUrl}
                      onChange={(e) => setDocumentUrl(e.target.value)}
                    />
                  </TabsContent>

                  <TabsContent value="gpt" className="space-y-4">
                    <div className="space-y-4">
                      {/* Mental Health Mode Toggle or Start Button */}
                      <div className="flex justify-between items-center">
                        <Select value={gptModel} onValueChange={(value: "gpt-35-turbo" | "gpt-4") => setGptModel(value)}>
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select GPT Model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gpt-35-turbo">GPT-3.5 Turbo</SelectItem>
                            <SelectItem value="gpt-4">GPT-4</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {!isMentalHealthMode ? (
                          <Button
                            variant="outline"
                            onClick={startMentalHealthMode}
                            className="flex items-center gap-2"
                          >
                            <SparklesIcon className="h-4 w-4" />
                            Start Mental Health Assessment
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsMentalHealthMode(false);
                              setChatMessages([]);
                              setChatImage(null);
                              setChatImagePreview(null);
                            }}
                            className="flex items-center gap-2"
                          >
                            <XIcon className="h-4 w-4" />
                            Exit Assessment Mode
                          </Button>
                        )}
                      </div>
                      
                      {isMentalHealthMode ? (
                        /* Mental Health Chat Interface */
                        <div className="flex flex-col h-[400px]">
                          {/* Chat Messages Area */}
                          <div className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-800 rounded-md p-4 mb-4">
                            {chatMessages.map((message, index) => (
                              <div 
                                key={index} 
                                className={`mb-4 ${message.role === 'assistant' ? 'pl-2 border-l-2 border-primary' : 'pl-2 border-l-2 border-gray-300'}`}
                              >
                                <div className="text-xs text-gray-500 mb-1">
                                  {message.role === 'assistant' ? 'AI Assistant' : 'You'} 
                                  {message.timestamp && ` • ${message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                                </div>
                                <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                              </div>
                            ))}
                            {loading && (
                              <div className="flex items-center pl-2 border-l-2 border-primary animate-pulse">
                                <div className="text-xs text-gray-500">AI Assistant is typing...</div>
                              </div>
                            )}
                            <div ref={messagesEndRef} />
                          </div>
                          
                          {/* Image Preview (if any) */}
                          {chatImagePreview && (
                            <div className="relative mb-2">
                              <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[100px]">
                                <img 
                                  src={chatImagePreview} 
                                  alt="Preview" 
                                  className="max-h-[100px] w-auto"
                                />
                                <button
                                  onClick={() => {
                                    setChatImage(null);
                                    setChatImagePreview(null);
                                  }}
                                  className="absolute top-1 right-1 bg-gray-800/70 text-white rounded-full p-1"
                                >
                                  <XIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Message Input Area */}
                          <div className="flex items-end gap-2">
                            <Textarea
                              placeholder="Type your message here..."
                              value={currentMessage}
                              onChange={(e) => setCurrentMessage(e.target.value)}
                              className="flex-1 min-h-[80px] resize-none"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  sendMessage();
                                }
                              }}
                            />
                            <div className="flex flex-col gap-2">
                              <Button 
                                type="button" 
                                size="icon"
                                variant="outline"
                                onClick={openChatFileSelector}
                                title="Upload Image"
                              >
                                <UploadIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button" 
                                size="icon"
                                variant="outline"
                                onClick={openChatCamera}
                                title="Take Photo"
                              >
                                <CameraIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                type="button" 
                                size="icon"
                                onClick={sendMessage}
                                disabled={loading || (!currentMessage.trim() && !chatImage)}
                                title="Send Message"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <line x1="22" y1="2" x2="11" y2="13"></line>
                                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                                </svg>
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
                          
                          {/* Disclaimer */}
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">
                            Note: This AI assistant is not a substitute for professional mental health care. 
                            For serious concerns, please consult a qualified healthcare provider.
                          </div>
                        </div>
                      ) : (
                        /* Standard GPT Interface */
                        <Textarea
                          placeholder="Enter your prompt for GPT..."
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          className="min-h-[200px]"
                        />
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleAnalyze} 
                  disabled={loading || isApiValid === false} 
                  className="w-full"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {activeTab === 'gpt' ? (isMentalHealthMode ? 'Processing...' : 'Generating...') : activeTab === 'dalle' ? 'Creating Image...' : 'Analyzing...'}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <CheckIcon className="h-4 w-4" />
                      {activeTab === 'gpt' ? (isMentalHealthMode ? 'Send Message' : 'Generate with GPT') : activeTab === 'dalle' ? 'Create Image' : 'Analyze with Azure AI'}
                    </span>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {/* Results Card */}
            <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  The analysis results from Azure AI services will appear here
                </CardDescription>
              </CardHeader>
              <CardContent className="min-h-[200px] max-h-[500px] overflow-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center">
                      <svg className="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Processing your request...</p>
                    </div>
                  </div>
                ) : result ? (
                  activeTab === 'dalle' && result.data && result.data[0]?.url ? (
                    <div className="flex flex-col items-center">
                      <img 
                        src={result.data[0].url} 
                        alt="Generated image" 
                        className="max-w-full rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Generated image</p>
                    </div>
                  ) : activeTab === 'image' && result.sentiment ? (
                    <div className="space-y-4">
                      {/* Sentiment Analysis Section */}
                      <div className="p-4 border rounded-lg bg-white/50 dark:bg-gray-800/50">
                        <h3 className="text-lg font-medium mb-2">People Sentiment Analysis</h3>
                        <div className="whitespace-pre-wrap text-sm">
                          {typeof result.sentiment === 'string' 
                            ? result.sentiment
                            : JSON.stringify(JSON.parse(result.sentiment), null, 2)
                          }
                        </div>
                      </div>
                      
                      {/* Image Description Section */}
                      {result.visionAnalysis?.description?.captions && (
                        <div className="p-4 border rounded-lg bg-white/50 dark:bg-gray-800/50">
                          <h3 className="text-lg font-medium mb-2">Image Description</h3>
                          <p>{result.visionAnalysis.description.captions[0]?.text || "No description available"}</p>
                        </div>
                      )}
                      
                      {/* Full Analysis Section */}
                      <div className="mt-4">
                        <details>
                          <summary className="cursor-pointer text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            View Full Analysis
                          </summary>
                          <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto text-xs mt-2">
                            {JSON.stringify(result, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </div>
                  ) : (
                    <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-auto text-xs">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-4">
                    <div className="rounded-full bg-gray-100 dark:bg-gray-800 p-3 mb-4">
                      <UploadIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Results Yet</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Submit content for analysis to see Azure AI services in action
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

         {/* API Verification Section */}
         <div className="mt-6 flex justify-center">
              <Button 
                onClick={verifyApiConnection} 
                disabled={verifying}
                variant="outline" 
                className="flex items-center gap-2"
              >
                {verifying ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Verifying Connection...
                  </>
                ) : (
                  <>
                    <ShieldCheckIcon className="h-4 w-4" />
                    Verify Azure AI Connection
                  </>
                )}
              </Button>
            </div>
            {isApiValid !== null && (
  <div className="mt-2 flex justify-center">
    <Alert variant={isApiValid ? "default" : "destructive"} className="max-w-md text-center">
      <AlertTitle>
        {isApiValid 
          ? "Azure AI Connection Verified" 
          : "Azure AI Connection Failed"}
      </AlertTitle>
      <AlertDescription>
        {isApiValid 
          ? "Your Azure AI services configuration is valid." 
          : "Please check your Azure AI endpoint and API key configuration."}
      </AlertDescription>
    </Alert>
  </div>
)}

        </div>
      </div>

      {/* Camera Modal */}
      <Dialog open={isCameraOpen} onOpenChange={(open) => !open && closeCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take a Photo</DialogTitle>
            <DialogDescription>
              Point your camera at what you want to analyze.
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
    </>
  );
};

export default Index;
