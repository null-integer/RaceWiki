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


}

module.exports = Databse;