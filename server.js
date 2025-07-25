const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch'); // for GitHub sync

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

    fs.writeFile(RATINGS_FILE, JSON.stringify(ratings, null, 2), async (writeErr) => {
      if (writeErr) {
        console.error("❌ Failed to write file:", writeErr);
        return res.status(500).json({ status: 'error', message: 'File write failed' });
      }

      try {
        await pushToGitHub(JSON.stringify(ratings, null, 2));
      } catch (err) {
        console.error("⚠️ GitHub sync failed:", err);
      }

      res.json({ status: 'success' });
    });
  });
});

app.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});

async function pushToGitHub(fileContent) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const apiUrl = `https://api.github.com/repos/JD-7/taste-collector-backend/contents/ratings.json`;

  // Get existing SHA
  const getRes = await fetch(apiUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    }
  });
  const existing = await getRes.json();
  const sha = existing.sha;

  // Push update
  const commitRes = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json"
    },
    body: JSON.stringify({
      message: "🔄 Auto-update ratings.json",
      content: Buffer.from(fileContent).toString("base64"),
      sha,
      branch: "master"
    })
  });

  const result = await commitRes.json();
  console.log("📦 Pushed to GitHub:", result.commit?.html_url || result);
}
