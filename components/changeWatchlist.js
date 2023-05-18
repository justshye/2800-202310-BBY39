const { movieCollection, userCollection, ObjectId } = require("../config");

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
  
      const newMovie = {
        _id: movie._id, // Add the movie's ID to the newMovie object
        Release_Date: movie["Release_Date"],
        Title: movie["Title"],
        Overview: movie["Overview"],
        Popularity: movie["Popularity"],
        Vote_Count: movie["Vote_Count"],
        Vote_Average: movie["Vote_Average"],
        Original_Language: movie["Original_Language"],
        Genre: movie["Genre"],
        Poster_Url: movie["Poster_Url"],
        Watched: false,
      };
  
      // Update the watchlist array in the userCollection based on the selected status
      switch (selectedStatus) {
        case "plan-to":
          await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $push: { "watchlist.planToWatch": newMovie } }
          );
          break;
        case "watching":
          await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $push: { "watchlist.currentlyWatching": newMovie } }
          );
          break;
        case "watched":
          await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $push: { "watchlist.watched": newMovie } }
          );
          break;
        case "dropped":
          await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $push: { "watchlist.dropped": newMovie } }
          );
          break;
        default:
          throw new Error("Invalid status");
      }
  
      res.redirect("/");
    } catch (error) {
      console.error(error);
      res.status(500).send("An error occurred");
    }
  }
  
  module.exports = { changeWatchlist };