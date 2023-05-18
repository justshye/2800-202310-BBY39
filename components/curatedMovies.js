const { userCollection, movieCollection } = require("../config");

let cachedMovies = null;

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

function curateMovies(allMovies, rejectMovies, watchlist) {
  // Copy the allMovies array
  let curatedMovies = [...allMovies];

  // Filter out movies that are in the rejectMovies array
  curatedMovies = curatedMovies.filter(movie => !rejectMovies.includes(movie._id));

  // Filter out movies that are in the watchlist array
  curatedMovies = curatedMovies.filter(movie => !watchlist.includes(movie._id));
  console.log(curatedMovies.length);

  // Now we have a list of movies that are neither in the rejectMovies array nor in the watchlist
  // Let's sort them by popularity in descending order (assuming popularity is a numerical value)
  curatedMovies.sort((a, b) => b.Popularity - a.Popularity);

  // If you want to select a random movie from the top 1000 most popular movies:
  let randomIndex = Math.floor(Math.random() * 9827);
  let randomMovie = curatedMovies[randomIndex];

  return randomMovie;
}



async function curatedMovies(req, res) {
  try {
    const rejected = await getRejectedMovies(req, res);
    const watchlist = await getWatchlist(req, res);
    const movies = await getMovies();

    const moviesDisplayed = [];

    for (let i = 0; i < 5; i++) {
      // const randomIndex = Math.floor(Math.random() * movies.length);
      moviesDisplayed.push(curateMovies(movies, rejected, watchlist));
      // curatedMovie.splice(randomIndex, 1); // remove the selected movie from the array
    }

    const filter = { username: req.session.username };
    const update = { $set: { curatedMovies: moviesDisplayed } };

    const result = await userCollection.findOne(filter);
    // console.log(result);

    if (result) {
      await userCollection.updateOne(filter, update);
      console.log("Document updated successfully");
    } else {
      console.log("User not found");
    }

    res.json(moviesDisplayed);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { curatedMovies };
