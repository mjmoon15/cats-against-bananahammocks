const express = require("express");
const exphbs = require("express-handlebars");
const path = require("path");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Set Handlebars.

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.use(express.static(path.join("public")));

// View Routes
app.get("/", function (req, res) {
  res.render(__dirname + "/views/index.handlebars");
});

app.get("/pregame", function (req, res) {
  res.render(__dirname + "/views/pregame.handlebars");
});

app.get("/game", function (req, res) {
  res.render(__dirname + "/views/game.handlebars");
});

//Sets up username in array
users = [];
io.on("connection", function (socket) {
  socket.on("setUsername", function (data) {
    console.log("Username: ", data, "Socket ID: ", socket.id);
    //checks new username against existing array
    if (users.indexOf(data) > -1) {
      socket.emit(
        "userExists",
        data + " You found the princess. BWAH! She is in another house."
      );
    } else {
      users.push(data);
      socket.emit("userSet", { username: data });
    }
  });
  //listening for message
  socket.on("msg", function (data) {
    console.log("data received:", data);
    //Send message to everyone
    io.sockets.emit("newmsg", data);
  });
});

http.listen(PORT, function () {
  console.log("listening on port: " + PORT);
});
