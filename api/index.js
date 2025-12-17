const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();

app.use(cors());
app.use(bodyParser.json());

// Adjust paths for Vercel function environment (api/index.js is one level deep)
// But Vercel's runtime might set __dirname to /var/task/api.
// Root files like index.html are at /var/task.
// Safest is to use path.join(__dirname, '..', 'filename') if in api/.

const ROOT_DIR = path.join(__dirname, '..');

// Serve static files
app.use(express.static(ROOT_DIR));

// Configure Multer for Vercel (fallback to /tmp)
let uploadDir = path.join(ROOT_DIR, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
    fs.accessSync(uploadDir, fs.constants.W_OK);
} catch (e) {
    console.warn("Uploads dir read-only, switching to /tmp");
    uploadDir = path.join(require('os').tmpdir(), 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
}

// Serve from calculated uploadDir
app.use('/uploads', express.static(uploadDir));

// Use Memory Storage for Multer
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// In-Memory Fallback for Casos
const CASOS_FILE = path.join(ROOT_DIR, 'casos.js');
let memoryCasos = null; // Cache

function readCasos() {
    return new Promise((resolve, reject) => {
        if (memoryCasos) return resolve(memoryCasos); // Return cached

        fs.readFile(CASOS_FILE, 'utf8', (err, data) => {
            if (err) return reject(err);
            try {
                let cleanData = data.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                const startIndex = cleanData.indexOf('[');
                const endIndex = cleanData.lastIndexOf(']');
                if (startIndex === -1 || endIndex === -1) throw new Error('Invalid format');
                const jsonStr = cleanData.substring(startIndex, endIndex + 1);
                const casos = new Function('return ' + jsonStr)();

                memoryCasos = casos; // Initialize cache
                resolve(casos);
            } catch (e) {
                reject(e);
            }
        });
    });
}

function saveCasos(casosArray) {
    return new Promise((resolve) => {
        // Always update memory
        memoryCasos = casosArray;

        const jsonStr = JSON.stringify(casosArray, null, 4);
        const fileContent = `const casos = ${jsonStr};\n`;

        fs.writeFile(CASOS_FILE, fileContent, 'utf8', (err) => {
            if (err) {
                console.warn("Could not save to file (likely Vercel read-only). Data kept in memory.");
                // Resolve anyway so client doesn't see error
            }
            resolve();
        });
    });
}

// API Routes
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
        const newCasos = req.body; // Expecting array of cases
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

// Upload Endpoint
app.post('/api/upload', upload.single('ekgImage'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    // Generate filename manually
    const ext = path.extname(req.file.originalname);
    const name = path.basename(req.file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    const filename = name + '_' + Date.now() + ext;
    const targetPath = path.join(uploadDir, filename);

    // Write file to uploadDir
    fs.writeFile(targetPath, req.file.buffer, (err) => {
        if (err) {
            console.error("Error writing upload:", err);
            return res.status(500).json({ error: 'Failed to save file: ' + err.message });
        }
        console.log("File saved to:", targetPath);
        // Return relative path for frontend
        res.json({ filePath: 'uploads/' + filename });
    });
});

// Explicitly serve index.html for root
app.get('/', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// Explicitly serve other HTML pages
app.get('/editor.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'editor.html'));
});

app.get('/monitor.html', (req, res) => {
    res.sendFile(path.join(ROOT_DIR, 'monitor.html'));
});

module.exports = app;
