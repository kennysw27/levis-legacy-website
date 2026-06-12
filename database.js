const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

function initDb() {
  db.serialize(() => {
    // Create Vehicles Table with ALL fields the frontend needs
    db.run(`
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

    // Create Bookings Table
    db.run(`
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
  });
}

initDb();

module.exports = db;
