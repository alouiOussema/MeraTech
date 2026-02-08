import os
import urllib.request
import zipfile
import shutil
import sys

# Using the standard Arabic model which works reliably with Vosk
MODEL_URL = "https://alphacephei.com/vosk/models/vosk-model-ar-mgb2-0.4.zip"
MODEL_DIR = "model"
ZIP_FILE = "model.zip"

def download_and_extract():
    # Get current script directory
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)

    if os.path.exists(MODEL_DIR):
        print(f"Model directory '{MODEL_DIR}' already exists in {base_dir}.")
        return

    print(f"Downloading model from {MODEL_URL}...")
    try:
        urllib.request.urlretrieve(MODEL_URL, ZIP_FILE)
    except Exception as e:
        print(f"Failed to download model: {e}")
        sys.exit(1)

    print("Extracting model...")
    try:
        with zipfile.ZipFile(ZIP_FILE, 'r') as zip_ref:
            zip_ref.extractall(".")
    except Exception as e:
        print(f"Failed to extract model: {e}")
        sys.exit(1)

    # Vosk zip usually extracts to a folder with the model name
    extracted_folder = "vosk-model-ar-mgb2-0.4"
    if os.path.exists(extracted_folder):
        os.rename(extracted_folder, MODEL_DIR)
        print(f"Model extracted to '{MODEL_DIR}'.")
    else:
        print(f"Error: Expected extracted folder '{extracted_folder}' not found.")
        # List what is here
        print(f"Contents: {os.listdir('.')}")

    if os.path.exists(ZIP_FILE):
        os.remove(ZIP_FILE)

if __name__ == "__main__":
    download_and_extract()
