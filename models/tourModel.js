const mongoose = require('mongoose');

const InfoSchema = new mongoose.Schema({
  url: { type: String },
  x: {
    type: Number,
  },
  y: {
    type: Number,
  },
  z: {
    type: Number,
  },
  rx: {
    type: Number,
    default: 0,
  },
  ry: {
    type: Number,
    default: 0,
  },
  rz: {
    type: Number,
    default: 0,
  },
  s: {
    type: Number,
    default: 5,
  },
});

const TextBoxSchema = new mongoose.Schema({
  value: { type: String, default: 'Some text' },
  height: { type: String, default: '45' },
  width: {
    type: String,
    default: '155',
  },
  px: {
    type: Number,
  },
  py: {
    type: Number,
  },
  pz: {
    type: Number,
  },
  prx: {
    type: Number,
    default: 0,
  },
  pry: {
    type: Number,
    default: 0,
  },
  prz: {
    type: Number,
    default: 0,
  },
});

const pointerSchema = new mongoose.Schema({
  idtogo: {
    type: mongoose.Schema.Types.ObjectId,
  },
  x: {
    type: Number,
    required: [true, ' must have a x  coordinate'],
  },
  y: {
    type: Number,
    required: [true, ' must have a y  coordinate'],
  },
  z: {
    type: Number,
    required: [true, ' must have a z  coordinate'],
  },
  s: {
    type: Number,
    default: 15,
  },
  rx: {
    type: Number,
    default: 0,
  },
  ry: {
    type: Number,
    default: 0,
  },
  rz: {
    type: Number,
    default: 0,
  },
  rcx: {
    type: Number,
    default: 0,
  },
  rcy: {
    type: Number,
    default: 0,
  },
  rcz: {
    type: Number,
    default: 0,
  },
});

const sceneSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  description: {
    type: String,
  },
  imageLink: {
    type: String,
    required: [true, 'A scene must have an image'],
  },
  coords: [pointerSchema],
  infos: [TextBoxSchema],
  other: [InfoSchema],
});
const tourSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A tour must have a name'],
  },
  description: {
    type: String,
  },
  tourImage: {
    type: String,
  },
  scenesList: [sceneSchema],
  isPublic: {
    type: Boolean,
    default: false,
  },
  tourCreator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const Tour = mongoose.model('Tour', tourSchema);
module.exports = Tour;
