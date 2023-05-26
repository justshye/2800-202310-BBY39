// ChatGPT-3.5 was heavily used for the code below
const { movieCollection, userCollection, ObjectId } = require("../setup/config.js");

// Add movie to the user's watchlist
async function addToWatchlist(req, res) {
  try {
    const userId = req.session.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const movieId = req.query.movieId;
    const movie = await movieCollection.findOne({ _id: new ObjectId(movieId) });

    if (!movie) {
      throw new Error("Movie not found");
    }

    const user = await findUserById(userId); // Fetch user
    const alreadyInWatchlist = checkIfMovieInWatchlist(user.watchlist, movieId); // Check if movie is already in watchlist

    if (alreadyInWatchlist) {
      sendResponse(res, { alreadyInWatchlist: true }); // Send response indicating movie is already in watchlist
      return;
    }

    const newMovie = createNewMovieObject(movie); // Create a new movie object
    await updateUserWatchlist(userId, newMovie); // Update the user's watchlist

    sendResponse(res, { redirect: '/' }); // Send response indicating successful addition to watchlist
  } catch (error) {
    handleErrorResponse(error, res); // Handle any errors that occur
  }
}

// Find a user by their ID
async function findUserById(userId) {
  const user = await userCollection.findOne({ _id: new ObjectId(userId) });
  return user;
}

// Check if the movie is already in the user's watchlist
function checkIfMovieInWatchlist(watchlist, movieId) {
  return watchlist.some(watchlistMovie => watchlistMovie._id.toString() === movieId);
}

// Create a new movie object with selected properties
function createNewMovieObject(movie) {
  return {
    _id: movie._id,
    Release_Date: movie["Release_Date"],
    Title: movie["Title"],
    Overview: movie["Overview"],
    Popularity: movie["Popularity"],
    Vote_Count: movie["Vote_Count"],
    Vote_Average: movie["Vote_Average"],
    Original_Language: movie["Original_Language"],
    Genre: movie["Genre"],
    Poster_Url: movie["Poster_Url"],
    Watched: "Plan to Watch",
  };
}

// Update the user's watchlist
async function updateUserWatchlist(userId, newMovie) {
  await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $push: { watchlist: newMovie } }
  );
}

// Send a response with JSON data
function sendResponse(res, data) {
  res.json(data);
}

// Handle error responses by logging the error and sending a 500 status
function handleErrorResponse(error, res) {
  console.error(error);
  res.status(500).send("An error occurred");
}

module.exports = { addToWatchlist };
