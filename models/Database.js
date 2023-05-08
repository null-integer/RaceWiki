/*
  Database model to connect to Sqlite
*/
class Databse{

    static async newCategory(db, categoryName, categoryPicture, categoryDescription, categoryRules){
      await db.run(`INSERT INTO category (category_name, category_description, category_rules, category_picture) values (?,?,?,?)`,[categoryName, categoryDescription, categoryRules, categoryPicture]);
    }

    static async findCategorybyName(db, categoryName){
        categoryName = categoryName.replace(/_/g, " ");
        const result = await db.get("SELECT * FROM category WHERE category_name = ?;",[categoryName]);
        return result;
    }

    static async findAllCategories(db){
        const result = await db.all("SELECT category_name FROM category;");
        return result;
    }

    static async findFlagsByCategory(db, categoryName){
      categoryName = categoryName.replace(/_/g, " ");
      const result = await db.all(`SELECT flag_icon, flag_name, flag_meaning FROM flag WHERE flag_ID in 
      (SELECT flag_ID FROM categoryFlag WHERE category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?));`,[categoryName]);
      return result;
    }

    static async findTeamsByCategory(db, categoryName){
      categoryName = categoryName.replace(/_/g, " ");
      const result = await db.all(`SELECT team_name FROM team WHERE category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?)`,[categoryName]);
      return result;
    }

    static async findTeamByCategory(db, categoryName, teamName){
      categoryName = categoryName.replace(/_/g, " ");
      const result = await db.get(`SELECT * FROM team WHERE category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?) AND team_name = ?`,[categoryName, teamName]);
      return result;
    }

    static async findSeasonsByCategory(db, categoryName){
      categoryName = categoryName.replace(/_/g, " ");
      let result = await db.all(`SELECT season_year, season_picture FROM season WHERE category_ID = 
      (SELECT category_ID FROM category WHERE category_name = ?)`,[categoryName]);
      for(let row of result){
        row.season_year = row.season_year + "";
      }
      return result;
    }

    static async findCurrentStandings(db, category){
      let latestSeasons = await db.get(`SELECT season_ID, MAX(season_year) FROM season WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[category]);
      if(latestSeasons["MAX(season_year)"]){
        let results = await db.all(`SELECT driver_ID, driver_first_name, driver_last_name, points FROM (SELECT driver_ID, points FROM result WHERE points > 0 AND raceWeekend_ID IN (SELECT raceWeekend_ID FROM raceInSeason WHERE season_ID = ?)) NATURAL JOIN driver`,[latestSeasons.season_ID])
      
        let standings = [];
        results.forEach(result =>{
            standings.push({"name":result.driver_first_name + " " + result.driver_last_name, "points":result.points });
        });
        
        let teamDriverRelation = await db.all(`SELECT team_name, driver_first_name, driver_last_name FROM (SELECT * FROM (SELECT team_ID, driver_ID FROM drove WHERE season_ID = ?) NATURAL JOIN team) NATURAL JOIN driver`,[latestSeasons.season_ID]);
        teamDriverRelation = teamDriverRelation.map(x => function(){return{"team_name":x.team_name, "driver":x.driver_first_name + " " + x.driver_last_name }}());
        let teamDriverRelationObj = {};
        teamDriverRelation.forEach(x => {
          teamDriverRelationObj[x.driver] = x.team_name;
        });
        
        for(let x = 0; x<standings.length; x+=1){
          if(standings[x].name in teamDriverRelationObj)
            standings[x].team = teamDriverRelationObj[standings[x].name];
          else
            standings[x].team = "";
        }
  
        let standingsObj = [{},{}];
  
        for(let x = 0; x<standings.length; x+=1){
          if(standings[x].name in standingsObj[0]){
            standingsObj[0][standings[x].name] += standings[x].points;
          }else{
            standingsObj[0][standings[x].name] = standings[x].points;
          }
  
          if(standings[x].team in standingsObj[1]){
            standingsObj[1][standings[x].team] += standings[x].points;
          }else{
            standingsObj[1][standings[x].team] = standings[x].points;
          }
        }
  
        let finalStandings = [[],[]];
  
        for(let key in standingsObj[0]){
          let temp = {};
          temp["name"] = key;
          temp["points"] = standingsObj[0][key];
          finalStandings[0].push(temp);
        }
  
        finalStandings[0].sort((a,b) => b.points - a.points)
  
        for(let key in standingsObj[1]){
          if(key != ""){
            let temp = {};
            temp["team"] = key;
            temp["points"] = standingsObj[1][key];
            finalStandings[1].push(temp);          
          }
        }
  
        finalStandings[1].sort((a,b) => b.points - a.points)
  
        return finalStandings.concat([category]);
  
      }
      return [category];
    }

    static async findStandings(db, categoryName, seasonYear){
      categoryName = categoryName.replace(/_/g, " ");
      let lastestSeasonID = await db.get(`SELECT season_ID FROM season WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_year = ?`,[categoryName,seasonYear]);
      if(lastestSeasonID){
        let results = await db.all(`SELECT driver_ID, driver_first_name, driver_last_name, points FROM (SELECT driver_ID, points FROM result WHERE points > 0 AND raceWeekend_ID IN (SELECT raceWeekend_ID FROM raceInSeason WHERE season_ID = ?)) NATURAL JOIN driver`,[lastestSeasonID.season_ID])
      
        let standings = [];
        results.forEach(result =>{
            standings.push({"name":result.driver_first_name + " " + result.driver_last_name, "points":result.points });
        });
        
        let teamDriverRelation = await db.all(`SELECT team_name, driver_first_name, driver_last_name FROM (SELECT * FROM (SELECT team_ID, driver_ID FROM drove WHERE season_ID = ?) NATURAL JOIN team) NATURAL JOIN driver`,[lastestSeasonID.season_ID]);
        teamDriverRelation = teamDriverRelation.map(x => function(){return{"team_name":x.team_name, "driver":x.driver_first_name + " " + x.driver_last_name }}());
        let teamDriverRelationObj = {};
        teamDriverRelation.forEach(x => {
          teamDriverRelationObj[x.driver] = x.team_name;
        });
        
        for(let x = 0; x<standings.length; x+=1){
          if(standings[x].name in teamDriverRelationObj)
            standings[x].team = teamDriverRelationObj[standings[x].name];
          else
            standings[x].team = "";
        }
  
        let standingsObj = [{},{}];
  
        for(let x = 0; x<standings.length; x+=1){
          if(standings[x].name in standingsObj[0]){
            standingsObj[0][standings[x].name] += standings[x].points;
          }else{
            standingsObj[0][standings[x].name] = standings[x].points;
          }
  
          if(standings[x].team in standingsObj[1]){
            standingsObj[1][standings[x].team] += standings[x].points;
          }else{
            standingsObj[1][standings[x].team] = standings[x].points;
          }
        }
  
        let finalStandings = [[],[]];
  
        for(let key in standingsObj[0]){
          let temp = {};
          temp["name"] = key;
          temp["points"] = standingsObj[0][key];
          finalStandings[0].push(temp);
        }
  
        finalStandings[0].sort((a,b) => b.points - a.points)
  
        for(let key in standingsObj[1]){
          if(key != ""){
            let temp = {};
            temp["team"] = key;
            temp["points"] = standingsObj[1][key];
            finalStandings[1].push(temp);          
          }
        }
  
        finalStandings[1].sort((a,b) => b.points - a.points)
  
        return finalStandings;
  
      }
      return [];
    }

    static async findChampions(db, categoryName){
      categoryName = categoryName.replace(/_/g, " ");
      let lastestSeasonID = await db.get(`SELECT season_ID, MAX(season_year) FROM season WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[categoryName]);

      let results = await db.all(`SELECT driver_ID, driver_first_name, driver_last_name, points FROM (SELECT driver_ID, points FROM result WHERE points > 0 AND raceWeekend_ID IN (SELECT raceWeekend_ID FROM raceInSeason WHERE season_ID = ?)) NATURAL JOIN driver`,[lastestSeasonID.season_ID])
      
      let standings = [];
      results.forEach(result =>{
          standings.push({"name":result.driver_first_name + " " + result.driver_last_name, "points":result.points });
      });
      
      let teamDriverRelation = await db.all(`SELECT team_name, driver_first_name, driver_last_name FROM (SELECT * FROM (SELECT team_ID, driver_ID FROM drove WHERE season_ID = ?) NATURAL JOIN team) NATURAL JOIN driver`,[lastestSeasonID.season_ID]);
      teamDriverRelation = teamDriverRelation.map(x => function(){return{"team_name":x.team_name, "driver":x.driver_first_name + " " + x.driver_last_name }}());
      let teamDriverRelationObj = {};
      teamDriverRelation.forEach(x => {
        teamDriverRelationObj[x.driver] = x.team_name;
      });
      
      for(let x = 0; x<standings.length; x+=1){
        if(standings[x].name in teamDriverRelationObj)
          standings[x].team = teamDriverRelationObj[standings[x].name];
        else
          standings[x].team = "";
      }

      let standingsObj = [{},{}];

      for(let x = 0; x<standings.length; x+=1){
        if(standings[x].name in standingsObj[0]){
          standingsObj[0][standings[x].name] += standings[x].points;
        }else{
          standingsObj[0][standings[x].name] = standings[x].points;
        }

        if(standings[x].team in standingsObj[1]){
          standingsObj[1][standings[x].team] += standings[x].points;
        }else{
          standingsObj[1][standings[x].team] = standings[x].points;
        }
      }

      let champions = ["",""];

      let champPoints = -1;
      for(let key in standingsObj[0]){
        if(standingsObj[0][key] > champPoints){
          champions[0] = key;
          champPoints = standingsObj[0][key];

        }
      }

      champPoints = -1;
      for(let key in standingsObj[1]){
        if(standingsObj[1][key] > champPoints && standings[1][key] != ""){
          champions[1] = key;
          champPoints = standingsObj[1][key];
        }
      }
      return champions;
    }

    static async findDrivers(db,categoryName){
      categoryName = categoryName.replace(/_/g, " ");
      let result = await db.all(`SELECT driver_first_name,driver_last_name FROM (SELECT driver_ID FROM (SELECT season_ID FROM season WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?)) NATURAL JOIN drove) NATURAL JOIN driver`,[categoryName]);
      return result;
    }

    static async findSeasonByCategoryandYear(db, categoryName, seasonYear){
      categoryName = categoryName.replace(/_/g, " ");
      let result = await db.get(`SELECT * FROM season WHERE category_ID = 
      (SELECT category_ID FROM category WHERE category_name = ?) AND season_year = ?`,[categoryName, parseInt(seasonYear)]);
      return result;
    }

    static async findCalendar(db, categoryName, seasonYear){
      categoryName = categoryName.replace(/_/g, " ");
      let result = await db.all(`SELECT race_name, race_date FROM raceWeekend WHERE raceWeekend_ID IN (SELECT raceWeekend_ID FROM raceInSeason WHERE season_ID = (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)) AND (SELECT category_ID FROM category WHERE category_name = ?))`,[seasonYear, categoryName,categoryName]);
      return result;
    }

    static async findEntries(db, categoryName, seasonYear){
      categoryName = categoryName.replace(/_/g, " ");
      let result = await db.all(`SELECT team_name, driver_first_name, driver_last_name, vehicle_chassis_name FROM (SELECT * FROM (SELECT * FROM (SELECT * FROM drove WHERE season_ID = (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))) NATURAL JOIN driver) NATURAL JOIN team) NATURAL JOIN vehicle`,[seasonYear, categoryName]);
      result = result.map(x => function(){return{"team":x.team_name, "driver":x.driver_first_name + " " + x.driver_last_name, "vehicle":x.vehicle_chassis_name}}());
      result.sort((a,b) =>{
        if(a.team < b.team){
          return -1;
        }else if(a.team > b.team){
          return 1;
        }else{
          return 0;
        }
      });
      return result;
    }
    static async newSeason(db, categoryName, year, scoring){
      categoryName = categoryName.replace(/_/g, " ");
      await db.run(`INSERT INTO season (category_ID, season_year, season_scoring) VALUES ((SELECT category_ID FROM category WHERE category_name = ?),?,?)`,[categoryName,year, scoring]);
    }
    static async newTeam(db, categoryName,teamName,teamBaselocation,teamPictureURL){
      await db.run(`INSERT INTO team (category_ID, team_name, team_base_location, team_picture) VALUES ((SELECT category_ID FROM category WHERE category_name = ?),?,?,?)`,[categoryName,teamName,teamBaselocation,teamPictureURL]);
    }
    static async newFlag(db, categoryName, flagName,flagIcon, flagMeaning){
      categoryName = categoryName.replace(/_/g, " ");
      flagName = flagName.trim();
      flagIcon = flagIcon.trim();
      flagMeaning = flagMeaning.trim();

      let result = await db.get("SELECT * FROM flag WHERE flag_name = ? AND flag_icon = ? AND flag_meaning = ?",[flagName,flagIcon, flagMeaning]);
      
      if(result){
        await db.run(`INSERT INTO categoryFlag (category_ID, flag_ID) VALUES ((SELECT category_ID FROM category WHERE category_name = ?),?)`,[categoryName,result.flag_ID])
      }else{
        let newID = await db.run(`INSERT INTO flag (flag_meaning, flag_icon, flag_name) VALUES (?,?,?)`,[flagMeaning,flagIcon,flagName]);
        await db.run(`INSERT INTO categoryFlag (category_ID, flag_ID) VALUES ((SELECT category_ID FROM category WHERE category_name = ?),?)`,[categoryName,newID.lastID]);
      }
    }

    static async newScoring(db,position,points, categoryName, seasonYear){
      categoryName = categoryName.replace(/_/g, " ");
      let result = await db.get("SELECT season_scoring FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[seasonYear,categoryName])
      let newScoringString = "";
      let newScore = true;

      result.season_scoring.split(",").forEach(x => {
        if(x.split(":")[0] == position){
          newScoringString += position + ":" + points + ",";
          newScore = false;
        }else{
          newScoringString += x.split(":")[0] + ":" + x.split(":")[1] + ","
        }
      });

      if(newScore){
        newScoringString += position + ":" + points;
      }else{
        newScoringString = newScoringString.substring(0, newScoringString.length - 1);
      }

      await db.run(`UPDATE season SET season_scoring = ? WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[
        newScoringString,
        seasonYear,categoryName
      ]);
    }

    static async newRaceWeekend(db, raceName, raceDate, categoryName, seasonYear){
      categoryName = categoryName.replace(/_/g, " ");
      let result = await db.run(`INSERT INTO raceWeekend (category_ID, race_date, race_name, practiceSession_ID, qualifyingSession_ID, race_ID, circuit_ID) VALUES ((SELECT category_ID FROM category WHERE category_name = ?), ?, ?, 0, 0, 0, 0)`,[categoryName,raceDate,raceName]);
      await db.run(`INSERT INTO raceInSeason (season_ID, raceWeekend_ID, category_ID) VALUES ((SELECT season_ID FROM SEASON WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)),?,(SELECT category_ID FROM category WHERE category_name = ?))`,[seasonYear,categoryName,result.lastID,categoryName]);
    }

    static async newSeasonEntry(db, team, driverFirst, driverLast, vehicle, categoryName, seasonYear){
      categoryName = categoryName.replace(/_/g, " ");

      let driverResult = await db.get(`SELECT * FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,[driverFirst,driverLast]);
      if(!driverResult){
        driverResult = await db.run(`INSERT INTO driver (driver_first_name, driver_last_name,driver_number,driver_DOB,driver_nationality, driver_penalty_points, driver_picture) VALUES 
        (?,?,0,"","",0,"")`,[driverFirst,driverLast]);
        driverResult = driverResult.lastID;
      }else{
        driverResult = driverResult.driver_ID;
      }
      let teamResult = await db.get(`SELECT * FROM team WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[team,categoryName]);
      if(!teamResult){
        teamResult = await db.run(`INSERT INTO team (category_ID, team_name, team_base_location, team_picture) VALUES ((SELECT category_ID FROM category WHERE category_name = ?), ?, "","")`,[categoryName,team]);
        teamResult = teamResult.lastID;
      }else{
        teamResult = teamResult.team_ID;
      }
      await db.run(`INSERT INTO drove (season_ID, team_ID, driver_ID) VALUES ((SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)),?,?)`,[seasonYear, categoryName, teamResult, driverResult]);
      let vehicleResult = await db.get(`SELECT * FROM vehicle WHERE vehicle_chassis_name = ? AND vehicle_year = ? AND team_ID = (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[vehicle,seasonYear, team,categoryName]);
      if(!vehicleResult){
        await db.run(`INSERT INTO vehicle (team_ID, vehicle_engine, vehicle_chassis_name, vehicle_year, vehicle_power, vehicle_weight, vehicle_picture) VALUES (?,"",?,?,"","","")`,[teamResult,vehicle,seasonYear])
      }

    }
    static async newSession(db, categoryName,seasonYear,raceName,sessionType,sessionTime,sessionDate,sessionWeather,points){
      categoryName = categoryName.replace(/_/g, " ");

      if(sessionType == "Practice"){
        let result = await db.run(`INSERT INTO practiceSession (practiceSession_date, practiceSession_time, practiceSession_weather,points) VALUES (?,?,?,?)`,[sessionDate,sessionTime,sessionWeather,points]);

        let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                          (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
        let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
        
        raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
        raceIDs = raceIDs.map(x => x.raceWeekend_ID);
        let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));
        
        let newSessionString = await db.get(`SELECT practiceSession_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);

        if(newSessionString.practiceSession_ID == "0"){
          newSessionString = result.lastID + "";
        }else{
          newSessionString = newSessionString.practiceSession_ID+","+result.lastID;
        }

        await db.run(`UPDATE raceWeekend SET practiceSession_ID = ? WHERE raceWeekend_ID = ?`,[newSessionString,intersection[0]]);

      }else if(sessionType == "Qualifying"){
        let result = await db.run(`INSERT INTO qualifyingSession (qualifyingSession_date, qualifyingSession_time, qualifyingSession_weather,points) VALUES (?,?,?,?)`,[sessionDate,sessionTime,sessionWeather,points]);
        let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                          (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
        let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
        
        raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
        raceIDs = raceIDs.map(x => x.raceWeekend_ID);
        let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

        let newSessionString = await db.get(`SELECT qualifyingSession_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);

        if(newSessionString.qualifyingSession_ID == "0"){
          newSessionString = result.lastID + "";
        }else{
          newSessionString = newSessionString.qualifyingSession_ID+","+result.lastID;
        }

        await db.run(`UPDATE raceWeekend SET qualifyingSession_ID = ? WHERE raceWeekend_ID = ?`,[newSessionString,intersection[0]]);
      }else{
        let result = await db.run(`INSERT INTO race (race_date, race_time, race_weather,points) VALUES (?,?,?,?)`,[sessionDate,sessionTime,sessionWeather,points]);
        let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                          (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
        let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
        
        raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
        raceIDs = raceIDs.map(x => x.raceWeekend_ID);
        let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

        let newSessionString = await db.get(`SELECT race_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);

        if(newSessionString.race_ID == "0"){
          newSessionString = result.lastID + "";
        }else{
          newSessionString = newSessionString.race_ID+","+result.lastID;
        }

        await db.run(`UPDATE raceWeekend SET race_ID = ? WHERE raceWeekend_ID = ?`,[newSessionString,intersection[0]]);
      }
    }

    static async findRace(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.get(`SELECT race_name,race_picture FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);
      return result;
      
    }

    static async findSchedule(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.get(`SELECT practiceSession_ID, qualifyingSession_ID, race_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);

      let practice = await db.all(`SELECT practiceSession_date, practiceSession_time, practiceSession_weather, points FROM practiceSession WHERE ` + result.practiceSession_ID.split(",").map(x => "practiceSession_ID = ?").join(" OR "), result.practiceSession_ID.split(","));
      let qualifying = await db.all(`SELECT qualifyingSession_date, qualifyingSession_time, qualifyingSession_weather, points FROM qualifyingSession WHERE ` + result.qualifyingSession_ID.split(",").map(x => "qualifyingSession_ID = ?").join(" OR "),result.qualifyingSession_ID.split(","));
      let race = await db.all(`SELECT race_date, race_time, race_weather, points FROM race WHERE ` + result.race_ID.split(",").map(x => "race_ID = ?").join(" OR "),result.race_ID.split(","));

      practice = practice.map((x,index) => function(){return {...{'sessionType':"Practice", 'sessionNum':index+1},...x}; }() );
      qualifying = qualifying.map((x,index) => function(){return {...{'sessionType':"Qualifying", 'sessionNum':index+1},...x}; }() );
      race = race.map((x,index) => function(){return {...{'sessionType':"Race", 'sessionNum':index+1},...x}; }() );

      let schedule = [].concat(practice,qualifying,race);

      return schedule;
    }

    static async setCircuit(db, categoryName,seasonYear,raceName,circuitName){
      categoryName = categoryName.replace(/_/g, " ");

      let circuit = await db.get(`SELECT circuit_ID FROM circuit WHERE circuit_name = ?`,[circuitName]);

        let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                          (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
        let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
        
        raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
        raceIDs = raceIDs.map(x => x.raceWeekend_ID);
        let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      //Circuit in DB
      if(circuit){
        await db.run(`UPDATE raceWeekend SET circuit_ID = ? WHERE raceWeekend_ID = ?`,[circuit.circuit_ID,intersection[0]]);

      }else{
        let result = await db.run(`INSERT INTO circuit (circuit_country,circuit_city, circuit_length,circuit_turns,circuit_picture,circuit_name) VALUES ("","","","","",?)`,[circuitName]);
        await db.run(`UPDATE raceWeekend SET circuit_ID = ? WHERE raceWeekend_ID = ?`,[result.lastID,intersection[0]]);
      }
    }

    static async findCircuit(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.get(`SELECT circuit_name FROM circuit WHERE circuit_ID = (SELECT circuit_ID FROM raceWeekend WHERE raceWeekend_ID = ?)`,[intersection[0]]);

      return result;
    }

    static async newTurn(db,circuitName,turnNumber,turnName){
      circuitName = circuitName.replace(/_/g, " ");
      let update = await db.get(`SELECT turn_ID FROM turn WHERE circuit_ID = (SELECT circuit_ID FROM circuit WHERE circuit_name = ?) AND turn_number = ?`,[circuitName, turnNumber]);
      if(update){
        await db.run(`UPDATE turn SET turn_name = ? WHERE turn_ID = ?`,[turnName, update.turn_ID])
      }else{
        await db.run(`INSERT INTO turn (circuit_ID, turn_name, turn_number) VALUES ((SELECT circuit_ID FROM circuit WHERE circuit_name = ?),?,?)`,[circuitName, turnName, turnNumber]);
      }
    }

    static async getTurns(db,circuitName){
      circuitName = circuitName.replace(/_/g, " ");
      let result = await db.all(`SELECT turn_number, turn_name FROM turn WHERE circuit_ID = (SELECT circuit_ID FROM circuit WHERE circuit_name = ?)`,[circuitName]);
      return result;
    }

    static async findCircuitInfo(db,circuitName){
      circuitName = circuitName.replace(/_/g, " ");
      let result = await db.get(`SELECT * FROM circuit WHERE circuit_name = ?`,[circuitName]);
      return result;
    }

    static async newPracticeResult(db, categoryName,seasonYear,raceName,driverFirstName,driverLastName,driverLapTime, sessionNum){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let driverID = await db.get(`SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,[driverFirstName,driverLastName]);
      if(!driverID){
        let driverID = await db.run(`INSERT INTO driver (driver_first_name, driver_last_name, driver_number, driver_DOB, driver_nationality, driver_penalty_points, driver_picture) 
                                    VALUES (?,?,0,"","",0,"")`,[driverFirstName,driverLastName]);
        await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, result_comment, lap_time, session_number,points) VALUES (?,?,"Practice",0,"",?,?,0)`,[intersection[0],driverID.lastID, driverLapTime,sessionNum]);
        
      }else{
        let currentResult = await db.get(`SELECT * FROM result WHERE raceWeekend_ID = ? AND driver_ID = ? AND session_type = ? AND session_number = ?`,[intersection[0],driverID.driver_ID,"Practice",sessionNum]);
        if(currentResult){
          await db.run(`UPDATE result SET lap_time = ? WHERE raceWeekend_ID = ? AND driver_ID = ? AND session_type = ? AND session_number = ?`,[driverLapTime, intersection[0],driverID.driver_ID,"Practice",sessionNum])
        }else{
          await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, result_comment, lap_time, session_number,points) VALUES (?,?,"Practice",0,"",?,?,0)`,[intersection[0],driverID.driver_ID,driverLapTime,sessionNum]);
        }
      }

    }

    static async newQualifyingResult(db, categoryName,seasonYear,raceName,driverFirstName,driverLastName,driverLapTime, sessionNum){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let driverID = await db.get(`SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,[driverFirstName,driverLastName]);
      if(!driverID){
        let driverID = await db.run(`INSERT INTO driver (driver_first_name, driver_last_name, driver_number, driver_DOB, driver_nationality, driver_penalty_points, driver_picture) 
                                    VALUES (?,?,0,"","",0,"")`,[driverFirstName, driverLastName]);
        await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, result_comment, lap_time, session_number,points) VALUES (?,?,"Qualifying",0,"",?,?,0)`,[intersection[0],driverID.lastID, driverLapTime,sessionNum]);
        
      }else{
        let currentResult = await db.get(`SELECT * FROM result WHERE raceWeekend_ID = ? AND driver_ID = ? AND session_type = ? AND session_number = ?`,[intersection[0],driverID.driver_ID,"Qualifying",sessionNum]);
        if(currentResult){
          await db.run(`UPDATE result SET lap_time = ? WHERE raceWeekend_ID = ? AND driver_ID = ? AND session_type = ? AND session_number = ?`,[driverLapTime, intersection[0],driverID.driver_ID,"Qualifying",sessionNum])
        }else{
          await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, result_comment, lap_time, session_number,points) VALUES (?,?,"Qualifying",0,"",?,?,0)`,[intersection[0],driverID.driver_ID,driverLapTime,sessionNum]);
        }
      }

    }

    static async newRaceResult(db, categoryName,seasonYear,raceName,driverFirstName,driverLastName,driverLapTime, driverPosition, sessionNum){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let driverID = await db.get(`SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,[driverFirstName,driverLastName]);
      if(!driverID){
        let driverID = await db.run(`INSERT INTO driver (driver_first_name, driver_last_name, driver_number, driver_DOB, driver_nationality, driver_penalty_points, driver_picture) 
                                    VALUES (?,?,0,"","",0,"")`,[driverFirstName,driverLastName]);
        await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, result_comment, lap_time, session_number,points) VALUES (?,?,"Race",?,"",?,?,0)`,[intersection[0],driverID.lastID, driverPosition,driverLapTime,sessionNum]);
        
      }else{
        let currentResult = await db.get(`SELECT * FROM result WHERE raceWeekend_ID = ? AND driver_ID = ? AND session_type = ? AND session_number = ?`,[intersection[0],driverID.driver_ID,"Race",sessionNum]);
        if(currentResult){
          await db.run(`UPDATE result SET lap_time = ?, position = ? WHERE raceWeekend_ID = ? AND driver_ID = ? AND session_type = ? AND session_number = ?`,[driverLapTime, driverPosition, intersection[0],driverID.driver_ID,"Race",sessionNum])
        }else{
          await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, result_comment, lap_time, session_number,points) VALUES (?,?,"Race",?,"",?,?,0)`,[intersection[0],driverID.driver_ID,driverPosition,driverLapTime,sessionNum]);      
        }
      }

    }
    static async newPitStop(db, categoryName,seasonYear,raceName,driverFirstName, driverLastName, lapNumber,pitTime,totalTime,pitDescription){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let driver = await db.get(`SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,[driverFirstName, driverLastName]);
      if(!driver){
        let driver = await db.run(`INSERT INTO driver (driver_first_name, driver_last_name,driver_number,driver_DOB,driver_nationality, driver_penalty_points, driver_picture) VALUES 
        (?,?,0,"","",0,"")`,[driverFirstName, driverLastName]);

        await db.run(`INSERT INTO pitstop (raceWeekend_ID,driver_ID, pitstop_time, pitstop_lap, pitstop_total_time,pitstop_description) 
        VALUES (?, ?,?,?,?,?)`,[intersection[0], driver.lastID, pitTime,lapNumber,totalTime,pitDescription]);

      }else{
        await db.run(`INSERT INTO pitstop (raceWeekend_ID,driver_ID, pitstop_time, pitstop_lap, pitstop_total_time,pitstop_description) 
        VALUES (?, ?,?,?,?,?)`,[intersection[0], driver.driver_ID, pitTime,lapNumber,totalTime,pitDescription]);
      }
    }

    static async newIncident(db,categoryName,seasonYear,raceName,drivers,lapNumber,incidentDescription){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));
      
      await db.run(`INSERT INTO incident (raceWeekend_ID, incident_lap, incident_description, drivers_involved) VALUES (?,?,?,?)`,[intersection[0],lapNumber,incidentDescription,drivers]);
    
    }

    static async findIncidents(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.all(`SELECT drivers_involved, incident_lap, incident_description FROM incident WHERE raceWeekend_ID = ?`,[intersection[0]]);
      return result;

    }

    static async findPracticeResults(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.all(`SELECT driver_first_name, driver_last_name,lap_time, session_number,points from (SELECT * FROM result NATURAL JOIN driver) WHERE raceWeekend_ID = ? AND session_type = "Practice"`,[intersection[0]]);  
      
      return result; 
    }

    static async findQualifyingResults(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.all(`SELECT driver_first_name, driver_last_name,lap_time, session_number,points from (SELECT * FROM result NATURAL JOIN driver) WHERE raceWeekend_ID = ? AND session_type = "Qualifying"`,[intersection[0]]);

      return result;
    
    }

    static async findRaceResults(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.all(`SELECT position, driver_first_name, driver_last_name,lap_time, session_number,points from (SELECT * FROM result NATURAL JOIN driver) WHERE raceWeekend_ID = ? AND session_type = "Race"`,[intersection[0]]);

      return result;
    
    }

    static async findPitStops(db,categoryName,seasonYear,raceName){
      categoryName = categoryName.replace(/_/g, " ");

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.all(`SELECT driver_first_name, driver_last_name, pitstop_lap, pitstop_time, pitstop_total_time, pitstop_description FROM (SELECT * FROM (SELECT * FROM pitstop WHERE raceWeekend_ID = ?) NATURAL JOIN driver)`,[intersection[0]]);

      result = result.map(x => function(){return {"name":x.driver_first_name + " " + x.driver_last_name, "Lap": x.pitstop_lap, "Pit Time": x.pitstop_time, "Total":x.pitstop_total_time, "Desc":x.pitstop_description}}())
      result.sort((a,b) => parseInt(a["Lap"]) - parseInt(b["Lap"]))
      return result;
    
    }

    static async findDriver(db, driverName){
      let result = await db.get(`SELECT * FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,driverName.split(" "));
      return result;
    }



    static async newVehicle(db,categoryName,teamName,engine, chassis, seasonYear, power, weight, url){
      categoryName = categoryName.replace(/_/g, " ");
      teamName = teamName.replace(/_/g, " ");

      await db.run(`INSERT INTO vehicle (team_ID, vehicle_engine, vehicle_chassis_name, vehicle_year, vehicle_power, vehicle_weight, vehicle_picture) VALUES 
                    ((SELECT team_ID FROM team WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)),
                    ?,?,?,?,?,?)`,[teamName,categoryName,engine, chassis, seasonYear, power, weight, url]);
    }

    static async findVehicles(db, categoryName, teamName){
      categoryName = categoryName.replace(/_/g, " ");

      let result = await db.all(`SELECT vehicle_chassis_name FROM vehicle WHERE team_ID = (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[teamName,categoryName]);
      return result;
    }
    
    static async findTeamDrivers(db, categoryName, teamName){
      let result = await db.all(`SELECT * FROM (SELECT * FROM (SELECT * FROM drove WHERE team_ID = 
      (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?)
      )) NATURAL JOIN driver) NATURAL JOIN season`,[teamName,categoryName]);

      result = result.map(x => function(){return {"Driver": x.driver_first_name + " " + x.driver_last_name, "Season":x.season_year}}());


      return result;
    }

    static async findTeamResults(db, categoryName, teamName){
      categoryName = categoryName.replace(/_/g, " ");

      let result = await db.all(`SELECT * FROM result WHERE team_ID = 
      (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?)
      )`,[teamName,categoryName]);

      
      return result;
    }

    static async findVehicle(db,categoryName, teamName, vehicleName){
      categoryName = categoryName.replace(/_/g, " ");

      let result = await db.get(`SELECT * FROM vehicle WHERE vehicle_chassis_name = ? AND team_ID = (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[vehicleName, teamName, categoryName ]);
      return result;
    }

    static async findVehicleDrivers(db,categoryName, teamName, vehicleName){
      categoryName = categoryName.replace(/_/g, " ");

      let result = await db.all(`SELECT driver_first_name, driver_last_name FROM (SELECT driver_ID FROM drove WHERE season_ID = 
      (SELECT season_ID FROM season WHERE category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?) AND season_year = 
        (SELECT vehicle_year FROM vehicle WHERE vehicle_chassis_name = ? AND team_ID = 
          (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = 
            (SELECT category_ID FROM category WHERE category_name = ?)
          )
        )
      ) AND team_ID = (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?)
      )) NATURAL JOIN driver`,[categoryName, vehicleName, teamName, categoryName, teamName,categoryName]);

      result = result.map(x => function(){return {"Driver": x.driver_first_name + " " + x.driver_last_name}}());
      return result;
    }

    static async findVehicleResults(db,categoryName, teamName, vehicleName){
      categoryName = categoryName.replace(/_/g, " ");

      let result = await db.all(`SELECT position, driver_first_name, driver_last_name, race_name FROM (SELECT * FROM (SELECT * FROM result WHERE raceWeekend_ID IN 
      (SELECT raceWeekend_ID FROM raceInSeason WHERE season_ID = 
        (SELECT season_ID FROM season WHERE season_year = 
          (SELECT vehicle_year FROM vehicle WHERE vehicle_chassis_name = ? AND team_ID = 
            (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = 
              (SELECT category_ID FROM category WHERE category_name = ?)
            )
          )      
        )
      ) AND session_type = "Race" AND driver_ID IN 
      (
        SELECT driver_ID FROM (SELECT driver_ID FROM drove WHERE season_ID = 
          (SELECT season_ID FROM season WHERE category_ID = 
            (SELECT category_ID FROM category WHERE category_name = ?) AND season_year = 
            (SELECT vehicle_year FROM vehicle WHERE vehicle_chassis_name = ? AND team_ID = 
              (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = 
                (SELECT category_ID FROM category WHERE category_name = ?)
              )
            )
          ) AND team_ID = (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = 
            (SELECT category_ID FROM category WHERE category_name = ?)
          )) NATURAL JOIN driver
      )) NATURAL JOIN driver) NATURAL JOIN raceWeekend`,[vehicleName, teamName, categoryName,categoryName, vehicleName, teamName, categoryName, teamName,categoryName]);

      result = result.map(x => function(){return {"Position": x.position, "Driver": x.driver_first_name + " " + x.driver_last_name, "Race":x.race_name}}());
      
      return result;
    }

    static async updatePoints(db, categoryName,seasonYear,raceName,session,driver, points){
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let session_type = session.split(" ")[0];
      let session_number = session.split(" ")[1];
      let firstname = driver.split(" ")[0];
      let lastname = driver.split(" ")[1];

      await db.run(`UPDATE result SET points = ? WHERE raceWeekend_ID = ? AND session_type = ? AND session_number = ? AND driver_ID = (SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ?)`,[points,intersection[0],session_type,session_number,firstname,lastname]);
    }

    static async togglePoints(db, categoryName,seasonYear,raceName,session, status){
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let session_type = session.split(" ")[0];
      let session_number = session.split(" ")[1];

      if(session_type == "Practice"){

        let sessions = await db.get(`SELECT practiceSession_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);
        let id = sessions.practiceSession_ID.split(",")[session_number-1];
        await db.run(`UPDATE practiceSession SET points = ? WHERE practiceSession_ID = ?`,[status, id]);

      }else if(session_type === "Qualifying"){

        let sessions = await db.get(`SELECT qualifyingSession_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);
        let id = sessions.qualifyingSession_ID.split(",")[session_number-1];
        await db.run(`UPDATE qualifyingSession SET points = ? WHERE qualifyingSession_ID = ?`,[status, id]);

      }else{

        let sessions = await db.get(`SELECT race_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);
        let id = sessions.race_ID.split(",")[session_number-1];
        await db.run(`UPDATE race SET points = ? WHERE race_ID = ?`,[status, id]);

      }

    }

    static async updateCategoryImage(db,categoryName,imageURLInput){
      categoryName = categoryName.replace(/_/g, " ");
      await db.run(`UPDATE category SET category_picture = ? WHERE category_name = ?`,[imageURLInput,categoryName]);
    }    
    
    static async updateCircuitImage(db,circuitName,imageURLInput){
      circuitName = circuitName.replace(/_/g, " ");
      await db.run(`UPDATE circuit SET circuit_picture = ? WHERE circuit_name = ?`,[imageURLInput,circuitName]);
    }

    static async updateDriverImage(db,driverName,imageURLInput){
      driverName = driverName.replace(/_/g, " ");
      await db.run(`UPDATE driver SET driver_picture = ? WHERE driver_first_name = ? AND driver_last_name = ?`,[imageURLInput, driverName.split(" ")[0], driverName.split(" ")[1]]);
    }

    static async updateDriverInfo(db, driverName, updatedField, updatedInfo){
      driverName = driverName.replace(/_/g, " ");
      let att = {0:"driver_DOB",1:"driver_number",2:"driver_nationality",3:"driver_penalty_points"};
      await db.run(`UPDATE driver SET ${att[updatedField]} = ? WHERE driver_first_name = ? AND driver_last_name = ?`,[updatedInfo,driverName.split(" ")[0],driverName.split(" ")[1]]);

    }

    static async updateCircuitInfo(db, circuitName, updatedField, updatedInfo){
      circuitName = circuitName.replace(/_/g, " ");
      let att = {0:"circuit_country",1:"circuit_city",2:"circuit_length"};
      if(updatedField == 2){
        updatedInfo = updatedInfo.replace(/ Km/g,"")
      }
      await db.run(`UPDATE circuit SET ${att[updatedField]} = ? WHERE circuit_name = ?`,[updatedInfo,circuitName]);

    }

    static async updateTeamInfo(db, categoryName,teamName, updatedField, updatedInfo){
      categoryName = categoryName.replace(/_/g, " ");
      teamName = teamName.replace(/_/g, " ");
      let att = {0:"team_base_location"};
      
      await db.run(`UPDATE team SET ${att[updatedField]} = ? WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[updatedInfo,teamName, categoryName]);

    }

    static async updateVehicleInfo(db, categoryName,teamName,vehicleName, updatedField, updatedInfo){
      categoryName = categoryName.replace(/_/g, " ");
      teamName = teamName.replace(/_/g, " ");
      vehicleName = vehicleName.replace(/_/g, " ");
      let att = {2:"vehicle_engine",3:"vehicle_power",4:"vehicle_weight"};

      if(updatedField == 4){
        updatedInfo = updatedInfo.replace(/ Kg/g,"")
      }
      if(updatedField == 3){
        updatedInfo = updatedInfo.replace(/ HP/g,"")
      }

      await db.run(`UPDATE vehicle SET ${att[updatedField]} = ? WHERE vehicle_chassis_name = ? AND team_ID = (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[updatedInfo,vehicleName,teamName, categoryName]);

    }

    static async updateTeamImage(db,categoryName, teamName, imageURLInput){

      categoryName = categoryName.replace(/_/g, " ");
      teamName = teamName.replace(/_/g, " ");

      await db.run(`UPDATE team SET team_picture = ? WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[imageURLInput,teamName,categoryName]);
    }

    static async updateVehicleImage(db,categoryName, teamName, vehicleName, imageURLInput){

      categoryName = categoryName.replace(/_/g, " ");
      teamName = teamName.replace(/_/g, " ");
      vehicleName = vehicleName.replace(/_/g, " ");

      await db.run(`UPDATE vehicle SET vehicle_picture = ? WHERE vehicle_chassis_name = ? AND team_ID = (SELECT team_ID FROM team WHERE team_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[imageURLInput,vehicleName,teamName, categoryName]);
    }

    static async updateSeasonImage(db,categoryName, seasonYear, imageURLInput){

      categoryName = categoryName.replace(/_/g, " ");

      await db.run(`UPDATE season SET season_picture = ? WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[imageURLInput,seasonYear,categoryName]);
    }

    static async updateRaceImage(db,categoryName,seasonYear,raceName, imageURLInput){
      categoryName = categoryName.replace(/_/g, " ");
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      await db.run(`UPDATE raceWeekend SET race_picture = ? WHERE raceWeekend_ID = ?`,[imageURLInput, intersection[0]]);

    }

    static async updateCategoryRules(db,categoryName,updatedRules){
      categoryName = categoryName.replace(/_/g, " ");
      await db.run(`UPDATE category SET category_rules = ? WHERE category_name = ?`,[updatedRules,categoryName]);
    }

    static async updateCategoryDescription(db,categoryName,updatedDescription){
      categoryName = categoryName.replace(/_/g, " ");
      await db.run(`UPDATE category SET category_description = ? WHERE category_name = ?`,[updatedDescription,categoryName]);
    }

    static async findDriverTeams(db, driverName){
      let result = await db.all(`SELECT season_year, team_name, category_name  FROM 
      ((SELECT * FROM (SELECT * FROM drove WHERE driver_ID = (SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ? )) NATURAL JOIN team) NATURAL JOIN season) NATURAL JOIN category`,[driverName.split(" ")[0],driverName.split(" ")[1]]);
      return result;
    }

    static async findResults(db,driverName){
      let result = db.all(`SELECT position, season_year, race_name FROM (SELECT * FROM (SELECT * FROM 
      (SELECT * FROM result WHERE driver_ID = 
        (SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ?) AND session_type = "Race") NATURAL JOIN raceInSeason) NATURAL JOIN raceWeekend) NATURAL JOIN season`,[driverName.split(" ")[0],driverName.split(" ")[1]])
      return result;
    }
    
}

module.exports = Databse;