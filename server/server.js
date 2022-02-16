const express = require("express");
const path = require("path");
const http = require("http");
const socketIO = require("socket.io");
const {
  generateMessage,
  generatelocationMessage,
} = require("./utilities/message");
const { isRealString } = require("./utilities/isRealString");
const { Users } = require("./utilities/users");

// console.log(path.join(__dirname+"/../public"));
let app = express();
let server = http.createServer(app);
let io = socketIO(server); // Gives Us The Access To The Socket.io Library
const port = process.env.PORT || 3000;
app.use(express.static(path.join(__dirname + "/../public"))); // To Serve Public Folder
let users = new Users();

io.on("connection", (socket) => {
  // Listening To The In-Built Event Connection
  // console.log("A New User Connected");

  socket.on("createMessage", (message, callback) => {
    // console.log("createMessage : ", message)
    // console.log(message);
    if (!message.text) {
      callback();
    } else {
      let user = users.getUser(socket.id);
      if (user && isRealString(message.text))
        io.to(user.room).emit(
          "newMessage",
          generateMessage(user.name, message.text)
        );
      callback();
    }
  });

  socket.on("createlocationMessage", (chords) => {
    let user = users.getUser(socket.id);
    if (user)
      io.to(user.room).emit(
        "newlocationMessage",
        generatelocationMessage(user.name, chords.lat, chords.lng)
      );
  });

  socket.on("join", (params, callback) => {
    if (!isRealString(params.name) || !isRealString(params.room))
      return callback("Please Enter The Details Properly");
    // console.log(socket.id);
    socket.join(params.room);
    users.removeUser(socket.id); // If A User Is Already In Another Chat Room Then That User Will Be Kicked Out Of The Other Rooms
    users.addUser(socket.id, params.name, params.room);

    io.to(params.room).emit("updateUsersList", users.getUserList(params.room));
    socket.emit(
      "newMessage",
      generateMessage("Admin", "Welcome To Chat Room " + params.room + " !!")
    );

    socket.broadcast
      .to(params.room)
      .emit(
        "newMessage",
        generateMessage(
          "Admin",
          params.name + " Has Joined Chat Room " + params.room
        )
      );

    callback();
  });

  socket.on("disconnect", () => {
    let user = users.removeUser(socket.id);

    if (user) {
      io.to(user.room).emit("updateUsersList", users.getUserList(user.room));
      io.to(user.room).emit(
        "newMessage",
        generateMessage("Admin", user.name + " Has Left Chat Room " + user.room)
      );
    }
    // console.log("User Was Disconnected");
  });
});

server.listen(port, () => {
  console.log("Server Connected To " + port);
});
