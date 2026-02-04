const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.set('view engine', 'ejs');

// Load ROOT_PATHS from config.json
const configPath = path.join(__dirname, 'config.json');
let ROOT_PATHS = [];

try {
    const configData = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configData);

    if (Array.isArray(config.ROOT_PATHS)) {
        ROOT_PATHS = config.ROOT_PATHS;
    } else {
        console.error("ROOT_PATHS missing or not an array in config.json");
    }
} catch (err) {
    console.error("Failed to load config.json:", err);
}

// Helper to encode/decode paths for URLs
const encodePath = (p) => Buffer.from(p).toString('base64');
const decodePath = (p) => Buffer.from(p, 'base64').toString('utf8');

// 1. FILE BROWSER ROUTE
app.get('/', (req, res) => {
    const queryDir = req.query.dir ? decodePath(req.query.dir) : null;

    let items = { directories: [], files: [] };
    let parentDir = null;
    let currentTitle = "My Movie Archives";

    if (!queryDir) {
        // Show Root Archive Locations
        ROOT_PATHS.forEach(p => {
            if (fs.existsSync(p)) {
                items.directories.push({ name: p, fullPath: p });
            }
        });
    } else {
        // Show Contents of Selected Folder
        try {
            currentTitle = queryDir;
            const files = fs.readdirSync(queryDir);

            // Calculate parent directory if not at a root
            if (!ROOT_PATHS.includes(queryDir)) {
                parentDir = encodePath(path.dirname(queryDir));
            }

            files.forEach(file => {
                const fullPath = path.join(queryDir, file);
                try {
                    const stats = fs.statSync(fullPath);
                    if (stats.isDirectory()) {
                        items.directories.push({ name: file, fullPath });
                    } else if (file.toLowerCase().endsWith('.mp4')) {
                        items.files.push({ name: file, fullPath });
                    }
                } catch (e) { /* Skip restricted files */ }
            });
        } catch (err) {
            return res.status(500).send("Drive or Folder not accessible.");
        }
    }

    res.render('index', {
        items,
        parentDir,
        currentDirName: queryDir || "My Movie Archives",
        encodePath
    });
});

// 2. PLAYER PAGE
app.get('/player', (req, res) => {
    const filePath = decodePath(req.query.path);
    const folder = path.dirname(filePath);

    const files = fs.readdirSync(folder)
        .filter(f => f.toLowerCase().endsWith('.mp4'))
        .sort((a, b) => a.localeCompare(b));

    const currentName = path.basename(filePath);
    const index = files.indexOf(currentName);

    const playlist = files.map(f => ({
        encoded: encodePath(path.join(folder, f)),
        name: f
    }));

    res.render('player', {
        filename: currentName,
        encodedPath: req.query.path,
        playlist,
        index,
        parentDirEncoded: encodePath(folder)
    });
});

// 3. STREAMING ENGINE
app.get('/video-stream', (req, res) => {
    const videoPath = decodePath(req.query.path);

    if (!fs.existsSync(videoPath)) return res.status(404).send('File not found');



    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    if (!range || range.startsWith('bytes=0-')) {
        console.log(`[WATCHED] File: ${videoPath} | IP: ${clientIp} | Time: ${new Date().toLocaleString()}`);
    }

    if (range) {
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(videoPath, { start, end });

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunksize,
            'Content-Type': 'video/mp4',
        });
        file.pipe(res);
    } else {
        res.writeHead(200, {
            'Content-Length': fileSize,
            'Content-Type': 'video/mp4',
        });
        fs.createReadStream(videoPath).pipe(res);
    }
});

app.listen(3000, () => console.log('Movie Archive running: http://localhost:3000'));
