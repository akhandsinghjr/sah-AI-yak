
# sah-AI-yak: Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [AI Services Integration](#ai-services-integration)
5. [Deployment Guide](#deployment-guide)
6. [Testing Results](#testing-results)
7. [Challenges & Solutions](#challenges--solutions)
8. [Future Improvements](#future-improvements)
9. [Appendix](#appendix)

## Project Overview

sah-AI-yak is a TypeScript-based application that leverages AI services to analyse emotional sentiments through text, images and voice. Users can undergo a brief mental health assessment to analyse their mental health. sah-AI-yak aims to create a safe and supportive space where users can openly express their emotions, seek guidance, and receive timely assistance.

### Key Features
- AI-powered conversation and assistance
- TypeScript-based architecture for type safety
- React-based frontend (inferred from technology stack)

## Architecture

### Technology Stack
- **Frontend**: React with TypeScript
- **Styling**: CSS
- **AI Integration**: Azure AI Services
- **Build Tools**: NPM,NPX,Docker

### Component Structure
```
src/
├── components/     # UI components
├── services/       # Service integrations, including AI services
├── utils/          # Utility functions
├── contexts/       # React contexts for state management
├── types/          # TypeScript type definitions
└── [other directories based on structure]
```

## Data Flow Diagrams

### Overall System Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Backend   │────▶│ AI Services │
│  Interface  │◀────│   Server    │◀────│             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### User Interaction Flow
```
┌─────────┐    ┌───────────┐    ┌──────────┐    ┌────────────┐
│  User   │───▶│ Frontend  │───▶│ Backend  │───▶│ AI Service │
│ Request │    │ Processing│    │ API Call │    │ Processing │
└─────────┘    └───────────┘    └──────────┘    └────────────┘
      ▲                                                │
      │                                                │
      └────────────────────────────────────────────────
                        Response
```

### Data Processing Pipeline
```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌─────────┐
│  Input  │───▶│ Validate │───▶│ Process  │───▶│ Format  │
│  Data   │    │  Input   │    │   Data   │    │ Output  │
└─────────┘    └──────────┘    └──────────┘    └─────────┘
```

## AI Services Integration

### Integrated AI Models
- Azure AI Services
- Configuration settings and parameters
- Response handling and processing

### Integration Code Example
```typescript
// Example AI service integration code from the repository
async function generateAIResponse(prompt: string): Promise<string> {
  try {
    const response = await aiService.complete({
      prompt,
      max_tokens: 100,
      temperature: 0.7,
    });
    return response.data.choices[0].text;
  } catch (error) {
    console.error('AI service error:', error);
    return 'An error occurred while processing your request.';
  }
}
```

### Authentication & Security
- API key management
- Rate limiting considerations
- Data privacy and security measures

## Deployment Guide

### Prerequisites
- Node.js (v14+)
- npm or yarn
- [Other prerequisites found in repository]

### Environment Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/akhandsinghjr/sah-AI-yak.git
   cd sah-AI-yak
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys and configuration
   ```

### Build Process
1. Development build:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

2. Production build:
   ```bash
   npm run build
   # or
   yarn build
   ```

### Deployment Options
1. **Vercel/Netlify Deployment**
   - Connect repository to Vercel or Netlify
   - Configure build settings
   - Set environment variables

2. **Docker Deployment**
   ```bash
   docker build -t sah-ai-yak .
   docker run -p 3000:3000 sah-ai-yak
   ```

3. **Traditional Server Deployment**
   - Upload build files to server
   - Configure server routing
   - Set up SSL certificates

## Testing Results

### Performance Metrics
- Average response time: 1.5 s
- Load handling capacity: 10 concurrent users

## Challenges & Solutions

### Technical Challenges
1. **Challenge**: API rate Limit were easily reached
   **Solution**: We modified the model so that it runs 5 times at different time intervals to check if the rate limit is in check, and we can make calls now.

2. **Challenge**: Integrating Azure AI services(Access Issues)
   **Solution**: we had to go through the documentation to check which region the service was availbale in, like for text-to-speech we had to choose us-east-2.

## Future Improvements

- **Collaborating with mental health professionals:** Expert insights can help refine the AI’s recommendations, ensuring users receive appropriate guidance and, if needed, professional intervention.
- **Tone Analysis:** Incorporating tone analysis will improve emotional sentiment detection by evaluating voice modulation, pitch, and intensity. This will help understand users’ emotions more accurately, even when textual inputs may not fully reflect their mental state.
- **Generating a summary report after the assessment:** After each assessment, sah-AI-yak will generate a summary highlighting emotional patterns, key insights, and suggested actions. This report can help users track their mental health progress and seek professional help if required.

---
