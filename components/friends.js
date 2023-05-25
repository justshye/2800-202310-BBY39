const { userCollection } = require("../setup/config.js");

async function friends(req, res) {
  const result = await userCollection
    .find({})
    .project({
      username: 1,
      email: 1,
      password: 1,
      user_type: 1,
      _id: 1,
      avatar: 1,
    })
    .toArray();
  res.render("friends", { users: result });
}

module.exports = { friends };
