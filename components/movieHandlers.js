const { Configuration, OpenAIApi } = require("openai");
require("../utils.js");

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
  
  async function addToInterestedHandler(req, res) {
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
        Watched: false,
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
  }
  
  async function addToNotInterestedHandler(req, res) {
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
  }
  
  module.exports = { movieDetailsHandler, addToInterestedHandler, addToNotInterestedHandler };