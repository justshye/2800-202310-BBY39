const { bcrypt, expireTime, Joi, userCollection } = require("../config");

async function loginSubmit(req, res) {
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
}

module.exports = { loginSubmit }; 