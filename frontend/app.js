let users = []
let map
let currentLat
let currentLon
let socket

window.onload = function(){

const user = JSON.parse(localStorage.getItem("currentUser"))

document.getElementById("userName").innerText =
user.first_name + " " + user.last_name

// Start chat connection
initChat()


// Get real GPS location
navigator.geolocation.getCurrentPosition(position => {

currentLat = position.coords.latitude
currentLon = position.coords.longitude

fetchNearbyUsers()

}, error => {
    console.log("Geolocation failed:", error)
    document.getElementById("locationInput").style.display = "block"
    document.getElementById("manualCity").value = "Seattle, WA"
})
}

const cityCoordinates = {
    "seattle": { lat: 47.6062, lon: -122.3321 },
    "bellevue": { lat: 47.6101, lon: -122.2015 },
    "redmond": { lat: 47.673988, lon: -122.121513 },
    "kirkland": { lat: 47.6769, lon: -122.2060 },
    "bothell": { lat: 47.7617, lon: -122.2054 },
    "woodinville": { lat: 47.7545, lon: -122.1734 },
    "everett": { lat: 47.978984, lon: -122.202079 },
    "marysville": { lat: 48.0513, lon: -122.1770 }
}

function fetchNearbyUsers() {
    // Send location to backend
    fetch("/users-nearby", {

    method: "POST",

    headers: {
    "Content-Type": "application/json"
    },

    body: JSON.stringify({
    lat: currentLat,
    lon: currentLon
    })

    })

    .then(res => res.json())

    .then(data => {

    users = data

    loadUsers()

    initMap()

    })
    .catch(err => {
        console.error("Error fetching users:", err)
    })
}

function searchManualLocation() {
    const cityInput = document.getElementById("manualCity").value.trim().toLowerCase()
    const cityKey = cityInput.split(",")[0].trim()

    if (!cityKey || !cityCoordinates[cityKey]) {
        alert(
            "Please enter a supported city and state, for example: Seattle, WA or Bellevue, WA."
        )
        return
    }

    currentLat = cityCoordinates[cityKey].lat
    currentLon = cityCoordinates[cityKey].lon

    fetchNearbyUsers()
}


/////////////////////////
// CHAT SYSTEM
/////////////////////////

function initChat(){

socket = new WebSocket("ws://" + window.location.host + "/ws/chat")

socket.onmessage = function(event){

const msgBox = document.getElementById("messages")

if(!msgBox) return

const div = document.createElement("div")

div.className="chat-message"

div.innerText = event.data

msgBox.appendChild(div)

msgBox.scrollTop = msgBox.scrollHeight

}

}


function sendMessage(){

const input = document.getElementById("messageInput")

if(!input || input.value.trim()==="") return

const user = JSON.parse(localStorage.getItem("currentUser"))

const message = user.first_name + ": " + input.value

socket.send(message)

input.value=""

}

function toggleChat() {
    console.log("toggleChat called")
    const chatContent = document.getElementById("chatContent")
    const toggleBtn = document.getElementById("chatToggleBtn")
    
    console.log("chatContent:", chatContent)
    console.log("toggleBtn:", toggleBtn)
    
    if (chatContent.classList.contains("minimized")) {
        chatContent.classList.remove("minimized")
        toggleBtn.textContent = "−"
        console.log("expanded")
    } else {
        chatContent.classList.add("minimized")
        toggleBtn.textContent = "+"
        console.log("minimized")
    }
}


/////////////////////////
// MAP
/////////////////////////

function initMap(){

map = L.map('map').setView([currentLat, currentLon], 12)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map)


// Marker for current user
L.marker([currentLat, currentLon])
.addTo(map)
.bindPopup("You are here")


// Markers for nearby users
users.forEach(user => {

L.marker([user.lat, user.lon])
.addTo(map)
.bindPopup(user.first_name + " (" + user.distance + " miles)")

})

}


/////////////////////////
// USER LIST
/////////////////////////

function loadUsers(){

const list = document.getElementById("usersList")

list.innerHTML=""

users.forEach(user=>{

const div = document.createElement("div")

div.className="user-card"

div.innerHTML = `

<img src="${user.photo}" class="avatar">

<div class="user-info">
<strong>${user.first_name} ${user.last_name}</strong>
<p>${user.age} • ${user.distance} miles away</p>
<p>${user.city}</p>
</div>

`

div.onclick = ()=> showProfile(user)

list.appendChild(div)

})

}


/////////////////////////
// PROFILE VIEW
/////////////////////////

function showProfile(user){

document.getElementById("profileName").innerText =
user.first_name + " " + user.last_name

document.getElementById("profileAge").innerText = user.age
document.getElementById("profileGender").innerText = user.gender
document.getElementById("profileCity").innerText = user.city
document.getElementById("profileInterests").innerText =
user.interests.join(", ")

document.getElementById("profileModal").style.display="block"

}


function closeModal(){
document.getElementById("profileModal").style.display="none"
}


/////////////////////////
// FILTER USERS
/////////////////////////

function filterUsers(){

const text =
document.getElementById("filterInput").value.toLowerCase()

const filtered = users.filter(u =>
u.interests.join(",").toLowerCase().includes(text)
)

const list = document.getElementById("usersList")

list.innerHTML=""

filtered.forEach(user=>{

const div = document.createElement("div")

div.className="user-card"

div.innerHTML = `

<img src="${user.photo}" class="avatar">

<div class="user-info">
<strong>${user.first_name} ${user.last_name}</strong>
<p>${user.age} • ${user.distance} miles away</p>
<p>${user.city}</p>
</div>

`

div.onclick = ()=> showProfile(user)

list.appendChild(div)

})

}


/////////////////////////
// LOGOUT
/////////////////////////

function logout(){

localStorage.clear()

window.location.href="index.html"

}