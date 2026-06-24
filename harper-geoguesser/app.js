// ==========================================
// 1. DATABASE & AUTH LAYER CONFIGURATION
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyC85EcYAU14PGRY9M617Sjwcu5GGQ67bqU",
    authDomain: "geoguessr-harper.firebaseapp.com",
    projectId: "geoguessr-harper",
    storageBucket: "geoguessr-harper.firebasestorage.app",
    messagingSenderId: "286806833737",
    appId: "1:286806833737:web:ba6c2fd20706177bab5d98",
    measurementId: "G-BS82GV4WN7"
};

// Initialize Firebase safely
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Global elements selection
const loginBtn = document.querySelector(".btn-google"); 
const headerSignInLink = document.querySelector(".header-signin"); 
const loginCard = document.querySelector(".login-card");

let isLoggedIn = false; 

// ==========================================
// 2. AUTH STATE LISTENER (AUTOLOGIN CHECK)
// ==========================================
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        isLoggedIn = true;
        console.log("🔥 SUCCESS! User signed in:", user.displayName);
        
        // 1. Turn the login card button into a green "Play Game" button
        if (loginBtn) {
            loginBtn.innerHTML = `
                <span style="font-weight: bold; font-size: 1.1em; letter-spacing: 0.5px;">
                    Play Game
                </span>
            `;
            loginBtn.style.backgroundColor = "#28a745";
            loginBtn.style.color = "#ffffff";
            loginBtn.style.border = "none";
        }

        // 2. Update the top header to show username
        if (headerSignInLink) {
            headerSignInLink.textContent = user.displayName || "Player";
            headerSignInLink.style.cursor = "default"; 
            headerSignInLink.href = "javascript:void(0);"; 
        }
    } else {
        isLoggedIn = false;
        console.log("No user signed in.");
        
        // Reset the login button look
        if (loginBtn) {
            loginBtn.innerHTML = `
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;">
                Sign In with Google
            `;
            loginBtn.style.backgroundColor = "white";
            loginBtn.style.color = "#3c4043";
            loginBtn.style.border = "1px solid #dadce0";
        }

        // Reset header link look
        if (headerSignInLink) {
            headerSignInLink.textContent = "Sign In";
            headerSignInLink.href = "#";
            headerSignInLink.style.cursor = "pointer";
        }
    }
});

// ==========================================
// 3. INTERACTIVE BUTTON CLICK HANDLER
// ==========================================
if (loginBtn) {
    loginBtn.addEventListener("click", () => {
        if (isLoggedIn) {
            console.log("Launching game view...");
            window.location.href = "main.html";
            
            // Hide the login card
            if (loginCard) {
                loginCard.style.display = "none"; 
            }
            
            // Show the game layout map
            const gameContainer = document.getElementById("game-container"); 
            if (gameContainer) {
                gameContainer.style.display = "block"; 
            }
            
        } else {
            console.log("Opening Google Auth Popup...");
            const provider = new firebase.auth.GoogleAuthProvider();
            
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    console.log("Popup Auth Success! User details caught:", result.user.displayName);
                })
                .catch((error) => {
                    console.error("Popup Auth Error Details:", error.code, error.message);
                    alert("Firebase Sign-In Failed: " + error.message);
                });
        }
    });
}
// ==========================================
// 4. FETCH AND DISPLAY LEADERBOARD (Firebase v8)
// ==========================================
function loadLeaderboard() {
    // Assumes you are using Firestore ('firebase.firestore()')
    const db = firebase.firestore();
    const leaderboardList = document.getElementById("leaderboard-list");

    db.collection("leaderboard")
        .orderBy("score", "desc")
        .limit(10)
        .get()
        .then((querySnapshot) => {
            // Clear out any old content before appending fresh data
            if (leaderboardList) leaderboardList.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log(`${data.username}: ${data.score}`);

                // If you have a matching container in your HTML, inject rows directly:
                if (leaderboardList) {
                    const row = document.createElement("div");
                    row.className = "leaderboard-row";
                    row.innerHTML = `
                        <span class="player-name">${data.username || 'Anonymous'}</span>
                        <span class="player-score">${data.score.toLocaleString()} pts</span>
                    `;
                    leaderboardList.appendChild(row);
                }
            });
        })
        .catch((error) => {
            console.error("Error loading leaderboard: ", error);
        });
}

// Call this function when the page loads, or right after a user logs in!
loadLeaderboard();
