function register(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirm").value;

    const data = {
        purpose: "registeration",
        username: username,
        password: password,
      };

    if (password === confirm) {
        const isLocalConnection = window.location.hostname === '10.0.0.138';
        const socket = new WebSocket(isLocalConnection ? 'ws://10.0.0.138:1134' : 'ws://99.245.65.253:1134');

        socket.onopen = function (event) {
            socket.send(data)
        };

        socket.onmessage = function(event) {
            alert(event.data)
            socket.close(1000, "Closing Connection");
        };

        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("confirm").value = "";
    }
    else {
        alert("Passwords do not match!")
    }
}