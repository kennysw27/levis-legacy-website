const fs = require('fs');
const path = require('path');

const fleetPath = path.join(__dirname, 'fleet.js');
let fleetContent = fs.readFileSync(fleetPath, 'utf8');

const aiImages = {
  "2025-nissan-altima": "./assets/nissan_altima_2025.png",
  "2024-nissan-rogue": "./assets/nissan_rogue_2024.png",
  "2024-kia-telluride": "./assets/kia_telluride_2024.png",
  "2021-nissan-rogue": "./assets/nissan_rogue_2021.png",
  "2017-chrysler-pacifica": "./assets/chrysler_pacifica_2017.png",
  "2020-chrysler-pacifica": "./assets/chrysler_pacifica_2020.png",
  "2021-buick-enclave": "./assets/buick_enclave_2021.png"
};

Object.keys(aiImages).forEach(id => {
  const aiImg = aiImages[id];
  
  // Replace the main image
  const imageRegex = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?image:\\s*)".*?"`, 'g');
  fleetContent = fleetContent.replace(imageRegex, `$1"${aiImg}"`);
  
  // Prepend the AI image to the images array so it appears in the gallery too
  const imagesArrayRegex = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?images:\\s*\\[\\s*)`, 'g');
  fleetContent = fleetContent.replace(imagesArrayRegex, `$1\n    "${aiImg}",\n    `);
});

fs.writeFileSync(fleetPath, fleetContent, 'utf8');
console.log('Restored AI images as main!');
