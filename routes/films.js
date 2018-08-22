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
        films = JSON.parse(body);
        
        if (typeof(films.Search) === "undefined") {
          
          Film.findOne({ imdbID: films.imdbID }).populate('reviews.userId')
            .then((film) => {
              if (film) {
                films["score"] = film.score;
                
                if (film.users) {
                  films["favourite"] = film.users.indexOf(req.session.currentUser._id) > -1;
                } else {
                  films["favourite"] = false;
                  films["userScore"] = 'N/A'
                }

                if (film.ratings) {
                  let exitWhile = false;
                  let index = 0;
                  // Find the previous user rating
                  while (!exitWhile && index < film.ratings.length) {
                    if (film.ratings[index].userId.equals(req.session.currentUser._id)) {
                      exitWhile = true;
                    } else {
                      index++;
                    }
                  }

                  if (film.reviews) {
                    films["reviews"] = film.reviews;
                  }

                  if (exitWhile) {
                    // There is a previous user rating
                    films["userScore"] = film.ratings[index].score;
                  } else {
                    films["userScore"] = 'N/A'
                  }
                }
              } else {
                films["score"] = "N/A";
                films["favourite"] = false;
              }

              return films;
            })
            .then((films) => {
              res.json(films);
            })
            .catch(next);
        } else {
          res.json(films);
        }
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
  const score = 0;
  const acumUsersScore = 0;
  const reviews = [];
  const users = [];
  const params = req.params.params.split("&");

  const newFilm = Film({
    imdbID,
    Title,
    Poster,
    Year,
    score,
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
              res.status(200).json({code: 'user-added-to-film'});
              console.log('User added to film');
            });
        } else {
          res.status(200).json({code: 'film-is-already-favourite'});
          console.log('Thi films is already a favourite of the user')
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
              newFilm.score = 0;
              newFilm.acumUsersScore = 0;
              newFilm.users = users;

              newFilm.save()
                .then(() => {
                  res.status(200).json({code: 'film-added-to-favourites'});
                  console.log('Film added to favourites');
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
  const userId = req.params.userId;

  Film.find({ users : userId })
    .then((films) => {
      if (films) {
        res.json(films);
      } else {
        res.status(200).json({code: 'user-has-no-favourites'});
      }
    })
    .catch(next);
})

router.post('/vote/:params', (req, res, next) => {
  let imdbID = '';
  let userId = '';
  let score = 0;
  const params = req.params.params.split("&");
  let ratingIndex = -1;

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
        let exitWhile = false;
        let index = 0;

        // Find the previous user rating
        while (!exitWhile && index < film.ratings.length) {
          if (film.ratings[index].userId.equals(userId)) {
            exitWhile = true;
          } else {
            index++;
          }
        }

        if (exitWhile) {
          // There is a previous user rating
          ratingIndex = index;
        }
        
        if (ratingIndex === -1) {
          // Add user rating
          newUserRatig.userId = userId;
          newUserRatig.score = parseInt(score, 10);
          film.acumUsersScore += parseInt(score, 10);
          film.score = calcScore(film.acumUsersScore, film.ratings.length + 1);
          film.ratings.push(newUserRatig);
          film.save()
            .then(() => {
              res.status(200).json({code: 'user-rating-added'});
              console.log('New user rating added to film');
            });
        } else {
          // Modify user rating
          film.acumUsersScore -= film.ratings[ratingIndex].score;
          film.ratings[ratingIndex].score = parseInt(score, 10);
          film.acumUsersScore += parseInt(score, 10);
          film.score = calcScore(film.acumUsersScore, film.ratings.length);
          film.save()
            .then(() => {
              res.status(200).json({code: 'user-rating-modified'});
              console.log('User rating modified');
            });
        }
      } else {
        res.status(404).json({code: 'not-found'});
      }
    })
    .catch(next);
})

router.post('/review/:params', (req, res, next) => {
  // console.log(req.params.params.split("&"));
  // res.status(200).json({code: 'test_ok'});

  // let imdbID = '';
  let userId;
  let date;
  let review;
  // let score = 0;
  const params = req.params.params.split("&");
  // let ratingIndex = -1;

  const newReview = {
    userId,
    date,
    review
  }

  imdbID = params[0];
  userId = params[1];
  review = params[2];

  Film.findOne({ imdbID })
    .then((film) => {
      if (film) {
        newReview.userId = userId;
        newReview.date = new Date;
        newReview.review = review;
        film.reviews.push(newReview);
        film.save()
          .then(() => {
            res.status(200).json({code: 'review-added'});
            console.log('Review added');
          });
      } else {
        res.status(404).json({code: 'not-found'});
      }
    })
    .catch(next);
})

function calcScore(acumScore, ratingsQty) {
  ratingsQty = ratingsQty === 0 ? 1 : ratingsQty;
  
  return Math.round(acumScore / ratingsQty * 10);
}

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
