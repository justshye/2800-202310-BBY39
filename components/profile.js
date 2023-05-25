const { userCollection } = require("../config");

async function profile(req, res) {
  if (!req.session.authenticated) res.redirect("/");
  else {
    const username = req.session.username;
    try {
      const user = await userCollection.findOne(
        { username: username },
        { avatar: 1, watchlist: 1 }
      );
      const moviesWatched = user.watchlist ? user.watchlist.length : 0;
      const movieMateUnlocked = moviesWatched >= 5;
      res.render("profile", {
        user: username,
        email: req.session.email,
        avatar: user.avatar,
        moviesWatched,
        movieMateUnlocked,
      });
    } catch (err) {
      console.error(err);
      const movieMateUnlocked = false;
      res.render("profile", {
        user: username,
        email: req.session.email,
        avatar: user.avatar,
        moviesWatched: 0,
        movieMateUnlocked,
      });
    }
  }
}

module.exports = { profile };
