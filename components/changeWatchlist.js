const { movieCollection, userCollection, ObjectId } = require("../setup/config.js");

// Update the status of a movie in the user's watchlist
async function changeWatchlist(req, res) {
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

    const selectedStatus = req.body.status; // Assuming the selected status is sent via the request body

    const newMovie = createNewMovieObject(movie, selectedStatus); // Create a new movie object with the selected status

    await updateUserWatchlist(userId, movie, newMovie); // Update the user's watchlist with the new movie object

    updateWatchlistBasedOnStatus(userCollection, userId, movie._id, selectedStatus); // Update the watchlist based on the selected status

    sendResponse(res, { message: 'Status updated!' }); // Send response indicating successful status update
  } catch (error) {
    handleErrorResponse(error, res); // Handle any errors that occur
  }
}

// Create a new movie object with the selected status
function createNewMovieObject(movie, selectedStatus) {
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
    Watched: selectedStatus,
  };
}

// Update the user's watchlist with the new movie object
async function updateUserWatchlist(userId, movie, newMovie) {
  await userCollection.updateOne(
    { _id: new ObjectId(userId), "watchlist._id": movie._id },
    { $set: { "watchlist.$.Watched": newMovie.Watched } }
  );
}

// Update the watchlist based on the selected status
function updateWatchlistBasedOnStatus(userCollection, userId, movieId, selectedStatus) {
  switch (selectedStatus) {
    case "Plan to Watch":
      // Update the watchlist based on Plan to Watch status
      break;
    case "Currently Watching":
      // Update the watchlist based on Currently Watching status
      break;
    case "Completed":
      // Update the watchlist based on Completed status
      break;
    case "Dropped":
      // Update the watchlist based on Dropped status
      break;
    default:
      throw new Error("Invalid status");
  }
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

module.exports = { changeWatchlist };
