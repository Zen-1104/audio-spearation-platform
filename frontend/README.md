# STEM — Audio Source Separation Platform

A production-grade React frontend for the Audio Source Separation & Classification API.

## Tech Stack

- **React 18** (functional components + hooks)
- **Vite** (dev server + build)
- **Axios** (API requests with 120s timeout)
- **CSS Variables** (custom design system — no external UI library needed)

## Project Structure

```
src/
├── components/
│   ├── FileUpload.jsx      # Drag-and-drop upload zone
│   ├── DomainToggle.jsx    # Auto / Nature / Music selector
│   ├── Loader.jsx          # Animated waveform processing screen
│   ├── StemCard.jsx        # Stem card with player + download
│   └── HealthBanner.jsx    # API health status bar
├── pages/
│   ├── UploadPage.jsx      # Main upload + domain selection UI
│   ├── ProcessingPage.jsx  # Processing animation screen
│   └── ResultsPage.jsx     # Results grid with all stems
├── services/
│   └── api.js              # All API calls (health, separate, download)
├── hooks/
│   └── useHealth.js        # API health check hook
├── utils/
│   └── fileValidation.js   # File type + size validation
├── App.jsx                 # Root component + view state machine
├── main.jsx                # React entry point
└── index.css               # Global styles + design tokens
```

## Getting Started

### Prerequisites

- Node.js 18+ 
- The backend API running at `http://localhost:5000`

### Install & Run

```bash
# Install dependencies
npm install

# Start dev server (runs on port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dev server proxies all `/api/*` requests to `http://localhost:5000`, so make sure your backend is running.

### Build for Production

```bash
npm run build
npm run preview
```

## API Integration

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Check service + model status on load |
| `/api/separate` | POST | Upload file + start separation (up to 120s timeout) |
| `/api/stems/:id` | GET | Stream stem audio (used directly in `<audio src>`) |

## Features

- ✅ Drag-and-drop file upload with fallback picker
- ✅ File validation (WAV/MP3 only, max 50MB)
- ✅ Domain selection (Auto / Nature / Music)
- ✅ Health check with user-friendly status messages
- ✅ Animated waveform loader with elapsed timer
- ✅ Stem cards with confidence bars, audio player, download
- ✅ Full error handling for all API failure modes
- ✅ Smooth page transitions

## Error Handling

| Scenario | Message Shown |
|---|---|
| Backend offline | "Service unavailable. Please try again later." |
| Models not loaded | "AI models are still loading. Please wait and refresh." |
| File too large | "File too large. Max 50MB." |
| Wrong format | "Only WAV and MP3 files are allowed." |
| API 500 | "Processing failed. Try again." |
| No stems returned | "No separable sources detected." |
