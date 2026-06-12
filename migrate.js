const fs = require('fs');
const path = require('path');

// Delete old database to start fresh
const dbPath = path.resolve(__dirname, 'database.sqlite');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('Deleted old database.');
}

const db = require('./database');

// Read the frontend fleet file and convert ES modules to CommonJS
const content = fs.readFileSync('./public/fleet.js', 'utf8');
const code = content.replace(/export /g, '') + ';\n module.exports = vehicles;';
fs.writeFileSync('./temp_fleet.js', code);

const vehicles = require('./temp_fleet');

const stmt = db.prepare(`
  INSERT INTO vehicles (id, name, type, category, seats, bags, doors, transmission, fuelType, dailyRate, image, images, bestFor, shortDescription, fullDescription, description, features, rentalRequirements, deposit, mileagePolicy, fuelPolicy, pickupDropoff, turoLink, turoRating, turoTrips)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertAll = db.transaction((vehicleList) => {
  for (const v of vehicleList) {
    stmt.run(
      v.id, v.name, v.type, v.category, v.seats, v.bags,
      v.doors || null, v.transmission || null, v.fuelType || null,
      v.dailyRate, v.image,
      JSON.stringify(v.images || []),
      v.bestFor || null, v.shortDescription || null, v.fullDescription || null,
      v.description || null,
      JSON.stringify(v.features || []),
      JSON.stringify(v.rentalRequirements || []),
      v.deposit || null, v.mileagePolicy || null, v.fuelPolicy || null,
      v.pickupDropoff || null, v.turoLink || null,
      v.turoRating || null, v.turoTrips || null
    );
  }
});

insertAll(vehicles);
console.log(`Migrated ${vehicles.length} vehicles!`);

// Clean up
fs.unlinkSync('./temp_fleet.js');
console.log('Done.');
