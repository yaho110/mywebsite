// admin.js
import { db } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

const form = document.getElementById("news-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    date: document.getElementById("date").value,
    tag: document.getElementById("tag").value,
    title: document.getElementById("title").value,
    text: document.getElementById("text").value,
    link: document.getElementById("link").value || "",
    createdAt: new Date()
  };

  try {
    await addDoc(collection(db, "news"), data);
    alert("投稿しました");
    form.reset();
  } catch (err) {
    console.error(err);
    alert("投稿に失敗（※今は正常。次で認証を入れる）");
  }
});
