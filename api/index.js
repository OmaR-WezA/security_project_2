import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { initDB } from './db.js';
import { hashPassword, comparePassword, generateKeyPair } from './security.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve Static Files
app.use(express.static(path.join(__dirname, '../frontend')));

// Root Route - Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Automatic Initialization at startup for ease of use
initDB().catch(console.error);

// --- Initialization Route ---

app.get('/api/init', async (req, res) => {
    try {
        await initDB();
        res.json({ message: 'Database initialized successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Auth Routes ---

app.post('/api/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await hashPassword(password);
        const { publicKeyPem, privateKeyPem } = generateKeyPair();

        await pool.query(
            'INSERT INTO users (username, password_hash, public_key) VALUES (?, ?, ?)',
            [username, hashedPassword, publicKeyPem]
        );

        res.status(201).json({
            message: 'User registered',
            privateKey: privateKeyPem // In a real app, user should download/save this
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (rows.length === 0) return res.status(401).json({ error: 'User not found' });

        const user = rows[0];
        const match = await comparePassword(password, user.password_hash);

        if (!match) return res.status(401).json({ error: 'Invalid password' });

        const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { id: user.id, username: user.username, publicKey: user.public_key } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- User Routes ---

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT id, username, public_key FROM users');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- Messaging Routes ---

app.post('/api/messages/send', async (req, res) => {
    try {
        const { senderId, receiverId, ciphertext } = req.body;
        const [result] = await pool.query(
            'INSERT INTO messages (sender_id, receiver_id, ciphertext) VALUES (?, ?, ?)',
            [senderId, receiverId, ciphertext]
        );
        res.status(201).json({ message: 'Message sent', id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/messages/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query(`
            SELECT m.*, u.username as sender_name 
            FROM messages m 
            JOIN users u ON m.sender_id = u.id 
            WHERE m.receiver_id = ? OR m.sender_id = ?
            ORDER BY m.timestamp ASC`,
            [userId, userId]
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
