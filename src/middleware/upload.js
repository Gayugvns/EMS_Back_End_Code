const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '..', '..', 'uploads'); // Use path.join for robust directory path
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // The destination function receives the fully resolved path
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // 1. Generate a unique suffix using timestamp and random number
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // 2. Get the file extension
    const ext = path.extname(file.originalname);
    // 3. Combine them for the final filename
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  // Use a simple regex to check the MIME type for robustness
  // This is slightly better than checking both mimetype and extname
  if (file.mimetype.startsWith('image/')) {
    // Accept the file
    cb(null, true);
  } else {
    // Reject the file
    // Provide a clearer error message
    cb(new Error('Invalid file type. Only image files are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  // limits: 5MB in bytes (5 * 1024 * 1024 = 5242880)
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: fileFilter
});

// Export single file upload middleware
// Note: 'profileImage' must match the 'name' attribute in the HTML form/frontend upload
const uploadProfileImage = upload.single('profileImage');

module.exports = uploadProfileImage;