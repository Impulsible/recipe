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
// DOM Elements
const categoryFilter = document.getElementById('categoryFilter');
const dietFilter = document.getElementById('dietFilter');
const applyBtn = document.getElementById('applyFilters');
const clearBtn = document.getElementById('clearFilters');
const searchInput = document.getElementById('searchInput');

// Function: Apply filters
function applyFilters() {
  const category = categoryFilter.value;
  const diet = dietFilter.value;
  const search = searchInput.value.trim().toLowerCase();

  alert(`Filters Applied:\nCategory: ${category || 'All'}\nDiet: ${diet || 'All'}\nSearch: ${search || 'None'}`);

  // TODO: Filter your recipes/cards dynamically here
  // Example: filterRecipes({ category, diet, search });
}

// Function: Clear filters
function clearFilters() {
  categoryFilter.value = '';
  dietFilter.value = '';
  searchInput.value = '';

  alert('Filters Cleared!');
  // TODO: Reset your recipe/cards display here
  // Example: showAllRecipes();
}

// Event listeners
applyBtn.addEventListener('click', applyFilters);
clearBtn.addEventListener('click', clearFilters);

// Mobile search: Enter key triggers Apply
searchInput.addEventListener('keypress', e => {
  if (e.key === 'Enter') applyFilters();
});


// ---------- CONSTANTS ----------
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
const EDAMAM_API = 'https://api.edamam.com/api/nutrition-data';
const EDAMAM_APP_ID = 'YOUR_EDAMAM_APP_ID';
const EDAMAM_APP_KEY = 'YOUR_EDAMAM_APP_KEY';
const RATINGS_KEY = 'recipeRatings';

let recipes = [];
let mealPlan = JSON.parse(localStorage.getItem('mealPlan')) || {};

// ---------- DOM ELEMENTS ----------
const recipeList = document.getElementById('recipeList');
const modalBody = document.getElementById('modalBody');
const recipeModal = document.getElementById('recipeModal');
const modalClose = document.getElementById('modalClose');
// const searchInput = document.getElementById('searchInput'); // Removed duplicate declaration
const searchBtn = document.getElementById('searchBtn');
const randomBtn = document.getElementById('randomBtnToolbar');
const favoritesBtn = document.getElementById('favoritesToggle');
const slots = document.querySelectorAll('.meal-plan .slot');

// ---------- FETCH RECIPES ----------
async function fetchRecipes(search = 'chicken') {
  try {
    const res = await fetch(`${MEALDB_BASE}/search.php?s=${search}`);
    const data = await res.json();
    if (!data.meals) return;
    recipes = data.meals.map(meal => ({
      id: meal.idMeal,
      title: meal.strMeal,
      description: meal.strCategory + ' | ' + meal.strArea,
      img: meal.strMealThumb,
      ingredients: getIngredients(meal),
      instructions: meal.strInstructions.split(/\r?\n/),
      favorite: false
    }));
    renderRecipes(recipes);
  } catch (err) {
    console.error('Error fetching recipes:', err);
  }
}

// ---------- EXTRACT INGREDIENTS ----------
function getIngredients(meal) {
  const ingredients = [];
  for (let i=1; i<=20; i++) {
    const ing = meal[`strIngredient${i}`];
    const meas = meal[`strMeasure${i}`];
    if (ing && ing.trim() !== '') ingredients.push(`${meas.trim()} ${ing.trim()}`);
  }
  return ingredients;
}

// ---------- RENDER RECIPES ----------
function renderRecipes(list) {
  recipeList.innerHTML = '';
  document.getElementById('resultCount').textContent = list.length;
  document.getElementById('resultCountSummary').textContent = list.length;

  if (list.length === recipes.length) favoritesBtn.classList.remove('active');

  list.forEach(recipe => {
    const card = document.createElement('div');
    card.className = 'recipe-card';
    card.draggable = true;
    card.dataset.id = recipe.id;
    card.innerHTML = `
      <img src="${recipe.img}" alt="${recipe.title}">
      <div class="recipe-info">
        <h3>${recipe.title}</h3>
        <p>${recipe.description}</p>
        <button class="add-btn" data-id="${recipe.id}">${recipe.favorite ? '❤️ Added' : '➕ Add'}</button>
      </div>
    `;
    recipeList.appendChild(card);

    // Open modal
    card.querySelector('img').addEventListener('click', ()=>openModal(recipe));
    card.querySelector('h3').addEventListener('click', ()=>openModal(recipe));

    // Toggle favorite
    card.querySelector('.add-btn').addEventListener('click', e=>{
      e.stopPropagation();
      recipe.favorite = !recipe.favorite;
      renderRecipes(list);
    });

    // Drag events
    card.addEventListener('dragstart', e=>{
      e.dataTransfer.setData('text/plain', recipe.id);
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
}

// ---------- FETCH NUTRITION ----------
async function fetchNutritionFromIngredients(ingredientsArray) {
  if (!ingredientsArray || ingredientsArray.length === 0) return null;
  const ingrQuery = ingredientsArray.map(i=>encodeURIComponent(i)).join('&ingr=');
  const url = `${EDAMAM_API}?app_id=${EDAMAM_APP_ID}&app_key=${EDAMAM_APP_KEY}&ingr=${ingrQuery}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Nutrition API error');
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

// ---------- MODAL ----------
async function openModal(recipe) {
  const savedRatings = JSON.parse(localStorage.getItem(RATINGS_KEY)) || {};
  const rating = savedRatings[recipe.id] || 0;

  const nutrition = await fetchNutritionFromIngredients(recipe.ingredients);

  let nutritionHTML = '';
  if (nutrition && nutrition.totalWeight) {
    nutritionHTML = `
      <ul>
        <li>Calories: ${Math.round(nutrition.calories)}</li>
        <li>Fat: ${Math.round(nutrition.totalNutrients.FAT?.quantity || 0)}g</li>
        <li>Carbs: ${Math.round(nutrition.totalNutrients.CHOCDF?.quantity || 0)}g</li>
        <li>Protein: ${Math.round(nutrition.totalNutrients.PROCNT?.quantity || 0)}g</li>
      </ul>
    `;
  } else nutritionHTML = '<p>Nutrition info not available.</p>';

  modalBody.innerHTML = `
    <h2>${recipe.title}</h2>
    <img src="${recipe.img}" alt="${recipe.title}">
    <section><strong>Ingredients:</strong><ul>${recipe.ingredients.map(i=>`<li>${i}</li>`).join('')}</ul></section>
    <section><strong>Nutrition Facts:</strong>${nutritionHTML}</section>
    <section><strong>Instructions:</strong><ol>${recipe.instructions.map(i=>`<li>${i}</li>`).join('')}</ol></section>
    <section><strong>Rating:</strong>
      <div class="rating" data-id="${recipe.id}">
        ${[1,2,3,4,5].map(n=>`<span class="star" data-value="${n}">${n<=rating?'★':'☆'}</span>`).join('')}
      </div>
    </section>
  `;

  modalBody.querySelectorAll('.star').forEach(star=>{
    star.addEventListener('click', ()=>{
      const value = star.dataset.value;
      const id = star.parentElement.dataset.id;
      const saved = JSON.parse(localStorage.getItem(RATINGS_KEY)) || {};
      saved[id] = value;
      localStorage.setItem(RATINGS_KEY, JSON.stringify(saved));
      openModal(recipe);
    });
  });

  recipeModal.classList.remove('hidden');
}

// Close modal
modalClose.addEventListener('click', ()=>recipeModal.classList.add('hidden'));

// ---------- SEARCH ----------
function filterRecipes(query) {
  query = query.toLowerCase().trim();
  if (!query) return recipes;
  return recipes.filter(r =>
    r.title.toLowerCase().includes(query) ||
    r.description.toLowerCase().includes(query)
  );
}

searchBtn.addEventListener('click', ()=>renderRecipes(filterRecipes(searchInput.value)));
searchInput.addEventListener('keyup', e=>{
  if (e.key === 'Enter') renderRecipes(filterRecipes(searchInput.value));
});

// ---------- TOOLBAR ----------
randomBtn.addEventListener('click', ()=>{
  if (!recipes || recipes.length === 0) return;
  const randomIndex = Math.floor(Math.random() * recipes.length);
  openModal(recipes[randomIndex]);
});

favoritesBtn.addEventListener('click', ()=>{
  const showingFavorites = favoritesBtn.classList.toggle('active');
  let listToShow = recipes;
  if (searchInput.value.trim() !== '') listToShow = filterRecipes(searchInput.value);
  renderRecipes(showingFavorites ? listToShow.filter(r=>r.favorite) : listToShow);
});

// ---------- MEAL PLAN DRAG & DROP ----------
slots.forEach(slot=>{
  // Load saved
  slot.textContent = mealPlan[slot.dataset.day] || '';

  slot.addEventListener('dragover', e=>{
    e.preventDefault();
    slot.parentElement.classList.add('dragover');
  });

  slot.addEventListener('dragleave', e=>{
    slot.parentElement.classList.remove('dragover');
  });

  slot.addEventListener('drop', e=>{
    e.preventDefault();
    slot.parentElement.classList.remove('dragover');
    const recipeId = e.dataTransfer.getData('text/plain');
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
      slot.textContent = recipe.title;
      mealPlan[slot.dataset.day] = recipe.title;
      localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    }
  });
});

// ---------- INITIALIZE ----------
fetchRecipes();
document.getElementById('year').textContent = new Date().getFullYear();
document.getElementById('lastModified').textContent = `Last Modified: ${document.lastModified}`;

const quoteText = document.getElementById('quoteText');
const quoteLang = document.getElementById('quoteLang');
const newQuoteBtn = document.getElementById('newQuoteBtn');

// Quotes in multiple languages
const quotes = {
  en: [
    "The only way to do great work is to love what you do.",
    "Life is 10% what happens to us and 90% how we react to it.",
    "Happiness is not something ready made. It comes from your own actions."
  ],
  yo: [
    "Ọ̀nà kan ṣoṣo lati ṣe iṣẹ nla ni lati fẹran ohun ti o ṣe.",
    "Ìgbésí ayé jẹ́ 10% ohun tó ṣẹlẹ̀ sí wa àti 90% bí a ṣe ń fesi sí i.",
    "Ayọ̀ kì í ṣe ohun tí a ti ṣètò; ó wá láti iṣẹ́ wa."
  ],
  ig: [
    "Ụzọ naanị iji mee nnukwu ọrụ bụ ịhụ ọrụ gị n'anya.",
    "Ndụ bụ pasentị 10 ihe na-eme anyị na pasentị 90 otú anyị si emetụta ya.",
    "Ọṅụ abụghị ihe e kere eke; ọ si na omume anyị."
  ],
  ha: [
    "Hanya guda ɗaya don yin babban aiki shine ka so abin da kake yi.",
    "Rayuwa 10% abin da ke faruwa mana ne, 90% yadda muke mayar da martani.",
    "Farinciki ba abu ne da aka riga aka shirya ba, yana fitowa daga ayyukan mu."
  ],
  ef: [
    "Uforo ke esie emi ifiok ke idem mme idiok ifiok.",
    "Idem mme ufok ke 10% etiok adia emi, 90% ke ufok idem ete.",
    "Idim mmo ke idem mme idiok ifiok, enye ufok ikot ami."
  ],
  tv: [
    "Se ior u tar ikyase a tar ayim kpishi eren.",
    "Tsende i tar 10% eren, 90% i tar kwagh.",
    "Ayor u tar eren u tar veen tar tiv."
  ]
};

// Pick random quote
function getRandomQuote(lang = 'en') {
  const list = quotes[lang] || quotes['en'];
  const randomIndex = Math.floor(Math.random() * list.length);
  return list[randomIndex];
}

// Render quote with fade animation
function renderQuote() {
  const lang = quoteLang.value;
  quoteText.classList.add('fade-out');

  setTimeout(() => {
    quoteText.textContent = getRandomQuote(lang);
    quoteText.classList.remove('fade-out');
    quoteText.classList.add('fade-in');

    setTimeout(() => {
      quoteText.classList.remove('fade-in');
    }, 500);
  }, 300);
}

// Event listeners
quoteLang.addEventListener('change', renderQuote);
newQuoteBtn.addEventListener('click', renderQuote);

// Initial load
renderQuote();

