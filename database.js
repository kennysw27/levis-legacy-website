const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS vehicles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT,
    category TEXT,
    seats INTEGER,
    bags INTEGER,
    doors INTEGER,
    transmission TEXT,
    fuelType TEXT,
    dailyRate INTEGER,
    image TEXT,
    images TEXT,
    bestFor TEXT,
    shortDescription TEXT,
    fullDescription TEXT,
    description TEXT,
    features TEXT,
    rentalRequirements TEXT,
    deposit TEXT,
    mileagePolicy TEXT,
    fuelPolicy TEXT,
    pickupDropoff TEXT,
    turoLink TEXT,
    turoRating REAL,
    turoTrips INTEGER
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    pickupDate TEXT NOT NULL,
    returnDate TEXT NOT NULL,
    vehicleId TEXT,
    message TEXT,
    status TEXT DEFAULT 'pending',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

module.exports = db;
