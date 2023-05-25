const { movieCollection, userCollection, ObjectId } = require("../config");

// Add movie to the user's rejected movies
async function addToRejectedMovies(req, res) {
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
    const alreadyInRejectedList = checkIfMovieInRejectedList(user.rejectedMovies, movieId); // Check if movie is already in rejected list

    if (alreadyInRejectedList) {
      sendResponse(res, { alreadyInRejectedlist: true }); // Send response indicating movie is already in rejected list
      return;
    }

    const newMovie = createNewMovieObject(movie); // Create a new movie object
    await updateUserRejectedMovies(userId, newMovie); // Update the user's rejected movies

    sendResponse(res, { redirect: '/' }); // Send response indicating successful addition to rejected movies
  } catch (error) {
    handleErrorResponse(error, res); // Handle any errors that occur
  }
}

// Find a user by their ID
async function findUserById(userId) {
  const user = await userCollection.findOne({ _id: new ObjectId(userId) });
  return user;
}

// Check if the movie is already in the rejected movies list
function checkIfMovieInRejectedList(rejectedMovies, movieId) {
  return rejectedMovies.some(rejectedMovie => rejectedMovie._id.toString() === movieId);
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
  };
}

// Update the user's rejected movies
async function updateUserRejectedMovies(userId, newMovie) {
  await userCollection.updateOne(
    { _id: new ObjectId(userId) },
    { $push: { rejectedMovies: newMovie } }
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

module.exports = { addToRejectedMovies };
