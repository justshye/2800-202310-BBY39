const { userCollection } = require("../config");

async function randomMovie(req, res) {
  try {
    const movies = await getMovies();
    const randomMovies = [];

    for (let i = 0; i < 5; i++) {
      const randomIndex = Math.floor(Math.random() * movies.length);
      randomMovies.push(movies[randomIndex]);
      movies.splice(randomIndex, 1); // remove the selected movie from the array
    }

    const filter = { username: req.session.username };
    const update = { $set: { randomMovies: randomMovies } };

    const result = await userCollection.findOne(filter);
    console.log(result);

    if (result) {
      await userCollection.updateOne(filter, update);
      console.log("Document updated successfully");
    } else {
      console.log("User not found");
    }

    res.json(randomMovies);
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { randomMovie };
