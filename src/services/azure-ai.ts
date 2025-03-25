import { toast } from "sonner";

/**
 * Azure AI Services Integration
 * This file contains the services for connecting to Azure AI Services
 */

// The base endpoints for Azure services
const AZURE_COGNITIVE_ENDPOINT = "https://ai-aihackthonhub282549186415.cognitiveservices.azure.com/";
const AZURE_OPENAI_ENDPOINT = "https://ai-aihackthonhub282549186415.openai.azure.com/";
const AZURE_IITPHACKATHON_ENDPOINT = "https://ai-iitphackathon797339300099.openai.azure.com/";
const AZURE_SERVICES_ENDPOINT = "https://ai-iitphackathon797339300099.services.ai.azure.com/";
const AZURE_SPEECH_ENDPOINT = "https://eastus2.tts.speech.microsoft.com/"; // Add specific East US 2 speech endpoint

// API key - use the hardcoded value since we don't have environment variables set up
const API_KEY = "Fj1KPt7grC6bAkNja7daZUstpP8wZTXsV6Zjr2FOxkO7wsBQ5SzQJQQJ99BCACHYHv6XJ3w3AAAAACOGL3Xg";

// Headers for Azure Cognitive Services API requests
const getCognitiveHeaders = () => ({
  "Content-Type": "application/json",
  "Ocp-Apim-Subscription-Key": API_KEY,
});

// Modified getOpenAIHeaders to use "api-key" header for Azure OpenAI endpoints
const getOpenAIHeaders = () => ({
  "Content-Type": "application/json",
  "api-key": API_KEY,
});

/**
 * Validate API connection
 * Tests if the Azure API configuration is valid
 */
export const validateApiConnection = async () => {
  try {
    // Testing Computer Vision API as a representative endpoint
    const endpoint = `${AZURE_COGNITIVE_ENDPOINT}vision/v3.2/analyze?visualFeatures=Categories`;
    
    toast.info("Validating Azure AI Connection", { 
      description: "Testing connection to Azure Cognitive Services..." 
    });
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: getCognitiveHeaders(),
      body: JSON.stringify({ url: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSnM276EHEz7aTjjm1ec0VZRZ0rirSzZ2o3NA&s" }),
    });
    
    console.log("Validation response status:", response.status);
    
    if (response.ok || response.status === 200) {
      toast.success("Azure Connection Valid", { 
        description: "Successfully connected to Azure Cognitive Services" 
      });
      return true;
    } else {
      console.error("Validation response:", response.status, await response.text());
      toast.error("Azure Connection Invalid", { 
        description: `Status: ${response.status} - Check API key and endpoint` 
      });
      return false;
    }
  } catch (error) {
    console.error("Error validating API connection:", error);
    toast.error("Azure Connection Failed", { 
      description: "Check network and Azure service availability" 
    });
    return false;
  }
};

/**
 * Computer Vision Service
 * Analyze images for objects, tags, faces, adult content, etc.
 */
export const computerVisionService = {
  analyzeImage: async (imageInput: Blob | File | string) => {
    const endpoint = `${AZURE_COGNITIVE_ENDPOINT}vision/v3.2/analyze`;
    const params = new URLSearchParams({
      visualFeatures: "Categories,Tags,Description,Faces,Objects,Adult",
      language: "en",
    });

    try {
      console.log("Sending image analysis request to:", `${endpoint}?${params}`);
      
      let response;
      
      // Check if imageInput is a string (URL)
      if (typeof imageInput === 'string') {
        // If it's a URL, send it as JSON
        response = await fetch(`${endpoint}?${params}`, {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: imageInput }),
        });
      } else {
        // If it's a Blob or File, send as binary
        response = await fetch(`${endpoint}?${params}`, {
          method: "POST",
          headers: {
            "Ocp-Apim-Subscription-Key": API_KEY,
            "Content-Type": (imageInput as Blob).type || "application/octet-stream",
          },
          body: imageInput,
        });
      }

      console.log("Image analysis response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Computer Vision API error:", response.status, errorText);
        toast.error("Image Analysis Failed", {
          description: `Error: ${response.status} - ${response.statusText}`,
        });
        throw new Error(`Computer Vision API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast.error("Image Analysis Error", {
        description: "Unable to complete image analysis. Please check your connection and Azure service availability.",
      });
      throw error;
    }
  },
};

/**
 * Content Safety Service
 * Detect and moderate potentially harmful content
 */
export const contentSafetyService = {
  analyzeText: async (text: string) => {
    const endpoint = `${AZURE_COGNITIVE_ENDPOINT}contentsafety/text:analyze?api-version=2023-10-01`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getCognitiveHeaders(),
        body: JSON.stringify({
          text,
          categories: ["Hate", "SelfHarm", "Sexual", "Violence"],
        }),
      });

      if (!response.ok) {
        throw new Error(`Content Safety API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error analyzing content safety:", error);
      throw error;
    }
  },

  analyzeImage: async (image: Blob) => { // Changed parameter from imageUrl:string to image:Blob
    const endpoint = `${AZURE_COGNITIVE_ENDPOINT}contentsafety/image:analyze?api-version=2023-10-01`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": API_KEY,
          "Content-Type": image.type || "application/octet-stream"
        },
        body: image,
      });

      if (!response.ok) {
        throw new Error(`Content Safety API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error analyzing image safety:", error);
      throw error;
    }
  },
};

/**
 * Document Intelligence Service
 * Extract text, tables, and structure from documents
 */
export const documentIntelligenceService = {
  analyzeDocument: async (documentUrl: string) => {
    const endpoint = `${AZURE_COGNITIVE_ENDPOINT}formrecognizer/documentModels/prebuilt-layout:analyze?api-version=2023-07-31`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getCognitiveHeaders(),
        body: JSON.stringify({ urlSource: documentUrl }),
      });

      if (!response.ok) {
        throw new Error(`Document Intelligence API error: ${response.status}`);
      }

      // Get the operation ID from the response headers
      const operationLocation = response.headers.get("Operation-Location");
      if (!operationLocation) {
        throw new Error("Operation-Location header not found");
      }

      // Poll for the results
      return await pollForDocumentResults(operationLocation);
    } catch (error) {
      console.error("Error analyzing document:", error);
      throw error;
    }
  },
};

// Helper function to poll for document analysis results
const pollForDocumentResults = async (operationLocation: string) => {
  const headers = getCognitiveHeaders();
  let complete = false;
  let result = null;
  
  // Poll every 2 seconds until the operation is complete
  while (!complete) {
    const response = await fetch(operationLocation, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Document polling error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status === "succeeded") {
      complete = true;
      result = data;
    } else if (data.status === "failed") {
      throw new Error("Document analysis failed");
    } else {
      // Wait 2 seconds before polling again
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  return result;
};

/**
 * Language Service
 * Natural language processing, sentiment analysis, entity recognition, etc.
 */
export const languageService = {
  analyzeSentiment: async (text: string) => {
    // Use GPT-4 for sentiment analysis
    const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;

    try {
      console.log("Sending sentiment analysis request to:", endpoint);
      console.log("Request body:", {
        messages: [
          {
            role: "system",
            content: "You are an AI assistant that analyzes sentiment. Provide sentiment analysis for the following text, rating it as positive, negative, or neutral with a confidence score between 0 and 1."
          },
          {
            role: "user",
            content: text,
          },
        ],
        temperature: 0.7,
        max_tokens: 150,
      });

      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that analyzes sentiment. Provide sentiment analysis for the following text, rating it as positive, negative, or neutral with a confidence score between 0 and 1."
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });

      console.log("Sentiment analysis response status:", response.status);
      
      if (!response.ok) {
        // More detailed error logging
        const errorText = await response.text();
        console.error("GPT API error:", response.status, errorText);
        
        toast.error("Language Analysis Failed", {
          description: `Error: ${response.status} - ${response.statusText}`,
        });

        throw new Error(`Language API error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log("Sentiment analysis response:", responseData);
      
      return {
        sentiment: responseData.choices[0].message.content,
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Comprehensive error analyzing sentiment:", error);
      
      toast.error("Sentiment Analysis Error", {
        description: "Unable to complete sentiment analysis. Please check your connection and try again.",
      });

      throw error;
    }
  },

  extractKeyPhrases: async (text: string) => {
    // Updated to use GPT-3.5 Turbo for key phrase extraction
    const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Extract and list the key phrases from the following text. Return only the key phrases as a JSON array."
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`Language API error: ${response.status}`);
      }

      const responseData = await response.json();
      return {
        keyPhrases: responseData.choices[0].message.content,
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Error extracting key phrases:", error);
      throw error;
    }
  },

  recognizeEntities: async (text: string) => {
    // Updated to use GPT-3.5 Turbo for entity recognition
    const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Identify and categorize entities in the following text. Return the results as a JSON object with entity types as keys and arrays of entities as values."
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 250,
        }),
      });

      if (!response.ok) {
        throw new Error(`Language API error: ${response.status}`);
      }

      const responseData = await response.json();
      return {
        entities: responseData.choices[0].message.content,
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Error recognizing entities:", error);
      throw error;
    }
  },
};

/**
 * GPT Models Service
 * Direct access to GPT models for various tasks
 */
export const gptService = {
  chat: async (prompt: string) => {
    const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;
    const body = {
      messages: [
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`GPT API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error with gpt-4 chat:", error);
      throw error;
    }
  },

  generateImage: async (prompt: string) => {
    const endpoint = `${AZURE_IITPHACKATHON_ENDPOINT}openai/deployments/dall-e-3/images/generations?api-version=2024-02-01`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          prompt,
          n: 1,
          size: "1024x1024",
        }),
      });

      if (!response.ok) {
        throw new Error(`DALL-E API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error generating image:", error);
      throw error;
    }
  },
};

/**
 * Translation Service
 * Translate text between languages
 */
export const translationService = {
  translateText: async (text: string, targetLanguage: string, sourceLanguage?: string) => {
    // Using GPT for translation
    const endpoint = `${AZURE_IITPHACKATHON_ENDPOINT}openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-05-15`;
    
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are a translator. Translate the following text ${sourceLanguage ? `from ${sourceLanguage}` : ''} to ${targetLanguage}. Provide only the translation without explanations.`
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      if (!response.ok) {
        throw new Error(`Translation API error: ${response.status}`);
      }

      const responseData = await response.json();
      return {
        translation: responseData.choices[0].message.content,
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Error translating text:", error);
      throw error;
    }
  },

  detectLanguage: async (text: string) => {
    // Using GPT for language detection
    const endpoint = `${AZURE_IITPHACKATHON_ENDPOINT}openai/deployments/gpt-35-turbo/chat/completions?api-version=2023-05-15`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "Detect the language of the following text. Return only the language code (e.g., 'en', 'es', 'fr', etc.) without explanations."
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0.3,
          max_tokens: 10,
        }),
      });

      if (!response.ok) {
        throw new Error(`Language detection API error: ${response.status}`);
      }

      const responseData = await response.json();
      return {
        detectedLanguage: responseData.choices[0].message.content.trim(),
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Error detecting language:", error);
      throw error;
    }
  },
};

/**
 * Token Service
 * Generate and analyze token counts
 */
export const tokenService = {
  countTokens: async (text: string) => {
    const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-35-turbo/tokenize?api-version=2023-05-15`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error(`Token API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error counting tokens:", error);
      throw error;
    }
  },
};

/**
 * Image Analysis Service
 * Enhanced image analysis including sentiment of people in the image
 */
export const imageAnalysisService = {
  analyzeImageSentiment: async (imageInput: Blob | File | string) => {
    try {
      // First, analyze the image with Computer Vision
      const visionResult = await computerVisionService.analyzeImage(imageInput);
      
      // Check if there are people in the image
      const hasPeople = visionResult.description?.tags?.some(tag => 
        ['person', 'people', 'man', 'woman', 'child', 'face', 'human'].includes(tag.toLowerCase())
      ) || false;
      
      if (!hasPeople) {
        return {
          sentiment: "No people detected in the image",
          analysis: visionResult
        };
      }
      
      // Use the image caption as input for enhanced sentiment analysis
      const imageDescription = visionResult.description?.captions?.[0]?.text || "A person in an image";
      
      // Enhanced prompt for more nuanced emotional analysis
      const prompt = `
        Based on this description of an image: "${imageDescription}", 
        provide a highly detailed analysis of the emotional state of the person.
        
        Focus intensely on:
        1. Facial expressions - subtle indicators of sadness, fatigue, stress, fear, or forced happiness
        2. Body language - tension, slumped posture, protective gestures
        3. Eye expressions - tiredness, lack of emotional connection, vacant staring
        4. Overall energy level - exhaustion, agitation, withdrawal
        
        Be particularly attuned to signs of:
        - Hidden depression or anxiety
        - Forced smiles or performative happiness
        - Subtle indicators of emotional distress
        - Fatigue or burnout signatures
        
        Rate the emotional state on a detailed scale from very negative to very positive,
        and identify all potential emotions present, including contradictory ones.
        
        Return your analysis in JSON format with fields for:
        'overallSentiment' (a string like "positive", "negative", "neutral", or "mixed"),
        'confidenceScore' (a number between 0 and 1),
        'detectedEmotions' (an array of emotion strings),
        'potentialHiddenEmotions' (an array of emotions that may be present but concealed),
        'emotionalCongruence' (high, medium, or low - how aligned their expressions seem).
      `;
      
      const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an AI assistant specialized in psychological assessment and emotional analysis. You are trained to detect subtle emotional cues and potential signs of distress or incongruence in people's expressions and demeanor."
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 350,
        }),
      });

      if (!response.ok) {
        throw new Error(`Image sentiment analysis error: ${response.status}`);
      }

      const gptResponse = await response.json();
      
      return {
        sentiment: gptResponse.choices[0].message.content,
        visionAnalysis: visionResult,
        gptResponse: gptResponse
      };
    } catch (error) {
      console.error("Error analyzing image sentiment:", error);
      toast.error("Image Sentiment Analysis Error", {
        description: "Unable to analyze sentiment in the image.",
      });
      throw error;
    }
  },
};

/**
 * Mental Health Service
 * Specialized AI service for mental health assessment and assistance
 */
// Add a utility function for implementing retries with exponential backoff
const fetchWithRetry = async (url: string, options: RequestInit, maxRetries = 5): Promise<Response> => {
  let retries = 0;
  let lastError: Error | null = null;
  const rateLimitErrors = [429, 529]; // Both standard rate limit error and Azure custom error

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);
      
      // Check for any rate limiting errors
      if (rateLimitErrors.includes(response.status)) {
        // Get retry-after header if available, or use exponential backoff with longer delays
        const retryAfter = response.headers.get('retry-after');
        // Add more delay for each retry - start with 3 seconds minimum
        const delayMs = retryAfter ? 
          parseInt(retryAfter) * 1000 : 
          Math.max(3000, Math.pow(2, retries + 1) * 1000);
        
        console.log(`Rate limited (${response.status}). Retrying in ${delayMs/1000} seconds. Attempt ${retries + 1} of ${maxRetries}`);
        
        // Show a toast notification about the rate limiting
        toast.info("API Rate Limit Reached", {
          description: `Waiting ${Math.ceil(delayMs/1000)} seconds before retrying. (${retries + 1}/${maxRetries})`,
          duration: delayMs,
        });
        
        // Wait for the specified delay
        await new Promise(resolve => setTimeout(resolve, delayMs));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      console.error(`Fetch attempt ${retries + 1} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      retries++;
      
      if (retries < maxRetries) {
        // Longer exponential backoff
        const delayMs = Math.max(3000, Math.pow(2, retries + 1) * 1000);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw lastError || new Error('Request failed after max retries');
};

/**
 * Mental Health Service
 * Specialized AI service for mental health assessment and assistance
 */
export const mentalHealthService = {
  // Initialize the conversation with the mental health expert
  startConversation: async () => {
    const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;
    
    try {
      // Use fetchWithRetry instead of regular fetch
      const response = await fetchWithRetry(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: `You are an AI mental health assistant. Your purpose is to provide supportive conversation, 
              preliminary assessment, and general wellness advice. Begin by introducing yourself and asking 2-3 
              gentle screening questions about how the person is feeling today, their sleep patterns, and stress levels. 
              Keep your responses compassionate, non-judgmental, and concise (under 100 words). After initial questions, 
              suggest that a photo could help you better understand their current state, but make this optional. 
              Important: Always clarify you are not a replacement for professional mental health services.`
            },
            {
              role: "assistant",
              content: "Hello, I'm your AI mental health assistant. I'm here to listen and provide support, though I'm not a replacement for professional mental healthcare. How are you feeling today? Could you share a bit about your recent sleep patterns and current stress levels? Your responses will help me better understand how to support you."
            }
          ],
          temperature: 0.7,
          max_tokens: 250,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mental health service error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      return {
        messages: [
          {
            role: "assistant",
            content: "Hello, I'm your AI mental health assistant. I'm here to listen and provide support, though I'm not a replacement for professional mental healthcare. How are you feeling today? Could you share a bit about your recent sleep patterns and current stress levels? Your responses will help me better understand how to support you."
          }
        ],
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Error starting mental health conversation:", error);
      
      // Improved error message handling
      if (error instanceof Error && error.message.includes('429')) {
        toast.error("Service Temporarily Busy", {
          description: "Our mental health service is receiving high traffic. Please try again in a few moments.",
        });
      } else {
        toast.error("Service Error", {
          description: "Unable to start mental health assessment. Please try again later.",
        });
      }
      throw error;
    }
  },

  // Implement a cooldown mechanism to prevent rapid API calls
  _lastRequestTime: 0,
  _minRequestInterval: 5000, // 5 seconds minimum between requests
  
  async _enforceRequestCooldown() {
    const now = Date.now();
    const timeSinceLastRequest = now - this._lastRequestTime;
    
    if (timeSinceLastRequest < this._minRequestInterval) {
      const waitTime = this._minRequestInterval - timeSinceLastRequest;
      console.log(`Enforcing cooldown, waiting ${waitTime}ms before next request`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this._lastRequestTime = Date.now();
  },

  // Continue the conversation with user input - enhanced for emotional discrepancy detection
  continueConversation: async (messages: Array<{role: string, content: string}>, userImage?: Blob | null) => {
    try {
      // Enforce cooldown between API requests
      await mentalHealthService._enforceRequestCooldown();
      
      // First, process any user image if provided
      let imageAnalysis = null;
      let enhancedMessages = [...messages];
      let imageUrl = null;
      
      // Debug log to see what messages we're sending
      console.log("Mental health messages before processing:", JSON.stringify(enhancedMessages));
      
      if (userImage) {
        // Store the image for reference 
        imageUrl = URL.createObjectURL(userImage);
        
        // Analyze the user's image for sentiment
        imageAnalysis = await imageAnalysisService.analyzeImageSentiment(userImage);
        
        // Add image description and analysis to the conversation context
        if (imageAnalysis && imageAnalysis.sentiment) {
          // Find the last user message to analyze sentiment comparison
          const lastUserMessageIndex = enhancedMessages.findIndex(
            (msg, i, arr) => msg.role === "user" && (i === arr.length - 1 || arr[i + 1].role === "assistant")
          );
          
          if (lastUserMessageIndex !== -1) {
            const userText = enhancedMessages[lastUserMessageIndex].content;
            
            // Add system message with enhanced emotional discrepancy detection
            enhancedMessages.splice(lastUserMessageIndex + 1, 0, {
              role: "system",
              content: `Image analysis: The user has shared a photo of themselves. 
                Visual assessment indicates the following emotional signals: ${imageAnalysis.sentiment}. 
                Description of the image: ${imageAnalysis.visionAnalysis?.description?.captions?.[0]?.text || "Person in image"}.
                
                The user's text message was: "${userText}"
                
                IMPORTANT: Be vigilant about detecting inconsistencies between what the user says and how they look:
                
                1. Examine their facial expression carefully - look for signs of sadness, distress, anxiety, or fatigue
                2. Compare their actual words with their emotional expression
                3. Pay particular attention if they claim to be "fine", "good", "okay" or "happy" but appear otherwise
                4. Notice if they are minimizing their problems while looking troubled
                
                When you detect such discrepancies (and err on the side of suspecting them), compassionately address them in your response with statements like:
                - "I notice there might be more to how you're feeling..."
                - "Your expression suggests you might be experiencing different emotions than your words convey"
                - "I sense there might be deeper feelings you're not expressing in words"
                
                Avoid directly stating you're comparing their text and image, but gently encourage deeper emotional honesty.`
            });
          }
        }
      }
      
      // Now continue the conversation with enhanced context and more vigilant analysis
      const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;
      
      // Add the enhanced mental health system prompt to guide the conversation
      const systemPrompt = {
        role: "system",
        content: `You are an AI mental health assistant that prioritizes identifying hidden distress. Your purpose is to provide 
        supportive conversation while carefully watching for signs of concealed emotional struggle.
        
        Pay special attention to potential inconsistencies between what users say and how they appear in shared photos.
        Most people tend to hide their true emotional state with phrases like "I'm fine" or "just tired" - be gently
        suspicious of such statements, especially when photos suggest otherwise.
        
        When a user shares an image, carefully analyze their facial expression, posture, and apparent energy level,
        and compassionately note if these seem inconsistent with their words. Don't explicitly mention you're comparing
        text and image, but incorporate these observations naturally in your responses.
        
        Keep your responses compassionate, non-judgmental, and concise (under 150 words). Suggest tailored mindfulness
        techniques or coping strategies when appropriate.
        
        Important: Always clarify you are not a replacement for professional mental health services.`
      };
      
      const fullMessages = [systemPrompt, ...enhancedMessages];
      
      // Log for debugging
      console.log("Sending enhanced messages to GPT:", JSON.stringify(fullMessages));
      
      // Use fetchWithRetry instead of regular fetch for better handling of rate limits
      const response = await fetchWithRetry(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 350,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Mental health conversation error: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      
      return {
        message: responseData.choices[0].message.content,
        imageAnalysis: imageAnalysis,
        imageUrl: imageUrl, // Return the image URL for display in the UI
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Error in mental health conversation:", error);
      
      // Improved error message handling
      if (error instanceof Error && (error.message.includes('429') || error.message.includes('529'))) {
        // Increase the cooldown time when we hit rate limits
        mentalHealthService._minRequestInterval = 10000; // Increase to 10 seconds after a rate limit
        
        toast.error("Service Rate Limit Reached", {
          description: "Our AI service is currently experiencing high demand. Your message will be attempted again shortly.",
        });
      } else {
        toast.error("Conversation Error", {
          description: "There was a problem processing your message. Please try again.",
        });
      }
      throw error;
    }
  }
};

/**
 * Speech Service
 * Text-to-speech and speech-to-text capabilities
 */
export const speechService = {
  textToSpeech: async (text: string, voiceName: string = "en-US-JennyMultilingualNeural") => {
    try {
      // Using Azure Speech service for text-to-speech with East US 2 region
      const endpoint = `${AZURE_SPEECH_ENDPOINT}cognitiveservices/v1`;
      
      console.log("Sending text-to-speech request to:", endpoint);
      
      // Prepare SSML (Speech Synthesis Markup Language)
      const ssml = `
        <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="en-US">
          <voice name="${voiceName}">
            <mstts:express-as style="empathetic">
              ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')}
            </mstts:express-as>
          </voice>
        </speak>
      `;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": API_KEY,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-16khz-128kbitrate-mono-mp3",
          "User-Agent": "sahAIyak-mental-health-assistant"
        },
        body: ssml
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Text-to-speech complete error details:", {
          status: response.status,
          statusText: response.statusText,
          errorText,
          endpoint
        });
        throw new Error(`Text-to-speech error: ${response.status} - ${errorText}`);
      }
      
      // Get the audio data as arrayBuffer
      const audioData = await response.arrayBuffer();
      
      // Convert to base64 for easier handling
      const base64Audio = btoa(
        new Uint8Array(audioData)
          .reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      
      return {
        audioData,
        audioUrl: `data:audio/mp3;base64,${base64Audio}`,
        success: true
      };
    } catch (error) {
      console.error("Error in text-to-speech conversion:", error);
      toast.error("Text-to-Speech Error", {
        description: "Unable to convert text to speech. Please try again later.",
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  
  getAvatarSpeech: async (text: string, avatarType: string = "lisa") => {
    try {
      // First try using the talking avatar service
      console.log("Attempting to generate talking avatar with type:", avatarType);
      
      // Create the speaking avatar
      const endpoint = `${AZURE_SERVICES_ENDPOINT}talkingavatars/v0.1/generate`;
      
      // Check if service endpoint is properly configured
      if (!AZURE_SERVICES_ENDPOINT) {
        throw new Error("Talking Avatars service endpoint is not configured");
      }
      
      // Prepare the request payload
      const payload = {
        "talkingAvatar": {
          "source": {
            "type": "library-avatar",
            "libraryAvatarId": avatarType // e.g. "lisa", "guy", "hirotaka", "chrissy" are available options
          },
          "audioSource": {
            "type": "tts",
            "voice": "en-US-JennyMultilingualNeural",
            "text": text,
            "style": "Default"
          },
          "background": {
            "color": "#000A"
          },
          "format": "mp4",
          "size": {
            "width": 1280,
            "height": 720
          },
          "crop": {
            "type": "center"
          },
          "subtitles": {
            "auto": true,
            "textSize": 24,
            "font": "Arial"
          }
        }
      };
      
      console.log("Sending avatar generation request to:", endpoint);
      
      // Make the request to the Talking Avatars API
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": API_KEY
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        // If avatar fails, try simple text-to-speech instead
        console.log("Avatar generation failed with status:", response.status);
        const errorText = await response.text();
        throw new Error(`Avatar generation error: ${response.status} - ${errorText}`);
      }
      
      // Get the response which contains a URL to the video
      const data = await response.json();
      console.log("Avatar generated successfully with URL:", data.url);
      
      return {
        avatarUrl: data.url,
        success: true,
        isAvatarVideo: true
      };
    } catch (error) {
      console.error("Error generating talking avatar, falling back to speech only:", error);
      
      // Since the avatar generation failed, let's fallback to simple text-to-speech
      console.log("Trying fallback to basic text-to-speech");
      try {
        const speechResult = await speechService.textToSpeech(text);
        if (speechResult.success) {
          return {
            audioUrl: speechResult.audioUrl,
            success: true,
            isAvatarVideo: false,
            fallbackReason: error instanceof Error ? error.message : "Unknown avatar error"
          };
        } else {
          throw new Error("Both avatar and speech generation failed");
        }
      } catch (speechError) {
        console.error("Even fallback speech failed:", speechError);
        toast.error("Avatar and Speech Generation Error", {
          description: "Unable to generate talking avatar or speech. Please try again later.",
        });
        return {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
          fallbackError: speechError instanceof Error ? speechError.message : "Unknown speech error"
        };
      }
    }
  },

  // Add a method for browser-based speech recognition (fallback)
  startSpeechRecognition: () => {
    // Check for browser support
    if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
      console.error("Speech recognition not supported in this browser");
      return null;
    }
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Configure
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    return recognition;
  }
};

// Add TypeScript declarations for the Web Speech API
declare global {
  interface Window {
    SpeechRecognition?: typeof SpeechRecognition;
    webkitSpeechRecognition?: typeof SpeechRecognition;
  }
}

// Export a combined service object
export const azureAIServices = {
  validateApiConnection,
  computerVision: computerVisionService,
  contentSafety: contentSafetyService,
  documentIntelligence: documentIntelligenceService,
  language: languageService,
  translation: translationService,
  token: tokenService,
  gpt: gptService,
  imageAnalysis: imageAnalysisService, // Add the new service
  mentalHealth: mentalHealthService, // Add the mental health service
  speech: speechService, // Add the speech service
};

export default azureAIServices;
