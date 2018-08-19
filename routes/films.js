const express = require('express');
const router = express.Router();
const baseURL = 'http://www.omdbapi.com/?apikey=e87f567&';
const request = require('request');

const Film = require('../models/film');

router.get('/search/:filter', (req, res, next) => {
  request(`${baseURL}${req.params.filter}&type=movie`, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      if (JSON.parse(body).Error) {
        console.log(JSON.parse(body).Error);
      }

      switch (JSON.parse(body).Error) {
        case 'Too many results.':
          res.status(200).json({code: 'too-many-results'});
          break;
        
        case 'Movie not found!':
          res.status(200).json({code: 'movie-not-found'});
          break;

        default:
          res.json(JSON.parse(body));
          break;
      }
    } else {
      res.status(404).json({code: 'not-found'});
    }
  })
});

router.post('/addToFavourites/:imdbId', (req, res, next) => {
  const imdbId = '';
  const title = '';
  const year = 0;
  const score = 0;
  const reviews = undefined;
  const users = undefined;
  const body = {};

  const newFilm = Film({
    imdbId,
    title,
    year,
    score,
    reviews,
    users
  });

  request(`${baseURL}i=${req.params.imdbId}&type=movie`, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      if (JSON.parse(body).Error) {
        console.log(JSON.parse(body).Error);
      }

      switch (JSON.parse(body).Error) {
        case 'Movie not found!':
          res.status(200).json({code: 'movie-not-found'});
          break;

        default:
          body = JSON.parse(body); 
          newFilm.imdbId = body.imdbID;
          newFilm.title = body.Title;
          newFilm.year = body.Year;
          
          newFilm.save()
            .then(() => {
              console.log('Film saved');
            });
          break;
      }
    } else {
      res.status(404).json({code: 'not-found'});
    }
  })
})

module.exports = router;
