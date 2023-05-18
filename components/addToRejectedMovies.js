const { movieCollection, userCollection, ObjectId } = require("../config");

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

    const newMovie = {
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

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { rejectedMovies: newMovie } }
    );

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
}

module.exports = { addToRejectedMovies };
