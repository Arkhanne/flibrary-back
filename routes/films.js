const express = require('express');
const router = express.Router();
const baseURL = 'http://www.omdbapi.com/?apikey=e87f567&';
const request = require('request');

/* SEARCH */
router.get('/search/:filter', (req, res, next) => {
  request(`${baseURL}${req.params.filter}`, (error, response, body) => {
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

module.exports = router;
