const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from 'public' directory
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Storage Engine Configuration
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Check File Type
function checkFileType(file, cb) {
    // Allowed ext
    const filetypes = /jpeg|jpg|png|gif|mp4|mov|avi/;
    // Check ext
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    // Check mime
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images/Videos Only!');
    }
}

// Init Upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 100000000 }, // 100MB limit
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('media'); // 'media' is the field name

// Routes

// Get all logs
app.get('/api/logs', (req, res) => {
    const sql = "SELECT * FROM logs ORDER BY created_at DESC";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// Create a new log with optional media
app.post('/api/logs', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
            res.status(400).json({ msg: err });
        } else {
            const { type, title, content } = req.body;
            let media_url = null;

            if (req.file) {
                media_url = `/uploads/${req.file.filename}`;
            }

            const sql = 'INSERT INTO logs (type, title, content, media_url) VALUES (?,?,?,?)';
            const params = [type, title, content, media_url];

            db.run(sql, params, function (err, result) {
                if (err) {
                    res.status(400).json({ "error": err.message });
                    return;
                }
                res.json({
                    "message": "success",
                    "data": {
                        id: this.lastID,
                        type,
                        title,
                        content,
                        media_url
                    }
                });
            });
        }
    });
});

// Delete a log
app.delete('/api/logs/:id', (req, res) => {
    const sql = 'DELETE FROM logs WHERE id = ?';
    const params = [req.params.id];
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({ "message": "deleted", changes: this.changes });
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
