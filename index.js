//Import required modules
const request = require('supertest');
const assert = require('assert');
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
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(session({secret:"zkxckjaewqidjskaldanmcxz"}));


//Host name and port
const hostname = '127.0.0.1';
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

request(app).get('/users')
            .expect((res) => {
                if (!('users' in res.body)) throw new Error("Missing users /users in body");
            }).end(() => {console.log("/users working as expected")});

//Main Homepage
app.get('/', async (req, res) => {
  if (req.session.login){

    // let standings = [];
    // standings.push(await Database.findCurrentStandings(db,"F1"));
    // console.log(standings);

    res.render('homepage',{categories:categories,permission:req.session.login.permission, standings:standings});
  }
  else{
    // let standings = [];
    // standings.push(await Database.findCurrentStandings(db,"F1"));
    // console.log(standings);
    res.render('homepage',{categories:categories, permission:'null', standings:standings})
  }
    
});

request(app).get('/')
            .expect((res) => {
                if (!('categories' in res.body)) throw new Error("Missing categories in / body");
                if (!('permission' in res.body)) throw new Error("Missing permission in / body");
            }).end(() => {console.log("/ working as expected")});

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
    res.redirect("/register")
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




app.get('/signout',(req,res)=>{
  delete req.session.login
  res.render('homepage',{
    categories: categories,
    permission: 'null',
    standings:standings
  })
})

request(app).get('/signout')
            .expect((res) => {
                if (!('categories' in res.body)) throw new Error("Missing categories in /signout body");
                if (!('permission' in res.body)) throw new Error("Missing permission in /signout body");
                if (res.body.permission != 'null') throw new Error("Permissions not cleared after signout");
            }).end(() => {console.log("/signout working as expected")});

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


app.get('/getCategories', async (req,res) => {

  let result = await Database.findAllCategories(db);
  res.json(result);

});

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


request(app).get('/controlpanel')
            .expect((res) => {
                if (res.res.rawHeaders[3] != '/') {
                    if (!('categories' in res.body)) throw new Error("Missing categories in /controlpanel body");
                    if (!('users' in res.body)) throw new Error("Missing users in /controlpanel body");
                }
            }).end(() => {console.log("/controlpanel working as expected")});

app.post('/controlpanel' ,(req,res)=>{
  let id = req.body.Id;
  let username = req.body.username;
  let permission = req.body.role;
  switch(permission){
    case 'photo':
      permission = 'PHOTO'
      break;
    case 'writer':
      permission = 'WRITER'
      break;
  }
  User.update({permission: permission},{where: {id:id}})
  res.redirect('/controlpanel')
});

app.post('/delete', (req,res)=>{
  let id = req.body.Id
  User.destroy({where:{id:id}});
  res.redirect('/refresh')
})

app.get('/refresh',(req,res)=>{
  res.redirect('/controlpanel')
})

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

app.post('/search', async (req,res) => {

  switch(req.body.relation){
    case "Category":
      res.redirect('/category/'+req.body.query);
    break;

    case "Driver":
      res.redirect('/driver/'+req.body.query);
    break;

    case "Circuit":
      res.redirect('/circuit/'+req.body.query);
    break;

    case "Team":
      res.redirect('/team/'+req.body.additionalRelationMenu.replace(/ /g,"_") + "/"+req.body.query.replace(/ /g,"_"));
    break;

    case "Vehicle":
      res.render('notFound');
    break;

    case "Season":
      res.render('notFound');
    break;

    case "Race":
      res.render('notFound');
    break;

    default:
  }
});

//Articles

//Category Page
app.get('/category/:categoryName', async (req, res) =>{
  
    categoryName = req.params['categoryName'].replace(/_/g, " ");

  if (categories.includes(categoryName)){

    //Fetching needed info from database
    let categoryInfo = await Database.findCategorybyName(db,categoryName);
    let flags = await Database.findFlagsByCategory(db, categoryName);
    let teams = await Database.findTeamsByCategory(db, categoryName);
    let seasons = await Database.findSeasonsByCategory(db,categoryName);
    let drivers = await Database.findDrivers(db,categoryName);
    let champions = await Database.findChampions(db,categoryName);

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
      ["Driver's Champion", champions[0]],
      ["Constructor's Champion",champions[1]]
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
      writerScripts: ['/js/category.js'],
      photoScripts: ['/js/categoryImage.js']
    }

    if(req.session.login){
      res.render('article', {props:props, permission:req.session.login.permission});
    }
    else{
      res.render('article', {props:props, permission:'null'});
    }

  }
  else{
    res.render("notFound");
  }  
});


request(app).get('/category/:categoryName')
            .expect((res) => {
                if (!('props' in res.body)) throw new Error("Missing props in /category body");
                if (!('permission' in res.body)) throw new Error("Missing permission in /category body");
            }).end(() => {console.log("/category working as expected")});

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

    let teams = await Database.findDriverTeams(db, driverName);
    let results = await Database.findResults(db,driverName);

    let sections = [
      ["Table","Teams",teams,["Season","Team","Category"],["Text","Text","Text"]],
      ["Table","Results",results,["Position","Season","Race"],["Text","Text","Text"]],
    ];
  
    let generalInfo = [
      ["Date of Birth",driverInfo.driver_DOB.length == 0 ? "?" : driverInfo.driver_DOB],
      ["Number",driverInfo.driver_number.length == 0 ? "?" : driverInfo.driver_number],
      ["Nationality",driverInfo.driver_nationality.length == 0 ? "?" : driverInfo.driver_nationality],
      ["Penalty Points",driverInfo.driver_penalty_points.length == 0 ? "?" : driverInfo.driver_penalty_points],
      ["Championships",""],
      ["Wins",results == undefined ? 0 : results.filter(x => {return x.position == 1}).length ],
      ["Podiums",results == undefined ? 0 : results.filter(x => {return x.position == 1 || x.position == 2 || x.position == 3}).length],
    ];
  
    let articleTitle = driverName;
  
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL:driverInfo.driver_picture,
      relation:"/",
      writerScripts: ['/js/driver.js'],
      photoScripts: ['/js/driverImage.js']
    };
  
    if(req.session.login){
      res.render('article', {props:props, permission:req.session.login.permission});
    }
    else{
      res.render('article', {props:props, permission:'null'});
    }

  }else{
    res.render("notFound");
  }

});


request(app).get('/driver/:driverName')
            .expect((res) => {
                if (!('props' in res.body)) throw new Error("Missing props in /driver body");
            }).end(() => {console.log("/driver working as expected")});

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
      photoScripts: ["/js/circuitImage.js"],
      writerScripts: ["/js/circuit.js"],
    };
  
    if(req.session.login){
      res.render('article', {props:props, permission:req.session.login.permission});
    }
    else{
      res.render('article', {props:props, permission:'null'});
    }
  }else{
    res.render("notFound");
  }

});

request(app).get('/circuit/:circuitName')
            .expect((res) => {
                if (!('props' in res.body)) throw new Error("Missing props in /circuit body");
            }).end(() => {console.log("/circuit working as expected")});


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
    let drivers = await Database.findTeamDrivers(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "));
    // let results = await Database.findTeamResults(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "));

    let sections = [
      ["Table","Vehicles", vehicles,[],["Link"],"/vehicle/"+req.params["categoryName"]+ "/"+req.params["teamName"]+"/"],
      ["Table","Drivers", drivers,["Driver","Seasons"],["Text","Text"]],
      ["Table","Results" , [],["Driver","Race","Season","Place"],["Text","Text","Text","Text"]],
    ];
  
    let generalInfo = [
      ["Team Base", teamInfo.team_base_location],
      ["Drivers",""],
      ["Constructor's Championships",""],
      ["Driver's Champsionships",""],
      ["Victories",""],
      ["Podiums",""],
    ];
  
    let articleTitle = teamInfo.team_name;

    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: teamInfo.team_picture,
      relation: "/"+req.params["categoryName"]+ "/"+req.params["teamName"]+"/",
      photoScripts: ["/js/teamImage.js"],
      writerScripts: ["/js/team.js"],
    };
  
    if(req.session.login){
      res.render('article', {props:props, permission:req.session.login.permission});
    }
    else{
      res.render('article', {props:props, permission:'null'});
    }  }else{
    res.render("notFound");
  }

});


request(app).get('/team/:categoryName/:teamName')
            .expect((res) => {
                if (!('props' in res.body)) throw new Error("Missing props in /team body");
            }).end(() => {console.log("/team working as expected")});

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
    let drivers = await Database.findVehicleDrivers(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "), req.params["vehicleName"].replace(/_/g," "));
    let results = await Database.findVehicleResults(db,req.params["categoryName"].replace(/_/g," "), req.params["teamName"].replace(/_/g," "), req.params["vehicleName"].replace(/_/g," "));
    
    let sections = [
      ["Table","Drivers",drivers,[],["Link"],"/driver/"],
      ["Table","Full Results",results,["Position","Driver","Race",],["Text","Text","Text"]]
    ];
  
    let generalInfo = [
      ["Team",req.params["teamName"].replace(/_/g," ")],
      ["Season",vehicleInfo.vehicle_year],
      ["Engine",vehicleInfo.vehicle_engine],
      ["Power", vehicleInfo.vehicle_power + " HP"],
      ["Weight",vehicleInfo.vehicle_weight + " Kg"],
      ["Races", results == undefined ? 0 : results.length],
      ["Wins",results == undefined ? 0 : results.filter(x => {return x.Position == 1}).length ],
      ["Podiums",results == undefined ? 0 : results.filter(x => {return x.Position == 1 || x.Position == 2 || x.Position == 3}).length],
    ];
  
    let articleTitle = vehicleInfo.vehicle_chassis_name;
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: vehicleInfo.vehicle_picture,
      photoScripts: ['/js/vehicleImage.js'],
      writerScripts: ['/js/vehicle.js'],
    };
  
    if(req.session.login){
      res.render('article', {props:props, permission:req.session.login.permission});
    }
    else{
      res.render('article', {props:props, permission:'null'});
      
    }
  }else{
    res.render("notFound");
  }

});


request(app).get('/vehicle/:categoryName/:teamName/:vehicleName')
            .expect((res) => {
                if (!('props' in res.body)) throw new Error("Missing props in /vehicle body");
            }).end(() => {console.log("/vehicle working as expected")});

//POST methods for Vehicle page

//Update the vehicle image
app.post('/vehicle/:categoryName/:teamName/:vehicleName/image',async (req, res) =>{

  Database.updateVehicleImage(db,req.params["categoryName"],req.params["teamName"],req.params["vehicleName"],req.body.imageURLInput.trim());
  
  res.redirect(req.et('referer'));
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
    calendar.sort(function(a,b){return new Date(a.race_date) - new Date(b.race_date)})
    for(let round = 0; round < calendar.length; round+=1){
      calendarArray.push({"Round":round + 1, "Date":calendar[round].race_date, "Name":calendar[round].race_name});
    }
    // calendarArray.sort(function(a,b){return new Date(a.Date) - new Date(b.Date)});
  
    let entries = await Database.findEntries(db,categoryName, req.params["seasonYear"]);
    let teams = [];
    entries.forEach(x => {
      if(!teams.includes(x["team"])){
        teams.push(x["team"]);
      }
    });
  
    let standings = await Database.findStandings(db,categoryName,req.params["seasonYear"]);  
    let sections = [
      ["Table","Scoring System",scoringSystem, ["Position","Points"],["Text","Text"]],
      ["Table","Entries",entries,["Team","Driver","Vehicle"],["Text","Text","Text"]],
      ["Table","Calendar",calendarArray,["Round","Date","Name"],["Text","Text","Link"],"/race/"+req.params["categoryName"]+"/"+req.params["seasonYear"]+"/"],
      ["Table","Driver's Standings",standings[0],["Driver","Points"],["Text","Text"]],
      ["Table","Constructor's Standings",standings[1],["Team","Points"],["Text","Text"]],
    ];
  
    let generalInfo = [
      ["Year", seasonInfo.season_year],
      ["Races",calendarArray.length],
      ["Drivers",entries.length],
      ["Teams",teams.length],
      ["Driver's Champion",standings[0].length >= 1 ? standings[0][0].name : ""],
      ["Constructor's Champion",standings[1].length >= 1 ? standings[1][0].team : ""],
    ];
  
    let articleTitle = req.params["seasonYear"]+ " "+categoryName+" Season";
    let props = {
      categories:categories,
      articleTitle: articleTitle,
      sections:sections, 
      generalInfo:generalInfo,
      pictureURL: seasonInfo.season_picture,
      relation: req.params["categoryName"]+"/"+req.params["seasonYear"],
      writerScripts:['/js/season.js'],
      photoScripts:['/js/seasonImage.js'],
    };
  
    if(req.session.login){
      res.render('article', {props:props, permission:req.session.login.permission});
    }
    else{
      res.render('article', {props:props, permission:'null'});
    }
  }else{
    res.render("notFound");
  }

});

request(app).get('/season/:categoryName/:seasonYear')
            .expect((res) => {
                if (!('props' in res.body)) throw new Error("Missing props in /season body");
            }).end(() => {console.log("/season working as expected")});


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
      additionalScripts: ["/js/results.js"],
      writerScripts: ["/js/resultsEditor.js"],
      photoScripts: ["/js/resultsImage.js"],
    };
  
    if(req.session.login){
      res.render('article', {props:props, permission:req.session.login.permission});
    }
    else{
      res.render('article', {props:props, permission:'null'});
    }
  }else{
    res.render("notFound");
  }

});


request(app).get('/race/:categoryName/:seasonYear/:raceName')
            .expect((res) => {
                if (!('props' in res.body)) throw new Error("Missing props in /race body");
            }).end(() => {console.log("/race working as expected")});

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


let standings = {
  "F1": [
    {"name":"Max Verstappen","team":"Oracle Redbull Racing","points":119},
    {"name":"Sergio Perez","team":"Oracle Redbull Racing","points":105},
    {"name":"Fernando Alonso","team":"Aston Martin Aramco Cognizant F1 Team","points":75},
    {"name":"Lewis Hamilton","team":"Mercedes-AMG PETRONAS F1 Team","points":56},
    {"name":"Carlos Sainz","team":"Scuderia Ferrari","points":44},
    {"name":"George Russell","team":"Mercedes-AMG PETRONAS F1 Team","points":40},
    {"name":"Charles Leclerc","team":"Scuderia Ferrari","points":34},
    {"name":"Lance Stroll","team":"Aston Martin Aramco Cognizant F1 Team","points":27},
    {"name":"Lando Norris","team":"McLaren F1 Team","points":10},
    {"name":"Pierre Gasly","team":"BWT Alpine F1 Team","points":8},
    {"name":"Nico Hulkenberg","team":"MoneyGram Haas F1 Team","points":6},
    {"name":"Esteban Ocon","team":"BWT Alpine F1 Team","points":6},
    {"name":"Valterri Bottas","team":"Alfa Romeo F1 Team Stake","points":4},
    {"name":"Oscar Piastri","team":"McLaren F1 Team","points":4},
    {"name":"Zhou Guanyu","team":"Alfa Romeo F1 Team Stake","points":2},
    {"name":"Yuki Tsunoda","team":"Scuderia AlphaTauri","points":2},
    {"name":"Kevin Magnessun","team":"MoneyGram Haas F1 Team","points":2},
    {"name":"Alexander Albon","team":"Williams Racing","points":1},
    {"name":"Logan Sargeant","team":"Williams Racing","points":0},
    {"name":"Nyck DeVries","team":"Scuderia AlphaTauri","points":0},
  ],
  "F2": [
    {"name":"Theo Pourchaire","team":"ART Grand Prix","points":65},
    {"name":"Frederik Vesti","team":"Prema Powerteam","points":60},
    {"name":"Ayumu Iwasa","team":"DAMS","points":58},
    {"name":"Oliver Bearman","team":"Prema Powerteam","points":41},
    {"name":"Kush Maini","team":"Campos Racing","points":39},
    {"name":"Dennis Hauger","team":"MP Motorsport","points":36},
    {"name":"Ralph Boschung","team":"Campos Racing","points":34},
    {"name":"Arthur Leclerc","team":"DAMS","points":33},
    {"name":"Jehan Daruvala","team":"MP Motorsports","points":33},
    {"name":"Enzo Fittipaldi","team":"Carlin","points":32},
    {"name":"Victor Martins","team":"ART Grand Prix","points":31},
    {"name":"Zane Maloney","team":"Carlin","points":29},
    {"name":"Richard Verschoor","team":"Van Amersfoort Racing","points":29},
    {"name":"Jack Doohan","team":"UNI-Virtuosi","points":27},
    {"name":"Isack Hadjar","team":"HitechGP","points":24},
    {"name":"Jak Crawford","team":"HitechGP","points":16},
    {"name":"Juan Manuel Correa","team":"Van Amersfoort Racing","points":15},
    {"name":"Clement Novalak","team":"Trident","points":4},
    {"name":"Roman Staněk","team":"Trident","points":2},
    {"name":"Roy Nissany","team":"Charouz Racing System","points":2},
    {"name":"Amaury Cordeel","team":"UNI-Virtuosi","points":0},
    {"name":"Brad Benavides","team":"Charouz Racing System","points":0},

  ],
  "F3": [{},{},{}],
  "Indycar": [{},{},{}],
  "MotoGP": [{},{},{}],
  "Moto2": [{},{},{}],
  "Nascar Cup Series": [{},{},{}],

}

//Start the server
app.listen(port, () => console.log('Server running'));