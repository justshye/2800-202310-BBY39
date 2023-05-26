// ChatGPT-3.5 was heavily used for the code below
const csv = require("csv-parser");
const fs = require("fs");

let count = 0;

fs.createReadStream("./mymoviedb.csv")
  .pipe(csv())
  .on("data", async (row) => {
    const title = row["Title"];
    const movieAlreadyExists = await movieCollection.findOne({ Title: title });
    if (movieAlreadyExists) {
      console.log(`A movie with title "${title}" already exists in the database.`);
    } else {
      const newMovie = {
        Release_Date: row["Release_Date"],
        Title: row["Title"],
        Overview: row["Overview"],
        Popularity: row["Popularity"],
        Vote_Count: row["Vote_Count"],
        Vote_Average: row["Vote_Average"],
        Original_Language: row["Original_Language"],
        Genre: row["Genre"],
        Poster_Url: row["Poster_Url"]
      };
      const result = await movieCollection.insertOne(newMovie);
      console.log(`Movie "${title}" inserted into the database.`);
    }
    count++;
  })
  .on("end", async () => {
    console.log(`Processed ${count} movies.`);
    const totalMovies = await movieCollection.countDocuments();
    console.log(`Total number of movies in collection: ${totalMovies}.`);
  });