const express = require('express');
const router = express.Router();
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
ffmpeg.setFfmpegPath(ffmpegPath);
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configure upload
const upload = multer({ dest: 'uploads/' });

// STT Endpoint
router.post('/stt', upload.single('audio'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const inputPath = req.file.path;
  const outputPath = `${inputPath}.wav`;

  try {
    // 1. Convert audio to 16kHz mono PCM WAV
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .toFormat('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // 2. Call Python STT Service
    const pythonScript = path.join(__dirname, '../services/stt_service.py');
    
    // Check if python script exists
    if (!fs.existsSync(pythonScript)) {
        throw new Error(`Python script not found at ${pythonScript}`);
    }

    const pythonProcess = spawn('python', [pythonScript, outputPath]);

    let dataString = '';
    let errorString = '';

    pythonProcess.stdout.on('data', (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      errorString += data.toString();
    });

    await new Promise((resolve, reject) => {
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python process exited with code ${code}: ${errorString}`));
        } else {
          resolve();
        }
      });
    });

    // 3. Parse result
    try {
      const result = JSON.parse(dataString);
      res.json(result);
    } catch (e) {
      console.error("Failed to parse Python output:", dataString);
      res.status(500).json({ error: 'Failed to parse STT result', details: dataString });
    }

  } catch (error) {
    console.error('STT Error:', error);
    res.status(500).json({ error: 'STT processing failed', details: error.message });
  } finally {
    // Cleanup
    if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
  }
});

module.exports = router;
