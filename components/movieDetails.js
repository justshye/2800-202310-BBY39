const e = require("express");
const { userCollection } = require("../config");

async function findUserByUsername(username) {
  return await userCollection.findOne({ username: username });
}

function findMovieByIdInArray(movieArray, movieId) {
  return movieArray.find((movie) => movie._id == movieId);
}

function getWatchlistLength(watchlist) {
  return watchlist.length;
}

async function movieDetails(req, res) {
  const movieId = req.params.id;
  const filter = { _id: movieId };
  const projection = { randomMovies: 5 };

  try {
    const result = await findUserByUsername(req.session.username);
    console.log(result);
    if (result) {
      const { randomMovies, curatedMovies, searchedMovies, watchlist } = result;

      const movieCurated = findMovieByIdInArray(curatedMovies, movieId);
      const movieRandom = findMovieByIdInArray(randomMovies, movieId);
      const movieSearched = findMovieByIdInArray(searchedMovies, movieId);

      let movie;

      if (movieRandom) movie = movieRandom;
      else if (movieCurated) movie = movieCurated;
      else if (movieSearched) movie = movieSearched;

      const watchlistLength = getWatchlistLength(watchlist);

      res.render("moviedetails", { movie: movie, watchlistLength: watchlistLength });
    } else {
      console.log("Document not found");
      return res.status(404).send("Movie not found");
    }
  } catch (error) {
    console.error("Error retrieving document:", error);
    return res.status(500).send("Internal Server Error");
  }
}

module.exports = { movieDetails };
