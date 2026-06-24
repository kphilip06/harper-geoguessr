  firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            console.log("User already authenticated. Passing to game...");
            // Corrected to main.html so auto-login doesn't break
            window.location.href = "main.html";
        }
    });
