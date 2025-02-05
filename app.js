const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const multer = require('multer');
const path = require('path');
const opn = require('opn'); // Use 'opn' instead of 'open'

const app = express();
const port = process.env.PORT || 3000; // Use environment variable or default to 3000

// Database setup
const db = new sqlite3.Database('./database.db');

// Create table for quotations
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS quotations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      reference_number TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      marketer_name TEXT NOT NULL,
      pdf_file TEXT NOT NULL
    )
  `);
});

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
});

app.post('/submit', upload.single('pdf_file'), (req, res) => {
  const { reference_number, client_name, marketer_name } = req.body;
  const date = new Date().toISOString().split('T')[0];
  const pdf_file = req.file.filename;

  // Check if reference number exists
  db.get('SELECT * FROM quotations WHERE reference_number = ?', [reference_number], (err, row) => {
    if (err) return res.status(500).send('Database error');
    if (row) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
          <link rel="stylesheet" href="/css/styles.css">
        </head>
        <body>
          <div class="container mt-5">
            <div class="text-center mb-4">
              <img src="/images/logo.png" alt="Technochem Logo" class="company-logo">
            </div>
            <div class="alert alert-danger text-center">
              <h2>Error: Reference Number already exists!</h2>
              <a href="/" class="btn btn-primary mt-3">Go Back</a>
            </div>
          </div>
        </body>
        </html>
      `);
    }

    // Insert new quotation
    db.run(
      'INSERT INTO quotations (date, reference_number, client_name, marketer_name, pdf_file) VALUES (?, ?, ?, ?, ?)',
      [date, reference_number, client_name, marketer_name, pdf_file],
      (err) => {
        if (err) return res.status(500).send('Database error');
        res.send(`
          <!DOCTYPE html>
          <html>
          <head>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
            <link rel="stylesheet" href="/css/styles.css">
          </head>
          <body>
            <div class="container mt-5">
              <div class="text-center mb-4">
                <img src="/images/logo.png" alt="Technochem Logo" class="company-logo">
              </div>
              <div class="alert alert-success text-center">
                <h2>Your entry has been successfully submitted!</h2>
                <a href="/" class="btn btn-primary mt-3">Submit a New Entry</a>
              </div>
            </div>
          </body>
          </html>
        `);
      }
    );
  });
});

app.get('/list', (req, res) => {
  res.sendFile(path.join(__dirname, 'views/list.html'));
});

app.get('/api/list', (req, res) => {
  db.all('SELECT * FROM quotations ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).send('Database error');
    res.json(rows);
  });
});

app.get('/search', (req, res) => {
  const query = req.query.q.toLowerCase();
  db.all('SELECT * FROM quotations ORDER BY date DESC', (err, rows) => {
    if (err) return res.status(500).send('Database error');
    const results = rows.filter(
      (row) =>
        row.client_name.toLowerCase().includes(query) ||
        row.marketer_name.toLowerCase().includes(query) ||
        row.reference_number.toLowerCase().includes(query)
    );
    res.json(results);
  });
});

// Start server and open browser
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  opn(`http://localhost:${port}`); // Automatically open the browser
});