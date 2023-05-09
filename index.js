const { Configuration, OpenAIApi } = require("openai");
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

const configuration = new Configuration({
	organization: process.env.OPENAI_ORGANIZATION_ID,
	apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function getOpenAIResponse(prompt) {
	const completion = await openai.createChatCompletion({
		model: "gpt-3.5-turbo",
		messages: [
			{role: "user", content: prompt},
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

app.get('/openai', async (req, res) => {
	try {
	  const prompt = req.query.prompt || ''; // Get the prompt from the query parameter or use an empty string as the default
	  let response;
	  if (prompt != '' ) {
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