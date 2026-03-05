let users = []
let map

window.onload = function(){

const user = JSON.parse(localStorage.getItem("currentUser"))

document.getElementById("userName").innerText =
user.first_name + " " + user.last_name


fetch("/users")

.then(res => res.json())

.then(data => {

users = data

loadUsers()

initMap()

})

}


function initMap(){

map = L.map('map').setView([47.98, -122.20], 10)

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
maxZoom:19
}).addTo(map)

users.forEach(user => {

L.marker([user.lat, user.lon])
.addTo(map)
.bindPopup(user.first_name)

})

}


function loadUsers(){

const list = document.getElementById("usersList")

list.innerHTML=""

users.forEach(user=>{

const div = document.createElement("div")

div.className="user-card"

div.innerHTML = `
<strong>${user.first_name} ${user.last_name}</strong><br>
${user.city}
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
<strong>${user.first_name} ${user.last_name}</strong><br>
${user.city}
`

div.onclick = ()=> showProfile(user)

list.appendChild(div)

})

}


function logout(){
localStorage.clear()
window.location.href="index.html"
}