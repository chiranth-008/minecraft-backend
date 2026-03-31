require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS - Allow your GitHub Pages site
app.use(cors({
  origin: ['https://chiranth-008.github.io', '*'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// ==================== Firebase Setup ====================
let serviceAccount;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } else {
        serviceAccount = require('./firebase-service-account.json');
    }
    console.log("✅ Firebase service account loaded successfully");
} catch (err) {
    console.error("❌ Firebase setup error:", err.message);
    console.error("Make sure FIREBASE_SERVICE_ACCOUNT env var is set correctly on Render");
}

// Initialize Firebase
initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// ==================== Routes ====================

// Health Check
app.get('/', (req, res) => {
    res.json({ 
        message: "🚀 Minecraft Backend is Running!",
        status: "Connected to Firebase"
    });
});

// Get Live Tips (from guide-sections collection)
app.get('/api/sections', async (req, res) => {
    try {
        const snapshot = await db.collection('guide-sections')
            .orderBy('order', 'asc')
            .get();
        
        const sections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(sections);
    } catch (error) {
        console.error("Error fetching sections:", error);
        res.status(500).json({ error: "Failed to load tips from database" });
    }
});

// Get All Community Comments
app.get('/api/comments', async (req, res) => {
    try {
        const snapshot = await db.collection('comments')
            .orderBy('timestamp', 'desc')
            .get();

        const comments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        res.status(500).json({ error: "Failed to load comments" });
    }
});

// Add New Comment
app.post('/api/comments', async (req, res) => {
    try {
        const { name, message } = req.body;

        if (!message || message.trim() === "") {
            return res.status(400).json({ error: "Message is required" });
        }

        const newComment = {
            name: (name || "Anonymous").trim(),
            message: message.trim(),
            timestamp: new Date().toISOString()
        };

        await db.collection('comments').add(newComment);

        res.json({ success: true, message: "Comment saved successfully!" });
    } catch (error) {
        console.error("Error saving comment:", error);
        res.status(500).json({ error: "Failed to save comment" });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Minecraft Backend running on http://localhost:${PORT}`);
});
