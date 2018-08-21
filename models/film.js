const mongoose = require("mongoose");
const Schema   = mongoose.Schema;

const filmSchema = new Schema({
  imdbID: {
    type: String,
    required: true
  },
  Title: String,
  Poster: String,
  Year: Number,
  score: Number,
  acumUsersScore: Number,
  reviews: [{type: mongoose.Schema.Types.ObjectId, ref: 'Review'}],
  users: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
  ratings: [{userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'}, score: Number}]
}, {
  timestamps: true
});

const Film = mongoose.model('Film', filmSchema);

module.exports = Film;