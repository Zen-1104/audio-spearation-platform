import os
import torch
import torchaudio
import pandas as pd
import numpy as np
import librosa
import librosa.display
import matplotlib
matplotlib.use('Agg')  # prevents matplotlib from trying to open a GUI window
import matplotlib.pyplot as plt
from Core.resnet_model import AudioResNet
from Core.gtzan_dataset import GENRES

# Device Selection -> will use the device's CPU if it's not an Apple device.
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")

# Confidence Threshold (< .20%)
NATURE_CONFIDENCE_THRESHOLD = 0.20

# mel Spectrogram transform
mel_transform = torchaudio.transforms.MelSpectrogram(
    sample_rate = 22050,
    n_fft = 1024,
    hop_length = 512,
    n_mels = 128
).to(device)

# ESC-50 class map 
def load_esc50_classes(csv_path = "data/esc50.csv"):
    df = pd.read_csv(csv_path)
    class_map = dict(zip(df['target'], df['category']))
    return class_map

# Model loader 
def load_model(num_classes, weights_path):
    if not os.path.exists(weights_path):
        print(f"Warning: weights not found at {weights_path}")
        return None
    model = AudioResNet(num_classes = num_classes).to(device)
    model.load_state_dict(torch.load(
        weights_path, map_location = device, weights_only = True
    ))
    model.eval()
    print(f"Loaded: {weights_path}")
    return model

# Load both models at startup
nature_model = load_model(num_classes = 50, weights_path = "Models/esc50_resnet_v1.pth")
music_model  = load_model(num_classes = 10, weights_path = "Models/gtzan_resnet_v1.pth")

try:
    ESC50_CLASSES = load_esc50_classes()
except FileNotFoundError:
    print("Warning: esc50.csv not found.")
    ESC50_CLASSES = {}

def models_are_loaded():
    return nature_model is not None and music_model is not None

# Audio preprocessor 
def preprocess_audio(audio_path, num_samples):
    signal, sr = torchaudio.load(audio_path)

    if sr != 22050:
        signal = torchaudio.transforms.Resample(sr, 22050)(signal)

    if signal.shape[0] > 1:
        signal = torch.mean(signal, dim = 0, keepdim = True)

    if signal.shape[1] > num_samples:
        signal = signal[:, :num_samples]
    elif signal.shape[1] < num_samples:
        signal = torch.nn.functional.pad(signal, (0, num_samples - signal.shape[1]))

    signal = signal.to(device)
    mel    = mel_transform(signal).unsqueeze(0)
    return mel

# Nature prediction —> returns top 3 + recognised flag
def predict_nature(audio_path):
    """
    Returns a dict with:
      - recognised (bool)
      - label (str)         — top prediction, or "Unrecognised Sound"
      - closest_match (str) — always the top prediction regardless of threshold
      - confidence (float)  — top prediction confidence %
      - top3 (list)         — [{label, confidence}, ...] always 3 items
    """
    if nature_model is None:
        return {
            "recognised":    False,
            "label":         "Model not loaded",
            "closest_match": "Model not loaded",
            "confidence":    0.0,
            "top3":          []
        }

    mel = preprocess_audio(audio_path, num_samples=22050 * 5)

    with torch.no_grad():
        outputs       = nature_model(mel)
        probabilities = torch.nn.functional.softmax(outputs / 3.0, dim=1)

        # Top 3 predictions
        top3_confidences, top3_indices = torch.topk(probabilities, k=3, dim=1)

    top3 = []
    for i in range(3):
        idx        = top3_indices[0][i].item()
        conf       = round(top3_confidences[0][i].item(), 4)
        raw_label  = ESC50_CLASSES.get(idx, "Unknown")
        clean_label = raw_label.replace('_', ' ').title()
        top3.append({"label": clean_label, "confidence": conf})

    top_label      = top3[0]["label"]
    top_confidence = top3[0]["confidence"]
    recognised     = top_confidence >= 0.25

    return {
        "recognised":    recognised,
        "label":         top_label if recognised else "Unrecognised Sound",
        "closest_match": top_label,
        "confidence":    top_confidence,
        "top3":          top3
    }

# Music prediction —> returns top 3 + recognised flag
def predict_music(audio_path):
    """
    Returns a dict with:
      - recognised (bool)
      - label (str)
      - closest_match (str)
      - confidence (float)
      - top3 (list)
    """
    if music_model is None:
        return {
            "recognised":    False,
            "label":         "Model not loaded",
            "closest_match": "Model not loaded",
            "confidence":    0.0,
            "top3":          []
        }

    mel = preprocess_audio(audio_path, num_samples = 22050 * 30)

    with torch.no_grad():
        outputs       = music_model(mel)
        probabilities = torch.nn.functional.softmax(outputs, dim = 1)

        top3_confidences, top3_indices = torch.topk(probabilities, k = 3, dim = 1)

    top3 = []
    for i in range(3):
        idx   = top3_indices[0][i].item()
        conf  = round(top3_confidences[0][i].item(), 4)
        label = GENRES[idx].title()
        top3.append({"label": label, "confidence": conf})

    top_label      = top3[0]["label"]
    top_confidence = top3[0]["confidence"]
    recognised     = top_confidence >= 0.25

    return {
        "recognised":    recognised,
        "label":         top_label if recognised else "Unrecognised Sound",
        "closest_match": top_label,
        "confidence":    top_confidence,
        "top3":          top3
    }

# Spectrogram image generator
def generate_spectrogram_image(audio_path, save_path, title=None):
    """
    Generates a styled mel spectrogram image for a given audio stem.
    Saves to save_path and returns the path.
    Uses the magma colormap — looks great on dark-themed frontends.
    """
    try:
        y, sr = librosa.load(audio_path, sr = 22050)

        mel    = librosa.feature.melspectrogram(
            y = y, 
            sr = sr, 
            n_fft = 1024, 
            hop_length = 512, 
            n_mels = 128
        )

        mel_db = librosa.power_to_db(mel, ref = np.max)

        fig, ax = plt.subplots(figsize = (8, 3), facecolor = '#1a1a2e')
        ax.set_facecolor('#1a1a2e')

        img = librosa.display.specshow(
            mel_db,
            sr = sr,
            hop_length = 512,
            x_axis = 'time',
            y_axis = 'mel',
            cmap = 'magma',
            ax = ax
        )

        cbar = fig.colorbar(img, ax = ax, format = '%+2.0f dB')
        cbar.ax.yaxis.set_tick_params(color = 'white')
        plt.setp(cbar.ax.yaxis.get_ticklabels(), color = 'white', fontsize = 8)

        display_title = title or os.path.basename(audio_path).replace('.wav', '').title()
        ax.set_title(display_title, color = 'white', fontsize = 12, fontweight = 'bold', pad = 8)
        ax.tick_params(colors = 'white', labelsize = 8)
        ax.xaxis.label.set_color('white')
        ax.yaxis.label.set_color('white')

        for spine in ax.spines.values():
            spine.set_edgecolor('#444444')

        plt.tight_layout()

        os.makedirs(os.path.dirname(save_path) if os.path.dirname(save_path) else '.', exist_ok = True)
        plt.savefig(save_path, dpi = 120, bbox_inches = 'tight', facecolor = '#1a1a2e')
        plt.close(fig)

        return save_path

    except Exception as e:
        print(f"Spectrogram generation failed for {audio_path}: {e}")
        plt.close('all')
        return None