// ChatGPT-3.5 and Comp 2537 code was heavily used for the code below
const {
  bcrypt,
  expireTime,
  Joi,
  saltRounds,
  userCollection,
} = require("../setup/config.js");

// Function to validate user details
async function validateUserDetails(username, email, password) {
  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    email: Joi.string().email().required(),
    password: Joi.string().max(20).required(),
  });

  return schema.validate({ username, email, password });
}

// Function to check if user already exists
async function checkUserExistence(username, email) {
  return await userCollection.findOne({
    $or: [{ username: username }, { email: email }],
  });
}

// Function to hash user password
async function hashUserPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

// Function to create new user
async function createNewUser(username, email, hashedPassword) {
  return await userCollection.insertOne({
    username: username,
    email: email,
    password: hashedPassword,
    user_type: "user",
    watchlist: [],
    rejectedMovies: [],
    avatar: "default.png",
  });
}

// Function to find user by username
async function findUserByUsername(username) {
  return await userCollection
    .find({ username: username })
    .project({ username: 1, password: 1, user_type: 1, _id: 1, email: 1 })
    .toArray();
}

// Function to set session variables
function setSessionVariables(req, user) {
  req.session.authenticated = true;
  req.session.cookie.maxAge = expireTime;
  req.session.username = user.username;
  req.session.email = user.email;
  req.session.user_type = user.user_type;
  req.session.userId = user._id;
}

async function signupSubmit(req, res) {
  var { username, email, password } = req.body;

  const validationResult = await validateUserDetails(username, email, password);

  if (validationResult.error) {
    res.render("signup-submit", {validationMessage: validationResult.error.message,});
    return;
  }

  const userAlreadyExists = await checkUserExistence(username, email);

  if (userAlreadyExists) {
    let validationMessage = userAlreadyExists.username == username
      ? "Username is already taken!"
      : "Email is already in use!";

    res.render("signup-submit", {validationMessage,});
    return;
  }

  var hashedPassword = await hashUserPassword(password);
  await createNewUser(username, email, hashedPassword);

  const result = await findUserByUsername(username);
  setSessionVariables(req, result[0]);

  req.session.save(() => {
    res.redirect("/");
  });
}

module.exports = { signupSubmit };
