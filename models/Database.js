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

}


let mockDatabase = {
    "category": [
      {"categoryID":0, "categoryName":"F1", "description":"", "rules":"", "Drivers": 20, "Teams": 10, "pictureURL":"" },
      {"categoryID":1, "categoryName":"F2", "description":"", "rules":"","Drivers": 22, "Teams": 11, "pictureURL":""},
      {"categoryID":2, "categoryName":"F3", "description":"", "rules":"","Drivers": 30, "Teams": 10, "pictureURL":""},
      {"categoryID":3, "categoryName":"IndyCar","description":"", "rules":"","Drivers": 34, "Teams": 12, "pictureURL":""},
      {"categoryID":4, "categoryName":"MotoGP", "description":"", "rules":"","Drivers": 30, "Teams": 15, "pictureURL":""},
      {"categoryID":5, "categoryName":"Moto2", "description":"", "rules":"","Drivers": 30, "Teams": 15, "pictureURL":""},
      {"categoryID":6, "categoryName":"Nascar", "description":"", "rules":"","Drivers": 30, "Teams": 15, "pictureURL":""},
    ],
    "flagType": [
      {"flagTypeID":0, "categoryID": 0, "flagMeaning": "", "pictureURL":""}
    ],
    "season":[
      {"seasonID":0, "categoryID":0, "seasonYear":2020, "scoringSystem":" "}
    ],
    "raceWeekend":[
      {"raceWeekendID":0, "categoryID":0, "raceDate":"", "practiceSessionID":0, "qualifyingID":0, "raceID":0, "circuitID":0, "RaceName":""}
    ],
    "PracticeSession":[
      {"practiceSessionID":0, "sessionDate":"", "sessionTime":"", "resultID":0, "weather":" "}
    ],
    "QualifyingSession":[
      {"qualifyingSessionID":0, "sessionDate":"", "sessionTime":"", "resultID":0, "weather":" "}
    ],
    "Race":[
      {"RaceID":0, "raceDate":"", "racetime":"", "resultID":0, "weather":"", "raceDuration":"", "laps":0, "fastestLaptime":"","fastestLapDriverID":0}
    ],
    "result":[
      {"raceweekendID":0, "driverID":0, "sessionType":"", "position":0, "lapsLead":0}
    ],
    "team":[
      {"teamID":0, "categoryID":0, "TeamName":" ", "baseLocation":" ", "pictureURL":" "}
    ],
    "driver":[
      {"driverID":0, "firstName":" ", "lastName":" ", "driverNumber": "", "DoB":"", "nationality":" ", "penaltyPoints":" ", "pictureURL":""}
    ],
    "drove":[
      {"seasonID":0, "teamID":0, "driverID":0}
    ],
    "circuit":[
      {"circuitID":0, "Country":"", "City":"", "Length":"", "Turns":0, "pictureURL":""}
    ],
    "turns":[
      {"turnID":0, "circuitID":0, "TurnName":""}
    ],
    "vehicle":[
      {"vehicleID":0, "TeamID":0, "Engine":"", "ChassisName":"", "Year":0, "power":"", "weight":0, "pictureURL":""}
    ],
    "pitStops":[
      {"PitstopID":0, "RaceID":0, "DriverID":0, "PitStopTime":"", "Lap":0, "PitTime":"", "Description":""}
    ],
    "Incidents":[
      {"IncidentID":0, "RaceID":0, "IncidentTime":"", "Lap":0, "Description":""}
    ],
    "Involved":[
      {"IncidentID":0, "DriverID":0}
    ]
  };
  

module.exports = Databse;