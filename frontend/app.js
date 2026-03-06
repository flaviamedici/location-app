let users = []
let map
let currentLat
let currentLon

window.onload = function(){

const user = JSON.parse(localStorage.getItem("currentUser"))

document.getElementById("userName").innerText =
user.first_name + " " + user.last_name


// Get real GPS location
navigator.geolocation.getCurrentPosition(position => {

currentLat = position.coords.latitude
currentLon = position.coords.longitude


// Send location to backend
fetch("http://127.0.0.1:5000/users-nearby", {

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

})

}


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


function logout(){
localStorage.clear()
window.location.href="index.html"
}