# Audio Separation Platform

<img width="1280" height="718" alt="Screenshot 2026-04-25 at 3 39 48 PM" src="https://github.com/user-attachments/assets/d81576fb-9789-4324-80a0-ee338874ae2b" />

---
A full-stack machine learning application that separates audio files into individual stems and classifies each stem by genre or environmental sound category. The platform supports two distinct modes — one for music and one for nature recordings — each backed by a custom-trained ResNet-18 model.

Live demo: [audio-spearation-platform.vercel.app](https://audio-spearation-platform.vercel.app)

---

## What it does

Upload a WAV, MP3, FLAC, or OGG file and the platform will:

**Music mode** — Run the audio through Facebook's Demucs (htdemucs model) to separate it into four stems: vocals, drums, bass, and other. Each stem is then passed through a custom ResNet-18 classifier trained on the GTZAN dataset to predict its genre. A mel spectrogram is generated for each stem and displayed alongside an interactive waveform player.

**Nature mode** — Skip the separation step and classify the full recording using a ResNet-18 model trained on the ESC-50 dataset across 50 environmental sound categories. Returns the top 3 predictions with confidence scores and a full-clip spectrogram.

In both modes, individual stems or the full recording can be played back in the browser and downloaded as WAV files.

---

## Architecture

The project is split into two independently deployed services:

**Frontend** — React 18, built with Vite, deployed on Vercel. Uses React Router for page navigation, WaveSurfer.js for waveform rendering, Three.js and Vanta for the animated background, and Axios for API communication.

**Backend** — Flask, served with Gunicorn, containerised with Docker, deployed on Hugging face. Handles file ingestion, runs Demucs separation as a subprocess, runs inference through the custom PyTorch models, generates spectrogram images with Librosa and Matplotlib, and serves all resulting files as static endpoints.

---

## Project structure

```
audio-spearation-platform/
├── backend/
│   ├── Api/
│   │   └── app.py              # Flask routes and request handling
│   ├── Core/
│   │   ├── inference.py        # Model loading and prediction logic
│   │   ├── resnet_model.py     # AudioResNet architecture definition
│   │   ├── esc50_dataset.py    # ESC-50 PyTorch dataset class
│   │   ├── gtzan_dataset.py    # GTZAN PyTorch dataset class
│   │   └── separator.py        # Demucs separation wrapper
│   ├── Training/
│   │   ├── train_esc50.py      # Training script for the nature model
│   │   └── train_gtzan.py      # Training script for the music model
│   ├── Models/
│   │   ├── esc50_resnet_v1.pth # Trained nature classification weights
│   │   └── gtzan_resnet_v1.pth # Trained music classification weights
│   ├── data/
│   │   └── esc50.csv           # ESC-50 class label metadata
│   ├── Dockerfile
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/         # Reusable UI components
    │   ├── pages/              # Route-level page components
    │   ├── services/
    │   │   └── api.js          # Axios client and API helpers
    │   ├── hooks/
    │   │   └── useHealth.js    # Backend health polling hook
    │   └── App.jsx
    ├── public/
    ├── package.json
    └── vite.config.js
```

---

## Models

Both classifiers share the same base architecture: a ResNet-18 pretrained on ImageNet, adapted for single-channel mel spectrogram input by modifying the first convolutional layer to accept one channel instead of three. The RGB weights are averaged across channels to initialise the mono weights, preserving the pretrained feature representations.

The final fully connected layer is replaced with a dropout layer (p=0.3) followed by a linear layer sized to the target number of classes.

**Nature model (ESC-50)**
- 50 output classes covering environmental sounds such as rain, dog bark, engine, chainsaw, and so on
- Input: 5-second audio clip at 22050 Hz, converted to a 128-band mel spectrogram
- Confidence threshold for a "recognised" result: 0.25
- Training data: ESC-50 dataset with SpecAugment (frequency and time masking) for augmentation

**Music model (GTZAN)**
- 10 output classes: blues, classical, country, disco, hiphop, jazz, metal, pop, reggae, rock
- Input: 30-second audio clip at 22050 Hz, converted to a 64-band mel spectrogram
- Confidence threshold for a "recognised" result: 0.25
- Training data: GTZAN genre dataset

---

## API reference

Base URL: `https://zen-4011-audio-separation-model.hf.space`

### GET /api/health

Returns the service status and verifies the API is responsive.

```json
{
  "status": "ok",
  "models_loaded": true
}
```

### POST /api/separate

Accepts a multipart form upload and returns a JSON response with stems, predictions, and URLs.

| Field | Type | Description |
|---|---|---|
| `audio` | File | WAV, MP3, FLAC, or OGG file |
| `domain` | string | `"music"` or `"nature"` |

Response shape (music mode):

```json
{
  "job_id": "a1b2c3d4",
  "domain_detected": "music",
  "processing_time_seconds": 42.1,
  "stems": [
    {
      "id": "a1b2c3d4_vocals",
      "name": "Vocals",
      "label": "Hip-Hop",
      "closest_match": "Hip-Hop",
      "confidence": 0.81,
      "recognised": true,
      "top3": [
        { "label": "Hip-Hop", "confidence": 0.81 },
        { "label": "Pop", "confidence": 0.11 },
        { "label": "Reggae", "confidence": 0.05 }
      ],
      "audio_url": "/api/stems/a1b2c3d4/vocals.wav",
      "spectrogram_url": "/api/spectrograms/a1b2c3d4_vocals.png"
    }
  ]
}
```

### GET /api/stems/\<job_folder\>/\<stem_name\>

Streams a separated stem WAV file.

### GET /api/spectrograms/\<filename\>

Returns a mel spectrogram PNG image.

### GET /api/audio/\<filename\>

Returns the original uploaded audio file.

### GET /api/download-all/\<job_id\>

Returns a ZIP archive containing all separated stems for a job.

---

## Running locally

### Prerequisites

- Python 3.11
- Node.js 18 or later
- ffmpeg installed on the system (`brew install ffmpeg` on macOS)

### Backend

```bash
cd backend
pip install -r requirements.txt
```

The model weights at `Models/esc50_resnet_v1.pth` and `Models/gtzan_resnet_v1.pth` must be present. If you are training from scratch, see the Training section below.

```bash
gunicorn Api.app:app --bind 0.0.0.0:5001 --timeout 300 --workers 1
```

The API will be available at `http://localhost:5001`.

### Frontend

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL = http://localhost:5001
```

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Training the models

The training scripts are in `backend/Training/`. You will need to download the datasets separately as they are not included in this repository.

**ESC-50 (nature model)**

Download the ESC-50 dataset from [https://github.com/karolpiczak/ESC-50](https://github.com/karolpiczak/ESC-50) and place the audio files at `backend/data/audio/`. The `esc50.csv` metadata file is already included.

```bash
cd backend
python Training/train_esc50.py
```

The trained weights will be saved to `Models/esc50_resnet_v1.pth`.

**GTZAN (music model)**

Download the GTZAN dataset and place the genre folders at `backend/data/gtzan_data/genres_original/`.

```bash
cd backend
python Training/train_gtzan.py
```

The trained weights will be saved to `Models/gtzan_resnet_v1.pth`.

---

## Deployment

### Backend (Hugging Face)

The backend deploys via Hugging Face Docker Spaces. The `Dockerfile` pins PyTorch 2.2.2 (CPU build) and pre-downloads the Demucs htdemucs model weights at image build time to avoid cold-start delays.

Hugging Face automatically injects the port into the container, and the application is started directly via the `CMD` instruction in the `Dockerfile`:

```dockerfile
CMD ["sh", "-c", "gunicorn Api.app:app --bind 0.0.0.0:7860 --timeout 300 --workers 1"]

The backend requires at least 2GB of RAM to run Demucs separation reliably.

### Frontend (Vercel)

The frontend deploys automatically from the `frontend/` directory. Set the following environment variable in the Vercel project settings:

```

```
VITE_API_URL = https://zen-4011-audio-separation-model.hf.space
```

The `vercel.json` in the frontend directory handles SPA routing rewrites.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 |
| Build tool | Vite |
| Routing | React Router v7 |
| Audio visualisation | WaveSurfer.js |
| 3D background | Three.js, Vanta |
| HTTP client | Axios |
| Backend framework | Flask |
| WSGI server | Gunicorn |
| Audio separation | Demucs (htdemucs) |
| Deep learning | PyTorch, TorchAudio |
| Audio processing | Librosa |
| Containerisation | Docker |
| Frontend hosting | Vercel |
| Backend hosting | Hugging Face |

---

## Screenshots

<img width="1280" height="756" alt="Screenshot 2026-04-25 at 5 00 07 PM" src="https://github.com/user-attachments/assets/3f0fca09-36be-427f-8b7c-c0912e6487a2" />
<img width="1280" height="750" alt="Screenshot 2026-04-25 at 5 00 21 PM" src="https://github.com/user-attachments/assets/126dc48f-5014-4a84-9fc3-8f68a4c37c33" />
<img width="1280" height="752" alt="Screenshot 2026-04-25 at 5 01 41 PM" src="https://github.com/user-attachments/assets/3a340cbe-781c-4754-ba74-394cadc48df9" />

---

## Known limitations

- Processing time for music separation ranges from 30 to 90 seconds depending on file length, as Demucs runs on CPU.
- Files larger than approximately 50MB may cause request timeouts.
- The nature classifier covers only the 50 categories present in the ESC-50 dataset. Sounds outside this set will be returned as "Unrecognised Sound".
- Temporary files (uploads, separated stems, spectrograms) are stored on the container filesystem and are not persisted across deployments.
