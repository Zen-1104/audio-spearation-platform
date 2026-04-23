FROM python:3.11-slim

RUN apt-get update && apt-get install -y \
    ffmpeg \
    libsndfile1 \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir torch torchaudio torchvision \
    --index-url https://download.pytorch.org/whl/cpu

RUN pip install --no-cache-dir flask flask-cors werkzeug demucs \
    numpy pandas librosa soundfile scipy scikit-learn matplotlib \
    Pillow requests tqdm omegaconf einops julius PyYAML gunicorn
COPY . .

EXPOSE $PORT

CMD gunicorn Api.app:app --bind 0.0.0.0:$PORT --timeout 300 --workers 1