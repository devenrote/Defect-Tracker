const dotenv = require('dotenv');
dotenv.config();

const vars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET', 'CLOUDINARY_URL'];
vars.forEach(v => {
  const val = process.env[v];
  if (val) {
    console.log(`${v}: "${val}" (Length: ${val.length}, Ends with \\r: ${val.endsWith('\r')})`);
  } else {
    console.log(`${v} is UNDEFINED`);
  }
});
