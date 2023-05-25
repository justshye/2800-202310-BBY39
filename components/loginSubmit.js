const { bcrypt, expireTime, Joi, userCollection } = require("../setup/config.js");

async function validateInput(username, password) {
  const schema = Joi.object({
    username: Joi.string().alphanum().required(),
    password: Joi.string().max(20).required(),
  });

  const validationResult = schema.validate({ username, password });

  return validationResult.error != null
    ? {
        validationError: true,
        validationMessage: validationResult.error.message,
      }
    : null;
}

async function findUserByUsername(username) {
  const result = await userCollection
    .find({ username: username })
    .project({ username: 1, password: 1, user_type: 1, _id: 1, email: 1 })
    .toArray();

  return result.length === 1 ? result[0] : null;
}

async function authenticateUser(req, res, password, user) {
  if (await bcrypt.compare(password, user.password)) {
    req.session.authenticated = true;
    req.session.cookie.maxAge = expireTime;
    req.session.username = user.username;
    req.session.email = user.email;
    req.session.user_type = user.user_type;
    req.session.userId = user._id;
    req.session.save(() => {
      res.redirect("/");
    });
  } else {
    res.render("login-submit", {
      validationError: false,
      userFound: true,
      correctPassword: false,
    });
  }
}

async function loginSubmit(req, res) {
  const username = req.body.username;
  const password = req.body.password;

  const inputError = await validateInput(username, password);
  if (inputError) {
    res.render("login-submit", inputError);
    return;
  }

  const user = await findUserByUsername(username);
  if (!user) {
    res.render("login-submit", {
      validationError: false,
      userFound: false,
    });
    return;
  }

  await authenticateUser(req, res, password, user);
}

module.exports = { loginSubmit };
