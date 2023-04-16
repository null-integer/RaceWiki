//Import required modules
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const Database = require('./models/Database');

//Instantiate modules
const app = express();
app.set('view engine','ejs');
app.use(express.static(`${__dirname}/static`))

//Host name and port
const hostname = '127.0.0.1';
const port = 3000;

//connect to the database
let db;
(async () => {
	db = await open({
		filename: 'RaceWikiDB.db',
		driver: sqlite3.Database
	});
})();

//Routes

//Main Homepage
app.get('/', async (req, res) => {

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);
  
	res.render('homepage', {
    categories:categories,
  });
});

//Sign In Page
app.get('/signin', async (req, res) => {
	res.render('signin');
});

//Control Panel 
app.get('/controlpanel', async (req, res) => {
  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);
	res.render('controlPanel',{
    categories:categories,
  });
});

//Articles
app.get('/category/:categoryName', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);



  if (categories.includes(req.params['categoryName'])){

    let categoryInfo = await Database.findCategorybyName(db,req.params['categoryName']);
    
    //first attribute is to indicate if it's tabular data
    let sections = [
      [false, "Description", categoryInfo.category_description],
      [false, "Rules", categoryInfo.category_rules],
      [true,"Flags",""],
      [true,"Championship",""],
      [true,"Teams",""],
      [true,"Drivers",""]
    ];
  
    let generalInfo = [
      ["Drivers",categoryInfo.category_drivers],
      ["Teams",categoryInfo.category_teams],
      ["Driver's Champion",""],
      ["Constructor's Champion",""]
    ];
  
    let articleTitle = req.params['categoryName'];;
  
    res.render('article', {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: categoryInfo.category_picture
    });
  }
  else{
    res.sendStatus(404);
  }  
});

app.get('/driver', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  let sections = [
    "Teams",
    "Wins",
    "Podiums",
    "Pole Positions",
    "Results"
  ];

  let generalInfo = [
    "Date of Birth",
    "Number",
    "Nationality",
    "Championships",
    "Penalty Points",
    "Wins",
    "Podiums",
    "Pole Positions",
    "Fastests Laps"
  ];

  let articleTitle = "Category Name";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo
  });
});

app.get('/circuit', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  let sections = [
    "Turns"
  ];

  let generalInfo = [
    "Country",
    "City",
    "Length",
    "Turns",
    "Lap Record"
  ];

  let articleTitle = "Category Name";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo
  });
});

app.get('/team', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);
  
  let sections = [

    "Constructor's Championships",
    "Driver's Championships",
    "Chassis",
    "Engines",
    "Drivers",
    "Victories",
    "Podiums",
    "Pole Positions",
    "Results"
  ];

  let generalInfo = [
    "Drivers",
    "Chassis",
    "Engine",
    "Constructor's Championships",
    "Driver's Champsionships",
    "Victories",
    "Podiums",
    "Pole Positions",
    "Fastests Laps"
  ];

  let articleTitle = "Category Name";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo
  });
});

app.get('/vehicle', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  let sections = [
    "Drivers",
    "Wins",
    "Podiums",
    "Pole Positions",
    "Full Results"
  ];

  let generalInfo = [
    "Team",
    "Engine",
    "Power",
    "Weight",
    "Races",
    "Wins",
    "Podiums",
    "Pole Positions",
    "Fastests Laps"
  ];

  let articleTitle = "Category Name";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo
  });
});

app.get('/season', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  let sections = [
    "Scoring System",
    "Entries",
    "Calendar",
    "Results",
    "Driver's Standings",
    "Constructor's Standings"
  ];

  let generalInfo = [
    "Year",
    "Season #",
    "Races",
    "Driver's Champion",
    "Constructor's Champion"
  ];

  let articleTitle = "Category Name";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo
  });
});

app.get('/race', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  let sections = [
    "Practice Sessions",
    "Qualifying Sessions",
    "Race Sessions",
    "Pit Stops",
    "Incidents",
  ];

  let generalInfo = [
    "Season",
    "Race Date",
    "Laps",
    "Race Length",
    "Win",
    "Pole Position",
    "Fastest Lap",
  ];

  let articleTitle = "Category Name";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo
  });
});

//Start the server
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});