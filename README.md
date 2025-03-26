# सह-AI-यक (Sahayak): Mental Health Assistant

A conversational AI assistant for mental health assessment that analyzes both text and facial expressions to provide supportive responses.

## Tech Stack

### Frontend
- **Framework**: Next.js (React)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Components**: Custom UI component library with shadcn/ui
- **Icons**: Lucide React

### Azure AI Services
- **Azure OpenAI Service**: GPT-4 for conversation and emotional analysis
- **Azure Computer Vision**: Image analysis for facial expression assessment
- **Azure Speech Service**: Text-to-speech for voice responses
- **Azure Content Safety**: Content moderation

### Media Processing
- **Camera Integration**: WebRTC API and Canvas for photo capture
- **Speech Recognition**: Web Speech API for speech-to-text
- **Audio Playback**: HTML5 Audio API with custom controls

### User Experience
- **Real-time Feedback**: Visual sound wave animations during speech
- **Interactive UI**: Modal dialogs, tooltips, and responsive design
- **Status Indicators**: Loading states and progress animations
- **Toast Notifications**: User feedback system

### Performance Optimizations
- **Rate Limiting**: Exponential backoff for API calls
- **Error Handling**: Comprehensive error states with recovery
- **Lazy Loading**: Optimized asset loading
- **Responsive Design**: Mobile and desktop support

## Getting Started

### Azure Hackathon

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

## What technologies are used for this project?

This project is built with .

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS