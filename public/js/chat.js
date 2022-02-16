let socket = io(); // Making A Connection With Back-End

function scrollToBottom() {
  let messages = document.querySelector("#messages").lastElementChild;
  messages.scrollIntoView();
}

socket.on("connect", () => {
  // After Connection Ss Recognized By Client Side
  console.log("Connected To Server");
  let url_string = window.location.href;
  let url = new URL(url_string);
  let name = url.searchParams.get("name");
  let room = url.searchParams.get("room");
  let params = {
    name: name,
    room: room,
  };

  // console.log(params);
  socket.emit("join", params, (err) => {
    if (err) {
      alert(err);
      window.location.href = "/";
    } else {
      // console.log("There Is NO Error");
    }
  });
});

socket.on("newMessage", (message) => {
  const template = document.querySelector("#message-template").innerHTML;
  const formattedtime = moment(message.createdAt).format("LT");
  const html = Mustache.render(template, {
    from: message.from,
    text: message.text,
    createdAt: formattedtime,
  });
  const div = document.createElement("div");
  div.setAttribute("id", "rep");
  div.innerHTML = html;
  document.querySelector("#messages").appendChild(div);
  scrollToBottom();
});

socket.on("newlocationMessage", (message) => {
  const formattedTime = moment(message.createdAt).format("LT");
  // console.log("newLocationMessage", message);

  const template = document.querySelector(
    "#location-message-template"
  ).innerHTML;
  const html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime,
  });

  const div = document.createElement("div");
  div.innerHTML = html;

  document.querySelector("#messages").appendChild(div);
  scrollToBottom();
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});

socket.on("updateUsersList", (users) => {
  // console.log(users);
  let ol = document.createElement("ol");
  users.forEach((user) => {
    let li = document.createElement("li");
    li.innerHTML = user;
    ol.appendChild(li);
  });

  let users_list = document.querySelector("#users");
  users_list.innerHTML = "";
  users_list.appendChild(ol);
});

// // Acknowledgement
// socket.emit('createMessage', {
//     from: "Divyaansh",
//     text: "Hit Me bro"
// }, function (message) {
//     console.log(message, "Acknowledgement : Server Got The Message")
// })

// To Prevent The Reload Of index.html Page After Clicking The Submit Button
document.querySelector("#submit-btn").addEventListener("click", (e) => {
  e.preventDefault();

  if (document.querySelector('input[name="message"]').value == "") {
    document.querySelector("submit-btn").attr("disabled", true);
  }

  socket.emit(
    "createMessage",
    {
      text: document.querySelector('input[name="message"]').value,
    },
    function () {
      document.querySelector('input[name="message"]').value = ""; // Because Of This The Content In Input Section Gets Cleared After Clicking Send Button
    }
  );
});

document.querySelector("#send-location").addEventListener("click", (e) => {
  if (!navigator.geolocation) {
    // Checking Whether The GeoLocation Feature Is Supported By Your Browser Or Not
    return alert("GeoLocation Feature Is NOT Supported By Your Browser");
  }

  navigator.geolocation.getCurrentPosition(
    function (position) {
      // console.log(position);

      socket.emit("createlocationMessage", {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      });
    },
    function () {
      alert("Sorry !! Unable To Fetch Your Location");
    }
  );
});

document.querySelector("#exit-btn").addEventListener("click", (e) => {
  e.preventDefault();

  socket.emit("createMessage", {}, function () {
    window.location.href = "/";
  });
});
