const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files (extensions allows /admin to resolve to /admin.html)
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Explicit admin route as fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- VEHICLE ROUTES ---

// Get all vehicles
app.get('/api/vehicles', (req, res) => {
  db.all("SELECT * FROM vehicles", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const vehicles = rows.map(v => ({
      ...v,
      images: JSON.parse(v.images || '[]'),
      features: JSON.parse(v.features || '[]'),
      rentalRequirements: JSON.parse(v.rentalRequirements || '[]')
    }));
    res.json(vehicles);
  });
});

// Update vehicle (price, name, etc.)
app.put('/api/vehicles/:id', (req, res) => {
  const { dailyRate, name, shortDescription } = req.body;
  const id = req.params.id;
  
  // Build dynamic update
  const updates = [];
  const values = [];
  if (dailyRate !== undefined) { updates.push('dailyRate = ?'); values.push(dailyRate); }
  if (name !== undefined) { updates.push('name = ?'); values.push(name); }
  if (shortDescription !== undefined) { updates.push('shortDescription = ?'); values.push(shortDescription); }
  
  if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });
  
  values.push(id);
  db.run(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`, values, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

// Add new vehicle
app.post('/api/vehicles', (req, res) => {
  const { id, name, type, category, seats, bags, dailyRate, image, transmission, shortDescription } = req.body;
  const stmt = db.prepare(`
    INSERT INTO vehicles (id, name, type, category, seats, bags, dailyRate, image, transmission, shortDescription, images, features, rentalRequirements)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', '[]')
  `);
  stmt.run(id, name, type, category, seats, bags, dailyRate, image, transmission, shortDescription, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id });
  });
});

// --- BOOKING ROUTES ---

// Submit new booking request
app.post('/api/bookings', (req, res) => {
  const { name, email, phone, pickupDate, returnDate, vehicleId, message } = req.body;
  
  const stmt = db.prepare(`
    INSERT INTO bookings (name, email, phone, pickupDate, returnDate, vehicleId, message)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(name, email, phone, pickupDate, returnDate, vehicleId, message, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, bookingId: this.lastID });
  });
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  db.all("SELECT * FROM bookings ORDER BY createdAt DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Update booking status
app.put('/api/bookings/:id', (req, res) => {
  const { status } = req.body;
  db.run("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, updated: this.changes });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
