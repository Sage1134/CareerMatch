const sessionID = getLocalStorageItem("sessionID");
const username = getLocalStorageItem("username")

document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll(".tab");

    tabs.forEach(tab => {
        tab.addEventListener("click", function() {
            const tabName = this.dataset.tab;

            document.querySelectorAll(".contentTab").forEach(tab => {
                tab.style.display = "none";
            });

            document.getElementById(tabName + "Tab").style.display = "block";

            tabs.forEach(tab => tab.classList.remove("active"));
            this.classList.add("active");
        });
    });
});

function addSkill() {
    const newSkillInput = document.getElementById("newSkill");
    const newSkill = newSkillInput.value.trim();

    const data = {
        purpose: "addSkill",
        username: username,
        sessionToken: sessionID,
        skill: newSkill,
      };

    const isLocalConnection = window.location.hostname === "10.0.0.138";
    const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");

    socket.onopen = function (event) {
        socket.send(JSON.stringify(data));
    };

    socket.onmessage = function(event) {
        console.log("a");
        var data = JSON.parse(event.data);
        if (data["purpose"] == "skillAdded") {
            updateSkillList();
        }
        else if (data["purpose"] == "fail") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }

        socket.close(1000, "Closing Connection");

        newSkillInput.value = "";
    };
}


function updateSkillList() {
    console.log("e");
}

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}