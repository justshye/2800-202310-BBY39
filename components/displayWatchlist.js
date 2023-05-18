const {
  app,
  bcrypt,
  configuration,
  email_auto,
  email_password,
  expireTime,
  express,
  Joi,
  mongoStore,
  movieCollection,
  node_env,
  node_session_secret,
  nodemailer,
  OpenAIApi,
  port,
  saltRounds,
  session,
  userCollection,
  uuidv4,
} = require("../config");

async function displayWatchlist(req, res) {
  try {
    const filter = { username: req.session.username };
    const result = await userCollection.findOne(filter);

    if (result) {
      const watchlist = result.watchlist;
      res.json(watchlist);
    } else {
      console.log("User not found");
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error("Error retrieving watchlist:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { displayWatchlist };