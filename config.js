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

module.exports = {
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
  mongodb_database,
  mongodb_host,
  mongodb_password,
  mongodb_port,
  mongodb_session_secret,
  mongodb_user,
  node_env,
  node_session_secret,
  nodemailer,
  ObjectId,
  OpenAIApi,
  port,
  saltRounds,
  session,
  userCollection,
  uuidv4,
};