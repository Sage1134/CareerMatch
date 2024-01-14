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
    
    document.getElementById("messagesTabButton").addEventListener("click", function() {
        const isLocalConnection = window.location.hostname === "10.0.0.138";
        const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");
        
        const data = {
            purpose: "getMessages",
            username: username,
            sessionToken: sessionID,
          };
    
        socket.onopen = function (event) {
            socket.send(JSON.stringify(data));
        };

        socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            if (data["purpose"] == "returningMessages") {
                displayMessages(data);
            }
            else if (data["purpose"] == "fail") {
                alert("Session Invalid Or Expired");
                window.location.href = "../signIn/signIn.html";
            }

            socket.close(1000, "Closing Connection");
        };
    })

    document.getElementById("sendButton").addEventListener("click", function() {
        const isLocalConnection = window.location.hostname === "10.0.0.138";
        const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");
        const data = {
            purpose: "sendMessage",
            username: username,
            sessionToken: sessionID,
            chatName: getLocalStorageItem("currentChat"),
            message: document.getElementById("messageInput").value,
          };
    
        socket.onopen = function (event) {
            socket.send(JSON.stringify(data));
        };

        socket.onmessage = function(event) {
            var data = JSON.parse(event.data);
            if (data["purpose"] == "messageSent") {
                const isLocalConnection = window.location.hostname === "10.0.0.138";
                const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");

                const data = {
                    purpose: "getMessageData",
                    username: username,
                    sessionToken: sessionID,
                    chatID: getLocalStorageItem("currentChat"),
                };
                
                socket.onopen = function (event) {
                    setLocalStorageItem("currentChat",getLocalStorageItem("currentChat"));
                    socket.send(JSON.stringify(data));
                };

                socket.onmessage = function(event) {
                    var data = JSON.parse(event.data);
                    if (data["purpose"] == "returningMessageData") {
                        updateMessages(data);
                    }
                    else if (data["purpose"] == "fail") {
                        alert("Session Invalid Or Expired");
                        window.location.href = "../signIn/signIn.html";
                    }

                    socket.close(1000, "Closing Connection");
                };
            }
            else if (data["purpose"] == "fail") {
                alert("Session Invalid Or Expired");
                window.location.href = "../signIn/signIn.html";
            }

            socket.close(1000, "Closing Connection");
        };
    })
});

function displayMessages(data) {
    messageList = document.getElementById("chats");
    for (var message in data["messages"]) {
        var messageContainer = document.createElement("div");
        messageContainer.classList.add("message");

        var messageButton = document.createElement("button");
        messageButton.classList.add("messageButton");
        messageButton.textContent = message;

        messageContainer.appendChild(messageButton);

        messageList.appendChild(messageContainer);

        messageButton.addEventListener("click", (function () {
            return function () {
                const isLocalConnection = window.location.hostname === "10.0.0.138";
                const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");

                const data = {
                    purpose: "getMessageData",
                    username: username,
                    sessionToken: sessionID,
                    chatID: messageButton.textContent
                };
                
                socket.onopen = function (event) {
                    setLocalStorageItem("currentChat", messageButton.textContent);
                    socket.send(JSON.stringify(data));
                };

                socket.onmessage = function(event) {
                    var data = JSON.parse(event.data);
                    if (data["purpose"] == "returningMessageData") {
                        updateMessages(data);
                    }
                    else if (data["purpose"] == "fail") {
                        alert("Session Invalid Or Expired");
                        window.location.href = "../signIn/signIn.html";
                    }

                    socket.close(1000, "Closing Connection");
                };
            };
        })());
    }
}

function updateMessages(data) {
    const messageBox = document.getElementById("messages");
    while (messageBox.firstChild) {
        messageBox.removeChild(messageBox.firstChild);
    }

    for (var message in data["messages"]) {
        if (data["messages"].hasOwnProperty(message)) {
            var chatMsg = document.createElement("p");
            chatMsg.textContent = data["messages"][message]; 
            messageBox.appendChild(chatMsg);
        }
    }
}

function displayMatches(data) {
    const jobMatchList = document.getElementById("jobMatchList");
    const employeeMatchList = document.getElementById("employeeMatchList");

    while (jobMatchList.firstChild) {
        jobMatchList.removeChild(jobMatchList.firstChild);
    }
    while (employeeMatchList.firstChild) {
        employeeMatchList.removeChild(employeeMatchList.firstChild);
    }

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
        
        accept.addEventListener("click", (function (jobMatch) {
            return function () {
                var chatName = data["jobMatches"][jobMatch]["jobPoster"] + " and " + data["jobMatches"][jobMatch]["jobReciever"] + " | " + data["jobMatches"][jobMatch]["job"];
                const isLocalConnection = window.location.hostname === "10.0.0.138";
                const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134": "ws://99.245.65.253:1134");
                var jobIndex = data["jobMatches"][jobMatch]["jobReciever"] + " | " + data["jobMatches"][jobMatch]["job"]

                const requestData = {
                    purpose: "acceptChat",
                    username: username,
                    sessionToken: sessionID,
                    chatID: chatName,
                    otherClient: data["jobMatches"][jobMatch]["otherClient"],
                    jobPoster: data["jobMatches"][jobMatch]["jobPoster"],
                    jobReciever: data["jobMatches"][jobMatch]["jobReciever"],
                    jobName: jobMatch,
                    jobMatchInfo: jobIndex
                };
                
                socket.onopen = function (event) {
                    socket.send(JSON.stringify(requestData));
                };
        
                socket.onmessage = function (event) {
                    var responseData = JSON.parse(event.data);
                    if (responseData["purpose"] == "chatAccepted") {
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
                    } else if (responseData["purpose"] == "fail") {
                        alert("Session Invalid Or Expired");
                        window.location.href = "../signIn/signIn.html";
                    }
                    socket.close(1000, "Closing Connection");
                };
            };
        })(jobMatch));        

        decline.addEventListener("click", (function (jobMatch) {
            return function() {
                var chatName = data["jobMatches"][jobMatch]["jobPoster"] + " and " + data["jobMatches"][jobMatch]["jobReciever"] + " | " + data["jobMatches"][jobMatch]["job"];
                var jobIndex = data["jobMatches"][jobMatch]["jobPoster"] + " | " + data["jobMatches"][jobMatch]["job"]
                
                const requestData = {
                    purpose: "acceptChat",
                    username: username,
                    sessionToken: sessionID,
                    chatID: chatName,
                    otherClient: data["jobMatches"][jobMatch]["otherClient"],
                    jobPoster: data["jobMatches"][jobMatch]["jobPoster"],
                    jobReciever: data["jobMatches"][jobMatch]["jobReciever"],
                    jobName: jobMatch,
                    jobMatchInfo: jobIndex,
                };
                
                const isLocalConnection = window.location.hostname === "10.0.0.138";
                const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");

                socket.onopen = function (event) {
                    socket.send(JSON.stringify(requestData));
                };
    
                socket.onmessage = function(event) {
                    var data = JSON.parse(event.data);
                    if (data["purpose"] == "chatDeclined") {
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
                    }
                    else if (data["purpose"] == "fail") {
                        alert("Session Invalid Or Expired");
                        window.location.href = "../signIn/signIn.html";
                    }
                    socket.close(1000, "Closing Connection");
                };
            };
        })(jobMatch))

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
        matchScore.textContent = "Match Score: " + Math.round(data["employeeMatches"][employeeMatch]["matchScore"] * 100) + "%";
        matchSkills.textContent = "Employee Skills: " + data["employeeMatches"][employeeMatch]["matchSkills"].join(", ");
        accept.textContent = "Accept";
        decline.textContent = "Decline"

        match.appendChild(matchTitle);
        match.appendChild(matchScore);
        match.appendChild(matchSkills);
        match.appendChild(accept);
        match.appendChild(decline);
        
        accept.addEventListener("click", (function (employeeMatch) {
            return function () {
                var chatName = data["employeeMatches"][employeeMatch]["jobPoster"] + " and " + data["employeeMatches"][employeeMatch]["jobReciever"] + " | " + data["employeeMatches"][employeeMatch]["job"];
                const isLocalConnection = window.location.hostname === "10.0.0.138";
                const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134": "ws://99.245.65.253:1134");

                var jobIndex = data["employeeMatches"][employeeMatch]["jobPoster"] + " | " + data["employeeMatches"][employeeMatch]["job"]
                const requestData = {
                    purpose: "acceptChat",
                    username: username,
                    sessionToken: sessionID,
                    chatID: chatName,
                    otherClient: data["employeeMatches"][employeeMatch]["otherClient"],
                    jobPoster: data["employeeMatches"][employeeMatch]["jobPoster"],
                    jobReciever: data["employeeMatches"][employeeMatch]["jobReciever"],
                    jobName: jobIndex,
                    jobMatchInfo: employeeMatch,
                };

                socket.onopen = function (event) {
                    socket.send(JSON.stringify(requestData));
                };
        
                socket.onmessage = function (event) {
                    var responseData = JSON.parse(event.data);
                    if (responseData["purpose"] == "chatAccepted") {
                        const isLocalConnection = window.location.hostname === "10.0.0.138";
                        const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");
                        
                        const requestData = {
                            purpose: "getMatches",
                            username: username,
                            sessionToken: sessionID,
                          };
                    
                        socket.onopen = function (event) {
                            socket.send(JSON.stringify(requestData));
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

                    } else if (responseData["purpose"] == "fail") {
                        alert("Session Invalid Or Expired");
                        window.location.href = "../signIn/signIn.html";
                    }
                    socket.close(1000, "Closing Connection");
                };
            };  
        })(employeeMatch));

        decline.addEventListener("click", (function (employeeMatch) {
            var chatName = data["employeeMatches"][employeeMatch]["jobPoster"] + " and " + data["employeeMatches"][employeeMatch]["jobReciever"] + " | " + data["employeeMatches"][employeeMatch]["job"];
            var jobIndex = data["employeeMatches"][employeeMatch]["jobPoster"] + " | " + data["employeeMatches"][employeeMatch]["job"]
        
            const requestData = {
                purpose: "acceptChat",
                username: username,
                sessionToken: sessionID,
                chatID: chatName,
                otherClient: data["employeeMatches"][employeeMatch]["otherClient"],
                jobPoster: data["employeeMatches"][employeeMatch]["jobPoster"],
                jobReciever: data["employeeMatches"][employeeMatch]["jobReciever"],
                jobMatchInfo: jobIndex,
            };
        
            const isLocalConnection = window.location.hostname === "10.0.0.138";
            const socket = new WebSocket(isLocalConnection ? "ws://10.0.0.138:1134" : "ws://99.245.65.253:1134");
        
            socket.onopen = function (event) {
                socket.send(JSON.stringify(requestData));
            };
        
            socket.onmessage = function (event) {
                var data = JSON.parse(event.data);
                if (data["purpose"] == "chatDeclined") {
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
                        } else if (data["purpose"] == "fail") {
                            alert("Session Invalid Or Expired");
                            window.location.href = "../signIn/signIn.html";
                        }
        
                        socket.close(1000, "Closing Connection");
                    };
                } else if (data["purpose"] == "fail") {
                    alert("Session Invalid Or Expired");
                    window.location.href = "../signIn/signIn.html";
                }
                socket.close(1000, "Closing Connection");
            };
        })(employeeMatch));
        
        employeeMatchList.appendChild(match);
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
    const data = {
        purpose: "getJobList",
        username: username,
        sessionToken: sessionID,
      };

    socket.onopen = function (event) {
        socket.send(JSON.stringify(data));
    };

    socket.onmessage = function(event) {
        var data = JSON.parse(event.data);
        if (data["purpose"] == "returningJobList") {
            const jobList = document.getElementById("jobList");
    
            while (jobList.firstChild) {
                jobList.removeChild(jobList.firstChild)
            }

            for (var job in jobList) {
                console.log(job);
            }
        }
        else if (data["purpose"] == "fail") {
            alert("Session Invalid Or Expired");
            window.location.href = "../signIn/signIn.html";
        }

        socket.close(1000, "Closing Connection");
    };
}

function clearJobSkills() {
    const skillListContainer = document.getElementById("jobSkillList");
    skillListContainer.innerHTML = "";

    currentJobSkills.length = 0;
}

function updateSkillList() {
    console.log("e");
}

function setLocalStorageItem(key, value) {
    localStorage.setItem(key, value);
}

function getLocalStorageItem(key) {
    return localStorage.getItem(key);
}