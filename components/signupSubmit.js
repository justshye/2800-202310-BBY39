const {
  bcrypt,
  expireTime,
  Joi,
  saltRounds,
  userCollection,
} = require("../config");

async function signupSubmit(req, res) {
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

  const result = await userCollection
  .find({ username: username })
  .project({ username: 1, password: 1, user_type: 1, _id: 1, email: 1 })
  .toArray();

  req.session.authenticated = true;
  req.session.cookie.maxAge = expireTime;
  req.session.username = result[0].username;
  req.session.email = result[0].email;
  req.session.user_type = result[0].user_type;
  req.session.userId = result[0]._id;
  req.session.save(() => {
    res.redirect("/");
  });
}

module.exports = { signupSubmit };
