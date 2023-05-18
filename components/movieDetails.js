const { userCollection } = require("../config");

async function movieDetails(req, res) {
  const movieId = req.params.id;
  const filter = { _id: movieId };
  const projection = { randomMovies: 5 };

  try {
    const result = await userCollection.findOne({
      username: req.session.username,
    });
    console.log(result);
    if (result) {
      const randomMovies = result.randomMovies;
      const curatedMovies = result.curatedMovies;
      let movieCurated;
      let movieRandom;
      console.log(randomMovies);
      if (curatedMovies) {
        movieCurated = curatedMovies.find((movie) => movie._id == movieId);
      }
      if (randomMovies) {
        movieRandom = randomMovies.find((movie) => movie._id == movieId);
      }

      let movie;
      if (movieRandom) {
        movie = movieRandom;
      } else if (movieCurated) {
        movie = movieCurated;
      }
      // console.log(movieCurated);
      res.render("moviedetails", { movie: movie });
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
