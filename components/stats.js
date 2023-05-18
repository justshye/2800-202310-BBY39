const { userCollection } = require("../config");

async function stats(req, res) {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  } else {
    const username = req.session.username;
    const user = await userCollection.findOne({ username: username }, { moviesWatched: 1 });
    const watchlistSize = user.watchlist.length;
    let moviesWatched = 0;
    for (const movie of user.watchlist) {
      if (movie.Watched) {
        moviesWatched++;
      }
    }
    const watchHours = Math.floor((moviesWatched * 130.9) / 60); //average movie duration is 130.9 minutes
    const watchMinutes = Math.floor((moviesWatched * 130.9) % 60);
    res.render("stats", { user: username, watchlistSize, moviesWatched, watchHours, watchMinutes });
  }
}

module.exports = { stats };
