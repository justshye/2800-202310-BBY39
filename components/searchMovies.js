// ChatGPT-4.0 was heavily used for the code below
const { userCollection, movieCollection } = require("../setup/config.js");
const Fuse = require('fuse.js');

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

async function searchMovies(req, res) {
  try {
    const movies = await getMovies(); // Get all movies
    const fuse = new Fuse(movies, { keys: ['Title'] });
    const searchString = req.body.searchString.trim().replace(/\s+/g, ' '); // Normalize search input
    const results = fuse.search(searchString);
    const topResults = results.slice(0, 5).map(result => result.item); // Take the top 5 results

    const filter = { username: req.session.username };
    const update = { $set: { searchedMovies: topResults } };

    const result = await userCollection.findOne(filter);

    if (result) {
      await userCollection.updateOne(filter, update);
      console.log("Document updated successfully");
      res.json(topResults);
    } else {
      console.log("User not found");
    }
  } catch (error) {
    console.error("Error updating document:", error);
    res.status(500).send("Internal Server Error");
  }
}

module.exports = { searchMovies };
