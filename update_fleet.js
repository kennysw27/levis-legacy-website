const fs = require('fs');
const path = require('path');

const fleetPath = path.join(__dirname, 'fleet.js');
let fleetContent = fs.readFileSync(fleetPath, 'utf8');

// Helper to get image files from a directory
function getImages(dirName) {
  const dirPath = path.join(__dirname, 'assets', 'real_photos', dirName);
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(f => f.endsWith('.jpg') || f.endsWith('.png'))
    .map(f => `./assets/real_photos/${dirName}/${f}`);
}

const altimaImgs = getImages('altima');
const rogue2024Imgs = getImages('rogue_silver'); // Using Rogue_JPG_Images for 2024
const tellurideImgs = getImages('telluride');
const rogue2021Imgs = getImages('rogue_red'); // Using Red_Rogue for 2021
const pacificaImgs = getImages('pacifica');
const enclaveImgs = getImages('additional');

// Map of vehicle IDs to their real image arrays
const imageMap = {
  "2025-nissan-altima": altimaImgs,
  "2024-nissan-rogue": rogue2024Imgs,
  "2024-kia-telluride": tellurideImgs,
  "2021-nissan-rogue": rogue2021Imgs,
  "2017-chrysler-pacifica": pacificaImgs.slice(0, 5), // First half for 2017
  "2020-chrysler-pacifica": pacificaImgs.slice(5),    // Second half for 2020
  "2021-buick-enclave": enclaveImgs
};

// Update the fleet string
Object.keys(imageMap).forEach(id => {
  const imgs = imageMap[id];
  if (imgs.length > 0) {
    const mainImg = imgs[0];
    const imgsString = JSON.stringify(imgs, null, 4);
    
    // Replace the main image
    const imageRegex = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?image:\\s*)".*?"`, 'g');
    fleetContent = fleetContent.replace(imageRegex, `$1"${mainImg}"`);
    
    // Add the images array after the main image
    const addImagesRegex = new RegExp(`(id:\\s*"${id}"[\\s\\S]*?image:\\s*".*?",)`, 'g');
    fleetContent = fleetContent.replace(addImagesRegex, `$1\n    images: ${imgsString},`);
  }
});

fs.writeFileSync(fleetPath, fleetContent, 'utf8');
console.log('Updated fleet.js with real photos!');
