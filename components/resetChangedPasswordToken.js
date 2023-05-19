const { bcrypt, Joi, saltRounds, userCollection } = require("../config");

async function resetChangedPasswordToken(req, res) {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  const schema = Joi.object({
    newPassword: Joi.string().max(20).required(),
    confirmPassword: Joi.any()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({ "any.only": "Passwords do not match." }),
  });

  try {
    await schema.validateAsync({ newPassword, confirmPassword });

    // 1. Retrieve the user from the database using the reset token
    const user = await userCollection.findOne({ resetToken: token });

    if (!user) {
      res.status(404).send("Invalid reset token.");
      return;
    }

    // 2. Update the user's password with the new password
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await userCollection.findOneAndUpdate(
      { resetToken: token },
      { $set: { password: hashedPassword, resetToken: null } }
    );

    res.render("password-changed", { state: "success", token: token });
  } catch (error) {
    res.render("password-changed", {
      validationMessage: error.details[0].message,
      state: "error",
      token: token,
    });
  }
}

module.exports = { resetChangedPasswordToken };
