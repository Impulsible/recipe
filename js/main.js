// =========================
// main.js
// Handles sidebar, dark mode, year/lastModified, profile, hero interactions
// =========================

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

  // ===== Profile =====
  const profileBtn = qs("#profileBtn");
  const logoutBtn = qs("#logoutBtn");
  const profileForm = qs("#profileForm");
  const sidebarName = qs("#sidebarName");
  const sidebarEmail = qs("#sidebarEmail");
  const welcomeText = qs("#welcomeText");
  const welcomeMessage = qs("#welcomeMessage");

  function loadProfile() {
    const name = localStorage.getItem("profileName");
    const email = localStorage.getItem("profileEmail");

    if (sidebarName) sidebarName.textContent = name || "Guest";
    if (sidebarEmail) sidebarEmail.textContent = email || "Not signed in";
    if (welcomeText) {
      welcomeText.textContent = name ? `Welcome back, ${name} 👋` : "Welcome back, Guest 👋";
    }
    if (welcomeMessage && name) {
      welcomeMessage.textContent = `Welcome back, ${name} 👋`;
    }
  }
  loadProfile();

  profileBtn?.addEventListener("click", () => (window.location.href = "profile.html"));

  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("profileName");
    localStorage.removeItem("profileEmail");
    loadProfile();
    alert("Signed out successfully.");
    window.location.href = "index.html";
  });

  if (profileForm) {
    const nameInput = qs("#profileName");
    const emailInput = qs("#profileEmail");
    if (nameInput) nameInput.value = localStorage.getItem("profileName") || "";
    if (emailInput) emailInput.value = localStorage.getItem("profileEmail") || "";

    profileForm.addEventListener("submit", (e) => {
      e.preventDefault();
      if (nameInput && emailInput) {
        localStorage.setItem("profileName", nameInput.value);
        localStorage.setItem("profileEmail", emailInput.value);
        alert("Profile saved!");
        window.location.href = "index.html";
      }
    });
  }

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

document.addEventListener("DOMContentLoaded", () => {
  const categoryFilter = document.getElementById("categoryFilter");
  const dietFilter = document.getElementById("dietFilter");
  const applyBtn = document.getElementById("applyFilters");
  const clearBtn = document.getElementById("clearFilters");
  const recipeCards = document.querySelectorAll(".recipe-card");

  // Function to filter cards based on dropdowns
  function filterRecipes() {
    const selectedCategory = categoryFilter.value;
    const selectedDiet = dietFilter.value;

    recipeCards.forEach(card => {
      const cardCategory = card.dataset.category;
      const cardDiet = card.dataset.diet;

      // Show card if it matches both filters or if filter is empty
      if ((selectedCategory === "" || cardCategory === selectedCategory) &&
          (selectedDiet === "" || cardDiet === selectedDiet)) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  // Apply button click
  applyBtn?.addEventListener("click", filterRecipes);

  // Clear button click
  clearBtn?.addEventListener("click", () => {
    categoryFilter.value = "";
    dietFilter.value = "";
    recipeCards.forEach(card => card.style.display = "block");
  });

  // Optional: Live filtering as user changes dropdowns
  categoryFilter?.addEventListener("change", filterRecipes);
  dietFilter?.addEventListener("change", filterRecipes);
});

const toggleBtn = document.getElementById('toggleFilters');
const closeBtn = document.getElementById('closeFilters');
const drawer = document.getElementById('filtersCard');
const overlay = document.getElementById('drawerOverlay');
const calRange = document.getElementById('caloriesRange');
const calLabel = document.getElementById('calLabel');

// Toggle Drawer
toggleBtn.addEventListener('click', () => {
  drawer.classList.toggle('hidden');
  overlay.classList.toggle('hidden');
  toggleBtn.setAttribute('aria-expanded', !drawer.classList.contains('hidden'));
});

closeBtn.addEventListener('click', () => {
  drawer.classList.add('hidden');
  overlay.classList.add('hidden');
  toggleBtn.setAttribute('aria-expanded', false);
});

overlay.addEventListener('click', () => {
  drawer.classList.add('hidden');
  overlay.classList.add('hidden');
  toggleBtn.setAttribute('aria-expanded', false);
});

// Update calories label
calRange.addEventListener('input', () => {
  calLabel.textContent = calRange.value;
});

// Make drawer draggable via header only
let isDragging = false;
let offsetX = 0;
let offsetY = 0;
const header = document.getElementById('drawerHeader');

header.addEventListener('mousedown', dragStart);
header.addEventListener('touchstart', dragStart, { passive: false });

function dragStart(e) {
  // Prevent dragging when interacting with inputs inside header (if any)
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'BUTTON') return;

  isDragging = true;
  const rect = drawer.getBoundingClientRect();

  if(e.type === 'mousedown') {
    offsetX = e.clientX - rect.left;
    offsetY = e.clientY - rect.top;
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('mouseup', dragEnd);
  } else {
    offsetX = e.touches[0].clientX - rect.left;
    offsetY = e.touches[0].clientY - rect.top;
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('touchend', dragEnd);
  }
}

function dragMove(e) {
  if(!isDragging) return;
  e.preventDefault(); // Only block default while dragging
  let x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
  let y = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;
  drawer.style.left = `${x - offsetX}px`;
  drawer.style.top = `${y - offsetY}px`;
}

// Meal Plan JS
const days = ['monday','tuesday','wednesday','thursday','friday'];
const savedMeals = JSON.parse(localStorage.getItem('mealPlan') || '{}');

// Update buttons
function updateButtons(){
  document.querySelectorAll('.day-btn').forEach(btn=>{
    const day = btn.dataset.day;
    btn.textContent = day.charAt(0).toUpperCase() + day.slice(1);
    if(savedMeals[day]) btn.textContent += `: ${savedMeals[day]}`;
  });
}

// Day buttons click
document.querySelectorAll('.day-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const day = btn.dataset.day;
    const meal = prompt(`Enter your meal for ${day}:`, savedMeals[day] || '');
    if(meal !== null){
      savedMeals[day] = meal.trim();
      localStorage.setItem('mealPlan', JSON.stringify(savedMeals));
      updateButtons();
    }
  });
});

// Open Planner Modal
const openPlannerBtn = document.getElementById('openPlannerBtn');
const plannerModal = document.getElementById('plannerModal');
const plannerList = document.getElementById('plannerList');
const closePlanner = document.getElementById('closePlanner');

openPlannerBtn.addEventListener('click', ()=>{
  plannerList.innerHTML = '';
  days.forEach(day=>{
    const li = document.createElement('li');
    li.textContent = `${day.charAt(0).toUpperCase() + day.slice(1)}: ${savedMeals[day] || '-'}`;
    plannerList.appendChild(li);
  });
  plannerModal.classList.remove('hidden');
});

closePlanner.addEventListener('click', ()=>plannerModal.classList.add('hidden'));
plannerModal.addEventListener('click', e=>{
  if(e.target === plannerModal) plannerModal.classList.add('hidden');
});

// Shopping List
const shoppingBtn = document.getElementById('shoppingListBtn');
shoppingBtn.addEventListener('click', ()=>{
  const meals = Object.values(savedMeals).filter(m=>m);
  if(meals.length === 0){
    alert("No meals added yet.");
    return;
  }
  alert("Shopping List:\n" + meals.join('\n'));
});

// Initialize
updateButtons();

