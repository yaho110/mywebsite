import { db, storage } from "./firebase.js";
import {
  collection, addDoc, getDocs, query, orderBy,
  doc, updateDoc, deleteDoc
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-storage.js";

const form = document.getElementById("news-form");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("news-admin-list");

const editingIdEl = document.getElementById("editing-id");
const formTitleEl = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const cancelEditBtn = document.getElementById("cancel-edit-btn");

const dateEl = document.getElementById("date");
const tagEl = document.getElementById("tag");
const titleEl = document.getElementById("title");
const textEl = document.getElementById("text");
const fileEl = document.getElementById("file");

let cachedDocs = []; // { id, ...data }

function setStatus(msg, isError = false) {
  statusEl.textContent = msg || "";
  statusEl.style.color = isError ? "#c62828" : "#111";
}

function resetFormToCreate() {
  editingIdEl.value = "";
  formTitleEl.textContent = "新規投稿";
  submitBtn.textContent = "投稿する";
  cancelEditBtn.disabled = true;
  form.reset();
  setStatus("");
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// Firestoreから一覧を再取得して描画
async function reloadList() {
  listEl.innerHTML = `<tr><td colspan="3">読み込み中…</td></tr>`;
  try {
    const q = query(collection(db, "news"), orderBy("date", "desc"));
    const snap = await getDocs(q);

    cachedDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (cachedDocs.length === 0) {
      listEl.innerHTML = `<tr><td colspan="3">まだ投稿がありません</td></tr>`;
      return;
    }

    listEl.innerHTML = "";
    cachedDocs.forEach(item => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.date ? formatDate(item.date) : "-"}</td>
        <td>
          <div class="tag">${item.tag || "-"}</div>
          <div class="title" style="margin-top:6px;">${escapeHtml(item.title || "")}</div>
          <div style="margin-top:6px; color:#666;">
            ${escapeHtml((item.text || "").slice(0, 60))}${(item.text || "").length > 60 ? "…" : ""}
          </div>
          ${item.link ? `<div style="margin-top:6px;"><a href="${item.link}" target="_blank">添付を見る ↗</a></div>` : ""}
        </td>
        <td>
          <div class="actions">
            <button class="btn-ghost" data-action="edit" data-id="${item.id}">編集</button>
            <button class="btn-danger" data-action="delete" data-id="${item.id}">削除</button>
          </div>
        </td>
      `;
      listEl.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    listEl.innerHTML = `<tr><td colspan="3">読み込みに失敗しました</td></tr>`;
  }
}

// 一覧の編集/削除ボタン
listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;
  const item = cachedDocs.find(x => x.id === id);
  if (!item) return;

  if (action === "edit") {
    // 左フォームに読み込む
    editingIdEl.value = item.id;
    formTitleEl.textContent = "編集";
    submitBtn.textContent = "更新する";
    cancelEditBtn.disabled = false;

    dateEl.value = item.date || "";
    tagEl.value = item.tag || "お知らせ";
    titleEl.value = item.title || "";
    textEl.value = item.text || "";
    fileEl.value = ""; // ファイル入力はセキュリティ上、値を入れられない

    setStatus("編集モード：内容を直して「更新する」", false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (action === "delete") {
    const ok = confirm("このNEWSを削除しますか？（元に戻せません）");
    if (!ok) return;

    try {
      // 添付ファイルがある場合：Storageも消す（filePathがあるときだけ）
      if (item.filePath) {
        await deleteObject(ref(storage, item.filePath));
      }

      await deleteDoc(doc(db, "news", item.id));
      setStatus("削除しました");
      // 編集中のものを消した場合はフォームも戻す
      if (editingIdEl.value === item.id) resetFormToCreate();
      await reloadList();
    } catch (err) {
      console.error(err);
      setStatus("削除に失敗しました（権限/ルール/ネットワーク確認）", true);
    }
  }
});

cancelEditBtn.addEventListener("click", () => {
  resetFormToCreate();
});

// 投稿/更新（フォーム送信）
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  setStatus("処理中…");

  const isEditing = !!editingIdEl.value;
  const id = editingIdEl.value;

  const payloadBase = {
    date: dateEl.value,
    tag: tagEl.value,
    title: titleEl.value,
    text: textEl.value,
    updatedAt: new Date()
  };

  try {
    // 添付ファイルが選ばれていたら Storageへアップロード
    let newFile = null;
    let newFileURL = "";
    let newFilePath = "";

    if (fileEl.files && fileEl.files.length > 0) {
      newFile = fileEl.files[0];
      newFilePath = `news/${Date.now()}_${newFile.name}`;
      const storageRef = ref(storage, newFilePath);
      await uploadBytes(storageRef, newFile);
      newFileURL = await getDownloadURL(storageRef);
    }

    if (!isEditing) {
      // 新規作成
      const payload = {
        ...payloadBase,
        createdAt: new Date(),
        link: newFileURL || "",
        filePath: newFilePath || ""
      };
      await addDoc(collection(db, "news"), payload);
      setStatus("投稿しました");
      resetFormToCreate();
      await reloadList();
      return;
    }

    // 編集更新
    const before = cachedDocs.find(x => x.id === id);

    // ファイル差し替えがある場合：古いファイルを消してから更新（filePathがあるときだけ）
    if (newFileURL) {
      if (before && before.filePath) {
        try {
          await deleteObject(ref(storage, before.filePath));
        } catch (err) {
          // 古いファイル消せなくても本体更新は進める（運用優先）
          console.warn("旧ファイル削除に失敗（無視して続行）", err);
        }
      }
    }

    const payload = {
      ...payloadBase,
      ...(newFileURL ? { link: newFileURL, filePath: newFilePath } : {})
    };

    await updateDoc(doc(db, "news", id), payload);

    setStatus("更新しました");
    resetFormToCreate();
    await reloadList();

  } catch (err) {
    console.error(err);
    setStatus("保存に失敗しました（権限/ルール/ネットワーク確認）", true);
  }
});

// 文字の最小エスケープ（タイトル・本文のプレビュー用）
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// 初期表示
resetFormToCreate();
reloadList();
