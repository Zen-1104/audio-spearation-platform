import os
import time

import sys
sys.stdout.flush()
sys.stderr.flush()

import zipfile
import io
from flask import send_file

# Path fix
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.path.exists(BASE_DIR) and os.path.isdir(os.path.join(BASE_DIR, 'Core')):
    os.chdir(BASE_DIR)
    sys.path.insert(0, BASE_DIR)

else:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

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
    "https://audio-separation-platform.vercel.app",
    "https://audio-separation-platform-ten.vercel.app",
    "https://zen-4011-audio-separation-model.hf.space",
    "http://localhost:5001",
    "http://localhost:3000"
])

# All paths under /tmp (writable on Cloud Run) 
TMP           = '/tmp'
UPLOAD_FOLDER = os.path.join(TMP, 'temp_uploads')
STEMS_BASE    = os.path.join(TMP, 'separated', 'htdemucs')
SPEC_FOLDER   = os.path.join(TMP, 'spectrograms')
ALLOWED_EXTS  = {'.wav', '.mp3', '.flac', '.ogg'}

os.makedirs(UPLOAD_FOLDER, exist_ok = True)
os.makedirs(STEMS_BASE,    exist_ok = True)
os.makedirs(SPEC_FOLDER,   exist_ok = True)

# Helpers
def allowed_file(filename):
    return os.path.splitext(filename.lower())[1] in ALLOWED_EXTS

def run_demucs(file_path):
    separated_out = os.path.join(TMP, 'separated')
    command = [
        sys.executable, "-m", "demucs.separate",
        "-n", "htdemucs",
        "--out", separated_out,
        file_path
    ]
    print(f"[CWD={os.getcwd()}] Running demucs on {file_path}")
    result = subprocess.run(command, capture_output = True, text = True)

    if result.returncode != 0:
        print(f"Demucs STDERR:\n{result.stderr}")
        print(f"Demucs STDOUT:\n{result.stdout}")
        return None

    base_name   = os.path.splitext(os.path.basename(file_path))[0]
    output_path = os.path.join(STEMS_BASE, base_name)

    if not os.path.isdir(output_path):
        print(f"Demucs ran but output folder missing: {output_path}")
        print(f"Contents of {os.path.join(TMP, 'separated')}: {os.listdir(os.path.join(TMP, 'separated'))}")
        return None

    return output_path, base_name

# Routes

@app.route('/', methods = ['GET'])
def index():
    readme_path = os.path.join(BASE_DIR, 'README.md')
    return send_file(readme_path, mimetype = 'text/plain')

@app.route('/api/health', methods = ['GET'])
def health_check():
    return jsonify({
        "status":        "ok",
        "models_loaded": models_are_loaded()
    }), 200

@app.route('/api/separate', methods = ['POST'])
def separate_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        file = request.files['audio']
        if file.filename == '':
            return jsonify({"error": "Empty filename"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Unsupported format. Use WAV, MP3, FLAC, or OGG."}), 422

        domain   = request.form.get('domain', 'auto')
        job_id   = str(uuid.uuid4())[:8]
        ext      = os.path.splitext(secure_filename(file.filename))[1]
        safe_name = f"{job_id}{ext}"
        save_path = os.path.join(UPLOAD_FOLDER, safe_name)
        file.save(save_path)
        print(f"CWD: {os.getcwd()}")
        print(f"Saved to: {save_path}")
        print(f"File exists: {os.path.exists(save_path)}")
        print(f"/tmp contents: {os.listdir('/tmp')}")
        print(f"[{job_id}] Saved upload to {save_path}")

        if domain == 'nature':
            return handle_nature(save_path, job_id)
        else:
            return handle_music(save_path, job_id)

    except Exception as e:
        import traceback
        print("=== SEPARATE ERROR ===")
        traceback.print_exc()
        print("=== END ERROR ===")
        return jsonify({"error": str(e)}), 500


def handle_nature(audio_path, job_id):
    print(f"[{job_id}] Nature classification...")
    start_time = time.time()

    try:
        result = predict_nature(audio_path)

    except Exception as e:
        return jsonify({"error": f"Classification failed: {str(e)}"}), 500

    spec_filename = f"{job_id}_full.png"
    spec_path     = os.path.join(SPEC_FOLDER, spec_filename)
    generate_spectrogram_image(audio_path, spec_path, title = "Full Recording")

    return jsonify({
        "job_id":          job_id,
        "domain_detected": "nature",
        "processing_time_seconds": round(time.time() - start_time, 1),
        "stems": [{
            "id":              f"{job_id}_full",
            "name":            "Full Recording",
            "label":           result["label"],
            "closest_match":   result["closest_match"],
            "top3":            result["top3"],
            "recognised":      result["recognised"],
            "confidence":      result["confidence"],
            "audio_url":       f"/api/audio/{os.path.basename(audio_path)}",
            "spectrogram_url": f"/api/spectrograms/{spec_filename}"
        }]
    }), 200


def handle_music(audio_path, job_id):
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

        spec_filename = f"{job_id}_{stem_name}.png"
        spec_path     = os.path.join(SPEC_FOLDER, spec_filename)
        generate_spectrogram_image(stem_file, spec_path, title = stem_name.title())

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


@app.route('/api/stems/<job_folder>/<stem_name>', methods = ['GET'])
def get_stem(job_folder, stem_name):
    directory = os.path.join(STEMS_BASE, job_folder)
    return send_from_directory(directory, stem_name)

@app.route('/api/audio/<filename>', methods = ['GET'])
def get_audio(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/api/spectrograms/<filename>', methods = ['GET'])
def get_spectrogram(filename):
    return send_from_directory(SPEC_FOLDER, filename)

@app.route('/api/download-all/<job_id>', methods = ['GET'])
def download_all_stems(job_id):
    job_folders = [
        f for f in os.listdir(STEMS_BASE)
        if os.path.isdir(os.path.join(STEMS_BASE, f))
    ]
    matched_folder = next((f for f in job_folders if f.startswith(job_id)), None)
    if not matched_folder:
        return jsonify({"error": "Job not found"}), 404

    folder_path = os.path.join(STEMS_BASE, matched_folder)
    zip_buffer  = io.BytesIO()

    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
        for stem_file in os.listdir(folder_path):
            if stem_file.endswith('.wav'):
                zf.write(os.path.join(folder_path, stem_file), stem_file)

    zip_buffer.seek(0)
    return send_file(
        zip_buffer,
        mimetype = 'application/zip',
        as_attachment = True,
        download_name = f'stems_{job_id}.zip'
    )

@app.route('/api/classify', methods = ['POST'])
def classify_audio():
    if 'audio' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file      = request.files['audio']
    domain    = request.form.get('domain', 'music')
    save_path = os.path.join(UPLOAD_FOLDER, secure_filename(file.filename))
    file.save(save_path)

    try:
        result = predict_nature(save_path) if domain == 'nature' else predict_music(save_path)

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