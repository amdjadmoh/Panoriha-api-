const mongoose = require('mongoose');
// Define the schema for the blacklist
const BlacklistedTokenSchema = new mongoose.Schema({
  token: { type: String, required: true },
});

// Create the model
const BlacklistedToken = mongoose.model(
  'BlacklistedToken',
  BlacklistedTokenSchema,
);
module.exports = BlacklistedToken;
