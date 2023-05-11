const { Configuration, OpenAIApi } = require("openai");
require('./utils.js');

require("dotenv").config();

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
/* secret information */

var { database } = include("./databaseConnection.js");
const userCollection = database.db(mongodb_database).collection("users");

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

// async..await is not allowed in global scope, must use a wrapper
async function main() {
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

  const resetToken = "YOUR_RESET_TOKEN"; // Replace with your actual reset token

// Plain text body
const textBody = `Dear User,

You have requested to reset your password. To proceed with the password reset process, please click on the following link:

Reset Password: http://example.com/reset/${resetToken}

If you did not initiate this request, please ignore this email. Your current password will remain unchanged.

Thank you,
The Support Team`;

// HTML body
const htmlBody = `<p>Dear User,</p>
<p>You have requested to reset your password. To proceed with the password reset process, please click on the following link:</p>
<p><a href="http://example.com/reset/${resetToken}">Reset Password</a></p>
<p>If you did not initiate this request, please ignore this email. Your current password will remain unchanged.</p>
<p>Thank you,<br>
The MovieMate Support Team</p>`;

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: `"MovieMate 👻" <${email_auto}>`, // sender address
    to: "nico140895@gmail.com", // list of receivers
    subject: "Password Reset", // Subject line
    text: textBody, // plain text body
    html: htmlBody, // html body
  });

  // console.log("Message sent: %s", info.messageId);
  // // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  console.log("Message sent: %s", info.messageId);
}
main().catch(console.error);

async function generateResetToken() {
  // Generate a random string or value to use as the reset token
  const resetToken = await bcrypt.hash("your_reset_token_value", 10); // Replace "your_reset_token_value" with your own reset token value

  // Store the reset token securely in the user's document in the database
  const user = await userCollection.findOneAndUpdate(
    { email: "turtino08@gmail.com" }, // Replace with the user's email for whom the reset token is generated
    { $set: { resetToken: resetToken } },
    { returnOriginal: false }
  );

  // Return the reset token
  return user.resetToken;
}
// console.log(generateResetToken());

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: false }));

app.use(express.static(__dirname + "/public"));



app.get('/', (req, res) => {
    res.render("homepage", {
        user: req.session.username,
        authenticated: req.session.authenticated
    });
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

app.post("/resetPassword", async (req, res) => {
  try {
    // 1. Get the user's email from the request body
    const { email } = req.body;

    // 2. Check if the email exists in the database
    const user = await userCollection.findOne({ email });
    console.log(email);
    if (!user) {
      res.status(404).send("Email not found.");
      return;
    }

    

    // 3. Generate a unique password reset token (you can use a library like uuid or crypto)
    const resetToken = generateResetToken(); // Replace with your own implementation

    // 4. Save the reset token to your database for future verification
    // Save the token to the user's document in the database or any other desired approach

    // 5. Create a Nodemailer transporter
    const transporter = nodemailer.createTransport({
      // Specify your email service provider and credentials
      service: "gmail",
      auth: {
        user: email_auto,
        pass: email_password,
      },
    });

    // 6. Compose the email
    const mailOptions = {
      from: "moviemate2000@gmail.com",
      to: email,
      subject: "Password Reset",
      text: `Click on the following link to reset your password: http://example.com/reset/${resetToken}`,
    };

    // 7. Send the email
    await transporter.sendMail(mailOptions);

    // 8. Handle successful email sending
    res.status(200).send("Password reset link has been sent to your email.");
  } catch (error) {
    // 9. Handle error
    console.error("Error sending password reset email:", error);
    res.status(500).send("An error occurred while sending the password reset email.");
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
