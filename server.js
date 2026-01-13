const express = require('express');
const fs = require('fs');
const path = require('path');

// Initialize Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Helper function to append data to JSON file
function appendToFile(filename, entry) {
  const filePath = path.join(__dirname, filename);
  let data = [];
  try {
    const fileContents = fs.readFileSync(filePath, 'utf8');
    data = JSON.parse(fileContents);
  } catch (err) {
    // File does not exist or is invalid; start with empty array
    data = [];
  }
  data.push(entry);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

// Endpoint to handle general contact form submissions
app.post('/api/contact', (req, res) => {
  const submission = {
    name: req.body.name || '',
    email: req.body.email || '',
    message: req.body.message || '',
    timestamp: new Date().toISOString(),
  };
  appendToFile('contact_submissions.json', submission);
  res.json({ success: true });
});

// Endpoint to handle quote requests
app.post('/api/quote', (req, res) => {
  // Load existing quotes to determine the next quote number
  const quotesPath = path.join(__dirname, 'quote_requests.json');
  let quotes = [];
  try {
    const fileContents = fs.readFileSync(quotesPath, 'utf8');
    quotes = JSON.parse(fileContents);
  } catch (err) {
    quotes = [];
  }
  // Generate next quote number (e.g., Q-001, Q-012)
  const nextNumber = quotes.length + 1;
  const quoteNumber = 'Q-' + String(nextNumber).padStart(3, '0');
  const submission = {
    quoteNumber,
    name: req.body.name || '',
    email: req.body.email || '',
    phone: req.body.phone || '',
    address: req.body.address || '',
    fenceType: req.body.fenceType || '',
    linearFootage: req.body.linearFootage || '',
    fenceHeight: req.body.fenceHeight || '',
    corners: req.body.corners || '',
    endpoints: req.body.endpoints || '',
    singleGates: req.body.singleGates || '',
    doubleGates: req.body.doubleGates || '',
    cantileverGates: req.body.cantileverGates || '',
    description: req.body.description || '',
    timestamp: new Date().toISOString(),
  };
  quotes.push(submission);
  fs.writeFileSync(quotesPath, JSON.stringify(quotes, null, 2));
  res.json({ success: true });
});

// Endpoint to update a note on a quote
app.post('/api/update-quote-note', (req, res) => {
  const { index, note } = req.body;
  const filePath = path.join(__dirname, 'quote_requests.json');
  let quotes = [];
  try {
    quotes = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read quote requests.' });
  }
  const idx = parseInt(index, 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= quotes.length) {
    return res.status(400).json({ error: 'Invalid index.' });
  }
  // Update note
  quotes[idx].note = note || '';
  fs.writeFileSync(filePath, JSON.stringify(quotes, null, 2));
  return res.json({ success: true });
});

// Endpoint to update a note on a contact submission
app.post('/api/update-contact-note', (req, res) => {
  const { index, note } = req.body;
  const filePath = path.join(__dirname, 'contact_submissions.json');
  let contacts = [];
  try {
    contacts = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read contact submissions.' });
  }
  const idx = parseInt(index, 10);
  if (Number.isNaN(idx) || idx < 0 || idx >= contacts.length) {
    return res.status(400).json({ error: 'Invalid index.' });
  }
  contacts[idx].note = note || '';
  fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
  return res.json({ success: true });
});

// Serve static files from the current directory
app.use(express.static(__dirname));

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Fury Fence backend running on port ${PORT}`);
});