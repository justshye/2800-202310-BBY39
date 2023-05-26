// ChatGPT-3.5 was heavily used for the code below
const { userCollection } = require("../setup/config.js");

async function resetPasswordToken(req, res) {
  const { token } = req.params;

  console.log("token ", token);

  // Check if the token exists in the database
  const user = await userCollection.findOne({ resetToken: token });

  if (!user) {
    res.render("link-expired", { login: "/login" });
  } else {
    res.render("reset-password", { token });
  }
}

module.exports = { resetPasswordToken };
