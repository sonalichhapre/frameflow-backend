// FrameFlow Backend — server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const sharp = require('sharp');
const fs = require('fs');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false })); // CSP off so inline scripts work
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') || '*' }));
app.use(morgan('combined'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Static files (the FrameFlow frontend) ────────────────────────────────────
app.use(express.static(path.join(__dirname, 'public')));

// ── Upload storage ────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const OUTPUT_DIR = path.join(__dirname, 'outputs');
[UPLOAD_DIR, OUTPUT_DIR].forEach(d => fs.mkdirSync(d, { recursive: true }));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, WEBP, and HEIC images are supported.'));
    }
    cb(null, true);
  },
});

// ── In-memory job store (replace with Redis/DB for production) ────────────────
const jobs = new Map();

// ── Motion style configs ──────────────────────────────────────────────────────
const MOTION_STYLES = {
  'cinematic-pan':  { label: 'Cinematic Pan',  crop: { left: 0.05, top: 0,    width: 0.90, height: 1.00 } },
  'ken-burns':      { label: 'Ken Burns',       crop: { left: 0,    top: 0.05, width: 0.95, height: 0.95 } },
  'parallax-3d':    { label: 'Parallax 3D',     crop: { left: 0.02, top: 0.02, width: 0.96, height: 0.96 } },
  'zoom-burst':     { label: 'Zoom Burst',      crop: { left: 0.10, top: 0.10, width: 0.80, height: 0.80 } },
  'glitch-reveal':  { label: 'Glitch Reveal',   crop: { left: 0,    top: 0,    width: 1.00, height: 1.00 } },
  'slow-drift':     { label: 'Slow Drift',      crop: { left: 0.03, top: 0,    width: 0.97, height: 1.00 } },
};

const RESOLUTIONS = {
  '720p':  { width: 1280, height: 720 },
  '1080p': { width: 1920, height: 1080 },
  '4K':    { width: 3840, height: 2160 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function updateJob(id, patch) {
  jobs.set(id, { ...jobs.get(id), ...patch, updatedAt: Date.now() });
}

async function processImage(jobId, inputPath, style, resolution, format) {
  try {
    updateJob(jobId, { progress: 15, message: 'Analysing depth…' });
    await delay(400);

    const metadata = await sharp(inputPath).metadata();
    const { width: origW, height: origH } = metadata;

    updateJob(jobId, { progress: 40, message: 'Generating motion…' });
    await delay(600);

    // Apply style crop to simulate motion framing
    const cfg = MOTION_STYLES[style] || MOTION_STYLES['cinematic-pan'];
    const res = RESOLUTIONS[resolution] || RESOLUTIONS['1080p'];

    const cropLeft   = Math.round(cfg.crop.left   * origW);
    const cropTop    = Math.round(cfg.crop.top    * origH);
    const cropWidth  = Math.round(cfg.crop.width  * origW);
    const cropHeight = Math.round(cfg.crop.height * origH);

    updateJob(jobId, { progress: 70, message: 'Rendering frames…' });
    await delay(700);

    const outputFilename = `frameflow-${jobId}.${format === 'GIF' ? 'gif' : format === 'MOV' ? 'mov' : 'mp4'}.jpg`;
    const outputPath = path.join(OUTPUT_DIR, outputFilename);

    // Sharp processes the image: crop + resize to chosen resolution
    // (In production this step would call a real video encoder / AI model)
    await sharp(inputPath)
      .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
      .resize(res.width, res.height, { fit: 'cover', position: 'center' })
      .jpeg({ quality: 90 })
      .toFile(outputPath);

    updateJob(jobId, { progress: 90, message: 'Encoding video…' });
    await delay(400);

    updateJob(jobId, { progress: 100, message: 'Finalising…' });
    await delay(200);

    updateJob(jobId, {
      status: 'done',
      outputFilename,
      outputPath,
      label: `${cfg.label} · ${resolution} · ${format}`,
    });
  } catch (err) {
    console.error('Processing error:', err);
    updateJob(jobId, { status: 'error', message: err.message });
  } finally {
    // Clean up input after processing
    fs.unlink(inputPath, () => {});
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── API Routes ────────────────────────────────────────────────────────────────

// POST /api/generate  — upload image + kick off job
app.post('/api/generate', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded.' });

  const { style = 'cinematic-pan', resolution = '1080p', format = 'MP4' } = req.body;

  if (!MOTION_STYLES[style]) {
    return res.status(400).json({ error: `Unknown motion style: ${style}` });
  }
  if (!RESOLUTIONS[resolution]) {
    return res.status(400).json({ error: `Unknown resolution: ${resolution}` });
  }
  if (!['MP4', 'MOV', 'GIF'].includes(format)) {
    return res.status(400).json({ error: `Unknown format: ${format}` });
  }

  const jobId = uuidv4();
  jobs.set(jobId, {
    id: jobId,
    status: 'processing',
    progress: 0,
    message: 'Starting…',
    style,
    resolution,
    format,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Kick off async processing (don't await — return immediately)
  processImage(jobId, req.file.path, style, resolution, format);

  res.status(202).json({ jobId, message: 'Processing started.' });
});

// GET /api/jobs/:id  — poll job status
app.get('/api/jobs/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  res.json(job);
});

// GET /api/download/:id  — download processed file
app.get('/api/download/:id', (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found.' });
  if (job.status !== 'done') return res.status(400).json({ error: 'Job not complete yet.' });

  res.download(job.outputPath, job.outputFilename, (err) => {
    if (err) {
      console.error('Download error:', err);
      if (!res.headersSent) res.status(500).json({ error: 'Download failed.' });
    } else {
      // Clean up output file after download
      fs.unlink(job.outputPath, () => {});
      jobs.delete(job.id);
    }
  });
});

// POST /api/waitlist  — email collection
const waitlist = [];

app.post('/api/waitlist', (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  if (waitlist.find(e => e.email === email)) {
    return res.json({ message: 'You\'re already on the list!' });
  }
  waitlist.push({ email, joinedAt: new Date().toISOString() });
  console.log(`[waitlist] New signup: ${email} — total: ${waitlist.length}`);
  res.json({ message: 'You\'re on the list! We\'ll be in touch soon.' });
});

// GET /api/health  — Render health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    jobs: jobs.size,
    waitlist: waitlist.length,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/styles  — list supported motion styles
app.get('/api/styles', (req, res) => {
  res.json(Object.entries(MOTION_STYLES).map(([id, cfg]) => ({ id, label: cfg.label })));
});

// Fallback — serve index.html for client-side routing
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'File too large. Maximum size is 50 MB.' });
  }
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error.' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`FrameFlow backend running on port ${PORT}`);
  console.log(`Static frontend: http://localhost:${PORT}`);
  console.log(`Health check:    http://localhost:${PORT}/api/health`);
});
