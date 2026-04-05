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
    document.getElementById("manualLat").value = 47.6062
    document.getElementById("manualLon").value = -122.3321
})

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
    const lat = parseFloat(document.getElementById("manualLat").value)
    const lon = parseFloat(document.getElementById("manualLon").value)

    if (isNaN(lat) || isNaN(lon)) {
        alert("Please enter valid latitude and longitude")
        return
    }

    currentLat = lat
    currentLon = lon

    fetchNearbyUsers()
}

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