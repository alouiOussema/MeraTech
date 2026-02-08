import os
import sys
import json
import wave
import contextlib
from vosk import Model, KaldiRecognizer, SetLogLevel

# Disable Vosk logs
SetLogLevel(-1)

# Configuration
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "model")
SAMPLE_RATE = 16000

def load_model():
    if not os.path.exists(MODEL_PATH):
        print(json.dumps({"error": f"Model not found at {MODEL_PATH}"}))
        sys.exit(1)
    return Model(MODEL_PATH)

def process_audio(file_path):
    try:
        if not os.path.exists(file_path):
            return {"error": "Audio file not found"}

        model = load_model()
        
        # Open the audio file
        with wave.open(file_path, "rb") as wf:
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getcomptype() != "NONE":
                return {"error": "Audio file must be WAV format mono PCM."}
            
            rec = KaldiRecognizer(model, wf.getframerate())
            rec.SetWords(True)

            while True:
                data = wf.readframes(4000)
                if len(data) == 0:
                    break
                if rec.AcceptWaveform(data):
                    pass # We just want the final result
            
            res = json.loads(rec.FinalResult())
            return {"transcript": res.get("text", "")}

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: python stt_service.py <audio_file_path>"}))
        sys.exit(1)
    
    audio_file = sys.argv[1]
    result = process_audio(audio_file)
    print(json.dumps(result))
