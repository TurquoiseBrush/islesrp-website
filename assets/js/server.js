const express = require("express");
const fs = require("fs");
const cors = require("cors");
const app = express();

app.use(express.json());
app.use(cors()); // Allow requests from your frontend

const LOG_FILE = "clicks.json";

// Load existing clicks
let clickData = [];
if (fs.existsSync(LOG_FILE)) {
  clickData = JSON.parse(fs.readFileSync(LOG_FILE, "utf8"));
}

// Endpoint to track clicks
app.post("/track-click", (req, res) => {
  const { text, url } = req.body;
  if (!text || !url) return res.status(400).send("Invalid data");

  // Log the click
  const clickEntry = { text, url, timestamp: new Date().toISOString() };
  clickData.push(clickEntry);
  fs.writeFileSync(LOG_FILE, JSON.stringify(clickData, null, 2));

  console.log("Logged click:", clickEntry);
  res.status(200).send("Click logged");
});

// View logs (for debugging)
app.get("/logs", (req, res) => {
  res.json(clickData);
});

// Start server on Render
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Click tracking server running on port ${PORT}`));
