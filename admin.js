import { db, storage } from "./firebase.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const form = document.getElementById("news-form");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fileInput = document.getElementById("file");
  let fileURL = "";

  try {
    // ファイルが選択されていたらアップロード
    if (fileInput.files.length > 0) {
      const file = fileInput.files[0];
      const storageRef = ref(
        storage,
        `news/${Date.now()}_${file.name}`
      );

      await uploadBytes(storageRef, file);
      fileURL = await getDownloadURL(storageRef);
    }

    const data = {
      date: document.getElementById("date").value,
      tag: document.getElementById("tag").value,
      title: document.getElementById("title").value,
      text: document.getElementById("text").value,
      link: fileURL, // ← ここにURLが入る
      createdAt: new Date()
    };

    await addDoc(collection(db, "news"), data);

    alert("投稿しました");
    form.reset();

  } catch (err) {
    console.error(err);
    alert("投稿に失敗（※今はルールでブロックされるのが正常）");
  }
});
