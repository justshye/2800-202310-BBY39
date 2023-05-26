// ChatGPT-3.5 was heavily used for the code below
const { userCollection } = require("../setup/config.js");

async function stats(req, res) {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  } else {
    const username = req.session.username;
    const user = await userCollection.findOne({ username: username }, { moviesWatched: 1 });
    const watchlistSize = user.watchlist.length;
    let moviesWatched = 0;
    let moviesPlanned = 0;
    let moviesWatching = 0;
    let moviesDropped = 0;
    for (const movie of user.watchlist) {
      if (movie.Watched === "Completed") {
        moviesWatched++;
      } else if (movie.Watched === "Plan to Watch") {
        moviesPlanned++;
      } else if (movie.Watched === "Currently Watching") {
        moviesWatching++;
      } else if (movie.Watched === "Dropped") {
        moviesDropped++;
      }
    }
    const watchHours = Math.floor((moviesWatched * 130.9) / 60); //average movie duration is 130.9 minutes
    const watchMinutes = Math.floor((moviesWatched * 130.9) % 60);
    res.render("stats", { user: username, watchlistSize, moviesWatched, watchHours, watchMinutes, moviesPlanned, moviesWatching, moviesDropped, rejectedMovieCount: user.rejectedMovies.length });
  }
}

module.exports = { stats };
