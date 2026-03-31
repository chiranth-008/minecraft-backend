require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// Firebase Setup
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error("❌ No Firebase service account found");
}

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Routes
app.get('/', (req, res) => {
  res.json({ message: "🚀 Minecraft Backend is Running!" });
});

app.get('/api/sections', async (req, res) => {
  try {
    const snapshot = await db.collection('guide-sections').orderBy('order').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to load tips" });
  }
});

app.get('/api/comments', async (req, res) => {
  try {
    const snapshot = await db.collection('comments').orderBy('timestamp', 'desc').get();
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Failed to load comments" });
  }
});

app.post('/api/comments', async (req, res) => {
  try {
    const { name, message } = req.body;
    if (!message) return res.status(400).json({ error: "Message required" });

    await db.collection('comments').add({
      name: name || "Anonymous",
      message: message,
      timestamp: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save" });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
