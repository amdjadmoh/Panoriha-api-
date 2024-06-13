const multer = require('multer');
const path = require('path');
const fs = require('fs');

const TourStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `images/tours/`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const OtherStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `images/tours/${req.params.tourID}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const SceneStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = `images/tours/${req.params.tourID}`;
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const uploadTourImage = multer({ storage: TourStorage });
const uploadSceneImage = multer({ storage: SceneStorage });
const uploadOtherFile = multer({ storage: OtherStorage });

module.exports = { uploadTourImage, uploadSceneImage, uploadOtherFile };
