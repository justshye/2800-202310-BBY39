const { app, bcrypt, Configuration, email_auto, email_password, expireTime, express, Joi, mongoStore, movieCollection, mongodb_database, mongodb_host, mongodb_password, mongodb_port, mongodb_session_secret, mongodb_user, nodemailer, OpenAIApi, port, saltRounds, session, userCollection, uuidv4 } = require('../config');

async function movieDetailsHandler(req, res) {
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
      console.log(randomMovies);
      const movie = randomMovies.find((movie) => movie._id == movieId);
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

module.exports = { movieDetailsHandler };