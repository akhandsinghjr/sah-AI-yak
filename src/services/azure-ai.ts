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

// API key (corrected from the Postman examples)
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
      
      // Use the image caption as input for sentiment analysis
      const imageDescription = visionResult.description?.captions?.[0]?.text || "A person in an image";
      
      // Ask GPT to analyze sentiment of people in the image
      const prompt = `
        Based on this description of an image: "${imageDescription}", 
        analyze the sentiment or emotional state of any people described.
        Focus on facial expressions, body language, and context clues.
        Rate the emotional state on a scale of very negative to very positive,
        and identify specific emotions if possible (joy, sadness, anger, surprise, etc.).
        Return your analysis in JSON format with fields for 'overallSentiment' (a string like "positive", "negative", or "neutral"), 
        'confidenceScore' (a number between 0 and 1), and 'detectedEmotions' (an array of emotion strings).
      `;
      
      const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that specializes in analyzing the emotional content and sentiment of people in images based on descriptions."
            },
            {
              role: "user",
              content: prompt,
            },
          ],
          temperature: 0.3,
          max_tokens: 250,
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
export const mentalHealthService = {
  // Initialize the conversation with the mental health expert
  startConversation: async () => {
    const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;
    
    try {
      const response = await fetch(endpoint, {
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
        throw new Error(`Mental health service error: ${response.status}`);
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
      toast.error("Service Error", {
        description: "Unable to start mental health assessment. Please try again later.",
      });
      throw error;
    }
  },

  // Continue the conversation with user input
  continueConversation: async (messages: Array<{role: string, content: string}>, userImage?: Blob | null) => {
    try {
      // First, process any user image if provided
      let imageAnalysis = null;
      let enhancedMessages = [...messages];
      
      if (userImage) {
        // Analyze the user's image for sentiment
        imageAnalysis = await imageAnalysisService.analyzeImageSentiment(userImage);
        
        // Add image description and analysis to the conversation context
        if (imageAnalysis && imageAnalysis.sentiment) {
          // Find the last user message to attach the image analysis to
          const lastUserMessageIndex = enhancedMessages.findIndex(
            (msg, i, arr) => msg.role === "user" && (i === arr.length - 1 || arr[i + 1].role === "assistant")
          );
          
          if (lastUserMessageIndex !== -1) {
            // Add system message with image analysis after the user's message
            enhancedMessages.splice(lastUserMessageIndex + 1, 0, {
              role: "system",
              content: `Image analysis: The user shared a photo of themselves. 
                Visual assessment indicates the following emotional signals: ${imageAnalysis.sentiment}. 
                Description of the image: ${imageAnalysis.visionAnalysis?.description?.captions?.[0]?.text || "Person in image"}.
                Consider this visual information in your response, but don't explicitly mention that you've analyzed their photo.`
            });
          }
        }
      }
      
      // Now continue the conversation with enhanced context
      const endpoint = `${AZURE_OPENAI_ENDPOINT}openai/deployments/gpt-4/chat/completions?api-version=2025-01-01-preview`;
      
      // Add the mental health system prompt to guide the conversation
      const systemPrompt = {
        role: "system",
        content: `You are an AI mental health assistant. Your purpose is to provide supportive conversation, 
        preliminary assessment, and general wellness advice. Keep your responses compassionate, non-judgmental, 
        and concise (under 150 words). If the user has shared a photo of themselves, subtly incorporate insights 
        from the visual cues without explicitly mentioning the image analysis. Suggest mindfulness techniques or 
        coping strategies when appropriate. After a few exchanges, gently ask if they would like to share a photo 
        to help you better understand their current state, but make this optional.
        Important: Always clarify you are not a replacement for professional mental health services.`
      };
      
      const fullMessages = [systemPrompt, ...enhancedMessages];
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getOpenAIHeaders(),
        body: JSON.stringify({
          messages: fullMessages,
          temperature: 0.7,
          max_tokens: 350,
        }),
      });

      if (!response.ok) {
        throw new Error(`Mental health conversation error: ${response.status}`);
      }

      const responseData = await response.json();
      
      return {
        message: responseData.choices[0].message.content,
        imageAnalysis: imageAnalysis,
        rawResponse: responseData
      };
    } catch (error) {
      console.error("Error in mental health conversation:", error);
      toast.error("Conversation Error", {
        description: "There was a problem processing your message. Please try again.",
      });
      throw error;
    }
  }
};

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
};

export default azureAIServices;
