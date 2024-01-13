const sessionID = getLocalStorageItem("sessionID");
const username = getLocalStorageItem("username")
const currentJobSkills = [];

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
    document.getElementById("insertSkill").addEventListener("click", insertSkill);
    document.getElementById("matchesTabButton").addEventListener("click", function() {
        const isLocalConnection = window.location.hostname === "10.0.0.138";
        const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");
        
        const data = {
            purpose: "getMatches",
            username: username,
            sessionToken: sessionID,
          };
    
        socket.onopen = function (event) {
            socket.send(JSON.stringify(data));
        };

        socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            if (data["purpose"] == "returningMatches") {
                displayMatches(data);
            }
            else if (data["purpose"] == "fail") {
                alert("Session Invalid Or Expired");
                window.location.href = "../signIn/signIn.html";
            }

            socket.close(1000, "Closing Connection");
        };
        })
});

function displayMatches(data) {
    jobMatchList = document.getElementById("jobMatchList");
    employeeMatchList = document.getElementById("employeeMatchList");

    for (var jobMatch in data["jobMatches"]) {
        var match = document.createElement("div");
        match.classList.add("match");

        var matchSkills = document.createElement("p");
        var matchTitle = document.createElement("p");
        var matchScore = document.createElement("p");
        var accept = document.createElement("button");
        var decline = document.createElement("button");

        matchTitle.classList.add("matchInfo");
        matchScore.classList.add("matchInfo");
        matchSkills.classList.add("matchInfo");
        accept.classList.add("matchButton");
        decline.classList.add("matchButton");

        matchTitle.textContent = jobMatch; 
        matchScore.textContent = "Match Score: " + Math.round(data["jobMatches"][jobMatch]["matchScore"] * 100) + "%";
        matchSkills.textContent = "Required Skills: " + data["jobMatches"][jobMatch]["matchSkills"].join(", ");
        accept.textContent = "Accept";
        decline.textContent = "Decline"

        match.appendChild(matchTitle);
        match.appendChild(matchScore);
        match.appendChild(matchSkills);
        match.appendChild(accept);
        match.appendChild(decline);

        jobMatchList.appendChild(match);
    } 

    for (var employeeMatch in data["employeeMatches"]) {
        var match = document.createElement("div");
        match.classList.add("match");

        var matchSkills = document.createElement("p");
        var matchTitle = document.createElement("p");
        var matchScore = document.createElement("p");
        var accept = document.createElement("button");
        var decline = document.createElement("button");

        matchTitle.classList.add("matchInfo");
        matchScore.classList.add("matchInfo");
        matchSkills.classList.add("matchInfo");
        accept.classList.add("matchButton");
        decline.classList.add("matchButton");

        matchTitle.textContent = employeeMatch; 
        matchScore.textContent = "Match Score: " + Math.round(data["jobMatches"][jobMatch]["matchScore"] * 100) + "%";
        matchSkills.textContent = "Employee Skills: " + data["jobMatches"][jobMatch]["matchSkills"].join(", ");
        accept.textContent = "Accept";
        decline.textContent = "Decline"

        match.appendChild(matchTitle);
        match.appendChild(matchScore);
        match.appendChild(matchSkills);
        match.appendChild(accept);
        match.appendChild(decline);

        jobMatchList.appendChild(match);
    } 
}

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

function insertSkill() {
    const requiredSkillInput = document.getElementById("requiredSkill");
    const skillListContainer = document.getElementById("jobSkillList");
    const newSkill = requiredSkillInput.value.trim();

    if (newSkill !== "" && !currentJobSkills.includes(newSkill)) {
        const skillItem = document.createElement("div");
        skillItem.textContent = newSkill;

        skillListContainer.appendChild(skillItem);
        currentJobSkills.push(newSkill);

        requiredSkillInput.value = "";
    }
    else {
        requiredSkillInput.value = "";
    }
}

function submitJobForm(event) {
    event.preventDefault();

    const jobNameInput = document.getElementById("jobName");
    const descriptionInput = document.getElementById("description");

    const data = {
        purpose: "postJob",
        username: username,
        sessionToken: sessionID,
        jobName: jobNameInput.value,
        description: descriptionInput.value,
        skills: [...currentJobSkills], 
    };

    const isLocalConnection = window.location.hostname === "10.0.0.138";
    const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");

    socket.onopen = function (event) {
        socket.send(JSON.stringify(data));
    };

    socket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data["purpose"] == "jobPosted") {
            updateJobList();
        }
        else if (data["purpose"] == "jobDuplicate") {
            alert("You Have Already Posted A Job Under This Name!");
        }
        else if (data["purpose"] == "invalidJobName") {
            alert("This Job Name Is Invalid!");
        }
        else if (data["purpose"] == "fail") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }

        socket.close(1000, "Closing Connection");

        jobNameInput.value = "";
        descriptionInput.value = "";
        clearJobSkills();
    };
}

function updateJobList() {
    console.log("e");
}

function clearJobSkills() {
    const skillListContainer = document.getElementById("jobSkillList");
    skillListContainer.innerHTML = "";

    currentJobSkills.length = 0;
}

function updateSkillList() {
    console.log("e");
}

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}