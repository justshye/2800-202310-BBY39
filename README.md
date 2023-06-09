# **2800-202310-BBY39: MovieMate**

## **Project Description**

Our team, MovieMate, is developing a movie curation web application to help movie enthusiasts discover personalized movie recommendations while promoting social equity and diversity, using personalized filtering, and data from an online movie dataset.

## **Technologies Used**  
- **Frontend** : EJS, HTML, JavaScript, Bootstrap
- **Backend** : JavaScript (Node.js)
- **Database** : MongoDB
- **Other tech tools** : Qoddi (for hosting)

## **Listing of File Contents**

Here are the files and directories in the repository:
```
root
│   .gitignore
│   package.json
│   Procfile
│   README.md
│
├───components
│       addToRejectedMovies.js
│       addToWatchlist.js
│       changeWatchlist.js
│       curatedMovies.js
│       displayWatchlist.js
│       friends.js
│       loginSubmit.js
│       movieDetails.js
│       movieDetailsWatchlist.js
│       openai.js
│       profile.js
│       randomMovie.js
│       resetChangedPasswordToken.js
│       resetPassword.js
│       resetPasswordToken.js
│       searchMovies.js
│       signupSubmit.js
│       stats.js
│       userOptions.js
│
├───public
│   │   arrow.png
│   │   check.png
│   │   home.png
│   │   homepage-wireframeHD.png
│   │   Landing Page Instructions 1.png
│   │   Landing Page Instructions 2.png
│   │   Landing Page Instructions 3.png
│   │   Landing Page Instructions 4.png
│   │   Landing Page Instructions 5.png
│   │   Landing Page Instructions 6.png
│   │   moviemate404.png
│   │   moviepreview-wireframeHD.png
│   │   profile-user.png
│   │   profilepage-wireframe.png
│   │   profilepage-wireframeHD.png
│   │   remove.png
│   │   search.png
│   │   style.css
│   │   to-do-list.png
│   │
│   └───avatars
│           default.png
│           detective pikachu.png
│           lucifer.png
│           moviemate.png
│           sonic.png
│           wednesday.png
│           will smith.png
│
├───setup
│       config.js
│       databaseConnection.js
│       datasetInformationInsertion.js
│       index.js
│       utils.js
│
└───views
    │   404.ejs
    │   email-not-found.ejs
    │   friends.ejs
    │   homepage.ejs
    │   link-expired.ejs
    │   login-submit.ejs
    │   login.ejs
    │   moviedetails-watchlist.ejs
    │   moviedetails.ejs
    │   openai.ejs
    │   password-changed.ejs
    │   post-recover-password.ejs
    │   profile.ejs
    │   recover-password.ejs
    │   reset-password.ejs
    │   signup-submit.ejs
    │   signup.ejs
    │   stats.ejs
    │   watchlist-currentlyWatching.ejs
    │   watchlist-dropped.ejs
    │   watchlist-planToWatch.ejs
    │   watchlist-watched.ejs
    │   watchlist.ejs
    │
    └───templates
            back-to-login.ejs
            back-to-resetPassword.ejs
            back-to-signup.ejs
            bottomnav.ejs
            filter-checkboxes.ejs
            footer.ejs
            header.ejs
            tindernavbar.ejs
            user.ejs
```            

## **How to Install or Run the Project**

To start working on this web application, follow these steps:

1. Download and Install Visual Studio Code, and nodejs
2. Clone the repo by copying the address in github and using git clone
3. Install all npm dependencies found in the package.json including:  
   a. bcrypt  
   b. connect-mongo  
   c. connect-mongodb-session  
   d. csv-parser  
   e. dotenv  
   f. ejs  
   g. express  
   h. express-session  
   i. fuse.js  
   j. joi  
   k. node-localstorage   
   l. nodemailer  
   m. openai   
   n. uuid   

4. Create a mongodb account with atlas, and ask a team member to give you access to the database
5. Configure your .env file to include the information found in passwords.txt which will have important server/email/server login IDs and passwords
6. Obtain API keys for open ai api and add that to your .env file
7. Refer to the testing plan [https://docs.google.com/spreadsheets/d/1UIhqntL1AezH-u0fq1aIW8L1h4QlU8DDP-XTuM899Os/edit#gid=0] for testing history and potential bugfix contributions
8. To run the project, make sure you also install the node module nodemon
9. To use nodemon, make sure to type 'nodemon index.js' in terminal (make sure you are in the root folder of the cloned repo)

Remember to check the plaintext file **passwords.txt** (not added to the repo) in the Dropbox for any admin/user/server login IDs and passwords.

## **How to Use the Product (Features)**

#### **Login:** <br>
Before you can use MovieMate, you will be required to create an account, which will ask you for an email, username (must not already be in database), and password. If you already have an account, you can simply login with a username and password. <br>

#### **Searching/adding movies:** <br>
Once you are in the application, you will be directed to the home page where you can either search for movies, or use random or curated to find new movies. The curated button will find movies based on your watchlist, while random will select any random movie. If you find a movie that interests you, you can either add to watchlist or reject it either in the main page or in the movie details page (accessed by clicking on a movie). <br>

#### **Watchlist:** <br>
To access the watchlist, you can click on the bottom left navigation button. Movies that are added to watchlist will be found in the watchlist. Every movie can be marked as completed, dropped, plan to watch, and currently watching. The movies can be filtered for easy browsing. The movies can be filtered by your current watching status of the movie, as well as by the movie genres. If you wish to find a movie by name, you may also use the searchbar provided. <br>

#### **Profile:** <br>
To access the profile, you can click on the bottom right navigation button. Every user will also have a custom profile where they can customize their profile picture with one of the preset images. You can also view you movie stats by clicking on the stats button. Users can access their friends watchlists by clicking on friends and then clicking on view watchlist(note that this feature is still a work in progress).  <br>

#### **Logging out:** <br>
To log out from the application, must first go to the profile page. Once the profile page is reached, a user can click on the Log out button to exit their session. A user may also be logged out if their session is over 6 hours long.

## **Credits, References, and Licenses**

Note: The entirety of the code was generated by using a combination of code from comp 2537 as well as chatgpt. Our code has been heavily be refactored over and over using ChatGPT, and as a result, it can be assumed that every line of code has some sort of modification done by ChatGPT.

Our application used code from the following sources: 
1. ChatGPT [Prompt Log: https://docs.google.com/spreadsheets/d/1dvW0a_oPzTTrDhKPqBA-ZSf5jJF9RrkjnewyTdMaMUc/edit#gid=0]
2. Comp 2537 assignments(from all our team members)/lectures  
3. Open ai api: https://platform.openai.com/docs/introduction
4. Open ai tutorial: https://youtu.be/LX_DXLlaymg
5. Nodemailer: https://nodemailer.com/about/ 
6. Bootstrap: https://getbootstrap.com/docs/5.3/getting-started/introduction/ 
7. 9000+ Movies Dataset: https://www.kaggle.com/datasets/disham993/9000-movies-dataset

## **How We Used AI**

- **App Creation** : ChatGPT was heavily used to create the code for our application. It was used to refactor code (make it cleaner), find out solutions to problems, as well as to learn new things along the way.
- **Data Sets** : We did not use any AI to create/clean up datasets.
- **App Functionality** : The MovieMate application does not currently use AI for any functionality. It has the open ai api already setup to use, however we did not implement anything for it as of this moment.
- **Limitations and Solutions** : We were planning originally to use AI to generate a shorter description for movies, but we found that it would take too long, and make for a poor user experience. We ended up simply displaying only the first 20 words of the description instead.

## **Contact Information**

You can contact our team members through email:
- Trevor: tsiu6@my.bcit.ca
- Nicolas: nrodriguez8@my.bcit.ca
- Cyrus: cvillaruz1@my.bcit.ca
- Samuel: spark362@my.bcit.ca
