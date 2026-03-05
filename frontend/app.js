const API = "http://127.0.0.1:8000"

async function login(){

const email = document.getElementById("email").value

const res = await fetch(`${API}/login?email=${email}`,{
method:"POST"
})

const data = await res.json()

localStorage.setItem("user_id",data.user_id)

window.location="dashboard.html"
}

async function signup(){

navigator.geolocation.getCurrentPosition(async(pos)=>{

const lat = pos.coords.latitude
const lon = pos.coords.longitude

const interests =
document.getElementById("interests")
.value.split(",")

const user = {
first_name:document.getElementById("first_name").value,
last_name:document.getElementById("last_name").value,
email:document.getElementById("email").value,
age:parseInt(document.getElementById("age").value),
gender:document.getElementById("gender").value,
bio:document.getElementById("bio").value,
interests:interests,
latitude:lat,
longitude:lon
}

await fetch(`${API}/signup`,{
method:"POST",
headers:{'Content-Type':'application/json'},
body:JSON.stringify(user)
})

window.location="index.html"

})

}

async function loadDashboard(){

if(!document.getElementById("map")) return

navigator.geolocation.getCurrentPosition(async(pos)=>{

const lat = pos.coords.latitude
const lon = pos.coords.longitude

const res = await fetch(`${API}/nearby-users?lat=${lat}&lon=${lon}`)

const users = await res.json()

const list = document.getElementById("users")

users.forEach(u=>{

const div=document.createElement("div")
div.className="user-card"

div.innerHTML=`
<span>${u.name} (${u.age})</span>
<a class="link" href="profile.html?id=${u.id}">View</a>
`

list.appendChild(div)

})

const map = L.map('map').setView([lat,lon],13)

L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
).addTo(map)

L.marker([lat,lon]).addTo(map).bindPopup("You")

users.forEach(u=>{

L.marker([u.latitude,u.longitude])
.addTo(map)
.bindPopup(`<b>${u.name}</b>`)

})

})

}

async function loadProfile(){

const params=new URLSearchParams(window.location.search)
const id=params.get("id")

if(!id) return

const res=await fetch(`${API}/profile/${id}`)

const u=await res.json()

document.getElementById("name").innerText=
u.first_name+" "+u.last_name

document.getElementById("bio").innerText=u.bio
document.getElementById("age").innerText=u.age
document.getElementById("gender").innerText=u.gender

const interestDiv=document.getElementById("interests")

u.interests.forEach(i=>{

const span=document.createElement("span")
span.className="tag"
span.innerText=i

interestDiv.appendChild(span)

})

}

function logout(){

localStorage.clear()

window.location="index.html"

}

loadDashboard()
loadProfile()