const express = require('express');
const toursController = require('../controllers/toursController');
const {
  uploadTourImage,
  uploadSceneImage,
  uploadOtherFile,
} = require('../utils/uploadingFile');
const authController = require('../controllers/authController');
const Tour = require('../models/tourModel');

const router = express.Router();

router
  .route('/')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.getUserTours,
  )
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    uploadTourImage.single('image'),
    toursController.createTour,
  );
router
  .route('/:tourID')
  .get((req, res, next) => {
    Tour.findById(req.params.tourID)
      .then((tour) => {
        if (tour.isPublic) {
          toursController.getTour(req, res);
        } else {
          authController.protect(req, res, () => {
            authController.restrictTo('admin', 'user')(req, res, () => {
              authController.restrictTourToCreator(req, res, () => {
                toursController.getTour(req, res);
              });
            });
          });
        }
      })
      .catch(next);
    // authController.protect,
    // authController.restrictTo('admin', 'user'),
    // authController.restrictTourToCreator,
    // toursController.getTour,
  })
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    authController.restrictTourToCreator,
    toursController.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    authController.restrictTourToCreator,
    toursController.deleteTour,
  )
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    authController.restrictTourToCreator,
    uploadSceneImage.single('image'),
    toursController.addScene,
  );
router
  .route('/:tourID/scenes/:sceneID')
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    authController.restrictTourToCreator,
    toursController.deleteScene,
  )
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    authController.restrictTourToCreator,
    toursController.updateScene,
  )
  .get(toursController.getSceneImage);

router
  .route('/:tourID/:sceneID/addPointer')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.addPointer,
  );
router
  .route('/:tourID/:sceneID/addText')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.addText,
  );
router
  .route('/:tourID/:sceneID/addOther')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.addOther,
  );
router
  .route('/:tourID/:sceneID/:pointerID')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.updatePointer,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.deletePointer,
  );
router
  .route('/:tourID/:sceneID/text/:textID')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.updateText,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.deleteText,
  );
router
  .route('/:tourID/:sceneID/other/:otherID')
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.updateOther,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    toursController.deleteOther,
  );
router
  .route('/:tourID/other')
  .post(
    authController.protect,
    authController.restrictTo('admin', 'user'),
    uploadOtherFile.single('image'),
    toursController.returnUrl,
  );
module.exports = router;
