const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Explicit admin route as fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- VEHICLE ROUTES ---

// Get all vehicles
app.get('/api/vehicles', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM vehicles").all();
    const vehicles = rows.map(v => ({
      ...v,
      images: JSON.parse(v.images || '[]'),
      features: JSON.parse(v.features || '[]'),
      rentalRequirements: JSON.parse(v.rentalRequirements || '[]')
    }));
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update vehicle (price, name, etc.)
app.put('/api/vehicles/:id', (req, res) => {
  try {
    const { dailyRate, name, shortDescription } = req.body;
    const id = req.params.id;

    const updates = [];
    const values = [];
    if (dailyRate !== undefined) { updates.push('dailyRate = ?'); values.push(dailyRate); }
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (shortDescription !== undefined) { updates.push('shortDescription = ?'); values.push(shortDescription); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    const result = db.prepare(`UPDATE vehicles SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json({ success: true, updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add new vehicle
app.post('/api/vehicles', (req, res) => {
  try {
    const { id, name, type, category, seats, bags, dailyRate, image, transmission, shortDescription } = req.body;
    db.prepare(`
      INSERT INTO vehicles (id, name, type, category, seats, bags, dailyRate, image, transmission, shortDescription, images, features, rentalRequirements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', '[]', '[]')
    `).run(id, name, type, category, seats, bags, dailyRate, image, transmission, shortDescription);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- BOOKING ROUTES ---

// Submit new booking request
app.post('/api/bookings', (req, res) => {
  try {
    const { name, email, phone, pickupDate, returnDate, vehicleId, message } = req.body;
    const result = db.prepare(`
      INSERT INTO bookings (name, email, phone, pickupDate, returnDate, vehicleId, message)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name, email, phone, pickupDate, returnDate, vehicleId, message);
    res.json({ success: true, bookingId: result.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bookings
app.get('/api/bookings', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM bookings ORDER BY createdAt DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update booking status
app.put('/api/bookings/:id', (req, res) => {
  try {
    const { status } = req.body;
    const result = db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true, updated: result.changes });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
