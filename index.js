//Import required modules
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const Database = require('./models/Database');
const User = require('./models/User');
const path = require('path')
const sequalize = require('./models/model')
const bcrypt = require('bcrypt');
const session = require('express-session')
const Op = require('sequelize').Op;

sequalize.sync().then(()=>console.log('ready'));

//Instantiate modules
const app = express();
app.set('view engine','ejs');

// app.use(express.static(`${__dirname}/static`))
// app.use(express.urlencoded({extended: false}));

//Host name and port
//const hostname = '127.0.0.1';
const port = 3000;

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'static')));


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

app.get('/users', async (req,res)=>{
  const users = await User.findAll();
  res.send(users)
})

//Main Homepage
app.get('/', async (req, res) => {
  if (req.session.login){
    res.render('homepage',{categories:categories,permission:req.session.login.permission});
  }
  else{
    res.redirect('/signin')
  }

});
//Sign In Page
app.get('/signin', async (req, res) => {
  if(req.session.login){
    res.redirect('/')
  }
  else{
    res.render('signin');
  }
	
});

//check credential in User db
app.post('/signin',(req,res)=>{
  let errors = [];
  let username = req.body.username.trim();
  let pw = req.body.password.trim();

  console.log(pw)

  console.log(req.body.register)

  if(req.body.register){
    res.redirect('/register')
    return;
  }
  else{
    if(username.length==0){
      errors.push({msg:"Please enter username"});
    }
    User.findOne({where: {username:username}}).then(user=>{
      if(user){
        bcrypt.compare(pw,user.pwhash,(err,match)=>{
          if(match){
            console.log("matching triggered")
            req.session.login = user
            res.redirect('/')
          }
          else{
            errors.push({msg:"Username and password is incorrect"});
            res.render('signin',{
              errors:errors
            })
          }
        })
      }
      else{
        errors.push({msg:'Username and password is incorrect'});
        res.render('signin',{
          errors:errors
        })
      }
    })
  
  }
  
});

//singup page
app.get('/register',(req,res)=>{
  res.render('register');
})

//create user in db
app.post('/register',(req,res)=>{
  let errors = [];
  let username = req.body.username.trim();
  let pw = req.body.password.trim();
  if(username.length==0){
    errors.push({msg:"Please enter username"});
  }
  else{
    User.findOne({where:{username:username}}).then(user=>{
      if(user){
        errors.push({msg:'This username is already taken'});
      }
      if(pw.length<6){
        errors.push({msg:"Password must be at least 6 characters"});
      }
      if(errors.length == 0){
        User.create({
          username: username,
          pwhash: bcrypt.hashSync(pw,10)
        }).then(user=>{
          res.redirect('/signin')
        });
      }
    })
  }
  
})

//Control Panel 
app.get('/controlpanel', async (req, res) => {
  if(req.session.login && req.session.login.permission=="ADMIN"){
    User.findAll({where:{permission: {[Op.ne]: 'ADMIN'}}}).then(users=>{
      res.render('controlPanel',{
        categories:categories,
        users:users
      });
    })
  }
  else{
    res.redirect('/');
  }
	
});

//New Category Page
app.get('/newcategory', async (req, res) => {
  res.render('newCategory',{error:""});
});

//New Category Post
app.post('/newcategory', async (req, res) => {

  if(req.body.nameInput.trim().length == 0){
    res.render('newCategory',{error:"Category name cannot be empty!"});
  }else{
    if(categories.includes(req.body.nameInput.trim())){
      res.render('newCategory',{error:"Category already in database!"});
    }else{
      await Database.newCategory(db, req.body.nameInput.trim(), req.body.imageInput.trim(), req.body.descriptionInput.trim(), req.body.rulesInput.trim());
      await updateCategories(db);
      res.redirect("/");
    }
  }

});

//Articles

//New Category Page
app.get('/category/:categoryName', async (req, res) =>{
  if(req.session.login){
    categoryName = req.params['categoryName'].replace(/_/g, " ");

    if (categories.includes(categoryName)){

    //Fetching needed info from database
    let categoryInfo = await Database.findCategorybyName(db,categoryName);
    let flags = await Database.findFlagsByCategory(db, categoryName);
    let teams = await Database.findTeamsByCategory(db, categoryName);
    let seasons = await Database.findSeasonsByCategory(db,categoryName);
    let drivers = await Database.findDrivers(db,categoryName);

    //Preprosessing the data
    seasons.sort((a,b) => parseInt(b.season_year) - parseInt(a.season_year));
    drivers.sort((a,b) => {
      if(a.driver_first_name < b.driver_first_name){
        return -1;
      }else if(a.driver_first_name > b.driver_first_name){
        return 1;
      }else{
        return 0;
      }
    });
    drivers = drivers.map(x => function() {return{"name" : x.driver_first_name + " " + x.driver_last_name}}());

    //Article Sections in the body
    /*
      SECTIONS ARRAY STRUCTURE:
      [
        Type(Text or Table)  => String,
        Section Title        => String
        Section Data         => String when type = Text, Object when type = Table 
        Table Column Names   => Array of Strings
        Type of Data         => Array of Strings
        URL                  => URL of Link if Section Data constains link
      ]
    */
    let sections = [
      ["Text", "Description", categoryInfo.category_description.length == 0 ? "?" : categoryInfo.category_description],
      ["Text", "Rules", categoryInfo.category_rules.length == 0 ? "?" : categoryInfo.category_rules],
      ["Table","Championships",seasons,["Season Year"],["Link"],"/season/"+req.params["categoryName"]+"/"],
      ["Table","Teams",teams,[],["Link"], "/team/"+req.params["categoryName"]+"/"],
      ["Table","Drivers",drivers,[],["Link"],"/driver/"],
      ["Table","Flags", flags, ["Icon", "Name", "Meaning"], ["Image","Text","Text"]]
    ];
  
    //General Info Data
    let generalInfo = [
      ["Driver's Champion",""],
      ["Constructor's Champion",""]
    ];

    //set the article title and website name
    let articleTitle = categoryName;

    //Properties object to pass all the needed data

    let props = {
      articleTitle: articleTitle,
      categories:categories,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: categoryInfo.category_picture,
      relation: req.params['categoryName'],
      additionalScripts: ['/js/category.js']
    }
  }
  }

  
  else{
    res.render("notFound");
  }  
});

//POST Methods for the category page

//Add a new season to a category
app.post('/category/:categoryName/season',async (req, res) =>{

  let year = req.body.seasonYearinput.trim();
  let scoring = req.body.seasonScoringinput.split("\r\n").join(",");

  Database.newSeason(db, req.params["categoryName"], year, scoring);
  res.redirect(req.get('referer'));
});

//Add a new team to a category
app.post('/category/:categoryName/team',async (req, res) =>{
  
  let teamName = req.body.teamNameinput.trim();
  let teamBaselocation = req.body.teamLocationinput.trim();
  let teamPictureURL = req.body.teamPictureURLinput.trim();

  Database.newTeam(db, req.params["categoryName"],teamName,teamBaselocation,teamPictureURL);

  res.redirect(req.get('referer'));
});

//Add a new flag to a category
app.post('/category/:categoryName/flag',async (req, res) =>{
  
  let flagName = req.body.flagNameinput.trim();
  let flagIcon = req.body.flagIconURLinput.trim();
  let flagMeaning = req.body.flagMeaninginput.trim();

  Database.newFlag(db, req.params["categoryName"], flagName,flagIcon, flagMeaning);

  res.redirect(req.get('referer'));
});

//Update the category image
app.post('/category/:categoryName/image',async (req, res) =>{
  
  Database.updateCategoryImage(db,req.params["categoryName"],req.body.imageURLInput.trim());
  res.redirect(req.get('referer'));
});

//Update the category rules
app.post('/category/:categoryName/rules',async (req, res) =>{
  
  try{
    Database.updateCategoryRules(db,req.params["categoryName"],req.body.updatedRules.trim());
    res.json({status:200});

  }catch(error){
	  res.json({status:400});
  }
});

//Update the category description
app.post('/category/:categoryName/description',async (req, res) =>{
  
  try{
    Database.updateCategoryDescription(db,req.params["categoryName"],req.body.updatedDescription.trim());
    res.json({status:200});

  }catch(error){
	  res.json({status:400});
  }
});

//Driver Page
app.get('/driver/:driverName', async (req, res) =>{

  let driverName = req.params["driverName"].replace(/_/g, " "); 
  let driverInfo = await Database.findDriver(db, driverName);

  if(driverInfo){

    let sections = [
      ["Table","Teams",[],["Season","Team"],["Text","Text"]],
      ["Table","Wins",[],["Season","Race","Team"],["Text","Text","Text"]],
      ["Table","Podiums",[],["Position","Season","Race","Team"],["Text","Text","Text","Text"]],
      ["Table","Pole Positions",[],["Season","Race","Team"],["Text","Text","Text"]],
      ["Table","Results",[],["Position","Season","Race","Team"],["Text","Text","Text","Text"]],
    ];
  
    let generalInfo = [
      ["Date of Birth",driverInfo.driver_DOB.length == 0 ? "?" : driverInfo.driver_DOB],
      ["Number",driverInfo.driver_number.length == 0 ? "?" : driverInfo.driver_number],
      ["Nationality",driverInfo.driver_nationality.length == 0 ? "?" : driverInfo.driver_nationality],
      ["Penalty Points",driverInfo.driver_penalty_points.length == 0 ? "?" : driverInfo.driver_penalty_points],
      ["Championships",""],
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

//POST Methods for Driver page

//Update the category image
app.post('/driver/:driverName/image',async (req, res) =>{
  
  Database.updateDriverImage(db,req.params["driverName"],req.body.imageURLInput.trim());
 
  res.redirect(req.get('referer'));
});

app.post('/driver/:driverName/generalInfo',async (req, res) =>{
  
  try{
    Database.updateDriverInfo(db, req.params["driverName"], req.body.updatedField, req.body.updatedInfo.trim() );
    res.json({status:200});

  }catch(error){
	  res.json({status:400});
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
      ["Country",circuitInfo.circuit_country.length == 0 ? "?" : circuitInfo.circuit_country],
      ["City",circuitInfo.circuit_city.length == 0 ? "?" : circuitInfo.circuit_city],
      ["Length",circuitInfo.circuit_length.length == 0 ? "?" : circuitInfo.circuit_length + " Km"],
      ["Turns",turns.length],
    ];
  
    let articleTitle = req.params["circuitName"].replace(/_/g, " ");
  
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      relation: "/circuit/"+req.params["circuitName"]+"/",
      pictureURL: circuitInfo.circuit_picture,
      additionalScripts: ["/js/circuit.js"]
    };
  
    res.render('article', {props:props});

  }else{
    res.render("notFound");
  }

});

//POST methods for circuit page

//New Turn For a circuit
app.post('/circuit/:circuitName/turn',async (req, res) =>{
  
  let turnNumber = req.body.turnNumberInput;
  let turnName = req.body.turnNameInput;

  Database.newTurn(db,req.params["circuitName"],turnNumber,turnName);

  res.redirect(req.get('referer'));
});

//Update the category image
app.post('/circuit/:circuitName/image',async (req, res) =>{
  
  Database.updateCircuitImage(db, req.params.circuitName, req.body.imageURLInput.trim());
  
  res.redirect(req.get('referer'));
});

//Update circuit general info
app.post('/circuit/:circuitName/generalInfo',async (req, res) =>{
  
  try{
    Database.updateCircuitInfo(db, req.params["circuitName"], req.body.updatedField, req.body.updatedInfo.trim() );
    res.json({status:200});

  }catch(error){
	  res.json({status:400});
  }
});

//Team Page
app.get('/team/:categoryName/:teamName', async (req, res) =>{

  let teamInfo = await Database.findTeamByCategory(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "));

  if(teamInfo){

    let vehicles = await Database.findVehicles(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "));
  
    let sections = [
      ["Table","Vehicles", vehicles,[],["Link"],"/vehicle/"+req.params["categoryName"]+ "/"+req.params["teamName"]+"/"],
      ["Table","Constructor's Championships", [],["Season","Position"],["Text","Text"]],
      ["Table","Driver's Championships",  [],["Season","Driver","Position"],["Text","Text","Text"]],
      ["Table","Drivers", [],["Driver","Seasons"],["Text","Text"]],
      ["Table","Victories", [],["Driver","Race","Season"],["Text","Text","Text"]],
      ["Table","Podiums", [],["Driver","Race","Season","Place"],["Text","Text","Text","Text"]],
      ["Table","Pole Positions", [],["Driver","Race","Season"],["Text","Text","Text"]],
      ["Table","Results" , [],["Driver","Race","Season","Place"],["Text","Text","Text","Text"]],
    ];
  
    let generalInfo = [
      ["Team Base", teamInfo.team_base_location],
      ["Drivers",""],
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

//POST methods for Team

//New Vehicle for a team
app.post('/:categoryName/:teamName/vehicle',async (req, res) =>{
  
  let engine = req.body.vehicleEngineInput.trim();
  let chassis = req.body.vehicleChassisNameInput.trim();
  let seasonYear = req.body.vehicleSeasonYearInput.trim();
  let power = req.body.vehiclePowerInput.trim();
  let weight = req.body.vehicleWeightInput.trim();
  let url = req.body.vehiclePictureURLInput.trim();

  Database.newVehicle(db,req.params["categoryName"],req.params["teamName"],engine, chassis, seasonYear, power, weight, url);

  res.redirect(req.get('referer'));
});

//Update the category image
app.post('/:categoryName/:teamName/image',async (req, res) =>{
  
  Database.updateTeamImage(db,req.params.categoryName,req.params.teamName,req.body.imageURLInput.trim())
  
  res.redirect(req.get('referer'));
});

//update team general info
app.post('/team/:categoryName/:teamName/generalInfo',async (req, res) =>{
  
  try{
    Database.updateTeamInfo(db, req.params["categoryName"],req.params["teamName"], req.body.updatedField, req.body.updatedInfo.trim() );
    res.json({status:200});

  }catch(error){
	  res.json({status:400});
  }
});


//Vehicle Page
app.get('/vehicle/:categoryName/:teamName/:vehicleName', async (req, res) =>{

  let vehicleInfo = await Database.findVehicle(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "), req.params["vehicleName"].replace(/_/g," "));

  if(vehicleInfo){

    let sections = [
      ["Table","Drivers",[],[],["Text"]],
      ["Table","Wins",[],["Driver","Race"],["Text","Text"]],
      ["Table","Podiums",[],["Driver","Race"],["Text","Text"]],
      ["Table","Pole Positions",[],["Driver","Race"],["Text","Text"]],
      ["Table","Full Results",[],["Driver","Race"],["Text","Text"]]
    ];
  
    let generalInfo = [
      ["Team",req.params["teamName"].replace(/_/g," ")],
      ["Season",vehicleInfo.vehicle_year],
      ["Engine",vehicleInfo.vehicle_engine],
      ["Power", vehicleInfo.vehicle_power + " HP"],
      ["Weight",vehicleInfo.vehicle_weight + " Kg"],
      ["Races",""],
      ["Wins",""],
      ["Podiums",""],
      ["Pole Positions",""],
    ];
  
    let articleTitle = vehicleInfo.vehicle_chassis_name;
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: vehicleInfo.vehicle_picture,
      additionalScripts: ['/js/vehicle.js']
    };
  
    res.render('article', {props:props});
  }else{
    res.render("notFound");
  }

});

//POST methods for Vehicle page

//Update the vehicle image
app.post('/vehicle/:categoryName/:teamName/:vehicleName/image',async (req, res) =>{

  Database.updateVehicleImage(db,req.params["categoryName"],req.params["teamName"],req.params["vehicleName"],req.body.imageURLInput.trim());
  
  res.redirect(req.get('referer'));
});

//Update the vehicle info
app.post('/vehicle/:categoryName/:teamName/:vehicleName/generalInfo',async (req, res) =>{
  
  try{
    Database.updateVehicleInfo(db, req.params["categoryName"],req.params["teamName"],req.params["vehicleName"], req.body.updatedField, req.body.updatedInfo.trim() );
    res.json({status:200});

  }catch(error){
	  res.json({status:400});
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
    calendarArray.sort(function(a,b){return new Date(a.Date) - new Date(b.Date)});
  
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
      ["Table","Driver's Standings",[],["Driver","Points"],["Text","Text"]],
      ["Table","Constructor's Standings",[],["Team","Points"],["Text","Text"]],
    ];
  
    let generalInfo = [
      ["Year", seasonInfo.season_year],
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
      pictureURL: seasonInfo.season_picture,
      relation: req.params["categoryName"]+"/"+req.params["seasonYear"],
      additionalScripts:['/js/season.js']
    };
  
    res.render('article', {props:props});
  }else{
    res.render("notFound");
  }

});

//POST methods for Season

//New Scoring for a season
app.post('/season/:categoryName/:seasonYear/scoring',async (req, res) =>{
  
  let position = req.body.positionInput.trim();
  let points = req.body.pointsInput.trim();

  Database.newScoring(db,position,points, req.params["categoryName"],req.params["seasonYear"]);
  res.redirect(req.get('referer'));
});

//Add a new Race to the calendar
app.post('/season/:categoryName/:seasonYear/race',async (req, res) =>{
  
  let raceName = req.body.raceNameInput.trim().toUpperCase();
  let raceDate = req.body.raceDateInput;

  Database.newRaceWeekend(db, raceName, raceDate, req.params["categoryName"], req.params["seasonYear"]);

  res.redirect(req.get('referer'));
});

//Add a new Entry to the season
app.post('/season/:categoryName/:seasonYear/entry',async (req, res) =>{
  
  let team = req.body.teamInput.trim();
  let driverFirst = req.body.driverFirstInput.trim();
  let driverLast = req.body.driverLastInput.trim();
  let vehicle = req.body.vehicleInput.trim();

  Database.newSeasonEntry(db, team, driverFirst, driverLast, vehicle, req.params["categoryName"], req.params["seasonYear"]);

  res.redirect(req.get('referer'));
});

//Update the season image
app.post('/season/:categoryName/:seasonYear/image',async (req, res) =>{

  Database.updateSeasonImage(db,req.params["categoryName"],req.params["seasonYear"],req.body.imageURLInput.trim());
  
  res.redirect(req.get('referer'));
});

//Race Page
app.get('/race/:categoryName/:seasonYear/:raceName', async (req, res) =>{


  let race = await Database.findRace(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"]);

  if(race){
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
            return {"Driver":y.driver_first_name + " "+y.driver_last_name, "Lap Time": y.lap_time, "Points":y.points};
          }
        }());
        sessionTable.sort(compareTimes);
        sessionTable = sessionTable.map((z,index) => function(){return {"Position":index+1, "Driver":z["Driver"], "Lap Time": z["Lap Time"], "Points":z["Points"]}}() );
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
            return {"Position":y.position,"Driver":y.driver_first_name + " "+y.driver_last_name, "Lap Time": y.lap_time , "Points":y.points};
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
  
    sections.push(["Table","Pit Stops",pitStops,["Driver","Lap","Pit Time","Total Time","Description"],["Link","Text","Text","Text","Text"],"/driver/"]);
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
      pictureURL: race.race_picture,
      relation: req.params["categoryName"] + "/"+req.params["seasonYear"]+"/"+req.params["raceName"],
      additionalScripts: ["/js/results.js"]
    };
  
    res.render('article', {props:props});
  }else{
    res.render("notFound");
  }

});

//POST Methods for Race

//Add a new scheduled session to the race
app.post('/race/:categoryName/:seasonYear/:raceName/schedule',async (req, res) =>{
  
  let sessionType = req.body.sessionTypeInput;
  let sessionTime = req.body.sessionTimeInput;
  let sessionDate = req.body.sessionDateInput;
  let sessionWeather = req.body.sessionWeatherInput.trim();
  let points = req.body.pointsInput == "Yes" ? 1 : 0;


  Database.newSession(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],sessionType,sessionTime,sessionDate,sessionWeather,points);
  
  
  res.redirect(req.get('referer'));
});

//Set a circuit for a race
app.post('/race/:categoryName/:seasonYear/:raceName/circuit',async (req, res) =>{
  
  let circuitName = req.body.circuitNameInput.trim();

  Database.setCircuit(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],circuitName);
  
  res.redirect(req.get('referer'));
});

//Add a new practice session result
app.post('/race/:categoryName/:seasonYear/:raceName/PracticeResult/:sessionNum',async (req, res) =>{
  
  let driverFirstName = req.body.driverFirstNameInput.trim();
  let driverLastName = req.body.driverLastNameInput.trim();
  let driverLapTime = req.body.driverLapTimeInput.trim();

  Database.newPracticeResult(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverFirstName,driverLastName,driverLapTime,req.params["sessionNum"]);
  
  res.redirect(req.get('referer'));
});

//Add a new qualifying session result
app.post('/race/:categoryName/:seasonYear/:raceName/QualifyingResult/:sessionNum',async (req, res) =>{
  
  let driverFirstName = req.body.driverFirstNameInput.trim();
  let driverLastName = req.body.driverLastNameInput.trim();
  let driverLapTime = req.body.driverLapTimeInput.trim();

  Database.newQualifyingResult(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverFirstName, driverLastName, driverLapTime,req.params["sessionNum"]);
  
  res.redirect(req.get('referer'));
});

//Add a new race session result
app.post('/race/:categoryName/:seasonYear/:raceName/RaceResult/:sessionNum',async (req, res) =>{
  
  let driverFirstName = req.body.driverFirstNameInput.trim();
  let driverLastName = req.body.driverLastNameInput.trim();
  let driverLapTime = req.body.driverLapTimeInput.trim();
  let driverPosition = req.body.driverPositionInput.trim();

  Database.newRaceResult(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverFirstName, driverLastName,driverLapTime,driverPosition,req.params["sessionNum"]);
  
  res.redirect(req.get('referer'));
});

//Add a new pitstop result
app.post('/race/:categoryName/:seasonYear/:raceName/PitStop',async (req, res) =>{
  
  let driverFirstName = req.body.driverFirstNameInput.trim();
  let driverLastName = req.body.driverLastNameInput.trim();
  let lapNumber = req.body.lapNumberInput.trim();
  let pitTime = req.body.pitTimeInput.trim();
  let totalTime = req.body.totalTimeInput.trim();
  let pitDescription = req.body.pitDescriptionInput.trim();
  
  Database.newPitStop(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],driverFirstName, driverLastName,lapNumber,pitTime,totalTime,pitDescription);

  res.redirect(req.get('referer'));
});

//Add a new race incident
app.post('/race/:categoryName/:seasonYear/:raceName/incident',async (req, res) =>{
  
  let drivers = req.body.DriversInvolvedInput;
  let lapNumber = req.body.lapNumberInput.trim();
  let incidentDescription = req.body.incidentDescriptionInput.trim();

  Database.newIncident(db, req.params["categoryName"],req.params["seasonYear"],req.params["raceName"],drivers,lapNumber,incidentDescription);

  res.redirect(req.get('referer'));
});

//Update race image
app.post('/race/:categoryName/:seasonYear/:raceName/image',async (req, res) =>{


  Database.updateRaceImage(db,req.params["categoryName"],req.params["seasonYear"],req.params["raceName"], req.body.imageURLInput.trim());

  res.redirect(req.get('referer'));

});


//Update session points
app.post('/updatePoints',async (req, res) =>{

  try{

    Database.updatePoints(db, req.body.category, req.body.season, req.body.race, req.body.session, req.body.driver, req.body.points);
    res.json({status:200});

  }catch(error){
	  res.json({status:400});

  }

});

//Toggle points for session
app.post('/togglePoints',async (req, res) =>{

  try{

    Database.togglePoints(db, req.body.category, req.body.season, req.body.race, req.body.session, req.body.status);
    res.json({status:200});

  }catch(error){
	  res.json({status:400});

  }

});

//Start the server
app.listen(port, () => console.log('Server running'));