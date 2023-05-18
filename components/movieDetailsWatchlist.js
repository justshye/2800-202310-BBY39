const { userCollection } = require("../config");

async function movieDetailsWatchlist(req, res) {
  const movieId = req.params.id;
  try {
    const result = await userCollection.findOne({
      username: req.session.username,
    });
    console.log(result);
    if (result) {
      const randomMovies = result.randomMovies;
      console.log(randomMovies);
      const movie = randomMovies.find((movie) => movie._id == movieId);
      res.render("moviedetails-watchlist", { movie: movie });
    } else {
      console.log("Document not found");
      return res.status(404).send("Movie not found");
    }
  } catch (error) {
    console.error("Error retrieving document:", error);
    return res.status(500).send("Internal Server Error");
  }
}

module.exports = { movieDetailsWatchlist };