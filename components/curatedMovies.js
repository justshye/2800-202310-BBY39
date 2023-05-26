const { userCollection, movieCollection } = require("../setup/config.js");

let cachedMovies = null;

function matches(arr, field, value) {
  return (
    arr.filter((obj) => obj[field].toString() === value.toString()).length > 0
  );
}

// Function to fetch the movies array
async function getMovies() {
  // If the movies array is already cached, return it
  if (cachedMovies) {
    return cachedMovies;
  }

  // If the movies array is not cached, fetch it from the movie collection
  const movies = await movieCollection.find().toArray();

  // Cache the movies array for future use
  cachedMovies = movies;

  return movies;
}

async function getRejectedMovies(req, res) {
  try {
    const filter = { username: req.session.username };
    const result = await userCollection.findOne(filter);
    // console.log(result);
    if (result) {
      const rejected = result.rejectedMovies;
      // console.log(rejected);
      return rejected;
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error retrieving watchlist:", error);
  }
}

async function getLastRejectedMovieGenre(req, res) {
  try {
    const filter = { username: req.session.username };
    const result = await userCollection.findOne(filter);
    if (result) {
      const rejectedMovies = result.rejectedMovies;
      if (rejectedMovies.length > 0) {
        const lastRejectedMovie = rejectedMovies[rejectedMovies.length - 1];
        return getGenres(lastRejectedMovie);
      }
      return []; // Return an empty array if there are no rejected movies
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error retrieving rejected movies list:", error);
  }
}

async function getWatchlist(req, res) {
  try {
    const filter = { username: req.session.username };
    const result = await userCollection.findOne(filter);
    // console.log(result);
    if (result) {
      const watchlist = result.watchlist;
      // console.log(watchlist);
      return watchlist;
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error retrieving watchlist:", error);
  }
}

function getGenres(movie) {
  // Assuming genres are stored as a string separated by commas and spaces
  return movie.Genre.split(", ");
}

function genreMatch(movie, genres) {
  // Check if a movie's genres match with a list of genres
  let movieGenres = getGenres(movie);
  return genres.some((genre) => movieGenres.includes(genre));
}

function getLastMovies(watchlist, numMovies) {
  // Ensure watchlist is an array
  if (!Array.isArray(watchlist)) {
    throw new Error("Watchlist must be an array");
  }

  // Ensure watchlist has enough movies
  if (watchlist.length < numMovies) {
    throw new Error(
      `Watchlist contains only ${watchlist.length} movie(s), but ${numMovies} were requested`
    );
  }

  // Return the last numMovies movies from the watchlist
  return watchlist.slice(Math.max(watchlist.length - numMovies, 0));
}

function curateMovies(allMovies, rejectMovies, watchlist) {
  console.log("All Movies: ", allMovies.length);
  // Filter out movies in rejectMovies and watchlist
  // Copy the allMovies array
  let curatedMovies = allMovies.filter(
    (movie) =>
      !matches(rejectMovies, "_id", movie._id) &&
      !matches(watchlist, "_id", movie._id)
  );
  console.log("Without rejected + watchlist: ", curatedMovies.length);

  // Collect genres from the last 5 movies in the watchlist
  let watchlistGenres = [];
  let lastXMovies;
  try {
    lastXMovies = getLastMovies(watchlist, 1);
  } catch (error) {
    console.error(error.message);
  }
  for (let movie of lastXMovies) {
    watchlistGenres.push(...getGenres(movie));
  }
  console.log("Genres accepted: 1st 3 movies", watchlistGenres);

  // Further filter the curatedMovies to only include movies that match at least one genre in the watchlistGenres
  curatedMovies = curatedMovies.filter((movie) =>
    genreMatch(movie, watchlistGenres)
  );

  // If there are no movies left after filtering, return null or an error message
  if (curatedMovies.length === 0) {
    console.log("No movies left");
  }

  // Sort by whether they match genres with the watchlist, then by popularity
  curatedMovies.sort((a, b) => {
    let aMatch = genreMatch(a, watchlistGenres);
    let bMatch = genreMatch(b, watchlistGenres);

    // If both or neither movies match, sort by popularity
    if (aMatch == bMatch) {
      return b.Popularity - a.Popularity;
    }
    // If only one matches, that one comes first
    else if (aMatch) {
      return -1;
    } else {
      return 1;
    }
  });

  console.log("After all curation: ", curatedMovies.length);

  // If you want to select a random movie from the top 1000 most popular movies:
  let randomIndex = Math.floor(Math.random() * curatedMovies.length);
  let randomMovie = curatedMovies[randomIndex];

  console.log(randomMovie);

  return randomMovie;
}

async function curatedMovies(req, res) {
  try {
    const rejected = await getRejectedMovies(req, res);
    const watchlist = await getWatchlist(req, res);
    const movies = await getMovies();
    const lastRejectedGenres = await getLastRejectedMovieGenre(req, res);
    console.log("rejected Genres: last 2 movies", lastRejectedGenres);

    const moviesDisplayed = [];

    for (let i = 0; i < 5; i++) {
      let randomIndex = Math.floor(Math.random() * movies.length);
      // If both rejected and watchlist are empty, then no curation, just random selection
      if (watchlist.length === 0) {
        while (moviesDisplayed.includes(movies[randomIndex])) {
          randomIndex = Math.floor(Math.random() * movies.length);
        }
        moviesDisplayed.push(movies[randomIndex]);
      } else if (i > 2) {
        if (rejected.length === 0) {
          while (moviesDisplayed.includes(movies[randomIndex])) {
            randomIndex = Math.floor(Math.random() * movies.length);
          }
        } else {
          while (
            moviesDisplayed.includes(movies[randomIndex]) ||
            genreMatch(movies[randomIndex], lastRejectedGenres)
          ) {
            randomIndex = Math.floor(Math.random() * movies.length);
          }
        }

        moviesDisplayed.push(movies[randomIndex]);
      } else {
        moviesDisplayed.push(curateMovies(movies, rejected, watchlist));
      }
    }

    const filter = { username: req.session.username };
    const update = { $set: { curatedMovies: moviesDisplayed } };

    const result = await userCollection.findOne(filter);
    // console.log(result);

    if (result) {
      await userCollection.updateOne(filter, update);
      console.log("Document updated successfully");
      res.json(moviesDisplayed);
    } else {
      console.log("User not found");
    }

    
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { curatedMovies };