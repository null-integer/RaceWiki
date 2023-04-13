//Import required modules
const express = require('express');

//Instantiate modules
const app = express();
app.set('view engine','ejs');
app.use(express.static(`${__dirname}/static`))

//Host name and port
const hostname = '127.0.0.1';
const port = 3000;

//Mock Database
categories = [
  "F1",
  "F2",
  "F3",
  "FE",
  "IndyCar",
  "MotoGP",
  "Moto2",
  "Nascar"
];

//Routes

//Main Homepage
app.get('/', async (req, res) => {

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
	res.render('controlPanel',{
    categories:categories,
  });
});

//Articles
app.get('/category/:categoryName', async (req, res) =>{

  if (categories.includes(req.params['categoryName'])){
    let sections = [
      "Rules",
      "Flags",
      "Championship",
      "Teams",
      "Drivers"
    ];
  
    let generalInfo = [
      "Drivers",
      "Teams",
      "Driver's Champion",
      "Constructor's Champion"
    ];
  
    let articleTitle = req.params['categoryName'];;
  
    res.render('article', {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo
    });
  }
  else{
    res.sendStatus(404);
  }


  
});

app.get('/driver', async (req, res) =>{

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

  let sections = [
    "Drivers",
    "Wins",
    "Podiums",
    "Pole Positions",
    "Full Results"
  ];

  let generalInfo = [
    "Championships",
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