// ChatGPT-3.5 was heavily used for the code below
const { userCollection } = require("../setup/config.js");

async function userOptions(req, res) {
  const { avatar } = req.body;
  const username = req.session.username;
  console.log("Updating avatar for user:", username, "with value:", avatar);
  try {
    const result = await userCollection.updateOne(
      { username: username },
      { $set: { avatar: avatar } },
      { upsert: true }
    );
    console.log("Update result:", result);
    req.session.avatar = avatar; // update the avatar in the session
    res.send(result);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating user avatar");
  }
}

module.exports = { userOptions };
