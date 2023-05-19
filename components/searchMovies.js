const { userCollection, movieCollection } = require("../config");
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
        const movies = await getMovies(); // your function to get all movies
        const fuse = new Fuse(movies, { keys: ['Title'] });
        const results = fuse.search(req.body.searchString);
        res.json(results.map(result => result.item));
      } catch (error) {
        console.error("Error searching movies:", error);
        res.status(500).send("Failed to search movies");
    }
  }
  

module.exports = { searchMovies };
