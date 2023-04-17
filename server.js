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

//New Category Page
app.get('/newcategory', async (req, res) => {

  res.render('newCategory');
});

//Articles
app.get('/category/:categoryName', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  categoryName = req.params['categoryName'].replace(/_/g, " ");

  if (categories.includes(categoryName)){

    let categoryInfo = await Database.findCategorybyName(db,categoryName);
    let flags = await Database.findFlagsByCategory(db, categoryName);
    let teams = await Database.findTeamsByCategory(db, categoryName);
    let seasons = await Database.findSeasonsByCategory(db,categoryName);

    //first attribute is to indicate if it's tabular data
    let sections = [
      ["Text", "Description", categoryInfo.category_description],
      ["Text", "Rules", categoryInfo.category_rules],
      ["Table","Championships",seasons,["Season Year"],["Link"],"/season/"+req.params["categoryName"]+"/"],
      ["Table","Teams",teams,[],["Link"], "/team/"+req.params["categoryName"]+"/"],
      ["Table","Drivers","",[]],
      ["Table","Flags", flags, ["Icon", "Name", "Meaning"], ["Image","Text","Text"]]
    ];
  
    let generalInfo = [
      ["Drivers",""],
      ["Teams",""],
      ["Driver's Champion",""],
      ["Constructor's Champion",""]
    ];
  
    let articleTitle = categoryName;;
  
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
    ["Table","Teams","",[]],
    ["Table","Wins","",[]],
    ["Table","Podiums","",[]],
    ["Table","Pole Positions","",[]],
    ["Table","Results","",[]],
  ];

  let generalInfo = [
    ["Date of Birth",""],
    ["Number",""],
    ["Nationality",""],
    ["Championships",""],
    ["Penalty Points",""],
    ["Wins",""],
    ["Podiums",""],
    ["Pole Positions",""],
    ["Fastests Laps",""],
  ];

  let articleTitle = "Category Name";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo,
    pictureURL:""
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

app.get('/team/:categoryName/:teamName', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  let teamInfo = await Database.findTeamByCategory(db,req.params["categoryName"], req.params["teamName"].replace(/_/g," "));
  
  let sections = [

    ["Text","Constructor's Championships", ""],
    ["Text","Driver's Championships", ""],
    ["Text","Chassis", ""],
    ["Text","Engines", ""],
    ["Text","Drivers", ""],
    ["Text","Victories", ""],
    ["Text","Podiums", ""],
    ["Text","Pole Positions", ""],
    ["Text","Results" , ""],
  ];

  let generalInfo = [
    ["Drivers",""],
    ["Chassis",""],
    ["Engine",""],
    ["Constructor's Championships",""],
    ["Driver's Champsionships",""],
    ["Victories",""],
    ["Podiums",""],
    ["Pole Positions",""],
    ["Fastests Laps",""]
  ];

  let articleTitle = teamInfo.team_name;

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo,
    pictureURL: teamInfo.team_picture
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

app.get('/season/:categoryName/:seasonYear', async (req, res) =>{

  let categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);

  let sections = [
    ["Text","Scoring System",""],
    ["Text","Entries",""],
    ["Text","Calendar",""],
    ["Text","Results",""],
    ["Text","Driver's Standings",""],
    ["Text","Constructor's Standings",""],
  ];

  let generalInfo = [
    ["Year",""],
    ["Season #",""],
    ["Races",""],
    ["Driver's Champion",""],
    ["Constructor's Champion",""],
  ];

  let articleTitle = req.params["seasonYear"]+ " "+req.params["categoryName"]+" Season";

  res.render('article', {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo,
    pictureURL: ""
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