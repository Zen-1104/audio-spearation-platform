import subprocess
import os

def separate_audio(file_path, output_dir = "separated"):
    """
    Runs Demucs htdemucs on the given audio file.
    Returns the path to the output stem folder, or None on failure.
    Called by app.py via run_demucs() — kept here as a standalone
    utility for testing separation independently.
    """
    print(f"Separating: {file_path}")

    command = [
        "python3", "-m", "demucs.separate",
        "-n", "htdemucs",
        "--out", output_dir,
        file_path
    ]

    result = subprocess.run(command, capture_output = True, text = True)

    if result.returncode == 0:
        base_name   = os.path.splitext(os.path.basename(file_path))[0]
        output_path = os.path.join(output_dir, "htdemucs", base_name)
        print(f"Success — stems at: {output_path}")
        return output_path
    
    else:
        print(f"Demucs failed:\n{result.stderr}")
        return None

if __name__ == "__main__":
    target = "test-audio.mp3"
    if os.path.exists(target):
        separate_audio(target)
    else:
        print(f"File not found: {target}")