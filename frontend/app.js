function signup() {
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;

    fetch("http://localhost:8000/signup", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        username: document.getElementById("username").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        lat: lat,
        lon: lon
      })
    })
    .then(res => res.json())
    .then(data => alert("User Created!"));
  });
}

function loadNearby(userId) {
  fetch(`http://localhost:8000/nearby?user_id=${userId}`)
    .then(res => res.json())
    .then(users => {
      const list = document.getElementById("users");
      users.forEach(u => {
        const li = document.createElement("li");
        li.innerText = u.username;
        list.appendChild(li);
      });
    });
}

