const {
  app,
  express,
  mongoStore,
  movieCollection,
  node_session_secret,
  port,
  session,
} = require("./config");

/* Component Imports */
const { resetPassword } = require("./components/resetPassword");
const { resetPasswordToken } = require("./components/resetPasswordToken");
const { resetChangedPasswordToken } = require("./components/resetChangedPasswordToken");
const { loginSubmit } = require("./components/loginSubmit.js");
const { signupSubmit } = require("./components/signupSubmit.js");
const { userOptions } = require("./components/userOptions.js");
const { profile } = require("./components/profile.js");
const { friends } = require("./components/friends.js");
const { stats } = require("./components/stats.js");
const { openAI } = require("./components/openai.js");
const { randomMovie } = require("./components/randomMovie.js");
const { curatedMovies } = require("./components/curatedMovies.js");
const { searchMovies } = require("./components/searchMovies.js");
const { displayWatchlist } = require("./components/displayWatchlist.js");
const { movieDetails } = require("./components/movieDetails.js");
const { movieDetailsWatchlist } = require("./components/movieDetailsWatchlist.js");
const { addToWatchlist } = require("./components/addToWatchlist.js");
const { addToRejectedMovies } = require("./components/addToRejectedMovies.js");
const { changeWatchlist } = require("./components/changeWatchlist.js")

app.use(
  session({
    secret: node_session_secret,
    store: mongoStore, //default is memory, but we want to use mongo
    saveUninitialized: false,
    resave: false,
  })
);

function isValidSession(req) {
  return req.session.authenticated;
}

function sessionValidation(req, res, next) {
  if (isValidSession(req)) {
    next();
  } else {
    res.redirect("/login");
  }
}

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/public"));

let cachedMovies = null;

// Function to fetch the movies array
async function getMovies() {
  // If the movies array is already cached, return it
  if (cachedMovies) {
    return cachedMovies;
  }

  // If the movies array is not cached, fetch it from the movie collection
  const movies = await movieCollection.find().toArray();

  // Cache the movies array for future use
  cachedMovies = movies;

  return movies;
}

app.get("/", async (req, res) => {
  try {
    const movies = await getMovies();
    // console.log(movies);
    res.render("homepage", {
      user: req.session.username,
      authenticated: req.session.authenticated,
      movies: movies,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching movies");
  }
});

app.get("/watchlist", (req, res) => {
  if (req.session.authenticated) {
    res.render("watchlist", {
      user: req.session.username,
    });
  } else {
    res.redirect("/");
  }
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/recover-password", (req, res) => {
  res.render("recover-password");
});

app.post("/resetPassword", resetPassword);

app.get("/reset/:token", resetPasswordToken);

app.post("/reset/:token/changedPassword", resetChangedPasswordToken);

app.post("/loginSubmit", loginSubmit);

app.post("/signupSubmit", signupSubmit);

app.get("/logout", (req, res) => {
  // localStorage.clear();
  req.session.destroy();
  res.redirect("/");
});

app.post("/user-options", sessionValidation, userOptions);

app.get("/profile", profile);

app.get("/friends", sessionValidation, friends);

// app.get("/friends", function (req, res) {
//   if (!req.session.authenticated) {
//     res.redirect("/");
//   } else {
//     // render the profile template
//     res.render("friends", { user: req.session.username });
//   }
// });

app.get("/stats", sessionValidation, stats);

app.get("/openai", openAI);

app.get("/random-movie", randomMovie);

app.get("/curated-movies", curatedMovies)

app.post("/search-home", searchMovies)

app.get("/display-watchlist", displayWatchlist);

app.post("/change-watchlist", changeWatchlist);

app.get("/movie/:id", movieDetails);

app.get("/movie/watchlist/:id", movieDetailsWatchlist);

app.get("/add-to-interested", sessionValidation, addToWatchlist);

app.get("/add-to-not-interested", addToRejectedMovies);

app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});
app.listen(port, () => {
  console.log(`Node application listening on port ${port}`);
});
