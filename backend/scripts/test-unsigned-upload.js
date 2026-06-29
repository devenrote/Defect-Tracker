require('dotenv').config();
const https = require('https');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'dk4rucnti';
const preset = 'ml_default'; // common default preset in Cloudinary

console.log('Testing unsigned Cloudinary upload with preset: ' + preset);

const postData = new URLSearchParams({
  file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==',
  upload_preset: preset,
  folder: 'Defect-Tracker'
}).toString();

const options = {
  hostname: 'api.cloudinary.com',
  port: 443,
  path: `/v1_1/${cloudName}/image/upload`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log('Status Code:', res.statusCode);
  console.log('Headers:', res.headers);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log('Response Body:');
    try {
      console.log(JSON.stringify(JSON.parse(body), null, 2));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request failed:', e.message);
});

req.write(postData);
req.end();
