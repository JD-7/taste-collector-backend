// backend/server.js
const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const FILE_PATH = path.join(__dirname, 'submissions.json');

app.use(cors());
app.use(express.json());

// Ensure submissions.json exists
if (!fs.existsSync(FILE_PATH)) {
  fs.writeFileSync(FILE_PATH, '[]', 'utf8');
}

// POST /submit: append new submission
app.post('/submit', (req, res) => {
  const newSubmission = req.body;
  if (!newSubmission || !newSubmission.dish || !newSubmission.taste_vector || !newSubmission.user) {
    return res.status(400).json({ error: 'Invalid submission format' });
  }

  try {
    const existing = JSON.parse(fs.readFileSync(FILE_PATH, 'utf8'));
    existing.push(newSubmission);
    fs.writeFileSync(FILE_PATH, JSON.stringify(existing, null, 2));
    res.status(200).json({ status: 'saved' });
  } catch (err) {
    console.error('Error writing file:', err);
    res.status(500).json({ error: 'Failed to save submission' });
  }
});

// Health check
app.get('/', (req, res) => {
  res.send('Taste Collector backend is running.');
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// package.json
/*
{
  "name": "taste-collector-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "express": "^4.18.2"
  }
}
*/
