require('dotenv').config();
const cloudinary = require('../src/config/cloudinary');

console.log('Testing Cloudinary root_folders API...');

cloudinary.api.root_folders()
.then(result => {
  console.log('API call succeeded! Root folders:');
  console.log(result);
})
.catch(error => {
  console.error('API call failed:');
  console.error(error);
});
