const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(__dirname, 'public/uploads', req.body.path || '');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }

        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const filename = req.body.filename || file.originalname;
        cb(null, filename);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});


app.post('/upload', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const { path: relativePath, filename } = req.body;

        const publicUrl = `${process.env.BASE_URL}/uploads/${relativePath}/${filename}`;

        console.log('✅ File saved:', {
            path: relativePath,
            filename: filename,
            fullPath: req.file.path
        });

        res.json({
            success: true,
            url: publicUrl,
            path: relativePath,
            filename: filename,
            size: req.file.size,
            mimetype: req.file.mimetype
        });

    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({
            success: false,
            message: 'Upload failed',
            error: error.message
        });
    }
});

// ============================================================================
// ROUTE RETRIEVE (GET fichier par path)
// ============================================================================
app.get('/file/:path(*)', (req, res) => {
    try {
        const filePath = path.join(__dirname, 'public/uploads', req.params.path);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'File not found'
            });
        }

        // Envoyer le fichier
        res.sendFile(filePath);

    } catch (error) {
        console.error('❌ Retrieve error:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving file'
        });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'o2switch upload service',
        timestamp: new Date().toISOString()
    });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Upload Service Started`);
    console.log(`📡 Port: ${PORT}`);
    console.log(`📁 Upload dir: ${path.join(__dirname, 'public/uploads')}`);
    console.log(`🌐 Base URL: ${process.env.BASE_URL}`);
    console.log('\n');
});