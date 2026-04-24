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

# Pre-download htdemucs weights into the image so runtime doesn't need internet
RUN python -c "from demucs.pretrained import get_model; get_model('htdemucs')"

# Cache bust — update this value to force a full rebuild
ARG CACHE_BUST=4
RUN echo "Cache bust: $CACHE_BUST"

COPY . .

EXPOSE $PORT

CMD ["sh", "-c", "gunicorn Api.app:app --bind 0.0.0.0:${PORT} --timeout 600 --workers 1 --capture-output --log-level debug"]