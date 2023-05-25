const { userCollection, movieCollection } = require("../setup/config.js");

let cachedMovies = null;

// Function to check if a given field matches a specific value in an array of objects
function matches(arr, field, value) {
  return arr.filter((obj) => obj[field].toString() === value.toString()).length > 0;
}

// Fetch movies from the movie collection and cache them
async function fetchMoviesFromCollection() {
  const movies = await movieCollection.find().toArray();
  cachedMovies = movies;
  return movies;
}

// Get movies either from the cache or fetch them from the collection
async function getMovies() {
  return cachedMovies || fetchMoviesFromCollection();
}

// Find a user by their username in the user collection
async function findUserByUsername(username) {
  const filter = { username: username };
  return await userCollection.findOne(filter);
}

// Get the list of rejected movies for a user
async function getRejectedMovies(req, res) {
  try {
    const result = await findUserByUsername(req.session.username);
    return result ? result.rejectedMovies : console.log("User not found");
  } catch (error) {
    console.error("Error retrieving rejected movies:", error);
  }
}

// Get the genres of the last rejected movie for a user
async function getLastRejectedMovieGenre(req, res) {
  try {
    const result = await findUserByUsername(req.session.username);
    if (!result) {
      console.log("User not found");
      return;
    }

    const rejectedMovies = result.rejectedMovies;
    return rejectedMovies.length > 0 ? getGenres(rejectedMovies[rejectedMovies.length - 1]) : [];
  } catch (error) {
    console.error("Error retrieving genres of last rejected movie:", error);
  }
}

// Get the watchlist for a user
async function getWatchlist(req, res) {
  try {
    const result = await findUserByUsername(req.session.username);
    return result ? result.watchlist : console.log("User not found");
  } catch (error) {
    console.error("Error retrieving watchlist:", error);
  }
}

// Get the genres of a movie by splitting the Genre field
function getGenres(movie) {
  return movie.Genre.split(", ");
}

// Check if a movie's genres match any of the given genres
function genreMatch(movie, genres) {
  let movieGenres = getGenres(movie);
  return genres.some((genre) => movieGenres.includes(genre));
}

// Get the last X movies from the watchlist
function getLastMovies(watchlist, numMovies) {
  if (!Array.isArray(watchlist)) {
    throw new Error("Watchlist must be an array");
  }

  if (watchlist.length < numMovies) {
    throw new Error(`Watchlist contains only ${watchlist.length} movie(s), but ${numMovies} were requested`);
  }

  return watchlist.slice(Math.max(watchlist.length - numMovies, 0));
}

// Curate a list of movies based on various criteria
function curatedMoviesList(allMovies, rejectMovies, watchlist, watchlistGenres) {
  let curatedMovies = allMovies.filter((movie) =>
    !matches(rejectMovies, "_id", movie._id) &&
    !matches(watchlist, "_id", movie._id)
  );

  curatedMovies = curatedMovies.filter((movie) => genreMatch(movie, watchlistGenres));
  return curatedMovies;
}

// Sort curated movies based on genre match and popularity
function sortCuratedMovies(curatedMovies, watchlistGenres) {
  return curatedMovies.sort((a, b) => {
    let aMatch = genreMatch(a, watchlistGenres);
    let bMatch = genreMatch(b, watchlistGenres);

    if (aMatch == bMatch) {
      return b.Popularity - a.Popularity;
    } else if (aMatch) {
      return -1;
    } else {
      return 1;
    }
  });
}

// Curate movies for a user based on their rejected movies and watchlist
function curateMovies(allMovies, rejectMovies, watchlist) {
  console.log("All Movies: ", allMovies.length);

  let lastXMovies;
  try {
    lastXMovies = getLastMovies(watchlist, 1);
  } catch (error) {
    console.error(error.message);
  }
  let watchlistGenres = lastXMovies.flatMap(getGenres);

  console.log("Genres accepted: 1st 3 movies", watchlistGenres);

  let curatedMovies = curatedMoviesList(allMovies, rejectMovies, watchlist, watchlistGenres);

  if (curatedMovies.length === 0) {
    console.log("No movies left");
    return;
  }

  curatedMovies = sortCuratedMovies(curatedMovies, watchlistGenres);

  console.log("After all curation: ", curatedMovies.length);

  let randomIndex = Math.floor(Math.random() * curatedMovies.length);
  let randomMovie = curatedMovies[randomIndex];

  console.log(randomMovie);

  return randomMovie;
}

// Add curated movies to a user's document
async function addCuratedMoviesToUser(filter, update) {
  const result = await userCollection.findOne(filter);
  if (result) {
    await userCollection.updateOne(filter, update);
    console.log("Document updated successfully");
  } else {
    console.log("User not found");
  }
}

// Handler for getting curated movies for a user
async function curatedMovies(req, res) {
  try {
    const rejected = await getRejectedMovies(req, res);
    const watchlist = await getWatchlist(req, res);
    const movies = await getMovies();
    const lastRejectedGenres = await getLastRejectedMovieGenre(req, res);
    console.log("Rejected Genres: last 2 movies", lastRejectedGenres);

    const moviesDisplayed = [];
    for (let i = 0; i < 5; i++) {
      let randomMovie = curateMovies(movies, rejected, watchlist);
      moviesDisplayed.push(randomMovie);
    }

    const filter = { username: req.session.username };
    const update = { $set: { curatedMovies: moviesDisplayed } };

    await addCuratedMoviesToUser(filter, update);
    res.json(moviesDisplayed);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { curatedMovies };
