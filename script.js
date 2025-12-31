import { db } from "./firebase.js";
import {
  collection,
  getDocs,
  query,
  orderBy
} from "https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js";

console.log("Firebase OK", db);

document.addEventListener("DOMContentLoaded", async () => {

  /* ======================
     ハンバーガーメニュー
  ====================== */
  const navToggle = document.querySelector(".nav-toggle");
  const globalNav = document.querySelector(".global-nav");
  const overlay   = document.querySelector(".nav-overlay");

  if (navToggle && globalNav && overlay) {
    navToggle.addEventListener("click", () => {
      navToggle.classList.toggle("open");
      globalNav.classList.toggle("open");
      overlay.classList.toggle("open");
    });

    overlay.addEventListener("click", () => {
      navToggle.classList.remove("open");
      globalNav.classList.remove("open");
      overlay.classList.remove("open");
    });
  }

  /* ======================
     NEWS データ取得（Firestore）
     （トップ + NEWS 一覧）
  ====================== */

  const topList  = document.getElementById("top-news-list"); // index.html
  const newsList = document.getElementById("news-list");     // news.html
  const filterBtns = document.querySelectorAll(".news-filter-btn");

  if (topList || newsList) {
    try {
      const q = query(
        collection(db, "news"),
        orderBy("date", "desc")
      );

      const snapshot = await getDocs(q);
      const news = snapshot.docs.map(doc => doc.data());

      /* ----- ① トップページ用（最新3件） ----- */
      if (topList) {
        topList.innerHTML = "";
        news.slice(0, 3).forEach(item => {
          const li = document.createElement("li");
          li.innerHTML = `
            <a href="news.html" class="top-news-item">
              <time datetime="${item.date}">
                ${formatDate(item.date)}
              </time>
              <p>${item.title}</p>
            </a>
          `;
          topList.appendChild(li);
        });
      }

      /* ----- ② NEWS 一覧ページ用 ----- */
      if (newsList) {
        renderNews(news);

        filterBtns.forEach(btn => {
          btn.addEventListener("click", () => {
            filterBtns.forEach(b => b.classList.remove("is-active"));
            btn.classList.add("is-active");

            const filter = btn.dataset.filter;
            const filtered =
              filter === "all"
                ? news
                : news.filter(item => item.tag === filter);

            renderNews(filtered);
          });
        });
      }

      function renderNews(items) {
        newsList.innerHTML = "";
        items.forEach(item => {
          const article = document.createElement("article");
          article.className = "news-item";
          article.innerHTML = `
            <time class="news-date">
              ${formatDate(item.date)}
            </time>
            <div class="news-body">
              <span class="news-tag">${item.tag}</span>
              <h2 class="news-title">${item.title}</h2>
              <p class="news-text">${item.text}</p>
              ${
                item.link
                  ? `<a href="${item.link}" class="news-link" target="_blank">
                      資料を見る ↗
                    </a>`
                  : ""
              }
            </div>
          `;
          newsList.appendChild(article);
        });
      }

    } catch (err) {
      console.error("NEWS 読み込みエラー", err);
    }
  }

  /* ======================
     日付フォーマット
     2025-12-10 → 2025.12.10
  ====================== */
  function formatDate(dateStr) {
    const d   = new Date(dateStr);
    const y   = d.getFullYear();
    const m   = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}.${m}.${day}`;
  }

  /* ======================
     WHY QUIZ（ABOUT US）
  ====================== */
  document.querySelectorAll(".quiz-card").forEach(card => {
    const correct    = card.dataset.answer;
    const buttons    = card.querySelectorAll(".quiz-choice");
    const result     = card.querySelector(".quiz-result");
    const answerText = card.querySelector(".quiz-answer");

    buttons.forEach(btn => {
      btn.addEventListener("click", () => {
        buttons.forEach(b => b.classList.remove("selected"));
        result.classList.remove("show");

        btn.classList.add("selected");
        answerText.textContent =
          btn.dataset.choice === correct
            ? "✅ 多くの人がこの選択をします"
            : "❌ 直感的だけど、行動は逆になりがち";

        result.classList.add("show");
      });
    });
  });

});
