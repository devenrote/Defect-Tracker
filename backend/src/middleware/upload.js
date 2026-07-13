const multer = require('multer');
const path = require('path');
const AppError = require('../utils/AppError');

const storage = multer.memoryStorage();

const allowedExtensions = [
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.jpg', '.jpeg', '.png', '.webp', '.gif',
  '.bmp', '.txt', '.rtf', '.csv', '.ppt', '.pptx', '.zip', '.rar', '.7z', '.log', '.json', '.xml'
];
const allowedTypes = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/x-ms-bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'application/rtf',
  'text/rtf',
  'text/csv',
  'application/csv',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/octet-stream',
  'application/x-7z-compressed',
  'text/x-log',
  'application/json',
  'application/xml',
  'text/xml'
];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError('Only images, PDFs, office documents, presentations, archives, logs, text, json, and xml files are allowed', 400), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = upload;
