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
    // Look up elements dynamically inside the handler state
    const signInLink = document.getElementById('authSignIn');
    const signOutBtn = document.getElementById('authSignOut');

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

        // 2. Change the text of the link to the user's name
        if (signInLink) {
            signInLink.textContent = user.displayName || "Player";
            signInLink.style.cursor = "default"; 
            signInLink.href = "javascript:void(0);"; 
        }
        
        // 3. Reveal the Sign Out button safely right next to it
        if (signOutBtn) {
            signOutBtn.style.display = "inline-block";
        }

    } else {
        isLoggedIn = false;
        console.log("No user signed in.");
        
        // Reset login card button
        if (loginBtn) {
            loginBtn.innerHTML = `
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg" alt="Google Logo" style="width: 18px; height: 18px; margin-right: 8px; vertical-align: middle;">
                Sign In with Google
            `;
            loginBtn.style.backgroundColor = "white";
            loginBtn.style.color = "#3c4043";
            loginBtn.style.border = "1px solid #dadce0";
        }

        // Reset text back to Sign In
        if (signInLink) {
            signInLink.textContent = "Sign In";
            signInLink.href = "#";
            signInLink.style.cursor = "pointer";
        }
        
        // Hide Sign Out button completely
        if (signOutBtn) {
            signOutBtn.style.display = "none";
        }
    }
});
// ==========================================
// 3. INTERACTIVE BUTTON CLICK HANDLERS
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

// Global active Sign In action listener for the header link
document.addEventListener("click", (event) => {
    if (event.target && event.target.id === "authSignIn") {
        // Only run this if the user is NOT logged in (if it still says "Sign In")
        if (!isLoggedIn) {
            event.preventDefault();
            console.log("Opening Google Auth Popup via header link...");
            
            const provider = new firebase.auth.GoogleAuthProvider();
            
            firebase.auth().signInWithPopup(provider)
                .then((result) => {
                    console.log("Header Auth Success! User details:", result.user.displayName);
                    // The onAuthStateChanged listener will automatically handle updating the UI!
                })
                .catch((error) => {
                    console.error("Header Auth Error Details:", error.code, error.message);
                    alert("Firebase Sign-In Failed: " + error.message);
                });
        }
    }
});

// Global active Sign Out action listener
document.addEventListener("click", (event) => {
    if (event.target && event.target.id === "authSignOut") {
        event.preventDefault();
        console.log("Signing user out...");
        firebase.auth().signOut()
            .then(() => {
                console.log("User successfully signed out via header.");
                window.location.reload(); // Refresh to clean up cache data completely
            })
            .catch((error) => {
                console.error("Error logging out:", error);
            });
    }
});

// ==========================================
// 4. FETCH AND DISPLAY LEADERBOARD (Firebase v8)
// ==========================================
function loadLeaderboard() {
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

loadLeaderboard();
