
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MicIcon, ImageIcon, FileTextIcon, GlobeIcon, BrainIcon, CheckIcon, UploadIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";
import { azureAIServices } from "@/services/azure-ai";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Index = () => {
  const [activeTab, setActiveTab] = useState("text");
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [gptModel, setGptModel] = useState<"gpt-35-turbo" | "gpt-4">("gpt-35-turbo");
  const [imagePrompt, setImagePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isApiValid, setIsApiValid] = useState<boolean | null>(null);
  const { toast } = useToast();

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

  const analyzeImage = async () => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Please enter an image URL to analyze",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const visionResult = await azureAIServices.computerVision.analyzeImage(imageUrl);
      setResult(visionResult);
      toast({
        title: "Analysis Complete",
        description: "Image analysis finished successfully",
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
        generateGptResponse();
        break;
      case "dalle":
        generateImage();
        break;
      default:
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-gray-50">Azure AI Analysis Hub</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Harness the power of Azure AI services to analyze text, images, and documents
          </p>
          
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
            <div className="mt-2">
              <Alert variant={isApiValid ? "default" : "destructive"} className="max-w-md mx-auto">
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
                    <Input
                      placeholder="Enter image URL for analysis..."
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                    {imageUrl && (
                      <div className="relative mt-2 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img 
                          src={imageUrl} 
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
                    <Select value={gptModel} onValueChange={(value: "gpt-35-turbo" | "gpt-4") => setGptModel(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select GPT Model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-35-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      placeholder="Enter your prompt for GPT..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="dalle" className="space-y-4">
                  <Textarea
                    placeholder="Enter a detailed description of the image you want to generate..."
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="min-h-[200px]"
                  />
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
                    {activeTab === 'gpt' ? 'Generating...' : activeTab === 'dalle' ? 'Creating Image...' : 'Analyzing...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckIcon className="h-4 w-4" />
                    {activeTab === 'gpt' ? 'Generate with GPT' : activeTab === 'dalle' ? 'Create Image' : 'Analyze with Azure AI'}
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

        <div className="mt-8">
          <Alert>
            <AlertTitle>Azure AI Services Configuration</AlertTitle>
            <AlertDescription>
              This application uses Azure AI Cognitive Services and Azure OpenAI services to analyze and generate content.
              If you're experiencing issues, please verify that:
              <ul className="list-disc ml-5 mt-2">
                <li>Your Azure subscription is active</li>
                <li>The Azure Cognitive Services and Azure OpenAI resources are properly configured</li>
                <li>The API key is correct across all services</li>
                <li>The required services have the necessary model deployments</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
};

export default Index;
