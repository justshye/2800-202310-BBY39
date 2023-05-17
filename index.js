const { Configuration, OpenAIApi } = require("openai");
require("./utils.js");

require("dotenv").config();

const { v4: uuidv4 } = require("uuid");
const nodemailer = require("nodemailer");
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
const email_auto = process.env.EMAIL_AUTO;
const email_password = process.env.EMAIL_PASSWORD;
const node_env = process.env.NODE_ENV;
/* secret information */

var { database, ObjectId } = include("./databaseConnection.js");

const userCollection = database.db(mongodb_database).collection("users");
const movieCollection = database.db(mongodb_database).collection("movies");

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
    messages: [{ role: "user", content: prompt }],
    max_tokens: 10,
    temperature: 0,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  console.log(completion.data.choices[0].message);
  return completion.data.choices[0].message.content;
}

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

async function sendEmail(email, resetToken, user) {
  // Generate test SMTP service account from ethereal.email
  // Only needed if you don't have a real mail account for testing
  // let testAccount = await nodemailer.createTestAccount();

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: email_auto, // generated ethereal user
      pass: email_password, // generated ethereal password
    },
  });
  let url = "";
  console.log("resetToken ", resetToken);
  if (node_env === "development") {
    url = `http://localhost:4420/reset/${resetToken}`;
  } else if (node_env === "production") {
    url = `http://fwurnptkem.eu09.qoddiapp.com/reset/${resetToken}`;
  }
  // Plain text body
  const textBody = `Dear ${user},

You have requested to reset your password. To proceed with the password reset process, please click on the following link:

Reset Password: ${url}

If you did not initiate this request, please ignore this email. Your current password will remain unchanged.

Thank you,
The Support Team`;

  // HTML body
  const htmlBody = `<p>Dear ${user},</p>
<p>You have requested to reset your password. To proceed with the password reset process, please click on the following link:</p>
<p><a href="${url}">Reset Password</a></p>
<p>If you did not initiate this request, please ignore this email. Your current password will remain unchanged.</p>
<p>Thank you,<br>
The MovieMate Support Team</p>`;

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"MovieMate 👻" <${email_auto}>`, // sender address
    to: email, // list of receivers
    subject: "Password Reset", // Subject line
    text: textBody, // plain text body
    html: htmlBody, // html body
  });

  // console.log("Message sent: %s", info.messageId);
  // // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  console.log("Message sent: %s", info.messageId);
  console.log("resetToken ", resetToken);
  console.log("Preview URL: %s", url);
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

app.get("/moviedetails", (req, res) => {
  if (req.session.authenticated) {
    res.render("moviedetails", {});
  } else {
    res.redirect("/");
  }
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/recover-password", (req, res) => {
  res.render("recover-password");
});

app.post("/resetPassword", async (req, res) => {
  try {
    // 1. Get the user's email from the request body
    const { email } = req.body;

    // 2. Check if the email exists in the database
    const user = await userCollection.findOne({ email });
    console.log(email);
    console.log(user.username);
    if (!user) {
      res.status(404).send("Email not found.");
      return;
    }

    // 3. Generate a unique password reset token (you can use a library like uuid or crypto)
    const resetToken = uuidv4();

    // Store the reset token securely in the user's document in the database
    await userCollection.findOneAndUpdate(
      { email: email }, // Replace with the user's email for whom the reset token is generated
      { $set: { resetToken: resetToken } }
    );
    // 4. Store the reset token securely in the user's document in the database and send the email
    sendEmail(email, resetToken, user.username);

    // 5. Handle successful email sending
    // res.status(200).send("Password reset link has been sent to your email.");
    res.render("post-recover-password", { login: "/login" });
  } catch (error) {
    // 6. Handle error
    console.error("Error sending password reset email:", error);
    res
      .status(500)
      .send("An error occurred while sending the password reset email.");
    res.render("post-recover-password");
  }
});

app.get("/reset/:token", async (req, res) => {
  const { token } = req.params;

  console.log("token ", token);

  // Check if the token exists in the database
  const user = await userCollection.findOne({ resetToken: token });

  if (!user) {
    res.render("link-expired", { login: "/login" });
  } else {
    res.render("reset-password", { token });
  }
});

app.post("/reset/:token/changedPassword", async (req, res) => {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  const schema = Joi.object({
    newPassword: Joi.string().max(20).required(),
    confirmPassword: Joi.any()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({ "any.only": "Passwords do not match." }),
  });

  try {
    await schema.validateAsync({ newPassword, confirmPassword });

    // 1. Retrieve the user from the database using the reset token
    const user = await userCollection.findOne({ resetToken: token });

    if (!user) {
      res.status(404).send("Invalid reset token.");
      return;
    }

    // 2. Update the user's password with the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await userCollection.findOneAndUpdate(
      { resetToken: token },
      { $set: { password: hashedPassword, resetToken: null } }
    );

    res.render("password-changed", { state: "success", token: token });
  } catch (error) {
    res.render("password-changed", {
      validationMessage: error.details[0].message,
      state: "error",
      token: token,
    });
  }
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
    .project({ username: 1, password: 1, user_type: 1, _id: 1, email: 1 })
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
    req.session.email = result[0].email;
    req.session.user_type = result[0].user_type;
    req.session.userId = result[0]._id;
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
    watchlist: [],
    rejectedMovies: [],
    avatar: "default.png",
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
  // localStorage.clear();
  req.session.destroy();
  res.redirect("/");
});

app.post("/user-options", sessionValidation, async (req, res) => {
  const { avatar } = req.body;
  const username = req.session.username;
  console.log("Updating avatar for user:", username, "with value:", avatar);
  try {
    const result = await userCollection.updateOne(
      { username: username },
      { $set: { avatar: avatar } },
      { upsert: true }
    );
    console.log("Update result:", result);
    req.session.avatar = avatar; // update the avatar in the session
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user avatar");
  }
});

app.get("/profile", async function (req, res) {
  if (!req.session.authenticated) {
    res.redirect("/");
  } else {
    const username = req.session.username;
    try {
      const user = await userCollection.findOne({ username: username }, { avatar: 1, moviesWatched: 1 });
      const moviesWatched = user.moviesWatched ? user.moviesWatched.length : 0;
      const movieMateUnlocked = moviesWatched >= 5;
      res.render("profile", { user: username, email: req.session.email, avatar: user.avatar, moviesWatched, movieMateUnlocked });
    } catch (err) {
      console.error(err);
      const movieMateUnlocked = false; // Set movieMateUnlocked to false
      res.render("profile", { user: username, email: req.session.email, avatar: user.avatar, moviesWatched: 0, movieMateUnlocked });
    }
  }
});

app.get("/friends", sessionValidation, async (req, res) => {
  const result = await userCollection
    .find({})
    .project({ username: 1, email: 1, password: 1, user_type: 1, _id: 1, avatar: 1 })
    .toArray();
  res.render("friends", { users: result });
});

// app.get("/friends", function (req, res) {
//   if (!req.session.authenticated) {
//     res.redirect("/");
//   } else {
//     // render the profile template
//     res.render("friends", { user: req.session.username });
//   }
// });

app.get("/stats", sessionValidation, async (req, res) => {
  if (!req.session.authenticated) {
    res.redirect("/");
    return;
  } else {
    const username = req.session.username;
    const user = await userCollection.findOne({ username: username }, { moviesWatched: 1 });
    const watchlistSize = user.watchlist.length;
    let moviesWatched = 0;
    for (const movie of user.watchlist) {
      if (movie.watched) {
        moviesWatched++;
      }
    }
    const watchHours = Math.floor((moviesWatched * 130.9) / 60); //average movie duration is 130.9 minutes
    const watchMinutes = Math.floor((moviesWatched * 130.9) % 60);
    res.render("stats", { user: username, watchlistSize, moviesWatched, watchHours, watchMinutes });
  }
});

app.get("/openai", async (req, res) => {
  try {
    const prompt = req.query.prompt || ""; // Get the prompt from the query parameter or use an empty string as the default
    let response;
    if (prompt != "") {
      response = await getOpenAIResponse(prompt);
    } else {
      response = "";
    }
    res.render("openai", { prompt, generatedMessage: response });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/random-movie", async (req, res) => {
  try {
    const movies = await getMovies();
    const randomMovies = [];

    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      randomMovies.push(movies[randomIndex]);
      movies.splice(randomIndex, 1); // remove the selected movie from the array
    }

    const filter = { username: req.session.username };
    const update = { $set: { randomMovies: randomMovies } };

    const result = await userCollection.findOne(filter);
    console.log(result);

    if (result) {
      await userCollection.updateOne(filter, update);
      console.log("Document updated successfully");
    } else {
      console.log("User not found");
    }

    res.json(randomMovies);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).send("Internal Server Error");
  }
});


// const { ObjectId } = require('mongodb');

app.get("/movie/:id", async (req, res) => {
  const movieId = req.params.id;

  const filter = { _id: movieId }; // Convert movieId to ObjectId
  const projection = { randomMovies: 5 };

  try {
    const result = await userCollection.findOne({ username: req.session.username });
    console.log(result);
    if (result) {
      const randomMovies = result.randomMovies;
      console.log(randomMovies);
      const movie = randomMovies.find((movie) => movie._id == movieId);
      // Handle the rest of your logic for rendering the movie details
      res.render("moviedetails", { movie: movie });
    } else {
      console.log("Document not found");
      return res.status(404).send("Movie not found");
    }
  } catch (error) {
    console.error("Error retrieving document:", error);
    return res.status(500).send("Internal Server Error");
  }
});


app.get("/add-to-interested", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const movieId = req.query.movieId;
    const movie = await movieCollection.findOne({ _id: new ObjectId(movieId) });

    if (!movie) {
      throw new Error("Movie not found");
    }

    const newMovie = {
      Release_Date: movie["Release_Date"],
      Title: movie["Title"],
      Overview: movie["Overview"],
      Popularity: movie["Popularity"],
      Vote_Count: movie["Vote_Count"],
      Vote_Average: movie["Vote_Average"],
      Original_Language: movie["Original_Language"],
      Genre: movie["Genre"],
      Poster_Url: movie["Poster_Url"],
      Watched: false
    };

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { watchlist: newMovie } }
    );

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.get("/add-to-not-interested", async (req, res) => {
  try {
    const userId = req.session.userId;

    if (!userId) {
      throw new Error("User not authenticated");
    }

    const movieId = req.query.movieId;
    const movie = await movieCollection.findOne({ _id: new ObjectId(movieId) });

    if (!movie) {
      throw new Error("Movie not found");
    }

    const newMovie = {
      Release_Date: movie["Release_Date"],
      Title: movie["Title"],
      Overview: movie["Overview"],
      Popularity: movie["Popularity"],
      Vote_Count: movie["Vote_Count"],
      Vote_Average: movie["Vote_Average"],
      Original_Language: movie["Original_Language"],
      Genre: movie["Genre"],
      Poster_Url: movie["Poster_Url"],
    };

    await userCollection.updateOne(
      { _id: new ObjectId(userId) },
      { $push: { rejectedMovies: newMovie } }
    );

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});
app.listen(port, () => {
  console.log(`Node application listening on port ${port}`);
});
