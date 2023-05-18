const { userCollection, movieCollection } = require("../config");

let cachedMovies = null;

// Function to fetch the movies array
async function getMovies() {
  // If the movies array is already cached, return it
  if (cachedMovies) {
    return cachedMovies;
  }

  // If the movies array is not cached, fetch it from the movie collection
  const movies = await movieCollection.find().toArray();

  // Cache the movies array for future use
  cachedMovies = movies;

  return movies;
}

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
