const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const film = new Schema({
  title: {
    type: String,
    required: true
  },
  year: {
    type: Number
  },
  score: {
    type: Number
  },
  reviews: {
    type: {type: mongoose.Schema.Types.ObjectId, ref: 'Review'}
  },
  reviews: {
    users: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}
  }
}, {
  timestamps: true
});

const Film = mongoose.model('Film', filmSchema);

module.exports = Film;