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
  analyzeImage: async (imageUrl: string) => {
    const endpoint = `${AZURE_COGNITIVE_ENDPOINT}vision/v3.2/analyze`;
    const params = new URLSearchParams({
      visualFeatures: "Categories,Tags,Description,Faces,Objects,Adult",
      language: "en",
    });

    try {
      console.log("Sending image analysis request to:", `${endpoint}?${params}`);
      
      const response = await fetch(`${endpoint}?${params}`, {
        method: "POST",
        headers: getCognitiveHeaders(),
        body: JSON.stringify({ url: imageUrl }),
      });

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

  analyzeImage: async (imageUrl: string) => {
    const endpoint = `${AZURE_COGNITIVE_ENDPOINT}contentsafety/image:analyze?api-version=2023-10-01`;

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: getCognitiveHeaders(),
        body: JSON.stringify({
          image: { url: imageUrl },
          categories: ["Hate", "SelfHarm", "Sexual", "Violence"],
        }),
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
};

export default azureAIServices;
