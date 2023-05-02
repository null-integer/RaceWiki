//Import required modules
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const Database = require('./models/Database');
const User = require('./models/User');

//Instantiate modules
const app = express();
app.set('view engine','ejs');
app.use(express.static(`${__dirname}/static`))
app.use(express.urlencoded({extended: false}));

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
  updateCategories(db);
})();

//Function to keep track of categories to not
//have to make an sql call everytime
let categories = [];
async function updateCategories(db){
  categories = await Database.findAllCategories(db);
  categories = categories.map(x => x.category_name);
}

//Function to compare lap times of drivers
function compareTimes(a,b){
  let aTime = 0;
  let bTime = 0;
  let counter = [0.001,1,60,3600];
  let idx = 0;

  a["Lap Time"].split(":").reverse().forEach(x=>{
    aTime += (parseInt(x)*counter[idx])
    idx += 1;
  });
  idx = 0;
  b["Lap Time"].split(":").reverse().forEach(x=>{
    bTime += (parseInt(x)*counter[idx])
    idx += 1;
  });
  if(aTime < bTime){
    return -1;
  }else if(aTime > bTime){
    return 1;
  }else{
    return 0;
  }
}

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

//check credential in User db
app.post('/signin',(req,res)=>{
  let errors = [];
  let username = req.body.username.trim();
  let pw = req.body.password.trim();
  if(username.length==0){
    errors.push({msg:"Please enter username"});
  }
  User.findOne({where: {username:username}}).then(user=>{
    if(user){
      bcrypt.compare(pw,user.pwhash,(err,match)=>{
        if(match){}
        else{
          errors.push({msg:"Username and password is incorrect"});
          res.render('login',{
            errors:errors
          })
        }
      })
    }
  })

});

//Control Panel 
app.get('/controlpanel', async (req, res) => {
	res.render('controlPanel',{
    categories:categories,
  });
});

//New Category Page
app.get('/newcategory', async (req, res) => {
  res.render('newCategory');
});

//New Category Post
app.post('/newcategory', async (req, res) => {
  console.log(req.body);
  res.redirect("/");
});

//Articles

//New Category Page
app.get('/category/:categoryName', async (req, res) =>{

  categoryName = req.params['categoryName'].replace(/_/g, " ");

  if (categories.includes(categoryName)){

    //Fetching needed info from database
    let categoryInfo = await Database.findCategorybyName(db,categoryName);
    let flags = await Database.findFlagsByCategory(db, categoryName);
    let teams = await Database.findTeamsByCategory(db, categoryName);
    let seasons = await Database.findSeasonsByCategory(db,categoryName);
    seasons.sort((a,b) => parseInt(b.season_year) - parseInt(a.season_year));

    //Section Data
    //[Type of data in section, Section Title, Section Data, ...OPTIONS]
    //Table Options = [Table Headings],[Type of Data in table]
    let sections = [
      ["Text", "Description", categoryInfo.category_description],
      ["Text", "Rules", categoryInfo.category_rules],
      ["Table","Championships",seasons,["Season Year"],["Link"],"/season/"+req.params["categoryName"]+"/"],
      ["Table","Teams",teams,[],["Link"], "/team/"+req.params["categoryName"]+"/"],
      ["Table","Drivers",[],["Driver Name"],["Text"]],
      ["Table","Flags", flags, ["Icon", "Name", "Meaning"], ["Image","Text","Text"]]
    ];
  
    //General Info Data
    let generalInfo = [
      ["Driver's Champion",""],
      ["Constructor's Champion",""]
    ];
  
    let articleTitle = categoryName;

    let props = {
      articleTitle: articleTitle,
      categories:categories,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: categoryInfo.category_picture,
      relation: req.params['categoryName'],
      additionalScripts: ['/js/category.js']
    }

    res.render('article', {props:props});

  }
  else{
    res.render("notFound");
  }  
});

//POST Methods for the category page
app.post('/category/:categoryName/season',async (req, res) =>{

  let year = req.body.seasonYearinput;
  let scoring = req.body.seasonScoringinput.split("\r\n").join(",");

  Database.newSeason(db, req.params["categoryName"], year, scoring);
  res.redirect(req.get('referer'));
});

app.post('/category/:categoryName/team',async (req, res) =>{
  
  let teamName = req.body.teamNameinput;
  let teamBaselocation = req.body.teamLocationinput;
  let teamPictureURL = req.body.teamPictureURLinput;

  Database.newTeam(db, req.params["categoryName"],teamName,teamBaselocation,teamPictureURL);

  res.redirect(req.get('referer'));
});

app.post('/category/:categoryName/flag',async (req, res) =>{
  
  let flagName = req.body.flagNameinput;
  let flagIcon = req.body.flagIconURLinput;
  let flagMeaning = req.body.flagMeaninginput;

  Database.newFlag(db, req.params["categoryName"], flagName,flagIcon, flagMeaning);

  res.redirect(req.get('referer'));
});

//Driver Page
app.get('/driver/:driverName', async (req, res) =>{

  let driverName = req.params["driverName"].replace(/_/g, " "); 
  let driverInfo = await Database.findDriver(db, driverName);
  if(driverInfo){
    let sections = [
      ["Table","Teams","",[]],
      ["Table","Wins","",[]],
      ["Table","Podiums","",[]],
      ["Table","Pole Positions","",[]],
      ["Table","Results","",[]],
    ];
  
    let generalInfo = [
      ["Date of Birth",driverInfo.driver_DOB],
      ["Number",driverInfo.driver_number],
      ["Nationality",driverInfo.driver_nationality],
      ["Championships",""],
      ["Penalty Points",driverInfo.driver_penalty_points],
      ["Wins",""],
      ["Podiums",""],
      ["Pole Positions",""],
      ["Fastests Laps",""],
    ];
  
    let articleTitle = driverName;
  
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL:driverInfo.driver_picture,
      relation:"/",
      additionalScripts: ['/js/driver.js']
    };
  
    res.render('article', {props:props});

  }else{
    res.render("notFound");
  }

});

//Circuit Page
app.get('/circuit/:circuitName', async (req, res) =>{

  let circuitInfo = await Database.findCircuitInfo(db,req.params["circuitName"]);

  if(circuitInfo){
    let turns = await Database.getTurns(db,req.params["circuitName"]);
    turns.sort((a,b)=>a["turn_number"]-b["turn_number"]);
  
    let sections = [
      ["Table","Turns",turns, ["Turn Number","Turn Name"],["Text","Text"]],
    ];
  
    let generalInfo = [
      ["Country",circuitInfo.circuit_country],
      ["City",circuitInfo.circuit_city],
      ["Length",circuitInfo.circuit_length + " Km"],
      ["Turns",turns.length],
      ["Lap Record",""]
    ];
  
    let articleTitle = req.params["circuitName"].replace(/_/g, " ");
  
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      relation: "/circuit/"+req.params["circuitName"]+"/",
      pictureURL: circuitInfo.circuit_picture
    };
  
    res.render('article', {props:props});

  }else{
    res.render("notFound");
  }

});

//POST methods for the circuit page
app.post('/circuit/:circuitName/turn',async (req, res) =>{
  
  let turnNumber = req.body.turnNumberInput;
  let turnName = req.body.turnNameInput;

  Database.newTurn(db,req.params["circuitName"],turnNumber,turnName);

  res.redirect(req.get('referer'));
});


//Team Page
app.get('/team/:categoryName/:teamName', async (req, res) =>{

  let teamInfo = await Database.findTeamByCategory(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "));

  if(teamInfo){
    let vehicles = await Database.findVehicles(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "));
  
    let sections = [
      ["Table","Vehicles", vehicles,[],["Link"],"/vehicle/"+req.params["categoryName"]+ "/"+req.params["teamName"]+"/"],
      ["Table","Constructor's Championships", [],[],["Text"]],
      ["Table","Driver's Championships",  [],[],["Text"]],
      ["Table","Drivers", [],["Driver","Seasons"],["Text","Text"]],
      ["Table","Victories", [],["Driver","Race","Season"],["Text","Text","Text"]],
      ["Table","Podiums", [],["Driver","Race","Season","Place"],["Text","Text","Text","Text"]],
      ["Table","Pole Positions", [],["Driver","Race","Season"],["Text","Text","Text"]],
      ["Table","Results" , [],["Driver","Race","Season","Place"],["Text","Text","Text","Text"]],
    ];
  
    let generalInfo = [
      ["Team Base", teamInfo.team_base_location],
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
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: teamInfo.team_picture,
      relation: "/"+req.params["categoryName"]+ "/"+req.params["teamName"]+"/",
      additionalScripts: ["/js/team.js"],
    };
  
    res.render('article', {props:props});
  }else{
    res.render("notFound");
  }

});

//POST method for Team
app.post('/:categoryName/:teamName/vehicle',async (req, res) =>{
  
  let engine = req.body.vehicleEngineInput;
  let chassis = req.body.vehicleChassisNameInput;
  let seasonYear = req.body.vehicleSeasonYearInput;
  let power = req.body.vehiclePowerInput;
  let weight = req.body.vehicleWeightInput;
  let url = req.body.vehiclePictureURLInput;

  Database.newVehicle(db,req.params["categoryName"],req.params["teamName"],engine, chassis, seasonYear, power, weight, url);

  res.redirect(req.get('referer'));
});


//Vehicle Page
app.get('/vehicle/:categoryName/:teamName/:vehicleName', async (req, res) =>{

  let vehicleInfo = await Database.findVehicle(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "), req.params["vehicleName"].replace(/_/g," "));

  if(vehicleInfo){

    let sections = [
      ["Text","Drivers",""],
      ["Text","Wins",""],
      ["Text","Podiums",""],
      ["Text","Pole Positions",""],
      ["Text","Full Results",""]
    ];
  
    let generalInfo = [
      ["Team",req.params["teamName"].replace(/_/g," ")],
      ["Engine",vehicleInfo.vehicle_engine],
      ["Power", vehicleInfo.vehicle_power + " HP"],
      ["Weight",vehicleInfo.vehicle_weight + " Kg"],
      ["Races",""],
      ["Wins",""],
      ["Podiums",""],
      ["Pole Positions",""],
      ["Fastests Laps",""]
    ];
  
    let articleTitle = vehicleInfo.vehicle_chassis_name;
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: vehicleInfo.vehicle_picture
    };
  
    res.render('article', {props:props});
  }else{
    res.render("notFound");
  }

});

//Season Page
app.get('/season/:categoryName/:seasonYear', async (req, res) =>{

  categoryName = req.params['categoryName'].replace(/_/g, " ");
  let seasonInfo = await Database.findSeasonByCategoryandYear(db, categoryName, req.params["seasonYear"]);

  if(seasonInfo){

    scoringSystem = [];
    let scoringArray = seasonInfo.season_scoring.split(",");
    scoringArray.forEach(score => {
      scoringSystem.push({"position":score.split(":")[0], "points":score.split(":")[1]});
    });
  
    let calendar = await Database.findCalendar(db,categoryName, req.params["seasonYear"]);
    calendarArray = [];
    for(let round = 0; round < calendar.length; round+=1){
      calendarArray.push({"Round":round + 1, "Date":calendar[round].race_date, "Name":calendar[round].race_name});
    }
  
    let entries = await Database.findEntries(db,categoryName, req.params["seasonYear"]);
    let teams = [];
    entries.forEach(x => {
      if(!teams.includes(x["team"])){
        teams.push(x["team"]);
      }
    });
  
  
    let sections = [
      ["Table","Scoring System",scoringSystem, ["Position","Points"],["Text","Text"]],
      ["Table","Entries",entries,["Team","Driver","Vehicle"],["Text","Text","Text"]],
      ["Table","Calendar",calendarArray,["Round","Date","Name"],["Text","Text","Link"],"/race/"+req.params["categoryName"]+"/"+req.params["seasonYear"]+"/"],
      ["Text","Driver's Standings",""],
      ["Text","Constructor's Standings",""],
    ];
  
    let generalInfo = [
      ["Year", seasonInfo.season_year],
      ["Season #",""],
      ["Races",calendarArray.length],
      ["Drivers",entries.length],
      ["Teams",teams.length],
      ["Driver's Champion",""],
      ["Constructor's Champion",""],
    ];
  
    let articleTitle = req.params["seasonYear"]+ " "+categoryName+" Season";
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: "",
      relation: req.params["categoryName"]+"/"+req.params["seasonYear"]
    };
  
    res.render('article', {props:props});
  }else{
    res.render("notFound");
  }

});

//POST methods for Season
app.post('/season/:categoryName/:seasonYear/scoring',async (req, res) =>{
  
  let position = req.body.positionInput;
  let points = req.body.pointsInput;

  Database.newScoring(db,position,points, req.params["categoryName"],req.params["seasonYear"]);
  res.redirect(req.get('referer'));
});

app.post('/season/:categoryName/:seasonYear/race',async (req, res) =>{
  
  let raceName = req.body.raceNameInput;
  let raceDate = req.body.raceDateInput;

  Database.newRaceWeekend(db, raceName, raceDate, req.params["categoryName"], req.params["seasonYear"]);

  res.redirect(req.get('referer'));
});

app.post('/season/:categoryName/:seasonYear/entry',async (req, res) =>{
  
  let team = req.body.teamInput;
  let driver = req.body.driverInput;
  let vehicle = req.body.vehicleInput;

  Database.newSeasonEntry(db, team, driver, vehicle, req.params["categoryName"], req.params["seasonYear"]);

  res.redirect(req.get('referer'));
});

//Race Page
app.get('/race/:categoryName/:seasonYear/:raceName', async (req, res) =>{

  let schedule = await Database.findSchedule(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);
  let circuit = await Database.findCircuit(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);
  let practiceResults = await Database.findPracticeResults(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);
  let qualifyingResults = await Database.findQualifyingResults(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);
  let raceResults = await Database.findRaceResults(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);
  let pitStops = await Database.findPitStops(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);
  let incidents = await Database.findIncidents(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);
  let lastRace;
  let lastQuali;

  if(!circuit){
    circuit = {"circuit_name":""};
  }

  let sections = [
    ["Table", "Schedule",schedule,["Session","Session #","Date","Time","Weather","Points"],["Text","Text","Text","Text","Text","Text"]],
    ["Table", "Circuit",[{"name":circuit.circuit_name}],[],["Link"],"/circuit/"],
  ];

  let table = {"Practice":practiceResults, "Qualifying":qualifyingResults, "Race":raceResults};
  schedule.forEach(x=>{

    let sessionTable = table[x.sessionType].filter(y => x.sessionNum == y.session_number);

    if(x.sessionType == "Practice" || x.sessionType == "Qualifying"){
      sessionTable = sessionTable.map(y => function(){
        if(x.sessionNum == y.session_number){
          return {"Driver":y.driver_first_name + " "+y.driver_last_name, "Lap Time": y.lap_time};
        }
      }());
      sessionTable.sort(compareTimes);
      sessionTable = sessionTable.map((z,index) => function(){return {"Position":index+1, "Driver":z["Driver"], "Lap Time": z["Lap Time"]}}() );
      sections.push(["Table",x.sessionType +" "+x.sessionNum+" Results",sessionTable,["Position","Driver","Lap Time","Points"],["Text","Link","Text","Text"],"/driver/"]);
      if(x.sessionType == "Qualifying"){
        if(!lastQuali){
          lastQuali = sessionTable;
        }else{
          lastQuali = sessionTable;
        }
      }
    }else{
      sessionTable = sessionTable.map(y => function(){
        if(x.sessionNum == y.session_number){
          return {"Position":y.position,"Driver":y.driver_first_name + " "+y.driver_last_name, "Lap Time": y.lap_time};
        }
      }());
      sessionTable.sort((a,b) => { return parseInt(a["Position"]) - parseInt(b["Position"])});

      sections.push(["Table",x.sessionType +" "+x.sessionNum+" Results",sessionTable,["Position","Driver","Fastest Lap Time","Points"],["Text","Link","Text","Text"],"/driver/"]);
      if(!lastRace){
        lastRace = sessionTable;
      }else{
        lastRace = sessionTable;
      }
    }
      
  });

  sections.push(["Table","Pit Stops",pitStops,["Driver","Lap","Pit Time","Total Time","Description"],["Text","Text","Text","Text","Text"]]);
  sections.push(["Table","Incidents",incidents,["Drivers Involved","Lap","Description"],["Text","Text","Text"]]);

  let FL = lastRace ? [...lastRace].sort(compareTimes) : [];
  let generalInfo = [
    ["Season",req.params["seasonYear"]],
    ["Circuit",circuit.circuit_name],
    ["Win", lastRace == undefined || lastRace.length == 0 ? "" : lastRace[0].Driver],
    ["Pole Position",lastQuali == undefined || lastQuali.length == 0 ? "" : lastQuali[0].Driver],
    ["Fastest Racing Lap", FL == undefined || FL.length == 0 ? "" : FL[0].Driver]
  ];

  let articleTitle = req.params["raceName"].replace(/_/g, " ");

  let props = {
    categories:categories,
    articleTitle: articleTitle,
    sections:sections, 
    generalInfo:generalInfo,
    pictureURL: "",
    relation: req.params["categoryName"] + "/"+req.params["seasonYear"]+"/"+req.params["raceName"],
    additionalScripts: ["/js/results.js"]
  };

  res.render('article', {props:props});
});

//POST Methods for Race
app.post('/race/:categoryName/:seasonYear/:raceName/schedule',async (req, res) =>{
  
  let sessionType = req.body.sessionTypeInput;
  let sessionTime = req.body.sessionTimeInput;
  let sessionDate = req.body.sessionDateInput;
  let sessionWeather = req.body.sessionWeatherInput;
  let points = req.body.pointsInput == "Yes" ? 1 : 0;


  Database.newSession(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],sessionType,sessionTime,sessionDate,sessionWeather,points);
  
  
  res.redirect(req.get('referer'));
});

app.post('/race/:categoryName/:seasonYear/:raceName/circuit',async (req, res) =>{
  
  let circuitName = req.body.circuitNameInput;

  Database.setCircuit(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],circuitName);
  
  res.redirect(req.get('referer'));
});

app.post('/race/:categoryName/:seasonYear/:raceName/PracticeResult/:sessionNum',async (req, res) =>{
  
  let driverName = req.body.driverNameInput;
  let driverLapTime = req.body.driverLapTimeInput;

  Database.newPracticeResult(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverName,driverLapTime,req.params["sessionNum"]);
  
  res.redirect(req.get('referer'));
});

app.post('/race/:categoryName/:seasonYear/:raceName/QualifyingResult/:sessionNum',async (req, res) =>{
  
  let driverName = req.body.driverNameInput;
  let driverLapTime = req.body.driverLapTimeInput;

  Database.newQualifyingResult(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverName,driverLapTime,req.params["sessionNum"]);
  
  res.redirect(req.get('referer'));
});

app.post('/race/:categoryName/:seasonYear/:raceName/RaceResult/:sessionNum',async (req, res) =>{
  
  let driverName = req.body.driverNameInput;
  let driverLapTime = req.body.driverLapTimeInput;
  let driverPosition = req.body.driverPositionInput;

  Database.newRaceResult(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverName,driverLapTime,driverPosition,req.params["sessionNum"]);
  
  res.redirect(req.get('referer'));
});

app.post('/race/:categoryName/:seasonYear/:raceName/PitStop',async (req, res) =>{
  
  let driverName = req.body.driverNameInput;
  let lapNumber = req.body.lapNumberInput;
  let pitTime = req.body.pitTimeInput;
  let totalTime = req.body.totalTimeInput;
  let pitDescription = req.body.pitDescriptionInput;
  
  Database.newPitStop(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverName,lapNumber,pitTime,totalTime,pitDescription);

  res.redirect(req.get('referer'));
});

app.post('/race/:categoryName/:seasonYear/:raceName/incident',async (req, res) =>{
  
  let drivers = req.body.DriversInvolvedInput;
  let lapNumber = req.body.lapNumberInput;
  let incidentDescription = req.body.incidentDescriptionInput;

  Database.newIncident(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],drivers,lapNumber,incidentDescription);

  res.redirect(req.get('referer'));
});

//Start the server
app.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});