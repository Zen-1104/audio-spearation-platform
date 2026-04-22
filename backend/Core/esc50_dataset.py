import os
import pandas as pd
import torch
import torchaudio
from torch.utils.data import Dataset

class ESC50Dataset(Dataset):
    def __init__(self, csv_file, audio_dir,
                 target_sample_rate = 22050,  # Standard freq
                 num_samples = 22050 * 5,     # Fixed length - 30 secs
                 augment = False):

        self.annotations        = pd.read_csv(csv_file)
        self.audio_dir          = audio_dir
        self.target_sample_rate = target_sample_rate
        self.num_samples        = num_samples
        self.augment            = augment

        self.mel_spectrogram = torchaudio.transforms.MelSpectrogram(
            sample_rate = target_sample_rate,
            n_fft = 1024,                          # Freq resolution
            hop_length = 512,                      # Time resolution
            n_mels = 128                           # Ouput height
        )

        # Only applied when augment = true
        self.freq_mask = torchaudio.transforms.FrequencyMasking(freq_mask_param = 20)
        self.time_mask = torchaudio.transforms.TimeMasking(time_mask_param = 40)

    def __len__(self):
        return len(self.annotations)

    def __getitem__(self, index):
        audio_path = os.path.join(
            self.audio_dir,
            self.annotations.iloc[index]['filename']
        )
        label = self.annotations.iloc[index]['target']

        try:
            signal, sr = torchaudio.load(audio_path)

        except Exception as e:
            print(f"Skipping corrupt file: {audio_path} — {e}")
            return self.__getitem__((index + 1) % len(self))

        # Resample if needed
        if sr != self.target_sample_rate:
            resampler = torchaudio.transforms.Resample(sr, self.target_sample_rate)
            signal    = resampler(signal)

        # Convert to mono
        if signal.shape[0] > 1:
            signal = torch.mean(signal, dim = 0, keepdim = True)

        # Trim to fixed length
        if signal.shape[1] > self.num_samples:
            signal = signal[:, :self.num_samples]

        elif signal.shape[1] < self.num_samples:
            num_missing = self.num_samples - signal.shape[1]
            signal = torch.nn.functional.pad(signal, (0, num_missing))

        # Compute mel spectrogram
        mel = self.mel_spectrogram(signal)

        # SpecAugment — only during training
        if self.augment:
            mel = self.freq_mask(mel)
            mel = self.time_mask(mel)
            mel = self.time_mask(mel)

        return mel, torch.tensor(label, dtype = torch.long)


if __name__ == "__main__":
    csv_path   = "data/esc50.csv"
    audio_path = "data/audio"

    if os.path.exists(csv_path) and os.path.exists(audio_path):
        dataset = ESC50Dataset(csv_path, audio_path, augment = False)
        print(f"Dataset size: {len(dataset)}")
        mel, label = dataset[0]
        print(f"Mel shape: {mel.shape}")
        print(f"Label: {label.item()}")

    else:
        print("ESC-50 dataset not found. Check your file paths.")