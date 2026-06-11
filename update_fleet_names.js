const fs = require('fs');
const path = require('path');

const fleetPath = path.join(__dirname, 'fleet.js');
let fleetContent = fs.readFileSync(fleetPath, 'utf8');

// Replacements in fleet.js
const replacements = [
  // 2024 Nissan Rogue -> 2021 Nissan Rogue
  { find: /id: "2024-nissan-rogue"/g, replace: 'id: "2021-nissan-rogue-black"' },
  { find: /name: "2024 Nissan Rogue"/g, replace: 'name: "2021 Nissan Rogue (Black)"' },
  
  // 2024 Kia Telluride -> 2021 Kia Telluride
  { find: /id: "2024-kia-telluride"/g, replace: 'id: "2021-kia-telluride"' },
  { find: /name: "2024 Kia Telluride"/g, replace: 'name: "2021 Kia Telluride"' },
  
  // 2021 Nissan Rogue (Red)
  { find: /id: "2021-nissan-rogue"/g, replace: 'id: "2021-nissan-rogue-red"' },
  { find: /name: "2021 Nissan Rogue"/g, replace: 'name: "2021 Nissan Rogue (Red)"' },
  
  // 2020 Chrysler Pacifica -> 2019 Chrysler Pacifica
  { find: /id: "2020-chrysler-pacifica"/g, replace: 'id: "2019-chrysler-pacifica"' },
  { find: /name: "2020 Chrysler Pacifica"/g, replace: 'name: "2019 Chrysler Pacifica"' }
];

replacements.forEach(r => {
  fleetContent = fleetContent.replace(r.find, r.replace);
});

// Let's also make sure to fix the second 2021 Nissan Rogue replace so it doesn't overlap the first one.
// Ah, the first replace changed "2024-nissan-rogue" to "2021-nissan-rogue-black".
// The second replace changed "2021-nissan-rogue" to "2021-nissan-rogue-red".
// That would accidentally change "2021-nissan-rogue-black" to "2021-nissan-rogue-red-black"!
// Let me fix that.

fleetContent = fs.readFileSync(fleetPath, 'utf8');

fleetContent = fleetContent.replace(/id: "2024-nissan-rogue"/g, 'id: "2021-nissan-rogue-black"');
fleetContent = fleetContent.replace(/name: "2024 Nissan Rogue"/g, 'name: "2021 Nissan Rogue (Black)"');

fleetContent = fleetContent.replace(/id: "2024-kia-telluride"/g, 'id: "2021-kia-telluride"');
fleetContent = fleetContent.replace(/name: "2024 Kia Telluride"/g, 'name: "2021 Kia Telluride"');

// Using exact string matching for the 2021 nissan rogue to avoid replacing the new black one
fleetContent = fleetContent.replace(/id: "2021-nissan-rogue"/g, 'id: "2021-nissan-rogue-red"');
fleetContent = fleetContent.replace(/name: "2021 Nissan Rogue"/g, 'name: "2021 Nissan Rogue (Red)"');

fleetContent = fleetContent.replace(/id: "2020-chrysler-pacifica"/g, 'id: "2019-chrysler-pacifica"');
fleetContent = fleetContent.replace(/name: "2020 Chrysler Pacifica"/g, 'name: "2019 Chrysler Pacifica"');

// Update Ratings
fleetContent = fleetContent.replace(/turoRating: 4.96/g, 'turoRating: 4.96');
fleetContent = fleetContent.replace(/turoTrips: 58/g, 'turoTrips: 58');

// 2019 Pacifica rating
fleetContent = fleetContent.replace(/turoRating: 5\.0,\s*turoTrips: 60/g, 'turoRating: 5.0,\n    turoTrips: 60');

fs.writeFileSync(fleetPath, fleetContent, 'utf8');
console.log("fleet names updated!");
