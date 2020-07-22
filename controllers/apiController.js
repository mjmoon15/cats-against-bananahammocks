const express = require("express");
const router = express.Router();
const db = require("../models");

router.get("/api/getgame/:roomid", async (req, res) => {
  try {
    // Gets room data from rooms table
    const roomObj = await db.Rooms.findOne({
      where: {
        id: req.params.roomid,
      },
    });

    // Gets rounds data from rounds table
    const roundsArr = await db.Rounds.findAll({
      where: {
        room_id: req.params.roomid,
      },
    });

    // Gets players data from players table
    const playersArr = await db.Players.findAll({
      where: {
        room_id: req.params.roomid,
      },
    });

    let masterObj = constructMasterObj(roomObj, roundsArr, playersArr);
    
    for (i = 0; i < masterObj.playerCount; i++) {
      // const player = masterObj.players[i];

      const playerCards = await db.Hands.findAll({
        where: {
          player_id: playersArr[i].id
        }
      });

      const handCards = playerCards.map((card) => card.answer_card_id);
      if (masterObj.players && masterObj.players[i]) {
        masterObj.players[i].currentHandCardIds = handCards;    
      }
    };

    const roundAnswerCards = await db.RoundAnswerCards.findAll({
      where: {
        round_id: masterObj.currentRound.id
      }
    });
    masterObj.currentRound.submittedAnswers = roundAnswerCards;

    if (masterObj.currentRound.submittedAnswers.length === masterObj.playerCount - 1 && masterObj.currentRound.status === 1) {
      masterObj.currentRound.status = 2;
    }

    if (masterObj.currentRound.status === 2 && masterObj.currentRound.winnerId !== null) {
      masterObj.currentRound.status = 3;
    }
  
    // Returns JSON onject containing all data
    res.json(masterObj);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      error: true,
      data: null,
      message: "Unable to retrieve players.",
    });
  }
});

const constructMasterObj = (roomObj, roundsArr, playersArr) => {
  const masterObj = {};

  const masterPlayers = playersArr.map((player) => {
    return {
      id: player.id,
      name: player.name,
      socketId: player.socket_id,
      points: player.points,
      currentHandCardIds: []
    }
  });

  let highestId = 0;
  let currentRoundObj = {};

  roundsArr.forEach((round) => {
    if(round.game_round > highestId) {
      highestId = round.game_round;
      currentRoundObj = round;
    }
  });

  const masterCurrentRound = {
    id: currentRoundObj.id,
    roundNumber: currentRoundObj.game_round,
    status: currentRoundObj.current_status,
    judgeId: currentRoundObj.judge_id,
    questionCardId: currentRoundObj.question_card_id,
    submittedAnswers: [],
    winnerId: currentRoundObj.winner_id
  }; 

  masterObj.id = roomObj.id;
  masterObj.hostId = roomObj.host_id;
  masterObj.playerCount = roomObj.player_count;
  masterObj.players = masterPlayers;
  masterObj.currentRound = masterCurrentRound;

  return masterObj;
};

module.exports = router;
