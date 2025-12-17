const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploads

// Configure Multer
const uploadDir = path.join(__dirname, 'uploads');
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir);
    }
} catch (e) {
    console.warn("Could not create uploads directory (likely read-only filesystem):", e.message);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        // Sanitize filename to avoid weird chars, preserve extension
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, name + '_' + Date.now() + ext)
    }
});

const upload = multer({ storage: storage });

const CASOS_FILE = path.join(__dirname, 'casos.js');

// Helper to read and parse casos.js
function readCasos() {
    return new Promise((resolve, reject) => {
        fs.readFile(CASOS_FILE, 'utf8', (err, data) => {
            if (err) return reject(err);
            // Extract the array logic. Assuming format: const casos = [ ... ];
            // We strip 'const casos =' and the trailing ';' if present.
            try {
                // Remove comments (simple regex, not perfect but works for standard JSON-like JS)
                let cleanData = data.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');

                // Find start of array
                const startIndex = cleanData.indexOf('[');
                const endIndex = cleanData.lastIndexOf(']');

                if (startIndex === -1 || endIndex === -1) {
                    throw new Error('Invalid format in casos.js');
                }

                const jsonStr = cleanData.substring(startIndex, endIndex + 1);
                // The content might be loose JS object (keys without quotes). JSON.parse requires strict JSON.
                // If the file is strictly valid JSON (keys quoted), JSON.parse works.
                // If not, we might need 'eval' or a looser parser. 
                // Currently casos.js HAS keys without quotes (e.g. paciente: "...").
                // So we use Function constructor to evaluate safely-ish.

                const casos = new Function('return ' + jsonStr)();
                resolve(casos);
            } catch (e) {
                reject(e);
            }
        });
    });
}

// Helper to save cases back to cases.js
function saveCasos(casosArray) {
    return new Promise((resolve, reject) => {
        // Convert to properly formatted JS string
        // We want to keep it readable, so keys unquoted if simple? 
        // Or just standard JSON is fine, JS is compatible with JSON.
        // Let's write it as JSON but assigned to variable.
        const jsonStr = JSON.stringify(casosArray, null, 4);
        const fileContent = `const casos = ${jsonStr};\n`;

        fs.writeFile(CASOS_FILE, fileContent, 'utf8', (err) => {
            if (err) return reject(err);
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
    // Return the relative path
    res.json({ filePath: 'uploads/' + req.file.filename });
});

// Start Server (only if direct execution)
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
