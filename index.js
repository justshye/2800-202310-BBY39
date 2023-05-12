const { Configuration, OpenAIApi } = require("openai");
require('./utils.js');

require("dotenv").config();

const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const bcrypt = require("bcrypt");
const Joi = require("joi");
// const url = require('url');
const saltRounds = 12;

const port = process.env.PORT || 4420;
const app = express();

const expireTime = 1 * 60 * 60 * 1000; //expires after 1 hour (hours * minutes * seconds * millis)

/* secret information */
const node_session_secret = process.env.NODE_SESSION_SECRET;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const mongodb_port = process.env.MONGODB_PORT;
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
/* secret information */

var { database } = include("./databaseConnection.js");
const userCollection = database.db(mongodb_database).collection("users");
const movieCollection = database.db(mongodb_database).collection("movies");

/* 
Should we have to reimport the data, run the following code until the database
has 1000 documents in the "movies" collection. You will need to install csv-parser
through npm to run this snippet.

const csv = require("csv-parser");
const fs = require("fs");

let count = 0;

fs.createReadStream("./imdb_top_1000.csv")
  .pipe(csv())
  .on("data", async (row) => {
    const title = row["Series_Title"];
    const movieAlreadyExists = await movieCollection.findOne({ Series_Title: title });
    if (movieAlreadyExists) {
      console.log(`A movie with title "${title}" already exists in the database.`);
    } else {
      const newMovie = {
        Poster_Link: row.Poster_Link,
        Series_Title: title,
        Released_Year: row.Released_Year,
        Certificate: row.Certificate,
        Runtime: row.Runtime,
        Genre: row.Genre,
        IMDB_Rating: row.IMDB_Rating,
        Overview: row.Overview,
        Meta_score: row.Meta_score,
        Director: row.Director,
        Star1: row.Star1,
        Star2: row.Star2,
        Star3: row.Star3,
        Star4: row.Star4,
        No_of_Votes: row.No_of_Votes,
        Gross: row.Gross,
      };
      const result = await movieCollection.insertOne(newMovie);
      console.log(`Movie "${title}" inserted into the database.`);
    }
    count++;
  })
  .on("end", async () => {
    console.log(`Processed ${count} movies.`);
    const totalMovies = await movieCollection.countDocuments();
    console.log(`Total number of movies in collection: ${totalMovies}.`);
  });
*/

var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true&w=majority`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

const configuration = new Configuration({
  organization: process.env.OPENAI_ORGANIZATION_ID,
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function getOpenAIResponse(prompt) {
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "user", content: prompt },
    ],
    max_tokens: 10,
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(completion.data.choices[0].message);
  return completion.data.choices[0].message.content;
}

app.use(session({
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

app.get('/', (req, res) => {
  res.render("homepage", {
    user: req.session.username,
    authenticated: req.session.authenticated
  });
});

app.get('/watchlist', (req, res) => {
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

app.post("/loginSubmit", async (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  const schema = Joi.object({
    username: Joi.string().alphanum().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ username, password });

  if (validationResult.error != null) {
    res.render("login-submit", {
      validationError: true,
      validationMessage: validationResult.error.message,
    });
    return;
  }

  const result = await userCollection
    .find({ username: username })
    .project({ username: 1, password: 1, user_type: 1, _id: 1 })
    .toArray();

  if (result.length != 1) {
    res.render("login-submit", {
      validationError: false,
      userFound: false,
    });
    return;
  }

  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session.cookie.maxAge = expireTime;
    req.session.username = result[0].username;
    req.session.user_type = result[0].user_type;
    req.session.save(() => {
      res.redirect("/");
    });
    return;
  } else {
    res.render("login-submit", {
      validationError: false,
      userFound: true,
      correctPassword: false,
    });
    return;
  }
});

app.post("/signupSubmit", async (req, res) => {
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ username, email, password });
  if (validationResult.error != null) {
    res.render("signup-submit", {
      validationMessage: validationResult.error.message,
    });
    return;
  }

  const userAlreadyExists = await userCollection.findOne({
    $or: [{ username: username }, { email: email }],
  });

  if (userAlreadyExists) {
    if (userAlreadyExists.username == username) {
      res.render("signup-submit", {
        validationMessage: "Username is already taken!",
      });
    } else if (userAlreadyExists.email == email) {
      res.render("signup-submit", {
        validationMessage: "Email is already in use!",
      });
    }

    return;
  }

  var hashedPassword = await bcrypt.hash(password, saltRounds);

  await userCollection.insertOne({
    username: username,
    email: email,
    password: hashedPassword,
    user_type: "user",
  });

  req.session.authenticated = true;
  req.session.email = email;
  req.session.cookie.maxAge = expireTime;
  req.session.username = username;
  req.session.save(() => {
    res.redirect("/");
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

app.get('/profile', function (req, res) {
  if (!req.session.authenticated) {
    res.redirect("/");
  } else {
    // render the profile template
    res.render("profile", { user: req.session.username });
  }
});

app.get('/friends', sessionValidation, async (req, res) => {
  const result = await userCollection.find({}).project({username: 1, email: 1, password: 1, user_type: 1, _id: 1}).toArray();
  res.render('friends', {users: result});
})

app.get('/stats', sessionValidation, async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
  } else {
    userCollection.findOne({ username: req.session.username }, function (err, user) {
      const totalMoviesWatched = user.moviesWatched.length;
      const totalWatchTime = user.moviesWatched.reduce((total, movie) => total + movie.watchTime, 0);

      res.render('stats', { user: user.username, totalMoviesWatched: totalMoviesWatched, totalWatchTime: totalWatchTime });
    });
  }
});


app.get('/friends', function (req, res) {
  if (!req.session.authenticated) {
    res.redirect("/");
  } else {
    // render the profile template
    res.render("friends", { user: req.session.username });
  }
});


app.get('/openai', async (req, res) => {
  try {
    const prompt = req.query.prompt || ''; // Get the prompt from the query parameter or use an empty string as the default
    let response;
    if (prompt != '') {
      response = await getOpenAIResponse(prompt);
    }
    else {
      response = '';
    }
    res.render('openai', { prompt, generatedMessage: response });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});
app.listen(port, () => {
  console.log(`Node application listening on port ${port}`);
});
