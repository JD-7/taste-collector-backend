const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const RATINGS_FILE = path.join(__dirname, 'ratings.json');

app.use(cors());
app.use(express.json());

app.post('/submit-rating', (req, res) => {
  const { user, dish, taste_vector, notes, timestamp } = req.body;

  // Basic validation
  if (
    !user || typeof user !== 'string' ||
    !dish || typeof dish !== 'string' ||
    !Array.isArray(taste_vector) || taste_vector.length !== 6
  ) {
    return res.status(400).json({ status: 'error', message: 'Invalid submission data' });
  }

  const entry = { user, dish, taste_vector, notes: notes || "", timestamp };
  console.log('✅ New submission received:', entry);

  // Read existing file (or initialize empty array)
  fs.readFile(RATINGS_FILE, 'utf8', (readErr, data) => {
    let ratings = [];
    if (!readErr && data) {
      try {
        ratings = JSON.parse(data);
      } catch (e) {
        console.error("⚠️ Failed to parse existing ratings file:", e);
      }
    }

    ratings.push(entry);

    fs.writeFile(RATINGS_FILE, JSON.stringify(ratings, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("❌ Failed to write file:", writeErr);
        return res.status(500).json({ status: 'error', message: 'File write failed' });
      }
      res.json({ status: 'success' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
