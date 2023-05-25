const { bcrypt, Joi, saltRounds, userCollection } = require("../setup/config.js");

// Function to validate new password and confirm password
async function validateNewPassword(newPassword, confirmPassword) {
  const schema = Joi.object({
    newPassword: Joi.string().max(20).required(),
    confirmPassword: Joi.any()
      .valid(Joi.ref("newPassword"))
      .required()
      .messages({ "any.only": "Passwords do not match." }),
  });

  return await schema.validateAsync({ newPassword, confirmPassword });
}

// Function to find user by reset token
async function findUserByResetToken(token) {
  return await userCollection.findOne({ resetToken: token });
}

// Function to hash the new password
async function hashPassword(password) {
  return await bcrypt.hash(password, saltRounds);
}

// Function to update user's password in the database
async function updateUserPassword(user, hashedPassword) {
  await userCollection.findOneAndUpdate(
    { resetToken: user.resetToken },
    { $set: { password: hashedPassword, resetToken: null } }
  );
}

async function resetChangedPasswordToken(req, res) {
  const { token } = req.params;
  const { newPassword, confirmPassword } = req.body;

  try {
    await validateNewPassword(newPassword, confirmPassword);

    // Retrieve the user from the database using the reset token
    const user = await findUserByResetToken(token);

    if (!user) {
      res.status(404).send("Invalid reset token.");
      return;
    }

    const hashedPassword = await hashPassword(newPassword);
    await updateUserPassword(user, hashedPassword);

    // Render password-changed view with success state
    res.render("password-changed", { state: "success", token: token });
  } catch (error) {
    // Render password-changed view with error state and validation message
    res.render("password-changed", {
      validationMessage: error.details[0].message,
      state: "error",
      token: token,
    });
  }
}

module.exports = { resetChangedPasswordToken };
