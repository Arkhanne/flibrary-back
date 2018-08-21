require('dotenv').config();

const express = require('express');
const router = express.Router();
const baseURL = 'http://www.omdbapi.com/?apikey=' + process.env.API_KEY + '&';
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
  let imdbID = '';
  let userId = '';
  const Title = ''
  const Poster = '';
  const Year = 0;
  const acumUsersScore = 0;
  const reviews = [];
  const users = [];
  const params = req.params.params.split("&");

  const newFilm = Film({
    imdbID,
    Title,
    Poster,
    Year,
    acumUsersScore,
    reviews,
    users
  });

  imdbID = params[0];
  userId = params[1];

  // Search if film already exists
  Film.findOne({ imdbID })
    .then((film) => {
      if (film) {
        // Find user in film users
        if (film.users.findIndex(k => k==userId) === -1) {
          // Add user to the film
          film.users.push(userId);
          film.save()
            .then(() => {
              console.log('User added to film');
            });
        }
      } else {
        // Create the film for the first time
        request(`${baseURL}i=${imdbID}&type=movie`, (error, response, body) => {
          if (!error && response.statusCode == 200) {
            if (JSON.parse(body).Error) {
              console.log(JSON.parse(body).Error);
            }
      
            apiErrors = manageApiErrors(JSON.parse(body).Error);
            if (apiErrors.status === 0) {
              const users = [];
              users.push(userId);

              body = JSON.parse(body); 
              newFilm.imdbID = body.imdbID;
              newFilm.Title = body.Title;
              newFilm.Poster = body.Poster;
              newFilm.Year = body.Year;
              newFilm.acumUsersScore = 0;
              newFilm.users = users;

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
      }
    })
    .catch(next);
})

router.get('/filmsByUser/:userId', (req, res, next) => {
  // let imdbID = '';
  const userId = req.params.userId;
  // const score = 0;
  // const reviews = [];
  // const users = [];
  // const params = req.params.params.split("&");

  // const newFilm = Film({
  //   imdbID,
  //   score,
  //   reviews,
  //   users
  // });

  // imdbID = params[0];
  // userId = params[1];

  // Search if film already exists
  Film.find({ users : userId })
    .then((films) => {
      if (films) {
        console.log(films);
        res.json(films);
      } else {

      }
    })
    .catch(next);
})

router.post('/vote/:params', (req, res, next) => {
  let imdbID = '';
  let userId = '';
  // const Title = ''
  // const Poster = '';
  // const Year = 0;
  let score = 0;
  // const reviews = [];
  // const users = [];
  const params = req.params.params.split("&");
  let ratingIndex = -1;
  // const newFilm = Film({
  //   imdbID,
  //   Title,
  //   Poster,
  //   Year,
  //   score,
  //   reviews,
  //   users
  // });

  const newUserRatig = {
    userId,
    score
  }

  imdbID = params[0];
  userId = params[1];
  score = params[2];

  Film.findOne({ imdbID })
    .then((film) => {
      if (film) {
        // ratingIndex = film.ratings.filter((rating, index) => { 
        //   if (rating.userId.equals(userId)) {
        //     return index;
        //   }
        // });

        // ratingIndex = film.ratings.map(function(x) {return x.userId; }).indexOf(userId);
        let exitWhile = false;
        let index = 0;
        while (!exitWhile && index < film.ratings.length) {
          if (film.ratings[index].userId.equals(userId)) {
            exitWhile = true;
          } else {
            index++;
          }
        }

        if (exitWhile) {
          ratingIndex = index;
        }
        
        if (ratingIndex === -1) {
          // Add user rating
          newUserRatig.userId = userId;
          newUserRatig.score = score;
          film.acumUsersScore += score;
          film.ratings.push(newUserRatig);
          film.save()
            .then(() => {
              console.log('New user rating added to film');
            });
        } else {
          // Modify user rating
          film.acumUsersScore -= film.ratings[ratingIndex].score;
          film.ratings[ratingIndex].score = score;
          film.acumUsersScore += score;
          film.save()
            .then(() => {
              console.log('User rate modified');
            });
        }
      } else {
        res.status(404).json({code: 'not-found'});
      }
    })
    .catch(next);
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
