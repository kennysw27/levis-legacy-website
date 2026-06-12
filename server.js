const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const multer = require('multer');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E6) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|gif/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    cb(null, ext && mime);
  }
});

// Email notification setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || ''
  }
});

async function sendBookingNotification(booking) {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log('Email not configured — skipping notification.');
    return;
  }

  const vehicleName = booking.vehicleId || 'No preference';

  try {
    await transporter.sendMail({
      from: `"Levi's Legacy Website" <${process.env.EMAIL_USER}>`,
      to: process.env.NOTIFY_EMAIL || process.env.EMAIL_USER,
      subject: `🚗 New Booking Request from ${booking.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #162033; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0; color: #c9a45c;">New Booking Request!</h2>
          </div>
          <div style="background: white; padding: 24px; border: 1px solid #eee; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; color: #888; width: 130px;">Customer</td><td style="padding: 8px 0; font-weight: bold;">${booking.name}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${booking.email}">${booking.email}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Phone</td><td style="padding: 8px 0;"><a href="tel:${booking.phone}">${booking.phone}</a></td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Vehicle</td><td style="padding: 8px 0;">${vehicleName}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Pickup Date</td><td style="padding: 8px 0;">${booking.pickupDate}</td></tr>
              <tr><td style="padding: 8px 0; color: #888;">Return Date</td><td style="padding: 8px 0;">${booking.returnDate}</td></tr>
              ${booking.message ? `<tr><td style="padding: 8px 0; color: #888;">Message</td><td style="padding: 8px 0;">${booking.message}</td></tr>` : ''}
            </table>
            <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid #eee;">
              <a href="https://levilegacy.com/admin" style="background: #c9a45c; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View in Admin Dashboard</a>
            </div>
          </div>
        </div>
      `
    });
    console.log('Booking notification email sent!');
  } catch (err) {
    console.error('Failed to send email:', err.message);
  }
}

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

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )
`);

// Seed default admin password if not set
const existingPw = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get();
if (!existingPw) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('admin_password', 'levis')").run();
}

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
    const id = req.params.id;
    const editableFields = ['name', 'type', 'category', 'seats', 'bags', 'dailyRate',
      'transmission', 'fuelType', 'shortDescription', 'fullDescription', 'bestFor',
      'deposit', 'mileagePolicy', 'fuelPolicy', 'pickupDropoff', 'image'];
    
    const updates = [];
    const values = [];
    for (const field of editableFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }
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
    const { id, name, type, category, seats, bags, dailyRate, image, transmission,
            fuelType, shortDescription, fullDescription, bestFor, deposit, mileagePolicy,
            fuelPolicy, pickupDropoff, features, rentalRequirements } = req.body;
    
    // Generate an id from the name if not provided
    const vehicleId = id || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
    
    db.prepare(`
      INSERT INTO vehicles (id, name, type, category, seats, bags, dailyRate, image, transmission,
        fuelType, shortDescription, fullDescription, bestFor, deposit, mileagePolicy, fuelPolicy,
        pickupDropoff, images, features, rentalRequirements)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]', ?, ?)
    `).run(vehicleId, name, type || 'Vehicle', category || 'suv', seats || 5, bags || 3,
           dailyRate, image || '', transmission || 'Automatic', fuelType || 'Regular Gasoline',
           shortDescription || '', fullDescription || '', bestFor || '',
           deposit || '', mileagePolicy || '', fuelPolicy || '', pickupDropoff || '',
           JSON.stringify(features || []), JSON.stringify(rentalRequirements || []));
    
    res.json({ success: true, id: vehicleId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a vehicle
app.delete('/api/vehicles/:id', (req, res) => {
  try {
    const result = db.prepare("DELETE FROM vehicles WHERE id = ?").run(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- IMAGE ROUTES ---

// Upload images to a vehicle
app.post('/api/vehicles/:id/images', upload.array('photos', 20), (req, res) => {
  try {
    const id = req.params.id;
    const vehicle = db.prepare("SELECT images, image FROM vehicles WHERE id = ?").get(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    const currentImages = JSON.parse(vehicle.images || '[]');
    const newPaths = req.files.map(f => './uploads/' + f.filename);
    const allImages = [...currentImages, ...newPaths];

    db.prepare("UPDATE vehicles SET images = ? WHERE id = ?").run(JSON.stringify(allImages), id);

    // If vehicle has no main image, set the first upload as main
    if (!vehicle.image || vehicle.image === '') {
      db.prepare("UPDATE vehicles SET image = ? WHERE id = ?").run(newPaths[0], id);
    }

    res.json({ success: true, images: allImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a specific image from a vehicle
app.delete('/api/vehicles/:id/images', (req, res) => {
  try {
    const id = req.params.id;
    const { imagePath } = req.body;
    const vehicle = db.prepare("SELECT images, image FROM vehicles WHERE id = ?").get(id);
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

    let currentImages = JSON.parse(vehicle.images || '[]');
    currentImages = currentImages.filter(img => img !== imagePath);
    db.prepare("UPDATE vehicles SET images = ? WHERE id = ?").run(JSON.stringify(currentImages), id);

    // If we deleted the main image, set a new one
    if (vehicle.image === imagePath) {
      const newMain = currentImages.length > 0 ? currentImages[0] : '';
      db.prepare("UPDATE vehicles SET image = ? WHERE id = ?").run(newMain, id);
    }

    // Try to delete the file from disk
    if (imagePath.startsWith('./uploads/')) {
      const filePath = path.join(__dirname, 'public', imagePath.replace('./', ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    res.json({ success: true, images: currentImages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set a specific image as the main/cover image
app.put('/api/vehicles/:id/main-image', (req, res) => {
  try {
    const id = req.params.id;
    const { imagePath } = req.body;
    db.prepare("UPDATE vehicles SET image = ? WHERE id = ?").run(imagePath, id);
    res.json({ success: true });
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
    
    // Send email notification (don't block the response)
    sendBookingNotification({ name, email, phone, pickupDate, returnDate, vehicleId, message });
    
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

// --- AUTH ROUTES ---

app.post('/api/login', (req, res) => {
  try {
    const { password } = req.body;
    const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get();
    if (row && row.value === password) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Incorrect password' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/change-password', (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const row = db.prepare("SELECT value FROM settings WHERE key = 'admin_password'").get();
    if (!row || row.value !== currentPassword) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }
    if (!newPassword || newPassword.length < 4) {
      return res.status(400).json({ success: false, error: 'New password must be at least 4 characters' });
    }
    db.prepare("UPDATE settings SET value = ? WHERE key = 'admin_password'").run(newPassword);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
