const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const db = require('./models');
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set Handlebars.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(express.static(path.join("public")));

const viewRoutes = require("./controllers/viewsController.js");
app.use(viewRoutes);

const apiRoutes = require("./controllers/apiController.js");
app.use(apiRoutes);

//Sets up username in array
users = [];

messages = [];

io.on("connection", (socket) => {

  socket.on("setUsername", (data) => {
    console.log("Username: ", data, "Socket ID: ", socket.id);

    //checks new username against existing array
    if (users.indexOf(data) > -1) {
      socket.emit(
        "userExists",
        `Another "${data}" is already registered.\nThere can be only one.`
      );
    } else {
      users.push(data);
      socket.emit("userSet", { username: data });
    }
  });

  //listening for message
  socket.on("msg", (data) => {
    messages.push(data);
    //Send message to everyone
    io.sockets.emit("newmsg", messages);
  });

  socket.on("arrival", () => {
    io.sockets.emit("userList", users);
  });

  socket.on("startGameClick", () => {
    io.sockets.emit("startGame", users);
  });

  socket.on("roomCreated", (id) => {
    io.sockets.emit("confirmRoomCreated", id);
  });

  socket.on("advanceStatus", () => {
    io.sockets.emit("getNewGameObj", users);
  });

  socket.on("getChats", () => {
    io.sockets.emit("newmsg", messages);
  });

//   // LEAVING THIS TO ADD IN FUNCTIONALITY LATER
//   // socket.on("playerLeft", (playerLeaving) => {
//   //   users = users.filter((userName) => userName !== playerLeaving);
//   //   io.sockets.emit("userList", users);
//   // });
});

require("./controllers/roomsController.js")(app);
require("./controllers/questionCardsController.js")(app);
require("./controllers/answerCardsController.js")(app);
require("./controllers/playersController.js")(app);
require("./controllers/roundsController.js")(app);
require("./controllers/roundAnswerCardsController.js")(app);
require("./controllers/handController.js")(app);
require("./controllers/roundsController.js")(app);

db.sequelize
  .sync()
  .then(function () {
    console.log("connect");
    http.listen(PORT, () => {
      console.log("listening on port: " + PORT);
    });
  })
  .catch((err) => {
    console.log(err);
  });
