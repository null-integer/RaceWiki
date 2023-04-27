class Databse{

    static async findCategorybyName(db, categoryName){
        const result = await db.get("SELECT * FROM category WHERE category_name = ?;",[categoryName]);
        return result;
    }

    static async findAllCategories(db){
        const result = await db.all("SELECT category_name FROM category;");
        return result;
    }

    static async findFlagsByCategory(db, categoryName){
      const result = await db.all(`SELECT flag_icon, flag_name, flag_meaning FROM flag WHERE flag_ID in 
      (SELECT flag_ID FROM categoryFlag WHERE category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?));`,[categoryName]);
      return result;
    }

    static async findTeamsByCategory(db, categoryName){
      const result = await db.all(`SELECT team_name FROM team WHERE category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?)`,[categoryName]);
      return result;
    }

    static async findTeamByCategory(db, categoryName, teamName){
      const result = await db.get(`SELECT * FROM team WHERE category_ID = 
        (SELECT category_ID FROM category WHERE category_name = ?) AND team_name = ?`,[categoryName, teamName]);
      return result;
    }

    static async findSeasonsByCategory(db, categoryName){
      let result = await db.all(`SELECT season_year FROM season WHERE category_ID = 
      (SELECT category_ID FROM category WHERE category_name = ?)`,[categoryName]);
      for(let row of result){
        row.season_year = row.season_year + "";
      }
      return result;
    }

    static async findSeasonByCategoryandYear(db, categoryName, seasonYear){
      let result = await db.get(`SELECT * FROM season WHERE category_ID = 
      (SELECT category_ID FROM category WHERE category_name = ?) AND season_year = ?`,[categoryName, parseInt(seasonYear)]);
      return result;
    }
    static async findCalendar(db, categoryName, seasonYear){
      let result = await db.all(`SELECT race_name, race_date FROM raceWeekend WHERE raceWeekend_ID IN (SELECT raceWeekend_ID FROM raceInSeason WHERE season_ID = (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)) AND (SELECT category_ID FROM category WHERE category_name = ?))`,[seasonYear, categoryName,categoryName]);
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
      let result = await db.get("SELECT * FROM flag WHERE flag_name = ? AND flag_icon = ? AND flag_meaning = ?",[flagName,flagIcon, flagMeaning]);
      
      if(result){
        await db.run(`INSERT INTO categoryFlag (category_ID, flag_ID) VALUES ((SELECT category_ID FROM category WHERE category_name = ?),?)`,[categoryName,result.flag_ID])
      }else{
        let newID = await db.run(`INSERT INTO flag (flag_meaning, flag_icon, flag_name) VALUES (?,?,?)`,[flagMeaning,flagIcon,flagName]);
        await db.run(`INSERT INTO categoryFlag (category_ID, flag_ID) VALUES ((SELECT category_ID FROM category WHERE category_name = ?),?)`,[categoryName,newID.lastID]);
      }
    }
    static async newScoring(db,position,points, categoryName, seasonYear){
      let result = await db.get("SELECT season_scoring FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[seasonYear,categoryName])

      await db.run(`UPDATE season SET season_scoring = ? WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)`,[
        result.season_scoring+","+position+":"+points,
        seasonYear,categoryName
      ]);
    }
    static async newRaceWeekend(db, raceName, raceDate, categoryName, seasonYear){
      let result = await db.run(`INSERT INTO raceWeekend (category_ID, race_date, race_name, practiceSession_ID, qualifyingSession_ID, race_ID, circuit_ID) VALUES ((SELECT category_ID FROM category WHERE category_name = ?), ?, ?, 0, 0, 0, 0)`,[categoryName,raceDate,raceName]);
      await db.run(`INSERT INTO raceInSeason (season_ID, raceWeekend_ID, category_ID) VALUES ((SELECT season_ID FROM SEASON WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)),?,(SELECT category_ID FROM category WHERE category_name = ?))`,[seasonYear,categoryName,result.lastID,categoryName]);
    }
    static async newSession(db, categoryName,seasonYear,raceName,sessionType,sessionTime,sessionDate,sessionWeather){
      if(sessionType == "Practice"){
        let result = await db.run(`INSERT INTO practiceSession (practiceSession_date, practiceSession_time, result_ID, practiceSession_weather) VALUES (?,?,0,?)`,[sessionDate,sessionTime,sessionWeather]);

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
        let result = await db.run(`INSERT INTO qualifyingSession (qualifyingSession_date, qualifyingSession_time, result_ID, qualifyingSession_weather) VALUES (?,?,0,?)`,[sessionDate,sessionTime,sessionWeather]);
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
        let result = await db.run(`INSERT INTO race (race_date, race_time, result_ID, race_weather,race_duration,race_laps,race_fastest_lap, race_fastest_lap_driver_ID) VALUES (?,?,0,?,0,0,0,0)`,[sessionDate,sessionTime,sessionWeather]);
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

    static async findSchedule(db,categoryName,seasonYear,raceName){
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.get(`SELECT practiceSession_ID, qualifyingSession_ID, race_ID FROM raceWeekend WHERE raceWeekend_ID = ?`,[intersection[0]]);

      let practice = await db.all(`SELECT practiceSession_date, practiceSession_time, practiceSession_weather FROM practiceSession WHERE ` + result.practiceSession_ID.split(",").map(x => "practiceSession_ID = ?").join(" OR "), result.practiceSession_ID.split(","));
      
      let qualifying = await db.all(`SELECT qualifyingSession_date, qualifyingSession_time, qualifyingSession_weather FROM qualifyingSession WHERE ` + result.qualifyingSession_ID.split(",").map(x => "qualifyingSession_ID = ?").join(" OR "),result.qualifyingSession_ID.split(","));
      let race = await db.all(`SELECT race_date, race_time, race_weather FROM race WHERE ` + result.race_ID.split(",").map(x => "race_ID = ?").join(" OR "),result.race_ID.split(","));

      practice = practice.map(x => function(){return {...{'sessionType':"Practice"},...x}; }() );
      qualifying = qualifying.map(x => function(){return {...{'sessionType':"Qualifying"},...x}; }() );
      race = race.map(x => function(){return {...{'sessionType':"Race"},...x}; }() );

      let schedule = [].concat(practice,qualifying,race);

      return schedule;
    }

    static async setCircuit(db, categoryName,seasonYear,raceName,circuitName){
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
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.get(`SELECT * FROM circuit WHERE circuit_ID = (SELECT circuit_ID FROM raceWeekend WHERE raceWeekend_ID = ?)`,[intersection[0]]);

      return result;
    }

    static async newTurn(db,circuitName,turnNumber,turnName){
      circuitName = circuitName.replace(/_/g, " ");
      await db.run(`INSERT INTO turn (circuit_ID, turn_name, turn_number) VALUES ((SELECT circuit_ID FROM circuit WHERE circuit_name = ?),?,?)`,[circuitName, turnName, turnNumber]);
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

    static async newPracticeResult(db, categoryName,seasonYear,raceName,driverName,driverLapTime){

      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let driverID = await db.get(`SELECT driver_ID FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,driverName.split(" ").slice(0,2));
      if(!driverID){
        let driverID = await db.run(`INSERT INTO driver (driver_first_name, driver_last_name, driver_number, driver_DOB, driver_nationality, driver_penalty_points, driver_picture) 
                                    VALUES (?,?,0,"","",0,"")`,driverName.split(" ").slice(0,2));
        await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, laps_lead, result_comment, lap_time) VALUES (?,?,"Practice",0,0,"",?)`,[intersection[0],driverID.lastID, driverLapTime]);
        
      }else{
        await db.run(`INSERT INTO result (raceWeekend_ID, driver_ID, session_type, position, laps_lead, result_comment, lap_time) VALUES (?,?,"Practice",0,0,"",?)`,[intersection[0],driverID.driver_ID,driverLapTime]);      
      }

    }

    static async newPitStop(db, categoryName,seasonYear,raceName,driverName,lapNumber,pitTime,totalTime){
      

    }

    static async findPracticeResults(db,categoryName,seasonYear,raceName){
      let raceWeekendIDs = await db.all(`SELECT raceWeekend_ID FROM raceInSeason WHERE category_ID = (SELECT category_ID FROM category WHERE category_name = ?) AND season_ID = 
                                        (SELECT season_ID FROM season WHERE season_year = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?))`,[categoryName,seasonYear,categoryName]);
      let raceIDs = await db.all("SELECT raceWeekend_ID FROM raceWeekend WHERE race_name = ? AND category_ID = (SELECT category_ID FROM category WHERE category_name = ?)",[raceName.replace(/_/g, " "),categoryName]);
      
      raceWeekendIDs = raceWeekendIDs.map(x => x.raceWeekend_ID);
      raceIDs = raceIDs.map(x => x.raceWeekend_ID);
      let intersection = raceWeekendIDs.filter(element => raceIDs.includes(element));

      let result = await db.all(`SELECT driver_first_name, driver_last_name,lap_time from (SELECT * FROM RESULT NATURAL JOIN driver) WHERE raceWeekend_ID = ?`,[intersection[0]]);

      result.sort((a,b) => { return a.lap_time - b.lap_time});
      result = result.map((x,index) => function(){return {"Position":index+1, "Driver":x.driver_first_name + " " + x.driver_last_name, "Lap Time": x.lap_time}}() );
      
      return result;
    
    }
    static async findDriver(db, driverName){
      let result = await db.get(`SELECT * FROM driver WHERE driver_first_name = ? AND driver_last_name = ?`,driverName.split(" "));
      return result;
    }

}

module.exports = Databse;