const express = require('express');
const router = express.Router();
const baseURL = 'http://www.omdbapi.com/?apikey=e87f567&';
const request = require('request');

/* SEARCH */
router.get('/search/:filter', (req, res, next) => {
  request(`${baseURL}${req.params.filter}`, (error, response, body) => {
    if (!error && response.statusCode == 200) {
      //TODO return 'no-data' Movie not found
      //control Too many results
      //check year filter
      res.json(JSON.parse(body));
    } else {
      res.status(404).json({code: 'not-found'});
    }
  })
});

module.exports = router;
