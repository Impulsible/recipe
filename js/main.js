
document.addEventListener("DOMContentLoaded", () => {
  // ===== Utilities =====
  const qs = (sel) => document.querySelector(sel);
  const qsa = (sel) => document.querySelectorAll(sel);

  // ===== Sidebar =====
  const sidebar = qs("#sidebar");
  const menuBtn = qs("#menuBtn");
  const closeSidebarBtn = qs("#closeSidebar");
  const backdrop = qs("#backdrop");
  let lastFocusedElement = null;

  function toggleSidebar(open) {
    if (!sidebar || !backdrop) return;
    if (open) {
      lastFocusedElement = document.activeElement;
      sidebar.classList.add("open");
      backdrop.style.opacity = "1";
      backdrop.style.pointerEvents = "auto";
      sidebar.setAttribute("aria-hidden", "false");
      closeSidebarBtn?.focus();
      document.body.classList.add("no-scroll");
    } else {
      sidebar.classList.remove("open");
      backdrop.style.opacity = "0";
      backdrop.style.pointerEvents = "none";
      sidebar.setAttribute("aria-hidden", "true");
      document.body.classList.remove("no-scroll");
      if (lastFocusedElement) lastFocusedElement.focus();
    }
  }

  menuBtn?.addEventListener("click", () => toggleSidebar(true));
  closeSidebarBtn?.addEventListener("click", () => toggleSidebar(false));
  backdrop?.addEventListener("click", () => toggleSidebar(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidebar?.classList.contains("open")) {
      toggleSidebar(false);
    }
    if (e.key === "Tab") document.body.classList.add("user-is-tabbing");
  });

  // ===== Dark Mode =====
const darkModeBtn = document.querySelector("#darkModeBtn") || document.querySelector("#darkModeToggle");
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
const themeKey = "theme";

const sunIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M12 4.75a1 1 0 0 1 1-1h0a1 1 0 1 1-2 0h0a1 1 0 0 1 1 1zM4.22 5.64a1 1 0 1 1 1.42-1.42h0a1 1 0 1 1-1.42 1.42zM2.75 12a1 1 0 1 1 0-2h0a1 1 0 0 1 0 2zM4.22 18.36a1 1 0 1 1 1.42 1.42h0a1 1 0 1 1-1.42-1.42zM12 19.25a1 1 0 0 1-1 1h0a1 1 0 1 1 2 0h0a1 1 0 0 1-1-1zM18.36 18.36a1 1 0 1 1 1.42 1.42h0a1 1 0 1 1-1.42-1.42zM19.25 12a1 1 0 1 1 0-2h0a1 1 0 0 1 0 2zM18.36 5.64a1 1 0 1 1 1.42-1.42h0a1 1 0 1 1-1.42 1.42zM12 8a4 4 0 1 1 0 8a4 4 0 0 1 0-8z"/>
  </svg>
`;

const moonIcon = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
    <path d="M21 12.79A9 9 0 0 1 11.21 3 7 7 0 1 0 21 12.79z"/>
  </svg>
`;

function applyTheme(isDark) {
  document.body.classList.toggle("dark", isDark);
  if (darkModeBtn) {
    darkModeBtn.setAttribute("aria-pressed", String(isDark));
    darkModeBtn.innerHTML = isDark ? sunIcon : moonIcon;
  }
}

const savedTheme = localStorage.getItem(themeKey);
applyTheme(savedTheme ? savedTheme === "dark" : prefersDark);

darkModeBtn?.addEventListener("click", () => {
  const isDark = !document.body.classList.contains("dark");
  applyTheme(isDark);
  localStorage.setItem(themeKey, isDark ? "dark" : "light");
});

  // ===== Footer year & last modified =====
  const yearEl = qs("#year");
  const lastModifiedEl = qs("#lastModified");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  if (lastModifiedEl) lastModifiedEl.textContent = `Last modified: ${document.lastModified || "—"}`;

  // ===== Hero Background Parallax =====
  const hero = qs(".hero");
  if (hero) {
    const HERO_BG = "images/hero-food.jpg";
    Object.assign(hero.style, {
      backgroundImage: `url("${HERO_BG}")`,
      backgroundPosition: "center",
      backgroundSize: "cover",
    });

    window.addEventListener(
      "scroll",
      () => {
        const rect = hero.getBoundingClientRect();
        const vh = window.innerHeight;
        if (rect.bottom > 0 && rect.top < vh) {
          const percent = Math.min(Math.max((vh - rect.top) / (vh + rect.height), 0), 1);
          hero.style.backgroundPositionY = `${50 - percent * 5}%`;
        }
      },
      { passive: true }
    );
  }
// public/js/main.js
console.log('✅ main.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  // --- Utilities ---
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));



  // --- Sidebar / Backdrop ---
  const menuBtn = $('#menuBtn');
  const sidebar = $('#sidebar');
  const closeSidebar = $('#closeSidebar');
  const backdrop = $('#backdrop');

  function openSidebar() {
    if (!sidebar) return;
    sidebar.classList.add('active');
    backdrop.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeSidebarFn() {
    if (!sidebar) return;
    sidebar.classList.remove('active');
    backdrop.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (menuBtn) menuBtn.addEventListener('click', openSidebar);
  if (closeSidebar) closeSidebar.addEventListener('click', closeSidebarFn);
  if (backdrop) backdrop.addEventListener('click', closeSidebarFn);

  // --- Dark mode toggle (persist in localStorage) ---
  const darkToggle = $('#darkModeToggle');
  const savedTheme = localStorage.getItem('rf_theme');
  if (savedTheme === 'dark') document.body.classList.add('dark');

  if (darkToggle) {
    darkToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark');
      const isDark = document.body.classList.contains('dark');
      localStorage.setItem('rf_theme', isDark ? 'dark' : 'light');
      // update aria
      darkToggle.setAttribute('aria-pressed', String(isDark));
    });
  }

  // --- Planner reset example handler (if present) ---
  const resetPlannerLink = document.getElementById('resetPlannerLink');
  if (resetPlannerLink) {
    resetPlannerLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (confirm('Reset the planner? This will remove saved meals for the week.')) {
        // example: clear localStorage keys used by planner
        localStorage.removeItem('rf_mealplan');
        // clear UI counts
        $$('.meal-count').forEach(n => n.textContent = '0');
        alert('Planner reset.');
      }
    });
  }

  // --- Make sure lucide icons exist then create icons ---
  try {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    } else {
      console.log('lucide not available yet — createIcons skipped.');
    }
  } catch (err) {
    console.warn('lucide.createIcons error:', err);
  }

  // debug helper to show resource checks in console
  console.log('UI wired: sidebar:', !!sidebar, 'backdrop:', !!backdrop, 'darkToggle:', !!darkToggle);
});



  // ===== Active Nav Highlight =====
  const currentPage = window.location.pathname.split("/").pop();
  qsa(".nav a, .sidebar nav a, .sidebar-nav a, .bottom-nav a").forEach((link) => {
    if (link.getAttribute("href") === currentPage) {
      link.classList.add("active");
    } else {
      link.classList.remove("active");
    }
  });

  // ===== Lucide Icons Init =====
  if (window.lucide) lucide.createIcons();
});

// =========================
// Surprise Me - Random Recipe Modal + Add to Planner
// =========================
(function () {
  const randomBtn = document.getElementById("randomBtnToolbar");
  const modal = document.getElementById("recipeModal");
  const modalBody = document.getElementById("modalBody");
  const modalClose = document.getElementById("modalClose");

  const plannerList = document.getElementById("plannerList"); // target list
  const plannerModal = document.getElementById("plannerModal");
  const closePlanner = document.getElementById("closePlanner");

  if (!randomBtn || !modal || !modalBody) return; // Safe check

  // Build ingredients list
  function buildIngredients(meal) {
    let html = "<ul class='ingredients-list'>";
    for (let i = 1; i <= 20; i++) {
      const ingredient = meal[`strIngredient${i}`];
      const measure = meal[`strMeasure${i}`];
      if (ingredient && ingredient.trim()) {
        html += `<li>${measure ? measure : ""} ${ingredient}</li>`;
      }
    }
    html += "</ul>";
    return html;
  }

  // Function to insert recipe details into modal
  function renderMeal(meal) {
    modalBody.innerHTML = `
      <h2 id="modalTitle">${meal.strMeal}</h2>
      <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="max-width:100%;border-radius:8px;">

      <p><strong>Category:</strong> ${meal.strCategory || "N/A"}</p>
      <p><strong>Area:</strong> ${meal.strArea || "N/A"}</p>
      ${meal.strTags ? `<p><strong>Tags:</strong> ${meal.strTags}</p>` : ""}

      <h3>Ingredients</h3>
      ${buildIngredients(meal)}

      <h3>Instructions</h3>
      <p style="white-space:pre-line;line-height:1.5;">${meal.strInstructions}</p>

      ${meal.strYoutube ? `<p><a href="${meal.strYoutube}" target="_blank">📺 Watch Video</a></p>` : ""}

      <button id="addToPlannerBtn" class="btn">➕ Add to Planner</button>
    `;

    // Attach Add to Planner functionality
    const addToPlannerBtn = document.getElementById("addToPlannerBtn");
    addToPlannerBtn.addEventListener("click", () => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span>${meal.strMeal}</span>
        <button class="remove-btn">❌</button>
      `;
      plannerList.appendChild(li);

      // Allow removing
      li.querySelector(".remove-btn").addEventListener("click", () => li.remove());

      // Open planner modal after adding
      plannerModal.classList.remove("hidden");
    });
  }

  // Random button fetch
  randomBtn.addEventListener("click", async () => {
    try {
      const res = await fetch("https://www.themealdb.com/api/json/v1/1/random.php");
      const data = await res.json();
      const meal = data.meals[0];

      renderMeal(meal);
      modal.classList.remove("hidden");
    } catch (err) {
      console.error("Error fetching recipe:", err);
      modalBody.innerHTML = `<p>⚠️ Sorry, something went wrong fetching the recipe.</p>`;
      modal.classList.remove("hidden");
    }
  });

  // Close recipe modal
  modalClose?.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", (e) => {
    if (e.target === modal) modal.classList.add("hidden");
  });

  // Close planner modal
  closePlanner?.addEventListener("click", () => plannerModal.classList.add("hidden"));
  plannerModal.addEventListener("click", (e) => {
    if (e.target === plannerModal) plannerModal.classList.add("hidden");
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  /* =====================
     WELCOME + GREETING
  ===================== */
  const welcomeCard = document.querySelector(".welcome-card");
  const greeting = document.getElementById("greeting");
  const foodTalkText = document.getElementById("foodTalkText");
  const btnEmoji = document.getElementById("btnEmoji");

  const hour = new Date().getHours();
  greeting.textContent =
    hour < 12 ? "Good Morning, Henry 🌅" :
    hour < 18 ? "Good Afternoon, Henry ☀️" :
                "Good Evening, Henry 🌙";

  const emojis = ["🥗","🍲","🥑","🍎","🍕","🍛","🍤","🍞","🥕","🍇"];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  welcomeCard.setAttribute("data-emoji", randomEmoji);
  btnEmoji.textContent = randomEmoji;

  const talks = [
  "Healthy meals, happy life 🥦",
  "Good food fuels great days 💪",
  "Eat better, live better 🌱",
  "Every bite counts 🍴",
  "Food is the ingredient that binds us together 🍜",
  "Small bites, big changes 🥕",
  "Hydrate, nourish, glow 💧",
  "Your body deserves the best 🥗",
  "Cooking is love made visible ❤️",
  "Savor the flavor of wellness 🍋",
  "You are what you eat — so eat something amazing 🍇",
  "Good vibes start with good food ✨",
  "Wholesome plates, wholesome hearts 💚",
  "A balanced diet is a recipe for joy ⚖️",
  "Fuel your body, feed your soul 🍓",
  "Tasty meets healthy — the perfect match 🥑",
  "Nourishment is self-care 🌻",
  "Every meal is a chance to thrive 🌾",
  "Cook with passion, eat with purpose 🍲",
  "From market to table, make every moment delicious 🛒"
];

  let talkIndex = 0, charIndex = 0, typingInterval;
  function typeTalk() {
    if (charIndex < talks[talkIndex].length) {
      foodTalkText.textContent += talks[talkIndex].charAt(charIndex++);
    } else {
      clearInterval(typingInterval);
      setTimeout(() => {
        talkIndex = (talkIndex + 1) % talks.length;
        foodTalkText.textContent = "";
        charIndex = 0;
        typingInterval = setInterval(typeTalk, 60);
      }, 3000);
    }
  }
  typingInterval = setInterval(typeTalk, 60);

  /* =====================
     MEAL PLANNER
  ===================== */
  const MEALDB_BASE = "https://www.themealdb.com/api/json/v1/1";
  const PLANNER_KEY = "rf_planner";
  const days = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

  let planner = JSON.parse(localStorage.getItem(PLANNER_KEY) || "{}");
  let selectedDay = "";

  const mealModal = document.getElementById("mealModal");
  const mealDayLabel = document.getElementById("mealDayLabel");
  const mealSelect = document.getElementById("mealSelect");
  const saveMealBtn = document.getElementById("saveMealBtn");
  const cancelMealBtn = document.getElementById("cancelMealBtn");

  const plannerModal = document.getElementById("plannerModal");
  const plannerList = document.getElementById("plannerList");
  const closePlannerBtn = document.getElementById("closePlannerBtn");

  const shoppingModal = document.getElementById("shoppingModal");
  const shoppingList = document.getElementById("shoppingList");
  const closeShoppingBtn = document.getElementById("closeShoppingBtn");
  const downloadShoppingBtn = document.getElementById("downloadShoppingBtn");

  // Load recipes from MealDB
  async function loadRecipes(q="chicken") {
    const res = await fetch(`${MEALDB_BASE}/search.php?s=${encodeURIComponent(q)}`);
    const data = await res.json();
    const meals = data.meals || [];
    mealSelect.innerHTML =
      `<option value="">Select a recipe</option>` +
      meals.map(m => `<option value="${m.idMeal}" data-name="${m.strMeal}">${m.strMeal}</option>`).join("");
  }

  // Update UI for a day's meals
  function updateMealList(day) {
    const ul = document.getElementById(`${day}Meals`);
    const meals = planner[day] || [];
    ul.innerHTML = meals.map(m => `<li>${m.name}</li>`).join("");
    const count = document.querySelector(`.day-item[data-day="${day}"] .meal-count`);
    count.textContent = meals.length;
  }

  // Init all days
  days.forEach(updateMealList);

  // Day click → open modal
  document.querySelectorAll(".day-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedDay = btn.dataset.day;
      mealDayLabel.textContent = selectedDay.charAt(0).toUpperCase() + selectedDay.slice(1);
      mealModal.classList.remove("hidden");
      loadRecipes();
    });
  });

  // Save meal
  saveMealBtn.addEventListener("click", () => {
    const mealId = mealSelect.value;
    const mealName = mealSelect.selectedOptions[0]?.dataset.name;
    if (!mealId) return;

    planner[selectedDay] = planner[selectedDay] || [];
    planner[selectedDay].push({ id: mealId, name: mealName });
    localStorage.setItem(PLANNER_KEY, JSON.stringify(planner));
    updateMealList(selectedDay);
    mealModal.classList.add("hidden");
  });

    cancelMealBtn.addEventListener("click", () => mealModal.classList.add("hidden"));
  
  });

document.addEventListener("DOMContentLoaded", () => {
  // ===== Elements =====
  const modal = document.getElementById("mealModal");
  const cancelBtn = document.getElementById("cancelMealBtn");
  const dayButtons = document.querySelectorAll(".day-btn");
  const resetBtn = document.getElementById("resetPlannerBtn") || document.getElementById("resetPlannerLink");
  const openPlannerBtn = document.getElementById("openPlannerBtn");
  const shoppingListBtn = document.getElementById("shoppingListBtn");

  // ===== Modal Handling =====
  dayButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      const day = btn.parentElement.dataset.day;
      document.getElementById("mealDayLabel").textContent =
        day.charAt(0).toUpperCase() + day.slice(1);
      modal.classList.add("show");
    });
  });

  cancelBtn?.addEventListener("click", () => modal.classList.remove("show"));
  modal?.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("show");
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") modal.classList.remove("show");
  });

  // ===== Navigation Buttons =====
  openPlannerBtn?.addEventListener("click", () => (window.location.href = "planner.html"));
  shoppingListBtn?.addEventListener("click", () => (window.location.href = "shopping.html"));

  // ===== Reset Planner =====
  resetBtn?.addEventListener("click", e => {
    e.preventDefault();
    if (confirm("♻️ Are you sure you want to reset your meal plan?")) {
      // Clear stored data
      localStorage.removeItem("mealPlan");

      // Reset all visual data
      document.querySelectorAll(".meal-list").forEach(list => (list.innerHTML = ""));
      document.querySelectorAll(".meal-count").forEach(count => (count.textContent = "0"));

      // Reset dashboard stats
      document.getElementById("plannedMeals").textContent = "0";
      document.getElementById("progress").textContent = "0%";

      alert("✅ All meals have been cleared successfully!");
    }
  });

  // ===== Load Stats on Startup =====
  loadDashboardStats();
});

/* =======================
   DASHBOARD STATS LOADER
=========================*/
function loadDashboardStats() {
  const planner = JSON.parse(localStorage.getItem("mealPlan")) || {};
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  const plannedMeals = Object.values(planner).flat().length;
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];
  const filledDays = days.filter(day => (planner[day] || []).length > 0).length;
  const progressPercent = Math.round((filledDays / days.length) * 100);

  document.getElementById("plannedMeals").textContent = plannedMeals;
  document.getElementById("favorites").textContent = favorites.length;
  document.getElementById("progress").textContent = progressPercent + "%";
}
// Scroll to Top Button
const scrollTopBtn = document.getElementById("scrollTopBtn");

window.addEventListener("scroll", () => {
  if (window.scrollY > 400) {
    scrollTopBtn.classList.add("show");
  } else {
    scrollTopBtn.classList.remove("show");
  }
});

scrollTopBtn.addEventListener("click", () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth"
  });
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('✅ Service Worker registered successfully!'))
      .catch(err => console.error('❌ Service Worker registration failed:', err));
  });
}
