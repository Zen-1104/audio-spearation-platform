import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, random_split
from Core.gtzan_dataset import gtzan_dataset
from Core.resnet_model import AudioResNet

# Configuration
AUDIO_PATH      = "data/gtzan_data/genres_original"
SAVE_PATH       = "Models/gtzan_resnet_v1.pth"
BATCH_SIZE      = 32
NUM_EPOCHS      = 30
LEARNING_RATE   = 0.001
TRAIN_SPLIT     = 0.8
NUM_CLASSES     = 10

# Device Selection -> will use the device's CPU if it's not an Apple device.
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Training on: {device.type.upper()}")

# Dataset
dataset    = gtzan_dataset(AUDIO_PATH)
train_size = int(TRAIN_SPLIT * len(dataset))
val_size   = len(dataset) - train_size
train_set, val_set = random_split(dataset, [train_size, val_size])

train_loader = DataLoader(train_set, batch_size = BATCH_SIZE, shuffle = True)
val_loader   = DataLoader(val_set,   batch_size = BATCH_SIZE, shuffle = False)

print(f"Train samples: {train_size}  |  Val samples: {val_size}")

# Model
model     = AudioResNet(num_classes = NUM_CLASSES).to(device)
loss_function = nn.CrossEntropyLoss()
model_optimizer = optim.Adam(model.parameters(), lr = LEARNING_RATE)

# To prevent overconfidence
scheduler = torch.optim.lr_scheduler.StepLR(
    model_optimizer, step_size=5, gamma=0.5
)

# Training loop
best_val_accuracy = 0.0

for epoch in range(NUM_EPOCHS):

    # Training phase
    model.train()
    running_loss    = 0.0
    correct_train   = 0
    total_train     = 0

    for batch_index, (spectrograms, labels) in enumerate(train_loader):
        spectrograms = spectrograms.to(device)
        labels       = labels.to(device)

        model_optimizer.zero_grad()
        outputs = model(spectrograms)
        loss    = loss_function(outputs, labels)
        loss.backward()
        model_optimizer.step()

        running_loss  += loss.item()
        _, predicted   = torch.max(outputs, 1)
        correct_train += (predicted == labels).sum().item()
        total_train   += labels.size(0)

        if (batch_index + 1) % 5 == 0:
            print(f"  Epoch [{epoch + 1:02d} / {NUM_EPOCHS}] | "
                  f"Batch [{batch_index + 1:02d} / {len(train_loader)}] | "
                  f"Loss: {running_loss / (batch_index + 1):.4f} | "
                  f"LR: {scheduler.get_last_lr()[0]:.6f}")

    train_accuracy = 100 * correct_train / total_train

    # Validation Phase
    model.eval()
    correct_val = 0
    total_val   = 0

    with torch.no_grad():
        for spectrograms, labels in val_loader:
            spectrograms = spectrograms.to(device)
            labels       = labels.to(device)

            outputs      = model(spectrograms)
            _, predicted = torch.max(outputs, 1)
            correct_val += (predicted == labels).sum().item()
            total_val   += labels.size(0)

    val_accuracy = 100 * correct_val / total_val

    scheduler.step()

    print("\n" + "=" * 55)
    print(f"Epoch [{epoch + 1} / {NUM_EPOCHS}] Complete")
    print("-" * 55)
    print(f"- Train Accuracy       : {train_accuracy:.2f}%")
    print(f"- Validation Accuracy  : {val_accuracy:.2f}%")
    print(f"- Learning Rate        : {scheduler.get_last_lr()[0]:.6f}")

    # Save the best Model
    if val_accuracy > best_val_accuracy:
        best_val_accuracy = val_accuracy
        torch.save(model.state_dict(), SAVE_PATH)
        print(f"  New best model saved — Val Accuracy: {val_accuracy:.2f}%")

    print("=" * 55 + "\n")

print(f"\nTraining complete. Best validation accuracy: {best_val_accuracy:.2f}%")
print(f"Model saved to {SAVE_PATH}")