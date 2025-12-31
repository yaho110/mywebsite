import { app } from "./firebase.js";
import { getAuth, signInWithEmailAndPassword } 
  from "https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js";

const auth = getAuth(app);

document.getElementById("login-btn").addEventListener("click", async () => {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    location.href = "admin.html";
  } catch (err) {
    document.getElementById("error").textContent = "認証に失敗しました";
  }
});
