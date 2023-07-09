const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

let db = null;
let dbPath = path.join(__dirname, "cricketMatchDetails.db");
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

convertPascalToCamel = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
    score: dbObject.score,
    fours: dbObject.fours,
    sixes: dbObject.sixes,
  };
};
// API 1 all players
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPascalToCamel(eachPlayer))
  );
});

//API 2 get player
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerId = `SELECT * FROM player_details WHERE player_id=${playerId}`;
  const player = await db.get(getPlayerId);
  response.send(convertPascalToCamel(player));
});

//API 3 update player name
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `UPDATE player_details SET player_name='${playerName}'
    WHERE player_id=${playerId}`;
  const player = await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//API 4 specific match id
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const matchQuery = `SELECT * FROM match_details WHERE match_id=${matchId}`;
  const match = await db.get(matchQuery);
  response.send(convertPascalToCamel(match));
});
//API 5 all matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `SELECT match_id,year,
  match FROM player_match_score NATURAL JOIN
  match_details WHERE player_id=
  ${playerId} `;
  const playerMatchesArray = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatchesArray.map((eachMatch) => convertPascalToCamel(eachMatch))
  );
});

//API 6 list of players of a specific match
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const matchPlayersQuery = `SELECT player_id,player_name FROM player_match_score 
    NATURAL JOIN player_details WHERE match_id=${matchId}`;
  const matchPlayersArray = await db.all(matchPlayersQuery);
  response.send(
    matchPlayersArray.map((eachPlayer) => convertPascalToCamel(eachPlayer))
  );
});

//get stats of a specific player
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `SELECT player_name AS playerName
  ,player_id AS playerId,SUM(score) AS totalScore,
   SUM(fours) AS totalFours,SUM(sixes) AS totalSixes FROM player_details
   NATURAL JOIN player_match_score WHERE player_id=${playerId}`;
  const playerStats = await db.get(getPlayerStatsQuery);
  response.send(playerStats);
});

module.exports = app;
