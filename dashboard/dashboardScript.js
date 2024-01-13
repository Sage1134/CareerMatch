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