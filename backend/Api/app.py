import os
import time
import sys
import zipfile
from flask import send_file
import io

# Path fix
os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import uuid
import subprocess
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename

from Core.inference import (
    predict_nature, predict_music,
    models_are_loaded, generate_spectrogram_image
)

app = Flask(__name__)
CORS(app, origins = [
    "https://audio-spearation-platform.vercel.app",
    "https://audio-spearation-platform-ten.vercel.app",
    "https://audio-spearation-platform-710uptim2-zen-1104s-projects.vercel.app",
    "http://localhost:5001",
    "http://localhost:3000"
])

UPLOAD_FOLDER = 'temp_uploads'
STEMS_BASE    = 'separated/htdemucs'
SPEC_FOLDER   = 'spectrograms'
ALLOWED_EXTS  = {'.wav', '.mp3', '.flac', '.ogg'}

os.makedirs(UPLOAD_FOLDER, exist_ok = True)
os.makedirs(STEMS_BASE,    exist_ok = True)
os.makedirs(SPEC_FOLDER,   exist_ok = True)

# Helpers 
def allowed_file(filename):
    return os.path.splitext(filename.lower())[1] in ALLOWED_EXTS

def run_demucs(file_path):
    """
    Runs Demucs htdemucs separation.
    Returns (output_folder_path, base_name) or None on failure.
    """
    command = [
        "python3", "-m", "demucs.separate",
        "-n", "htdemucs",
        "--out", "separated",
        file_path
    ]
    result = subprocess.run(command, capture_output = True, text = True)

    if result.returncode != 0:
        print(f"Demucs error:\n{result.stderr}")
        return None

    base_name   = os.path.splitext(os.path.basename(file_path))[0]
    output_path = os.path.join(STEMS_BASE, base_name)

    if not os.path.isdir(output_path):
        print(f"Demucs ran but output folder missing: {output_path}")
        return None

    return output_path, base_name

# Routes
@app.route('/api/health', methods = ['GET'])
def health_check():
    return jsonify({
        "status":        "ok",
        "models_loaded": models_are_loaded()
    }), 200

@app.route('/api/separate', methods = ['POST'])
def separate_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files['audio']
    if file.filename == '':
        return jsonify({"error": "Empty filename"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Unsupported format. Use WAV, MP3, FLAC, or OGG."}), 422

    domain  = request.form.get('domain', 'auto')
    job_id  = str(uuid.uuid4())[:8]

    ext       = os.path.splitext(secure_filename(file.filename))[1]
    safe_name = f"{job_id}{ext}"
    save_path = os.path.join(UPLOAD_FOLDER, safe_name)
    file.save(save_path)

    if domain == 'nature':
        return handle_nature(save_path, job_id)
    else:
        return handle_music(save_path, job_id)

def handle_nature(audio_path, job_id):
    """Nature path: classify full clip + generate one spectrogram."""
    print(f"[{job_id}] Nature classification...")
    start_time = time.time()

    try:
        result = predict_nature(audio_path)
    except Exception as e:
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500

    # Generate spectrogram for the full clip
    spec_filename = f"{job_id}_full.png"
    spec_path     = os.path.join(SPEC_FOLDER, spec_filename)
    generate_spectrogram_image(audio_path, spec_path, title="Full Recording")

    return jsonify({
        "job_id":          job_id,
        "domain_detected": "nature",
        "processing_time_seconds": round(time.time() - start_time, 1),
        "stems": [{
            "id":               f"{job_id}_full",
            "name":             "Full Recording",
            "label":            result["label"],            # Unrecognised Sound -> if below threshold
            "closest_match":    result["closest_match"],    # Closest match from the esc_50 dataset
            "top3":             result["top3"],             # Top 3 predictions to display
            "recognised":       result["recognised"],       # Whether the model crossed the confidence threshold
            "confidence":       result["confidence"],
            "audio_url":        f"/api/audio/{os.path.basename(audio_path)}",
            "spectrogram_url":  f"/api/spectrograms/{spec_filename}"
        }]
    }), 200

def handle_music(audio_path, job_id):
    """Music path: Demucs separation → classify each stem → spectrogram per stem."""
    print(f"[{job_id}] Running Demucs...")
    start_time = time.time()

    result = run_demucs(audio_path)
    if result is None:
        return jsonify({"error": "Separation failed. Please try a different file."}), 500

    output_folder, base_name = result
    stem_names = ["vocals", "drums", "bass", "other"]
    stems      = []

    for stem_name in stem_names:
        stem_file = os.path.join(output_folder, f"{stem_name}.wav")

        if not os.path.exists(stem_file):
            print(f"Stem missing: {stem_file} — skipping")
            continue

        try:
            prediction = predict_music(stem_file)

        except Exception as e:
            print(f"Classification failed for {stem_name}: {e}")
            prediction = {
                "recognised":    False,
                "label":         "Unknown",
                "closest_match": "Unknown",
                "confidence":    0.0,
                "top3":          []
            }

        # Generate spectrogram image for this stem
        spec_filename = f"{job_id}_{stem_name}.png"
        spec_path     = os.path.join(SPEC_FOLDER, spec_filename)
        generate_spectrogram_image(
            stem_file,
            spec_path,
            title=stem_name.title()
        )

        stems.append({
            "id":              f"{job_id}_{stem_name}",
            "name":            stem_name.title(),
            "label":           prediction["label"],
            "closest_match":   prediction["closest_match"],
            "top3":            prediction["top3"],
            "recognised":      prediction["recognised"],
            "confidence":      prediction["confidence"],
            "audio_url":       f"/api/stems/{base_name}/{stem_name}.wav",
            "spectrogram_url": f"/api/spectrograms/{spec_filename}"
        })

    if not stems:
        return jsonify({"error": "No stems produced. File may be too short or corrupted."}), 500

    return jsonify({
        "job_id":          job_id,
        "domain_detected": "music",
        "processing_time_seconds": round(time.time() - start_time, 1),
        "stems":           stems
    }), 200

@app.route('/api/stems/<job_folder>/<stem_name>', methods=['GET'])
def get_stem(job_folder, stem_name):
    directory = os.path.abspath(os.path.join(STEMS_BASE, job_folder))
    return send_from_directory(directory, stem_name)

@app.route('/api/audio/<filename>', methods=['GET'])
def get_audio(filename):
    directory = os.path.abspath(UPLOAD_FOLDER)
    return send_from_directory(directory, filename)

@app.route('/api/spectrograms/<filename>', methods=['GET'])
def get_spectrogram(filename):
    directory = os.path.abspath(SPEC_FOLDER)
    return send_from_directory(directory, filename)

@app.route('/api/download-all/<job_id>', methods=['GET'])
def download_all_stems(job_id):
    """Zip all stems for a job and return as download."""
    # Find the job folder in separated/htdemucs
    job_folders = [f for f in os.listdir(STEMS_BASE) if os.path.isdir(os.path.join(STEMS_BASE, f))]
    
    # Match by job_id prefix
    matched_folder = None
    for folder in job_folders:
        if folder.startswith(job_id):
            matched_folder = folder
            break
    
    if not matched_folder:
        return jsonify({"error": "Job not found"}), 404

    folder_path = os.path.join(STEMS_BASE, matched_folder)
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for stem_file in os.listdir(folder_path):
            if stem_file.endswith('.wav'):
                zf.write(os.path.join(folder_path, stem_file), stem_file)
    
    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype='application/zip',
        as_attachment=True,
        download_name=f'stems_{job_id}.zip'
    )

@app.route('/api/classify', methods = ['POST'])
def classify_audio():
    """Classify a single audio file directly."""
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file      = request.files['audio']
    domain    = request.form.get('domain', 'music')
    save_path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
    file.save(save_path)

    try:
        if domain == 'nature':
            result = predict_nature(save_path)
        else:
            result = predict_music(save_path)

    except Exception as e:
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500

    return jsonify({
        "label":         result["label"],
        "closest_match": result["closest_match"],
        "confidence":    result["confidence"],
        "recognised":    result["recognised"],
        "top3":          result["top3"]
    }), 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host = '0.0.0.0', port = port, debug = False)