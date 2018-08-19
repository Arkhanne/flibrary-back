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

      apiErrors = manageApiErrors(JSON.parse(body).Error);
      if (apiErrors.status === 0) {
        res.json(JSON.parse(body));
      } else {
        res.status(apiErrors.status).json({code: apiErrors.code});
      }
    } else {
      res.status(404).json({code: 'not-found'});
    }
  })
});

router.post('/addToFavourites/:params', (req, res, next) => {
  const imdbId = '';
  const title = '';
  const year = 0;
  const score = 0;
  const reviews = undefined;
  const users = undefined;
  const params = req.params.params.split("&");

  const newFilm = Film({
    imdbId,
    title,
    year,
    score,
    reviews,
    users
  });

  request(`${baseURL}i=${params[0]}&type=movie`, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      if (JSON.parse(body).Error) {
        console.log(JSON.parse(body).Error);
      }

      apiErrors = manageApiErrors(JSON.parse(body).Error);
      if (apiErrors.status === 0) {
        body = JSON.parse(body); 
        newFilm.imdbId = body.imdbID;
        newFilm.title = body.Title;
        newFilm.year = body.Year;
        newFilm.users = [params[1]];
        newFilm.save()
          .then(() => {
            console.log('Film saved');
          });
      } else {
        res.status(apiErrors.status).json({code: apiErrors.code});
      }
    } else {
      res.status(404).json({code: 'not-found'});
    }
  })
})

function manageApiErrors(error) {
  let status = 0;
  let code = '';

  switch (error) {
    case 'Too many results.':
      status = 200;
      code = 'too-many-results'
      break;
    
    case 'Movie not found!':
      status = 200;
      code = 'movie-not-found'
      break;

    default:
      break;
  }

  return {status, code};
}

module.exports = router;
