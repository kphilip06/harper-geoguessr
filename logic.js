// 1. Modern Firebase Module Imports 
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

//Firebase Credentials
const firebaseConfig = {
    apiKey: "AIzaSyC85EcYAU14PGRY9M617Sjwcu5GGQ67bqU",
    authDomain: "geoguessr-harper.firebaseapp.com",
    projectId: "geoguessr-harper",
    storageBucket: "geoguessr-harper.firebasestorage.app",
    messagingSenderId: "286806833737",
    appId: "1:286806833737:web:ba6c2fd20706177bab5d98",
    measurementId: "G-BS82GV4WN7"
};

//Link Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

let currentLoc = null;
let playerGuess = null;
let guessMarker = null;
let lastLocId = null;
let currentRound = 0;
let maxRounds = 10;
let totalScore = 0;


// Helper function to safely get Firebase when needed
function initFirebaseCheck() {
    if (!firebase) {
        firebase = window.firebase;
    }
    if (firebase && !db) {
        db = firebase.firestore();
    }
}

const myButton = document.getElementById('submit-btn');

// 1. Initialize the Leaflet Map centered on Harper College
const map = L.map('map').setView([42.0785, -88.0725], 16); 
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
}).addTo(map);

// 2. Handle Player Map Clicks
map.on('click', function(mapClickData) {
    playerGuess = mapClickData.latlng;
    
    if (guessMarker) {
        guessMarker.setLatLng(playerGuess);
    } else {
        guessMarker = L.marker(playerGuess).addTo(map);
    }
    myButton.classList.remove('hidden'); 

    if (mapClickData.originalEvent.shiftKey) {
        myButton.classList.add('hidden');
        guessMarker.remove();
        guessMarker = null;
        playerGuess = null;
    }
});

// 3. Load Game Data
function generateImage() {
    fetch('locations.json')
        .then(response => response.json())
        .then(data => {
            if (data.length > 1) {
                let nextLoc;
                do {
                    nextLoc = data[Math.floor(Math.random() * data.length)];
                } while (nextLoc.id === lastLocId);
                currentLoc = nextLoc;
            } else {
                currentLoc = data[0];
            }
            lastLocId = currentLoc.id;
            
            pannellum.viewer('panorama', {
                "type": "equirectangular",
                "panorama": currentLoc.image,
                "autoLoad": true
            });
        });
}

//Save score and register to db
function saveScore(username, totalScore) {
    if (!db) {
        return Promise.reject("Firestore database connection not established.");
    }

    
    return addDoc(collection(db, "leaderboard"), {
        username: username,
        score: parseInt(totalScore),
        timestamp: serverTimestamp() 
    })
    .then((docRef) => {
        console.log("Score successfully registered with ID: ", docRef.id);
    })
    .catch((error) => {
        console.error("Error registering score: ", error);
        throw error;
    });
}

// 4. Calculate Distance (Haversine Formula)
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = lat1 * Math.PI/180;
    const phi2 = lat2 * Math.PI/180;
    const deltaPhi = (lat2-lat1) * Math.PI/180;
    const deltaLambda = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
}

// 6. Reset Game State for Next Round
function resetGame() {
    currentLoc = null;
    playerGuess = null;
    if (guessMarker) {
        guessMarker.remove();
        guessMarker = null;
    }
    myButton.classList.add('hidden');

    map.eachLayer(layer => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline) {
            map.removeLayer(layer);
        }
    });
    
    generateImage();
}

// 5. Submit Button Event Listener
document.getElementById('submit-btn').addEventListener('click', () => {
    const distance = getDistance(playerGuess.lat, playerGuess.lng, currentLoc.lat, currentLoc.lng);
    
    let score = Math.max(0, Math.round(5000 - (distance * 25))); 
    totalScore += score;
    currentRound++;

    L.marker([currentLoc.lat, currentLoc.lng], {color: 'green'}).addTo(map)
        .bindPopup(`<b>Actual Location:</b> ${currentLoc.name}`).openPopup();

    L.polyline([playerGuess, [currentLoc.lat, currentLoc.lng]], {color: 'blue'}).addTo(map);

    setTimeout(() => {
        alert(`You were ${Math.round(distance)} meters away!\nScore: ${score} / 5000 points.`);
        
        if (currentRound >= maxRounds) {
            alert(`🎉 Game Over!\nYou completed all ${maxRounds} rounds.\nFinal Score: ${totalScore} / 50000 points!`);
            const currentUser = auth.currentUser;
            let playerUsername = "Anonymous Hero";

            if(currentUser) {
              playerUsername = currentUser.displayName || currentUser.email.split('@')[0];
            }
            saveScore(playerUsername, totalScore)
                .then(() => {
                    alert("Score successfully saved to the cloud leaderboard!");
                    window.location.href = "index.html"; 
                })
                .catch(err => {
                    alert(`⚠️ Score could not save.\nReason: ${err}\n\nReturning to main menu...`);
                    window.location.href = "index.html"; 
                });
        } else {
            const nextRound = confirm(`Round ${currentRound} of ${maxRounds} Complete!\nReady for the next round?`);
            
            if (nextRound) {
                resetGame();
            } else {
                alert('Thanks for playing! Returning to main menu.');
                window.location.href = "index.html";
            }
        }
    }, 50); 
});

generateImage();
