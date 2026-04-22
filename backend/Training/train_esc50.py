import torch
import torch.nn as nn
import torch.optim as optim
import pandas as pd
from torch.utils.data import DataLoader, Subset
from Core.esc50_dataset import ESC50Dataset
from Core.resnet_model import AudioResNet

# Configuration
CSV_PATH      = "data/esc50.csv"
AUDIO_DIR     = "data/audio"
SAVE_PATH     = "Models/esc50_resnet_v1.pth"
BATCH_SIZE    = 32
NUM_EPOCHS    = 30
LEARNING_RATE = 0.001   
NUM_CLASSES   = 50

# Device
device = torch.device("mps" if torch.backends.mps.is_available() else "cpu")
print(f"Training on: {device.type.upper()}")

# Dataset
df = pd.read_csv(CSV_PATH)

train_indices = df[df['fold'] != 5].index.tolist()
val_indices   = df[df['fold'] == 5].index.tolist()

train_dataset = ESC50Dataset(CSV_PATH, AUDIO_DIR, augment = True)
val_dataset   = ESC50Dataset(CSV_PATH, AUDIO_DIR, augment = False)

train_set = Subset(train_dataset, train_indices)
val_set   = Subset(val_dataset,   val_indices)

train_loader = DataLoader(train_set, batch_size = BATCH_SIZE, shuffle = True,  num_workers = 0)
val_loader   = DataLoader(val_set,   batch_size = BATCH_SIZE, shuffle = False, num_workers = 0)

print(f"Train samples : {len(train_set)}")
print(f"Val samples   : {len(val_set)}")
print(f"Train folds   : 1, 2, 3, 4")
print(f"Val fold      : 5")

# Model
model = AudioResNet(num_classes = NUM_CLASSES).to(device)

# Freeze early layers
for param in model.resnet.parameters():
    param.requires_grad = False

# Unfreeze layers to learn high-level patterns
for param in model.resnet.layer3.parameters():
    param.requires_grad = True

for param in model.resnet.layer4.parameters():
    param.requires_grad = True

for param in model.resnet.fc.parameters():
    param.requires_grad = True

# Confirmation
trainable = sum(p.numel() for p in model.parameters() if p.requires_grad)
total     = sum(p.numel() for p in model.parameters())
print(f"Trainable params: {trainable:,} / {total:,} ({100 * trainable / total:.1f}%)")

# Loss detector
loss_function   = nn.CrossEntropyLoss()

model_optimizer = optim.Adam(
    filter(lambda p: p.requires_grad, model.parameters()),
    lr = LEARNING_RATE
)

scheduler = torch.optim.lr_scheduler.StepLR(
    model_optimizer, step_size = 7, gamma = 0.5
)

# Training Loop
best_val_accuracy = 0.0

for epoch in range(NUM_EPOCHS):

    # Train phase
    model.train()
    running_loss  = 0.0
    correct_train = 0
    total_train   = 0

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
    print(f"  Epoch [{epoch+1} / {NUM_EPOCHS}] Complete")
    print("-" * 55)
    print(f"  Train Accuracy : {train_accuracy:.2f}%")
    print(f"  Val Accuracy   : {val_accuracy:.2f}%")
    print(f"  Learning Rate  : {scheduler.get_last_lr()[0]:.6f}")

    # To save the best model
    if val_accuracy > best_val_accuracy:
        best_val_accuracy = val_accuracy
        torch.save(model.state_dict(), SAVE_PATH)
        print(f"  New best model saved — Val Accuracy: {val_accuracy:.2f}%")

    print("=" * 55 + "\n")

print(f"Training complete. Best val accuracy: {best_val_accuracy:.2f}%")
print(f"Model saved to: {SAVE_PATH}")