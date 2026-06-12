const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE SETUP (auto-seeds if empty) ---
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY, name TEXT, type TEXT, category TEXT,
    seats INTEGER, bags INTEGER, doors INTEGER, transmission TEXT,
    fuelType TEXT, dailyRate INTEGER, image TEXT, images TEXT,
    bestFor TEXT, shortDescription TEXT, fullDescription TEXT,
    description TEXT, features TEXT, rentalRequirements TEXT,
    deposit TEXT, mileagePolicy TEXT, fuelPolicy TEXT,
    pickupDropoff TEXT, turoLink TEXT, turoRating REAL, turoTrips INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT NOT NULL,
    pickupDate TEXT NOT NULL, returnDate TEXT NOT NULL,
    vehicleId TEXT, message TEXT, status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Auto-seed vehicles if table is empty
const count = db.prepare("SELECT COUNT(*) as cnt FROM vehicles").get().cnt;
if (count === 0) {
  console.log("Database empty — seeding vehicles from fleet.js...");
  const content = fs.readFileSync(path.join(__dirname, 'public', 'fleet.js'), 'utf8');
  const code = content.replace(/export /g, '');
  // Use Function constructor to evaluate safely
  const fn = new Function(code + '; return vehicles;');
  const vehicleList = fn();

  const stmt = db.prepare(`
    INSERT INTO vehicles (id, name, type, category, seats, bags, doors, transmission,
      fuelType, dailyRate, image, images, bestFor, shortDescription, fullDescription,
      description, features, rentalRequirements, deposit, mileagePolicy, fuelPolicy,
      pickupDropoff, turoLink, turoRating, turoTrips)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertAll = db.transaction((list) => {
    for (const v of list) {
      stmt.run(
        v.id, v.name, v.type, v.category, v.seats, v.bags,
        v.doors || null, v.transmission || null, v.fuelType || null,
        v.dailyRate, v.image, JSON.stringify(v.images || []),
        v.bestFor || null, v.shortDescription || null, v.fullDescription || null,
        v.description || null, JSON.stringify(v.features || []),
        JSON.stringify(v.rentalRequirements || []),
        v.deposit || null, v.mileagePolicy || null, v.fuelPolicy || null,
        v.pickupDropoff || null, v.turoLink || null,
        v.turoRating || null, v.turoTrips || null
      );
    }
  });

  insertAll(vehicleList);
  console.log(`Seeded ${vehicleList.length} vehicles!`);
}

// Serve frontend files
app.use(express.static(path.join(__dirname, 'public'), { extensions: ['html'] }));

// Explicit admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// --- VEHICLE ROUTES ---

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

app.get('/api/bookings', (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM bookings ORDER BY createdAt DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
