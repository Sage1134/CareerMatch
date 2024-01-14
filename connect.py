from pymongo import MongoClient
from dotenv import load_dotenv
import websockets
import os
import asyncio
import json
import hashlib
import uuid
from gensim.models import Word2Vec

matchModel = Word2Vec.load("matchModel/matchModel.model")

sessionTokens = dict()

async def addSessionToken(username, token):
    sessionTokens[username] = token

    async def expireToken():
        await asyncio.sleep(86400)
        if username in sessionTokens.keys() and sessionTokens[username] == token:
            del sessionTokens[username]

    asyncio.create_task(expireToken())


load_dotenv("Vars.env")
uri = os.environ.get("MONGODB_URI")

client = MongoClient(uri)
database = client["Connect"]
collection = database["ConnectData"]

def getData(path):
    data = collection.find()

    for document in data:
        if document["_id"] == path[0]:
            data = document
            break
    else:
        return None

    for key in path:
        if key in data.keys():
            data = data[key]
        else:
            return None
        
    return data

def setData(path, data):
    newData = collection.find_one({"_id":path[0]})
    if newData != None:
        newData = dict(newData)
        dataUpdate = newData
        
        for key in enumerate(path):
            if key[0] != len(path) - 1:
                if key[1] in dataUpdate.keys():
                    if isinstance(dataUpdate[key[1]], dict):
                        dataUpdate = dataUpdate[key[1]]
                    else:
                        dataUpdate[key[1]] = {}
                        dataUpdate = dataUpdate[key[1]]
                else:
                    dataUpdate[key[1]] = {}
                    dataUpdate = dataUpdate[key[1]]
        dataUpdate[path[-1]] = data
        collection.find_one_and_replace({"_id":path[0]}, newData)

    else:
        newData = {}
        dataUpdate = newData
        
        for key in enumerate(path):
            dataUpdate[key[1]] = {}
            if (key[0] != len(path) - 1):
                dataUpdate = dataUpdate[key[1]]
        dataUpdate[path[-1]] = data

        newData["_id"] = path[0]
        collection.insert_one(newData)

def delData(path):
    data = collection.find()

    target = path.pop()

    for document in data:
        if len(path) != 0:
            if document["_id"] == path[0]:
                doc = document
                data = doc
                for key in path:
                    if key in data.keys():
                        data = data[key]
                if target in data.keys():
                    del data[target]
                
                collection.find_one_and_replace({"_id":path[0]}, doc)
                break
        else:
            collection.delete_one({"_id":target})

connectedClients = set()
ip = os.environ.get("ServerIP")
port = os.environ.get("Port")

async def newClientConnected(client_socket):
    try:
        connectedClients.add(client_socket)
        data = await client_socket.recv()
        data = json.loads(data)
        
        if data["purpose"] == "registration":
            await register(client_socket, data)
        elif data["purpose"] == "signIn":
            await signIn(client_socket, data)
        elif data["purpose"] == "addSkill":
            await addSkill(client_socket, data)
        elif data["purpose"] == "postJob":
            await postJob(client_socket, data)
        elif data["purpose"] == "getMatches":
            await getMatches(client_socket, data)
        elif data["purpose"] == "acceptChat":
            await acceptChat(client_socket, data)
        elif data["purpose"] == "declineChat":
            await declineChat(client_socket, data)
        elif data["purpose"] == "getMessages":
            await getMessages(client_socket, data)
        elif data["purpose"] == "getMessageData":
            await getMessageData(client_socket, data)
        elif data["purpose"] == "sendMessage":
            await sendMessage(client_socket, data)
        elif data["purpose"] == "getJobList":
            await getJobList(client_socket, data)
        elif data["purpose"] == "getSkillList":
            await getSkillList(client_socket, data)
        elif data["purpose"] == "signOut":
            await signOut(client_socket, data)
    except:
        pass

async def register(client_socket, data):
    try:
        username = data["username"]
        password = data["password"]

        if getData(["Credentials", username]) == None:
            hash_object = hashlib.sha256()
            hash_object.update(password.encode())
            hashed_password = hash_object.hexdigest()
            setData(["Credentials", username, "password"], hashed_password)
            
            data = {"purpose": "registerResult",
                    "result": "Registration Successful! Please Sign In."}
        else:
            data = {"purpose": "registerResult",
                    "result": "Username Already Taken!"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def signIn(client_socket, data):
    try:
        username = data["username"]
        password = data["password"]

        hash_object = hashlib.sha256()
        hash_object.update(password.encode())
        hashed_password = hash_object.hexdigest()
        
        if getData(["Credentials", username, "password"]) == hashed_password:
            sessionToken = str(uuid.uuid4())
            await addSessionToken(username, sessionToken)
            data = {"purpose": "success",
                "sessionToken": sessionToken,
                "redirect": "../dashboard/dashboard.html"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def addSkill(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                currentSkills = getData(["profileSkills", username])
                if currentSkills == None:
                    currentSkills = []
                skill = data["skill"].strip()
                if len(skill) >= 1:
                    if skill not in currentSkills:
                        currentSkills.append(skill)
                        setData(["profileSkills", username], currentSkills)
                data = {"purpose": "skillAdded"}
                determineJobs(username, currentSkills)
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def postJob(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                currentJobs = getData(["postedJobs", username])
                jobName = data["jobName"].strip()
                if currentJobs == None:
                    currentJobs = {}
                job = {"description": data["description"],
                        "skills": data["skills"]}
                if len(jobName) >= 1:
                    if jobName not in currentJobs.keys():
                        currentJobs[jobName] = job
                        setData(["postedJobs", username], currentJobs)
                        data = {"purpose": "jobPosted"}
                        determineEmployees(username, jobName, job["skills"])
                    else:
                        data = {"purpose": "jobDuplicate"}
                else:
                    data = {"purpose": "invalidJobName"}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def getMatches(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                jobMatches = getData(["jobMatches", username])
                employeeMatches = getData(["employeeMatches", username])
                data = {"purpose": "returningMatches",
                        "jobMatches": jobMatches,
                        "employeeMatches": employeeMatches}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def getMessages(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                messages = getData(["chats", username])
                if messages == None:
                    messages = {}
                data = {"purpose": "returningMessages",
                        "messages": messages}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def getJobList(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                jobs = getData(["postedJobs", username])
                if jobs == None:
                    jobs = {}
                data = {"purpose": "returningJobs",
                        "jobs": jobs}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def getSkillList(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                skills = getData(["profileSkills", username])
                if skills == None:
                    skills = []
                data = {"purpose": "returningSkills",
                        "skills": skills}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def getMessageData(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        chatID = data["chatID"]
        
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                messages = getData(["chats", username, chatID, "messages"])
                if messages == None:
                    messages = []
                data = {"purpose": "returningMessageData",
                        "messages": messages}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def acceptChat(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        chatName = data["chatID"]
        otherClient = data["otherClient"]
        jobName = data["jobName"]
        jobPoster = data["jobPoster"]
        jobReciever = data["jobReciever"]
        jobIndex = data["jobMatchInfo"]
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                chatStatus = getData(["chats", otherClient, chatName, "accepted"])
                yourChatStatus = getData(["chats", username, chatName, "accepted"])
                if yourChatStatus == None:
                    if chatStatus == True:
                        delData(["chats", otherClient, chatName, "accepted"])
                        setData(["chats", username, chatName, "messages"], [])
                        setData(["chats", otherClient, chatName, "messages"], [])
                        delData(["jobMatches", jobReciever, jobName])
                        delData(["employeeMatches", jobPoster, jobIndex])
                        data = {"purpose": "chatAccepted"}
                    else:
                        setData(["chats", username, chatName, "accepted"], True)
                else:
                    data = {"purpose": "chatAccepted"}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def declineChat(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        chatName = data["chatID"]
        otherClient = data["otherClient"]
        jobName = data["jobName"]
        jobPoster = data["jobPoster"]
        jobReciever = data["jobReciever"]
        jobIndex = data["jobMatchInfo"]
        
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                yourChatStatus = getData(["chats", username, chatName, "accepted"])
                if yourChatStatus == None:
                    setData(["chats", username, chatName, "accepted"], False)
                    delData(["chats", otherClient, chatName, "accepted"])
                    delData(["jobMatches", jobReciever, jobIndex])
                    delData(["employeeMatches", jobPoster, jobName])
                    data = {"purpose": "chatDeclined"}
                else:
                    data = {"purpose": "chatDeclined"}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def sendMessage(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]
        chatID = data["chatName"]
        message = data["message"]
        
        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                messages = getData(["chats", username, chatID, "messages"])
                if messages == None:
                    messages = []
                messages.append(message)
                
                names = chatID.split(" | ")[0]
                names = names.split(" and ")
                
                setData(["chats", names[0], chatID, "messages"], messages)
                setData(["chats", names[1], chatID, "messages"], messages)
                
                data = {"purpose": "messageSent"}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)

async def signOut(client_socket, data):
    try:
        sessionID = data["sessionToken"]
        username = data["username"]

        if username in sessionTokens.keys():
            if sessionTokens[username] == sessionID:
                del sessionTokens[username]
                data = {"purpose": "signOutSuccess"}
            else:
                data = {"purpose": "fail"}
        else:
            data = {"purpose": "fail"}
        await client_socket.send(json.dumps(data))
    except:
        pass
    finally:
        connectedClients.remove(client_socket)


def determineEmployees(username, job, skills):
    matches = getData(["employeeMatches", username])
    if matches is None:
        matches = {}

    profiles = getData(["profileSkills"])
    if username in profiles:
        del profiles[username]

    for employee_username, profileSkills in profiles.items():
        score = calculateMatchScore(skills, profileSkills)
        if score >= 0.6:
            data = {
                "job": job,
                "jobPoster": username,
                "jobReciever": employee_username,
                "matchScore": score,
                "matchSkills": profileSkills,
                "otherClient": employee_username
            }
            matches[employee_username + " | " + job] = data

            employeeMatches = getData(["jobMatches", employee_username])
            if employeeMatches is None:
                employeeMatches = {}
            job_match_data = {
                "job": job,
                "jobPoster": username,
                "jobReciever": employee_username,
                "matchScore": score,
                "matchSkills": skills,
                "otherClient": username
            }
            employeeMatches[username + " | " + job] = job_match_data
            setData(["jobMatches", employee_username], employeeMatches)

    setData(["employeeMatches", username], matches)
               
def determineJobs(username, skills):
    matches = getData(["jobMatches", username])
    if matches is None:
        matches = {}

    jobs = getData(["postedJobs"])
    if username in jobs:
        del jobs[username]

    for poster_username, posted_jobs in jobs.items():
        for job_name, job_data in posted_jobs.items():
            jobSkills = job_data.get("skills", [])
            score = calculateMatchScore(skills, jobSkills)
            if score >= 0.6:
                data = {
                    "job": job_name,
                    "jobPoster": poster_username,
                    "jobReciever": username,
                    "matchScore": score,
                    "matchSkills": jobSkills,
                    "otherClient": username
                }
                matches[poster_username + " | " + job_name] = data

                jobMatches = getData(["employeeMatches", poster_username])
                if jobMatches is None:
                    jobMatches = {}
                employee_match_data = {
                    "job": job_name,
                    "jobPoster": poster_username,
                    "jobReciever": username,
                    "matchScore": score,
                    "matchSkills": skills,
                    "otherClient": poster_username
                }
                jobMatches[username + " | " + job_name] = employee_match_data
                setData(["employeeMatches", poster_username], jobMatches)

    setData(["jobMatches", username], matches)
    
def determineSimilarity(w1, w2):
    try:
        return matchModel.wv.similarity(w1=w1, w2=w2)
    except:
        return 0.25

def calculateMatchScore(partyA, partyB):
    matchScores = []
    for i in partyA:
        currentTermScores = []
        for j in partyB:
            currentTermScores.append(determineSimilarity(i, j))
        if len(currentTermScores) > 0:
            matchScores.append(max(currentTermScores))
    if len(matchScores) == 0:
        return 0
    return min((sum(matchScores) / len(matchScores)) * 1.15, 1)

ip, port = "10.0.0.138", 1134
async def startServer():
    print("Server Started")
    await websockets.serve(newClientConnected, ip, port)
    
event_loop = asyncio.get_event_loop()
event_loop.run_until_complete(startServer())
event_loop.run_forever()