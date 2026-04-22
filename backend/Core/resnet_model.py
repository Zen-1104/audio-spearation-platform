import torch
import torch.nn as nn
import torch.optim as optim
from torchvision.models import resnet18, ResNet18_Weights
from Core.esc50_dataset import ESC50Dataset
from torch.utils.data import DataLoader

class AudioResNet(nn.Module):
    def __init__(self, num_classes = 50):
        super(AudioResNet, self).__init__()

        self.resnet = resnet18(weights = ResNet18_Weights.DEFAULT)

        original_conv1 = self.resnet.conv1
        self.resnet.conv1 = nn.Conv2d(
            1, original_conv1.out_channels,
            kernel_size = original_conv1.kernel_size,
            stride = original_conv1.stride,
            padding = original_conv1.padding,
            bias = False
        )

        with torch.no_grad():
            self.resnet.conv1.weight = nn.Parameter(
            original_conv1.weight.mean(dim = 1, keepdim = True)
        )

        num_features = self.resnet.fc.in_features
        self.resnet.fc = nn.Sequential(
            nn.Dropout(p = 0.3),
            nn.Linear(num_features, num_classes)
        )

    def forward(self, x):
        return self.resnet(x)

def train_model():
    device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
    print(f"Initializing Training on device: {device.type.upper()}")

    # Load Model
    model = AudioResNet(num_classes = 50).to(device)
    
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)

    # Load Data
    print("Loading ESC-50 Dataset...")
    csv_path = "data/esc50.csv"
    audio_path = "data/audio"
    dataset = ESC50Dataset(csv_path, audio_path)
    dataloader = DataLoader(dataset, batch_size = 32, shuffle = True)
    
    print("Starting Training Loop (Testing 1 Epoch)...")
    model.train()
    
    running_loss = 0.0
    for i, (spectrograms, labels) in enumerate(dataloader):
        spectrograms, labels = spectrograms.to(device), labels.to(device)
        
        optimizer.zero_grad()
        
        # Making a guess
        outputs = model(spectrograms)
        
        # Loss calculator
        loss = criterion(outputs, labels)
        
        # Learning from the mistake
        loss.backward()
        
        # updating the weights
        optimizer.step()
        
        running_loss += loss.item()
        
        # Print an update every 10 batches
        if (i + 1) % 10 == 0:
            print(f"Batch [{i+1}/{len(dataloader)}] - Loss: {running_loss / 10:.4f}")
            running_loss = 0.0
            
    print("Training epoch complete. Pipeline is fully functional.")
    
    # For saving the brain of the model
    torch.save(model.state_dict(), "esc50_resnet_v1.pth")
    print("Model saved to esc50_resnet_v1.pth")

if __name__ == "__main__":
    train_model()