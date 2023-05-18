const { userCollection } = require("../config");

async function stats(req, res) {
  if (!req.session.authenticated) {
    res.redirect("/");
  } else {
    userCollection.findOne(
      { username: req.session.username },
      function (err, user) {
        const totalMoviesWatched = user.moviesWatched.length;
        const totalWatchTime = user.moviesWatched.reduce(
          (total, movie) => total + movie.watchTime,
          0
        );

        res.render("stats", {
          user: user.username,
          totalMoviesWatched: totalMoviesWatched,
          totalWatchTime: totalWatchTime,
        });
      }
    );
  }
}

module.exports = { stats };
