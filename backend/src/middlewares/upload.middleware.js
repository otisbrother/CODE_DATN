const multer = require('multer');
const path = require('path');

// Material uploads
const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/materials'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// AI data uploads
const aiDataStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/ai-data'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Course uploads (thumbnail + intro video)
const courseStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/courses'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

// Lesson video uploads
const lessonVideoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads/videos'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const uploadMaterial = multer({
  storage: materialStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

const uploadAiData = multer({
  storage: aiDataStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadCourse = multer({
  storage: courseStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB for intro videos
  fileFilter: (req, file, cb) => {
    const allowedImage = /jpeg|jpg|png|gif|webp/;
    const allowedVideo = /mp4|webm|ogg|mov|avi/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (file.fieldname === 'thumbnail' && allowedImage.test(ext)) {
      cb(null, true);
    } else if (file.fieldname === 'intro_video' && allowedVideo.test(ext)) {
      cb(null, true);
    } else if (allowedImage.test(ext) || allowedVideo.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('File không hợp lệ. Chỉ chấp nhận ảnh (jpg, png, gif, webp) và video (mp4, webm, ogg, mov, avi)'));
    }
  },
});

const uploadLessonVideo = multer({
  storage: lessonVideoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB for lesson videos
  fileFilter: (req, file, cb) => {
    const allowedVideo = /mp4|webm|ogg|mov|avi/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowedVideo.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file video (mp4, webm, ogg, mov, avi)'));
    }
  },
});

module.exports = { uploadMaterial, uploadAiData, uploadCourse, uploadLessonVideo };
