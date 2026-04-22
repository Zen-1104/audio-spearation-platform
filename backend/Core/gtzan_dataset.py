import os
import torch
import torchaudio
from torch.utils.data import Dataset, DataLoader

# alphabetically sorted to determine the numeric label, do not change the order.
GENRES  =  sorted(['blues', 'classical', 'country', 'disco', 'hiphop',
                 'jazz', 'metal', 'pop', 'reggae', 'rock'])

class gtzan_dataset(Dataset):
    def __init__(self, audio_path, target_sample_rate = 22050, num_samples = 22050 * 30):
        
        self.target_sample_rate  =  target_sample_rate
        self.num_samples  =  num_samples
        self.genre_to_index  =  {genre: index for index, genre in enumerate(GENRES)}

        self.mel_spectrogram  =  torchaudio.transforms.MelSpectrogram(
            sample_rate = target_sample_rate,

            n_fft = 1024,         # Freq resolution
            hop_length = 512,     # Time resolution
            n_mels = 64           # Output height
        )

        # To go down the file rabbit hole...
        self.samples  =  []
        for genre in GENRES:
            genre_folder  =  os.path.join(audio_path, genre)

            if not os.path.isdir(genre_folder):
                print(f"Warning: folder not found — {genre_folder}")
                continue

            for filename in os.listdir(genre_folder):
                if filename.endswith('.wav'):
                    filepath  =  os.path.join(genre_folder, filename)
                    label  =  self.genre_to_index[genre]
                    self.samples.append((filepath, label))

        print(f"gtzan Dataset loaded: {len(self.samples)} samples across {len(GENRES)} genres.")

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        audio_path, label  =  self.samples[index]

        try:
            signal, sample_rate  =  torchaudio.load(audio_path)
        except Exception as e:
            print(f"\nSkipping corrupt files:  {audio_path} - {e}\n")
            return self.__getitem__((index + 1) % len(self.samples))

        # Resample if needed
        if sample_rate !=  self.target_sample_rate:
            resampler  =  torchaudio.transforms.Resample(sample_rate, self.target_sample_rate)
            signal  =  resampler(signal)

        # Convert to mono if stereo
        if signal.shape[0] > 1:
            signal  =  torch.mean(signal, dim = 0, keepdim = True)

        # Trim to fixed length
        if signal.shape[1] > self.num_samples:
            signal  =  signal[:, :self.num_samples]

        elif signal.shape[1] < self.num_samples:
            num_missing  =  self.num_samples - signal.shape[1]
            signal  =  torch.nn.functional.pad(signal, (0, num_missing))

        # Convert waveform to spectpgram
        mel  =  self.mel_spectrogram(signal)

        return mel, torch.tensor(label)

    def get_genre_name(self, idx):
        """Convert numeric label back to genre name — useful for inference."""
        return GENRES[idx]


if __name__  ==  "__main__":
    audio_path  =  "data/gtzan_data/genres_original"

    if os.path.exists(audio_path):
        dataset  =  gtzan_dataset(audio_path)
        dataloader  =  DataLoader(dataset, batch_size = 4, shuffle = True)

        spectrograms, labels  =  next(iter(dataloader))
        print(f"Batch spectrogram shape: {spectrograms.shape}")
        print(f"Batch labels: {labels}")
        print(f"Genres: {[dataset.get_genre_name(l.item()) for l in labels]}")

    else:
        print(f"Folder not found at {audio_path} — check your path.")