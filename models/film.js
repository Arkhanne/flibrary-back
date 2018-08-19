const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const filmSchema = new Schema({
  imdbId: {
    type:String,
    required: true
  },
  title: {
    type: String
  },
  year: {
    type: Number
  },
  score: {
    type: Number
  },
  reviews: {
    type: mongoose.Schema.Types.ObjectId, ref: 'Review'
  },
  users: {
    type: mongoose.Schema.Types.ObjectId, ref: 'User'
  },
}, {
  timestamps: true
});

const Film = mongoose.model('Film', filmSchema);

module.exports = Film;