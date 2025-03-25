const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Store job status in memory (in production, use a database)
const jobStatus = new Map();

// Azure configuration
const SPEECH_ENDPOINT = process.env.AZURE_SPEECH_ENDPOINT || 'https://eastus2.tts.speech.microsoft.com/';
const API_KEY = process.env.AZURE_API_KEY || 'Fj1KPt7grC6bAkNja7daZUstpP8wZTXsV6Zjr2FOxkO7wsBQ5SzQJQQJ99BCACHYHv6XJ3w3AAAAACOGL3Xg';
const API_VERSION = '2024-08-01';

// Submit a talking avatar synthesis job
app.post('/api/avatar/create', async (req, res) => {
  try {
    console.log('Received avatar generation request:', req.body);
    const { text, avatarType = 'lisa', voice = 'en-US-JennyMultilingualNeural' } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    // Generate a unique job ID
    const jobId = uuidv4();
    
    // Store initial job status
    jobStatus.set(jobId, {
      status: 'processing',
      created: new Date(),
      text,
      avatarType
    });

    // Submit the job to Azure
    const endpoint = `${SPEECH_ENDPOINT}cognitiveservices/avatar/batchsyntheses/${jobId}?api-version=${API_VERSION}`;
    
    // Prepare the synthesis configuration based on the sample Python code
    const payload = {
      synthesisConfig: {
        voice: voice
      },
      inputKind: "PlainText",
      inputs: [
        {
          content: text
        }
      ],
      avatarConfig: {
        customized: false,
        talkingAvatarCharacter: avatarType,
        talkingAvatarStyle: "graceful-sitting",
        videoFormat: "mp4",
        videoCodec: "h264",
        subtitleType: "soft_embedded",
        backgroundColor: "#FFFFFFFF"
      }
    };

    console.log('Submitting job to Azure:', endpoint);
    
    const response = await axios.put(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Ocp-Apim-Subscription-Key': API_KEY
      }
    });

    // Return the job ID to the client for status checking
    res.json({
      success: true,
      jobId,
      message: 'Avatar generation job submitted successfully'
    });

    // Start polling for job status in the background
    pollJobStatus(jobId);
  } catch (error) {
    console.error('Error submitting avatar job:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to submit avatar generation job',
      details: error.response?.data || error.message
    });
  }
});

// Check the status of a job
app.get('/api/avatar/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  
  if (!jobStatus.has(jobId)) {
    return res.status(404).json({ success: false, error: 'Job not found' });
  }
  
  res.json({
    success: true,
    ...jobStatus.get(jobId)
  });
});

// Poll the Azure API for job status
async function pollJobStatus(jobId) {
  try {
    const endpoint = `${SPEECH_ENDPOINT}cognitiveservices/avatar/batchsyntheses/${jobId}?api-version=${API_VERSION}`;
    
    // Poll every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(endpoint, {
          headers: {
            'Ocp-Apim-Subscription-Key': API_KEY
          }
        });
        
        const data = response.data;
        console.log(`Job ${jobId} status:`, data.status);
        
        if (data.status === 'Succeeded') {
          clearInterval(pollInterval);
          // Update job status with the result URL
          jobStatus.set(jobId, {
            ...jobStatus.get(jobId),
            status: 'completed',
            completed: new Date(),
            avatarUrl: data.outputs?.result
          });
          console.log(`Job ${jobId} completed successfully`);
        } else if (data.status === 'Failed') {
          clearInterval(pollInterval);
          jobStatus.set(jobId, {
            ...jobStatus.get(jobId),
            status: 'failed',
            error: data.errors || 'Unknown error'
          });
          console.error(`Job ${jobId} failed:`, data.errors);
        }
        // For 'Running' or 'NotStarted' status, continue polling
      } catch (error) {
        console.error(`Error polling job ${jobId}:`, error.response?.data || error.message);
        
        // After 3 minutes, stop polling to prevent endless polling for failed jobs
        const job = jobStatus.get(jobId);
        if (job && (new Date() - job.created) > 3 * 60 * 1000) {
          clearInterval(pollInterval);
          jobStatus.set(jobId, {
            ...job,
            status: 'failed',
            error: 'Polling timeout - job may still be processing'
          });
        }
      }
    }, 5000);
  } catch (error) {
    console.error(`Error setting up polling for job ${jobId}:`, error);
    jobStatus.set(jobId, {
      ...jobStatus.get(jobId),
      status: 'failed',
      error: 'Failed to set up status polling'
    });
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Avatar API endpoint: http://localhost:${PORT}/api/avatar/create`);
});
