require('./utils.js');

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const Joi = require('joi');
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


var {database} = include("./databaseConnection.js");
const userCollection = database.db(mongodb_database).collection("users");

var mongoStore = MongoStore.create({
    mongoUrl:
    `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/?retryWrites=true&w=majority`,
    crypto: {
        secret: mongodb_session_secret
    }
});

app.use(session({
    secret: node_session_secret,
        store: mongoStore, //default is memory, but we want to use mongo
        saveUninitialized: false,
        resave: false,
}
));

function isValidSession(req) {
    return req.session.authenticated;
}

function sessionValidation(req, res, next) {
    if (isValidSession(req)) {
        next();
    } 
    else {
        res.redirect('/login');
    }
}

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));

app.use(express.static(__dirname + "/public"));

// app.get('/', (req, res) => {
// 	res.
// });

app.get("*", (req, res) => {
    res.status(404);
    res.render("404");
});
app.listen(port, () => {
	console.log(`Node application listening on port ${port}`);
}); 