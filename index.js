require('./utils.js');

require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const Joi = require('joi');
const url = require('url');

const app = express();

app.set('view engine', 'ejs');

app.use(express.urlencoded({extended: false}));

app.use(express.static(__dirname + '/public'));

app.listen(port, () => {
	console.log(`Node application listening on port ${port}`);
}); 