const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const ROOT_DIR = path.join(__dirname, '..');

// ─── Static Files ────────────────────────────────────────
app.use(express.static(ROOT_DIR));

// ─── Upload Directory ────────────────────────────────────
let uploadDir = path.join(ROOT_DIR, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    fs.accessSync(uploadDir, fs.constants.W_OK);
} catch (e) {
    console.warn('Uploads dir read-only, switching to /tmp');
    uploadDir = path.join(require('os').tmpdir(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
}
app.use('/uploads', express.static(uploadDir));

const storage = multer.memoryStorage();
const upload = multer({ storage });

// ─── Redis / KV Setup ────────────────────────────────────
// Uses Upstash Redis in production (Vercel), falls back to local file in dev.
const KV_KEY = 'simcardio:casos';

let redisClient = null;

function getRedis() {
    if (redisClient) return redisClient;

    const url   = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (url && token) {
        try {
            const { Redis } = require('@upstash/redis');
            redisClient = new Redis({ url, token });
            console.log('✅ Upstash Redis connected');
        } catch (e) {
            console.warn('⚠️  Could not initialize Redis:', e.message);
        }
    } else {
        console.log('ℹ️  No Redis credentials found — using local file fallback');
    }

    return redisClient;
}

// ─── Local File Fallback ──────────────────────────────────
const CASOS_FILE = path.join(ROOT_DIR, 'casos.js');
let memoryCasos = null;

function readCasosFromFile() {
    return new Promise((resolve, reject) => {
        if (memoryCasos) return resolve(memoryCasos);

        fs.readFile(CASOS_FILE, 'utf8', (err, data) => {
            if (err) return reject(err);
            try {
                let clean = data.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                const start = clean.indexOf('[');
                const end   = clean.lastIndexOf(']');
                if (start === -1 || end === -1) throw new Error('Invalid format');
                const casos = new Function('return ' + clean.substring(start, end + 1))();
                memoryCasos = casos;
                resolve(casos);
            } catch (e) {
                reject(e);
            }
        });
    });
}

function saveCasosToFile(casosArray) {
    return new Promise((resolve) => {
        memoryCasos = casosArray;
        const content = `const casos = ${JSON.stringify(casosArray, null, 4)};\n`;
        fs.writeFile(CASOS_FILE, content, 'utf8', (err) => {
            if (err) console.warn('Could not save to file (read-only). Kept in memory.');
            resolve();
        });
    });
}

// ─── Unified Read / Write ─────────────────────────────────
async function readCasos() {
    const redis = getRedis();

    if (redis) {
        try {
            const data = await redis.get(KV_KEY);
            if (data) {
                // Upstash auto-parses JSON; if it's already an array, use it directly
                return Array.isArray(data) ? data : JSON.parse(data);
            }
            // First run: seed Redis from the local file
            console.log('ℹ️  Redis empty — seeding from casos.js');
            const casos = await readCasosFromFile();
            await redis.set(KV_KEY, JSON.stringify(casos));
            return casos;
        } catch (e) {
            console.error('Redis read error, falling back to file:', e.message);
        }
    }

    // Fallback
    return readCasosFromFile();
}

async function saveCasos(casosArray) {
    const redis = getRedis();

    if (redis) {
        try {
            await redis.set(KV_KEY, JSON.stringify(casosArray));
            console.log(`✅ Saved ${casosArray.length} cases to Redis`);
            return;
        } catch (e) {
            console.error('Redis write error, falling back to file:', e.message);
        }
    }

    return saveCasosToFile(casosArray);
}

// ─── API Routes ───────────────────────────────────────────
app.get('/api/casos', async (req, res) => {
    try {
        const casos = await readCasos();
        res.json(casos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error reading cases' });
    }
});

app.post('/api/casos', async (req, res) => {
    try {
        const newCasos = req.body;
        if (!Array.isArray(newCasos)) {
            return res.status(400).json({ error: 'Expected an array of cases' });
        }
        await saveCasos(newCasos);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error saving cases' });
    }
});

// Health / status endpoint
app.get('/api/status', (req, res) => {
    const redis = getRedis();
    res.json({
        storage: redis ? 'upstash-redis' : 'local-file',
        timestamp: new Date().toISOString()
    });
});

// ─── Upload ────────────────────────────────────────────────
app.post('/api/upload', upload.single('ekgImage'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ext      = path.extname(req.file.originalname);
    const name     = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${name}_${Date.now()}${ext}`;
    const target   = path.join(uploadDir, filename);

    fs.writeFile(target, req.file.buffer, (err) => {
        if (err) {
            console.error('Error writing upload:', err);
            return res.status(500).json({ error: 'Failed to save file: ' + err.message });
        }
        res.json({ filePath: 'uploads/' + filename });
    });
});

// ─── Static HTML Pages ────────────────────────────────────
app.get('/',            (req, res) => res.sendFile(path.join(ROOT_DIR, 'index.html')));
app.get('/editor.html', (req, res) => res.sendFile(path.join(ROOT_DIR, 'editor.html')));
app.get('/monitor.html',(req, res) => res.sendFile(path.join(ROOT_DIR, 'monitor.html')));

module.exports = app;
