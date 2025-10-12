// ===== API Configuration =====
const MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';

// ===== Global State =====
let currentUser = null;
let favorites = [];
let mealPlan = {};
let currentRecipes = [];
let allRecipes = [];
let isLoading = false;
let isShowingFavorites = false;

// ===== Dashboard Persistence Configuration =====
const DASHBOARD_STORAGE_KEY = 'dashboardProgress';
let dashboardCleared = false;

// ===== DOM Elements =====
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const closeSidebar = document.getElementById('closeSidebar');
const backdrop = document.getElementById('backdrop');
const darkModeToggle = document.getElementById('darkModeToggle');
const logoutBtn = document.getElementById('logoutBtn');
const scrollTopBtn = document.getElementById('scrollTopBtn');
const recipeModal = document.getElementById('recipeModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const resetPlannerLink = document.getElementById('resetPlannerLink');
const searchInput = document.getElementById('searchInput');
const randomBtnToolbar = document.getElementById('randomBtnToolbar');
const favoritesToggle = document.getElementById('favoritesToggle');
const recipeList = document.getElementById('recipeList');
const resultCount = document.getElementById('resultCount');

// ===== Utility Functions =====
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// ===== Initialize App =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Set up event listeners
    setupEventListeners();
    
    // Load user data with dashboard persistence
    loadUserData();
    
    // Initialize UI components
    initializeWelcomeGreeting();
    initializeSidebar();
    initializeDarkMode();
    initializeFooter();
    initializeScrollToTop();
    
    // Initialize food quotes
    initializeFoodQuotes();
    
    // Load content
    loadRecipes();
    updateDashboard();
    updateDailyTip();
    
    console.log('Recipe Finder App initialized successfully!');
}

// ===== Dashboard Persistence Functions =====
function saveDashboardProgress() {
    if (dashboardCleared) {
        // Don't save progress if dashboard was explicitly cleared
        return;
    }
    
    const progressData = {
        favorites: favorites,
        mealPlan: mealPlan,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(progressData));
    console.log('Dashboard progress saved');
}

function loadDashboardProgress() {
    const savedProgress = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    
    if (savedProgress) {
        try {
            const progressData = JSON.parse(savedProgress);
            
            // Only load progress if it's not too old (optional: you can remove this check)
            const lastUpdated = new Date(progressData.lastUpdated);
            const daysSinceUpdate = (new Date() - lastUpdated) / (1000 * 60 * 60 * 24);
            
            if (daysSinceUpdate < 30) { // Keep progress for 30 days
                favorites = progressData.favorites || favorites;
                mealPlan = progressData.mealPlan || mealPlan;
                console.log('Dashboard progress loaded from storage');
            } else {
                console.log('Dashboard progress expired, using defaults');
            }
        } catch (error) {
            console.error('Error loading dashboard progress:', error);
        }
    }
}

function clearDashboardProgress() {
    dashboardCleared = true;
    localStorage.removeItem(DASHBOARD_STORAGE_KEY);
    console.log('Dashboard progress cleared');
}

// ===== Event Listeners =====
function setupEventListeners() {
    // Sidebar toggle
    menuBtn?.addEventListener('click', () => toggleSidebar(true));
    closeSidebar?.addEventListener('click', () => toggleSidebar(false));
    backdrop?.addEventListener('click', () => toggleSidebar(false));
    
    // Dark mode toggle
    darkModeToggle?.addEventListener('click', toggleDarkMode);
    
    // Logout
    logoutBtn?.addEventListener('click', handleLogout);
    
    // Scroll to top
    scrollTopBtn?.addEventListener('click', scrollToTop);
    window.addEventListener('scroll', toggleScrollTopButton);
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
    
    // Random recipe button
    if (randomBtnToolbar) {
        randomBtnToolbar.addEventListener('click', getRandomRecipe);
    }
    
    // Favorites toggle
    if (favoritesToggle) {
        favoritesToggle.addEventListener('click', toggleFavoritesView);
    }
    
    // Day buttons in meal planner
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const day = this.parentElement.dataset.day;
            toggleDayMeals(day);
        });
    });
    
    // Reset planner
    if (resetPlannerLink) {
        resetPlannerLink.addEventListener('click', resetPlanner);
    }
    
    // Modal close
    if (modalClose && recipeModal) {
        modalClose.addEventListener('click', () => closeModal());
        recipeModal.addEventListener('click', (e) => {
            if (e.target === recipeModal) closeModal();
        });
    }
    
    // Escape key to close modals and sidebar
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!recipeModal.classList.contains('hidden')) {
                closeModal();
            }
            if (sidebar.classList.contains('open')) {
                toggleSidebar(false);
            }
        }
    });
}

// ===== Sidebar Functions =====
function initializeSidebar() {
    let lastFocusedElement = null;

    function toggleSidebar(open) {
        if (!sidebar || !backdrop) return;
        
        if (open) {
            lastFocusedElement = document.activeElement;
            sidebar.classList.add('open');
            backdrop.classList.add('show');
            sidebar.setAttribute('aria-hidden', 'false');
            closeSidebar?.focus();
            document.body.classList.add('no-scroll');
        } else {
            sidebar.classList.remove('open');
            backdrop.classList.remove('show');
            sidebar.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
            if (lastFocusedElement) lastFocusedElement.focus();
        }
    }

    // Add event listeners for sidebar
    if (menuBtn) {
        menuBtn.addEventListener('click', () => toggleSidebar(true));
    }
    
    if (closeSidebar) {
        closeSidebar.addEventListener('click', () => toggleSidebar(false));
    }
    
    if (backdrop) {
        backdrop.addEventListener('click', () => toggleSidebar(false));
    }

    // Close sidebar when clicking on navigation links
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', () => toggleSidebar(false));
    });

    // Close sidebar with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            toggleSidebar(false);
        }
    });

    // Expose toggle function globally if needed
    window.toggleSidebar = toggleSidebar;
}

// ===== Dark Mode Functions =====
function initializeDarkMode() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('darkMode');
    
    if (savedTheme === 'true' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-mode');
        darkModeToggle.setAttribute('aria-pressed', 'true');
        darkModeToggle.innerHTML = '<i data-lucide="sun"></i>';
        lucide.createIcons();
    }
}

function toggleDarkMode() {
    const isDark = document.body.classList.toggle('dark-mode');
    localStorage.setItem('darkMode', isDark);
    
    // Update icon
    const icon = isDark ? 'sun' : 'moon';
    darkModeToggle.innerHTML = `<i data-lucide="${icon}"></i>`;
    darkModeToggle.setAttribute('aria-pressed', isDark);
    lucide.createIcons();
}

// ===== Footer Functions =====
function initializeFooter() {
    const yearEl = document.getElementById('year');
    const lastModifiedEl = document.getElementById('lastModified');
    if (yearEl) yearEl.textContent = new Date().getFullYear();
    if (lastModifiedEl) lastModifiedEl.textContent = `Last modified: ${document.lastModified || "—"}`;
}

// ===== Scroll Functions =====
function initializeScrollToTop() {
    window.addEventListener('scroll', toggleScrollTopButton);
}

function toggleScrollTopButton() {
    if (!scrollTopBtn) return;
    
    if (window.scrollY > 400) {
        scrollTopBtn.classList.add('show');
    } else {
        scrollTopBtn.classList.remove('show');
    }
}

function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// ===== User Management =====
function loadUserData() {
    const savedUser = localStorage.getItem('currentUser');
    const savedFavorites = localStorage.getItem('favorites');
    const savedMealPlan = localStorage.getItem('mealPlan');
    
    currentUser = savedUser ? JSON.parse(savedUser) : { name: 'Henry', email: 'guest@example.com' };
    
    // Load dashboard progress (favorites and meal plan)
    loadDashboardProgress();
    
    // Only use localStorage data if dashboard progress wasn't loaded
    if (favorites.length === 0) {
        favorites = savedFavorites ? JSON.parse(savedFavorites) : [];
    }
    if (Object.keys(mealPlan).length === 0) {
        mealPlan = savedMealPlan ? JSON.parse(savedMealPlan) : {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
        };
    }
    
    updateUserUI();
}

function updateUserUI() {
    // Update sidebar
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    if (sidebarName) sidebarName.textContent = currentUser.name;
    if (sidebarEmail) sidebarEmail.textContent = currentUser.email;
}

function handleLogout() {
    if (confirm('Are you sure you want to sign out?')) {
        // Clear all user data including dashboard progress
        localStorage.removeItem('currentUser');
        localStorage.removeItem('favorites');
        localStorage.removeItem('mealPlan');
        clearDashboardProgress();
        window.location.href = 'index.html';
    }
}

// ===== Welcome Dashboard Functions =====
function initializeWelcomeGreeting() {
    const welcomeCard = document.querySelector('.welcome-card');
    const greeting = document.getElementById('greeting');
    const btnEmoji = document.getElementById('btnEmoji');

    if (!welcomeCard || !greeting) return;

    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    greeting.textContent = `${timeGreeting}, ${currentUser?.name || 'Henry'} ${hour < 12 ? '🌅' : hour < 18 ? '☀️' : '🌙'}`;

    const emojis = ['🥗','🍲','🥑','🍎','🍕','🍛','🍤','🍞','🥕','🍇'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    welcomeCard.setAttribute('data-emoji', randomEmoji);
    if (btnEmoji) btnEmoji.textContent = randomEmoji;
}

// ===== Food Quotes System =====
function initializeFoodQuotes() {
    const quotes = [
        "Healthy meals, happy life 🥦",
        "Good food fuels great days 💪",
        "Eat better, live better 🌱",
        "Every bite counts 🍴",
        "Food is the ingredient that binds us together 🍜",
        "Small bites, big changes 🥕",
        "Hydrate, nourish, glow 💧",
        "Your body deserves the best 🥗",
        "Cooking is love made visible ❤️",
        "Savor the flavor of wellness 🍋"
    ];
    
    const quoteElement = document.getElementById('foodQuote');
    if (!quoteElement) return;
    
    let currentQuoteIndex = 0;
    
    function rotateQuote() {
        // Fade out current quote
        quoteElement.style.opacity = '0';
        quoteElement.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            // Change to next quote
            currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
            quoteElement.textContent = quotes[currentQuoteIndex];
            
            // Fade in new quote
            setTimeout(() => {
                quoteElement.style.opacity = '1';
                quoteElement.style.transform = 'translateY(0)';
            }, 50);
        }, 500);
    }
    
    // Start with a random quote
    currentQuoteIndex = Math.floor(Math.random() * quotes.length);
    quoteElement.textContent = quotes[currentQuoteIndex];
    
    // Rotate every 4 seconds
    setInterval(rotateQuote, 4000);
}

// ===== Enhanced Recipe Functions - 30 Recipes =====
async function loadRecipes() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoadingState();
        
        // Fetch 30 random recipes
        const recipes = await getRandomRecipes(30);
        allRecipes = recipes;
        currentRecipes = recipes;
        displayRecipes(recipes);
        
        showToast(`Loaded ${recipes.length} delicious recipes! 🍴`);
        
    } catch (error) {
        console.error('Error loading recipes:', error);
        showErrorState('Failed to load recipes. Please check your connection and try again.');
    } finally {
        isLoading = false;
    }
}

async function getRandomRecipes(count = 30) {
    const recipes = [];
    const uniqueIds = new Set();
    
    try {
        // Use multiple approaches to get diverse recipes
        const categories = ['Seafood', 'Chicken', 'Beef', 'Vegetarian', 'Dessert', 'Pasta', 'Breakfast', 'Side', 'Miscellaneous'];
        
        // Fetch from multiple categories first
        for (let i = 0; i < Math.min(15, count); i++) {
            const category = categories[i % categories.length];
            try {
                const response = await fetch(`${MEALDB_BASE}/filter.php?c=${category}`);
                const data = await response.json();
                
                if (data.meals) {
                    // Get random meals from this category
                    const shuffled = data.meals.sort(() => 0.5 - Math.random());
                    const selected = shuffled.slice(0, 2);
                    
                    for (const meal of selected) {
                        if (recipes.length >= count) break;
                        if (!uniqueIds.has(meal.idMeal)) {
                            const detailResponse = await fetch(`${MEALDB_BASE}/lookup.php?i=${meal.idMeal}`);
                            const detailData = await detailResponse.json();
                            if (detailData.meals && detailData.meals[0]) {
                                uniqueIds.add(meal.idMeal);
                                recipes.push(detailData.meals[0]);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error fetching ${category} recipes:`, error);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Fill remaining with random recipes
        const remaining = count - recipes.length;
        for (let i = 0; i < remaining; i++) {
            try {
                const response = await fetch(`${MEALDB_BASE}/random.php`);
                const data = await response.json();
                
                if (data.meals && data.meals[0] && !uniqueIds.has(data.meals[0].idMeal)) {
                    uniqueIds.add(data.meals[0].idMeal);
                    recipes.push(data.meals[0]);
                }
            } catch (error) {
                console.error('Error fetching random recipe:', error);
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
    } catch (error) {
        console.error('Error in getRandomRecipes:', error);
        // Return fallback recipes if API fails
        return getFallbackRecipes(count);
    }
    
    return recipes.slice(0, count);
}

function getFallbackRecipes(count = 30) {
    const fallbackRecipes = [
        {
            idMeal: "1", strMeal: "Classic Pancakes", strMealThumb: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=300&fit=crop",
            strArea: "American", strCategory: "Breakfast", strInstructions: "Mix flour, eggs, milk, and baking powder. Cook on griddle until golden brown."
        },
        {
            idMeal: "2", strMeal: "Vegetable Stir Fry", strMealThumb: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop",
            strArea: "Asian", strCategory: "Main Course", strInstructions: "Stir fry vegetables with soy sauce and serve with rice."
        },
        {
            idMeal: "3", strMeal: "Chocolate Chip Cookies", strMealThumb: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=300&fit=crop",
            strArea: "American", strCategory: "Dessert", strInstructions: "Cream butter and sugar, add eggs and vanilla, mix in flour and chocolate chips."
        },
        {
            idMeal: "4", strMeal: "Grilled Salmon", strMealThumb: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop",
            strArea: "Mediterranean", strCategory: "Main Course", strInstructions: "Season salmon with herbs and grill until flaky."
        },
        {
            idMeal: "5", strMeal: "Caesar Salad", strMealThumb: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop",
            strArea: "Italian", strCategory: "Salad", strInstructions: "Toss romaine lettuce with Caesar dressing, croutons, and parmesan."
        }
    ];
    
    // Duplicate and modify fallback recipes to reach count
    const recipes = [];
    for (let i = 0; i < count; i++) {
        const original = fallbackRecipes[i % fallbackRecipes.length];
        const recipe = {
            ...original,
            idMeal: (i + 1).toString(),
            strMeal: `${original.strMeal} ${Math.floor(i / fallbackRecipes.length) + 1}`
        };
        recipes.push(recipe);
    }
    
    return recipes;
}

function displayRecipes(recipes) {
    if (!recipeList) return;
    
    if (recipes.length === 0) {
        recipeList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="search" class="empty-icon"></i>
                <h3>No recipes found</h3>
                <p>Try adjusting your search terms or browse all recipes.</p>
                <button class="btn btn-primary" onclick="loadRecipes()">
                    <i data-lucide="refresh-cw"></i> Load 30 Recipes
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    recipeList.innerHTML = recipes.map((recipe, index) => {
        if (!recipe) return '';
        
        // Determine difficulty based on ingredients count
        const ingredientCount = getIngredientCount(recipe);
        const difficulty = getDifficulty(ingredientCount);
        const difficultyClass = `difficulty-${difficulty.level}`;
        const isFav = isFavorite(recipe.idMeal);
        
        return `
            <div class="recipe-card" data-id="${recipe.idMeal}" style="animation-delay: ${index * 0.05}s">
                <div class="recipe-image-container">
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-image" loading="lazy">
                    <div class="recipe-overlay"></div>
                    <div class="difficulty-badge ${difficultyClass}">
                        ${difficulty.level}
                    </div>
                </div>
                
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.strMeal}</h3>
                    
                    <div class="recipe-meta">
                        <span class="recipe-cuisine">
                            <i data-lucide="map-pin"></i>
                            ${recipe.strArea || 'International'}
                        </span>
                        <span class="recipe-category">
                            <i data-lucide="tag"></i>
                            ${recipe.strCategory || 'Main Course'}
                        </span>
                    </div>
                    
                    <div class="recipe-actions">
                        <button class="btn-view view-recipe" data-id="${recipe.idMeal}">
                            <i data-lucide="eye"></i>
                            View Recipe
                        </button>
                        <button class="btn-favorite favorite-btn ${isFav ? 'active' : ''}" 
                                data-id="${recipe.idMeal}" 
                                aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                            <i data-lucide="heart"></i>
                        </button>
                    </div>
                </div>
                
                <div class="recipe-stats">
                    <span class="stat-item">
                        <i data-lucide="clock"></i>
                        ${difficulty.time}
                    </span>
                    <span class="stat-item">
                        <i data-lucide="list"></i>
                        ${ingredientCount} ingredients
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    if (resultCount) {
        resultCount.textContent = recipes.length;
        // Add animation to result count
        resultCount.style.transform = 'scale(1.2)';
        setTimeout(() => {
            resultCount.style.transform = 'scale(1)';
        }, 300);
    }
    
    // Add event listeners
    addRecipeEventListeners();
    lucide.createIcons();
}

function getIngredientCount(recipe) {
    let count = 0;
    for (let i = 1; i <= 20; i++) {
        if (recipe[`strIngredient${i}`] && recipe[`strIngredient${i}`].trim()) {
            count++;
        }
    }
    return count;
}

function getDifficulty(ingredientCount) {
    if (ingredientCount <= 5) {
        return { level: 'easy', time: '15-30 min' };
    } else if (ingredientCount <= 8) {
        return { level: 'medium', time: '30-45 min' };
    } else {
        return { level: 'hard', time: '45+ min' };
    }
}

function addRecipeEventListeners() {
    if (!recipeList) return;
    
    recipeList.querySelectorAll('.view-recipe').forEach(btn => {
        btn.addEventListener('click', function() {
            viewRecipe(this.dataset.id);
        });
    });
    
    recipeList.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            toggleFavorite(this.dataset.id);
        });
    });
}

// ===== Favorite Functionality =====
function toggleFavorite(recipeId) {
    const favoriteBtn = document.querySelector(`.favorite-btn[data-id="${recipeId}"]`);
    const recipe = allRecipes.find(r => r.idMeal === recipeId);
    
    if (!recipe) return;
    
    const isCurrentlyFavorite = isFavorite(recipeId);
    
    if (isCurrentlyFavorite) {
        // Remove from favorites
        favorites = favorites.filter(fav => fav.idMeal !== recipeId);
        favoriteBtn.classList.remove('active');
        favoriteBtn.setAttribute('aria-label', 'Add to favorites');
        showToast('Recipe removed from favorites 💔');
    } else {
        // Add to favorites
        favorites.push(recipe);
        favoriteBtn.classList.add('active');
        favoriteBtn.setAttribute('aria-label', 'Remove from favorites');
        showToast('Recipe added to favorites! ❤️');
        
        // Add heart beat animation
        favoriteBtn.classList.add('pulse');
        setTimeout(() => {
            favoriteBtn.classList.remove('pulse');
        }, 400);
    }
    
    saveFavorites();
    saveDashboardProgress(); // Save dashboard progress when favorites change
    updateDashboard();
    
    // Update modal favorite button if modal is open
    updateModalFavoriteButton(recipeId);
}

function updateModalFavoriteButton(recipeId) {
    const modalFavoriteBtn = document.querySelector('#recipeModal .modal-favorite-btn');
    if (modalFavoriteBtn && modalFavoriteBtn.dataset.id === recipeId) {
        const isNowFavorite = isFavorite(recipeId);
        modalFavoriteBtn.classList.toggle('active', isNowFavorite);
        modalFavoriteBtn.innerHTML = `
            <i data-lucide="heart"></i>
            ${isNowFavorite ? 'Remove Favorite' : 'Add to Favorites'}
        `;
        modalFavoriteBtn.setAttribute('aria-label', isNowFavorite ? 'Remove from favorites' : 'Add to favorites');
        lucide.createIcons();
    }
}

function isFavorite(recipeId) {
    return favorites.some(fav => fav.idMeal === recipeId);
}

// ===== Search Functionality =====
function handleSearch(event) {
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        currentRecipes = allRecipes;
        displayRecipes(currentRecipes);
        return;
    }
    
    const filteredRecipes = allRecipes.filter(recipe => 
        recipe.strMeal.toLowerCase().includes(searchTerm) ||
        (recipe.strArea && recipe.strArea.toLowerCase().includes(searchTerm)) ||
        (recipe.strCategory && recipe.strCategory.toLowerCase().includes(searchTerm))
    );
    
    currentRecipes = filteredRecipes;
    displayRecipes(filteredRecipes);
}

// ===== Random Recipe =====
async function getRandomRecipe() {
    try {
        const response = await fetch(`${MEALDB_BASE}/random.php`);
        const data = await response.json();
        
        if (data.meals && data.meals[0]) {
            showRecipeModal(data.meals[0]);
        }
    } catch (error) {
        console.error('Error fetching random recipe:', error);
        showToast('Failed to load random recipe. Please try again.', 'error');
    }
}

// ===== Favorites View =====
function toggleFavoritesView() {
    if (favoritesToggle.textContent.includes('Favorites')) {
        // Show favorites
        currentRecipes = favorites;
        favoritesToggle.innerHTML = '<i data-lucide="list"></i> All Recipes';
        showToast(`Showing ${favorites.length} favorite recipes ❤️`);
    } else {
        // Show all recipes
        currentRecipes = allRecipes;
        favoritesToggle.innerHTML = '<i data-lucide="heart"></i> Favorites';
        showToast('Showing all recipes 📚');
    }
    
    displayRecipes(currentRecipes);
    lucide.createIcons();
}

// ===== Enhanced Recipe Modal with Automatic Meal Planning =====
function showRecipeModal(recipe) {
    if (!recipeModal || !modalBody) return;
    
    // Format ingredients
    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const ingredient = recipe[`strIngredient${i}`];
        const measure = recipe[`strMeasure${i}`];
        
        if (ingredient && ingredient.trim()) {
            ingredients.push({ 
                ingredient: ingredient.trim(), 
                measure: (measure || '').trim() 
            });
        }
    }
    
    const isInFavorites = isFavorite(recipe.idMeal);
    
    modalBody.innerHTML = `
        <div class="recipe-modal-content">
            <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="modal-recipe-image" loading="lazy">
            <div class="modal-body">
                <h2>${recipe.strMeal}</h2>
                
                <div class="recipe-meta-modal">
                    <span class="recipe-meta-item">
                        <i data-lucide="map-pin"></i>
                        ${recipe.strArea || 'International'}
                    </span>
                    <span class="recipe-meta-item">
                        <i data-lucide="tag"></i>
                        ${recipe.strCategory || 'Main Course'}
                    </span>
                    <span class="recipe-meta-item">
                        <i data-lucide="clock"></i>
                        ${getDifficulty(getIngredientCount(recipe)).time}
                    </span>
                </div>
                
                ${ingredients.length > 0 ? `
                <div style="margin-bottom: 2rem;">
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="list"></i>
                        Ingredients (${ingredients.length})
                    </h3>
                    <ul style="columns: 2; gap: 1rem; list-style: none; padding: 0;">
                        ${ingredients.map(item => `
                            <li style="padding: 0.5rem 0; border-bottom: 1px solid var(--border); break-inside: avoid;">
                                <span style="font-weight: 500; color: var(--green);">${item.measure}</span> ${item.ingredient}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${recipe.strInstructions ? `
                <div>
                    <h3 style="display: flex; align-items: center; gap: 0.5rem;">
                        <i data-lucide="book-open"></i>
                        Instructions
                    </h3>
                    <div style="line-height: 1.6; color: var(--text);">
                        ${recipe.strInstructions.split('\n').filter(step => step.trim()).map(step => `
                            <p style="margin-bottom: 1rem; padding: 0.5rem 0; border-bottom: 1px solid var(--border);">
                                ${step.trim()}
                            </p>
                        `).join('')}
                    </div>
                </div>
                ` : '<p style="color: var(--muted); font-style: italic;">No instructions available for this recipe.</p>'}
                
                <div class="modal-actions">
                    <button id="autoAddToPlan" class="btn btn-primary">
                        <i data-lucide="calendar-plus"></i>
                        Auto-Add to Meal Plan
                    </button>
                    <button class="modal-favorite-btn ${isInFavorites ? 'active' : ''}" 
                            data-id="${recipe.idMeal}" 
                            id="modalFavoriteBtn">
                        <i data-lucide="heart"></i>
                        ${isInFavorites ? 'Remove Favorite' : 'Add to Favorites'}
                    </button>
                    ${recipe.strYoutube ? `
                        <a href="${recipe.strYoutube}" target="_blank" rel="noopener" class="btn btn-outline">
                            <i data-lucide="play-circle"></i>
                            Watch Video
                        </a>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Add event listener for favorite button in modal
    const favoriteBtn = document.getElementById('modalFavoriteBtn');
    if (favoriteBtn) {
        favoriteBtn.addEventListener('click', function() {
            toggleFavorite(this.dataset.id);
            // Update modal button state
            const isNowFavorite = isFavorite(recipe.idMeal);
            this.classList.toggle('active', isNowFavorite);
            this.innerHTML = `
                <i data-lucide="heart"></i>
                ${isNowFavorite ? 'Remove Favorite' : 'Add to Favorites'}
            `;
            lucide.createIcons();
        });
    }
    
    // Add event listener for auto-add to plan button
    const autoAddBtn = document.getElementById('autoAddToPlan');
    if (autoAddBtn) {
        autoAddBtn.addEventListener('click', function() {
            autoAddToMealPlan(recipe.strMeal, recipe.idMeal);
        });
    }
    
    showModal();
    lucide.createIcons();
    
    // Scroll modal to top
    modalBody.scrollTop = 0;
}

function showModal() {
    recipeModal.classList.remove('hidden');
    setTimeout(() => {
        recipeModal.classList.add('show');
    }, 10);
}

function closeModal() {
    recipeModal.classList.remove('show');
    setTimeout(() => {
        recipeModal.classList.add('hidden');
    }, 300);
}

// ===== Automatic Meal Planning System =====
function autoAddToMealPlan(recipeName, recipeId) {
    // Find the first available day with less than 3 meals
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    let availableDay = null;
    
    for (const day of days) {
        if (!mealPlan[day]) {
            mealPlan[day] = [];
        }
        
        // Check if meal already exists in any day
        const existingMeal = Object.values(mealPlan).flat().find(meal => meal.id === recipeId);
        if (existingMeal) {
            showToast(`"${recipeName}" is already in your meal plan!`, 'error');
            closeModal();
            return;
        }
        
        // Find day with available slot (max 3 meals per day)
        if (mealPlan[day].length < 3) {
            availableDay = day;
            break;
        }
    }
    
    if (availableDay) {
        // Add to the available day
        mealPlan[availableDay].push({
            name: recipeName,
            id: recipeId,
            added: new Date().toISOString()
        });
        
        saveMealPlan();
        saveDashboardProgress(); // Save dashboard progress when meal plan changes
        updateDashboard();
        updateMealPlanDisplay();
        
        showToast(`"${recipeName}" automatically added to ${availableDay.charAt(0).toUpperCase() + availableDay.slice(1)}! 📅`);
        closeModal();
    } else {
        // All days are full
        showToast('All days are full! Remove some meals or reset your plan.', 'error');
    }
}

// ===== Meal Plan Management =====
function updateMealPlanDisplay() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    
    days.forEach(day => {
        const meals = mealPlan[day] || [];
        const mealList = document.getElementById(`${day}Meals`);
        const mealCount = document.querySelector(`[data-day="${day}"] .meal-count`);
        
        if (mealCount) {
            mealCount.textContent = meals.length;
        }
        
        if (mealList) {
            mealList.innerHTML = '';
            meals.forEach((meal, index) => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${meal.name}</span>
                    <div class="meal-actions">
                        <button class="icon-btn remove-meal" data-day="${day}" data-index="${index}" aria-label="Remove ${meal.name}">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                `;
                mealList.appendChild(li);
            });
            
            // Add event listeners to remove buttons
            mealList.querySelectorAll('.remove-meal').forEach(btn => {
                btn.addEventListener('click', function() {
                    removeMealFromPlan(this.dataset.day, parseInt(this.dataset.index));
                });
            });
            
            lucide.createIcons();
        }
    });
}

function toggleDayMeals(day) {
    const mealList = document.getElementById(`${day}Meals`);
    if (mealList) {
        mealList.classList.toggle('expanded');
    }
}

function removeMealFromPlan(day, index) {
    if (mealPlan[day] && mealPlan[day][index]) {
        const mealName = mealPlan[day][index].name;
        mealPlan[day].splice(index, 1);
        saveMealPlan();
        saveDashboardProgress(); // Save dashboard progress when meal is removed
        updateDashboard();
        showToast(`Removed ${mealName} from ${day}`);
    }
}

function resetPlanner(e) {
    if (e) e.preventDefault();
    if (confirm('♻️ Are you sure you want to reset your meal plan?')) {
        mealPlan = {
            monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
        };
        saveMealPlan();
        clearDashboardProgress(); // Clear dashboard progress when planner is reset
        updateDashboard();
        updateMealPlanDisplay();
        showToast('Meal plan reset successfully!');
    }
}

// ===== Save/Load Data =====
function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function saveMealPlan() {
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
}

// ===== Dashboard Functions =====
function updateDashboard() {
    // Update favorites count
    const favoritesEl = document.getElementById('favorites');
    if (favoritesEl) {
        favoritesEl.textContent = favorites.length;
    }
    
    // Update planned meals count
    const plannedMeals = Object.values(mealPlan).reduce((total, day) => total + (day ? day.length : 0), 0);
    const plannedMealsEl = document.getElementById('plannedMeals');
    if (plannedMealsEl) {
        plannedMealsEl.textContent = plannedMeals;
    }
    
    // Update progress
    const daysWithMeals = Object.values(mealPlan).filter(day => day && day.length > 0).length;
    const progress = Math.min(Math.round((daysWithMeals / 5) * 100), 100);
    const progressEl = document.getElementById('progress');
    if (progressEl) {
        progressEl.textContent = `${progress}%`;
    }
}

// ===== Enhanced Daily Tip System =====
function updateDailyTip() {
    const tips = [
        "💡 Eat a colorful plate for better nutrition!",
        "💡 Drink plenty of water throughout the day",
        "💡 Include protein in every meal",
        "💡 Don't skip breakfast - it's important!",
        "💡 Cook with herbs and spices instead of salt",
        "💡 Plan your meals for the week ahead",
        "💡 Eat slowly and mindfully",
        "💡 Include healthy fats in your diet",
        "💡 Try meal prepping on weekends",
        "💡 Listen to your body's hunger cues"
    ];
    
    const dailyTip = document.getElementById('dailyTip');
    if (dailyTip) {
        // Change tip every hour for variety
        const now = new Date();
        const tipIndex = (now.getHours() + now.getDate()) % tips.length;
        const randomTip = tips[tipIndex];
        dailyTip.textContent = randomTip;
    }
}

// ===== UI Helpers =====
function showLoadingState() {
    if (!recipeList) return;
    
    recipeList.innerHTML = `
        <div class="empty-state">
            <div class="loading-spinner"></div>
            <h3>Loading 30 Delicious Recipes</h3>
            <p>Discovering new culinary adventures for you...</p>
            <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                <div class="loading-dot" style="animation-delay: 0s"></div>
                <div class="loading-dot" style="animation-delay: 0.2s"></div>
                <div class="loading-dot" style="animation-delay: 0.4s"></div>
            </div>
        </div>
    `;
}

function showErrorState(message) {
    if (!recipeList) return;
    
    recipeList.innerHTML = `
        <div class="empty-state">
            <i data-lucide="alert-circle" class="empty-icon"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="btn btn-primary" onclick="loadRecipes()">
                <i data-lucide="refresh-cw"></i> Try Again
            </button>
        </div>
    `;
    lucide.createIcons();
}

function showToast(message, type = 'success') {
    // Remove existing toast
    const existingToast = document.getElementById('appToast');
    if (existingToast) {
        existingToast.remove();
    }
    
    const toast = document.createElement('div');
    toast.id = 'appToast';
    toast.className = `toast ${type === 'error' ? 'error' : ''}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}" class="toast-icon"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(toast);
    lucide.createIcons();
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

// ===== Recipe View Function =====
function viewRecipe(recipeId) {
    const recipe = allRecipes.find(r => r.idMeal === recipeId);
    if (recipe) {
        showRecipeModal(recipe);
    } else {
        console.error('Recipe not found:', recipeId);
        showToast('Recipe not found. Please try again.', 'error');
    }
}

// ===== Global Exports =====
window.loadRecipes = loadRecipes;
window.getRandomRecipe = getRandomRecipe;
window.toggleFavoritesView = toggleFavoritesView;
window.resetPlanner = resetPlanner;
window.viewRecipe = viewRecipe;

// Update tip rotation to happen hourly
setInterval(updateDailyTip, 60 * 60 * 1000);

// ===== Mobile Hero Optimization =====
function optimizeHeroForMobile() {
  const hero = document.getElementById('hero');
  if (!hero) return;
  
  // Check if mobile device
  const isMobile = window.innerWidth <= 768;
  const isVerySmall = window.innerWidth <= 360;
  
  if (isMobile) {
    // Add mobile-specific class
    hero.classList.add('hero-mobile');
    
    // Adjust content for very small screens
    if (isVerySmall) {
      hero.classList.add('hero-very-small');
      
      // Optional: Dynamically adjust content
      const heroTitle = document.querySelector('.hero-title');
      if (heroTitle) {
        // Ensure text fits on very small screens
        heroTitle.style.fontSize = '1.6rem';
        heroTitle.style.lineHeight = '1.3';
      }
    }
  }
  
  // Handle orientation changes
  function handleOrientation() {
    if (window.innerHeight < 500 && window.matchMedia('(orientation: landscape)').matches) {
      hero.classList.add('hero-landscape');
    } else {
      hero.classList.remove('hero-landscape');
    }
  }
  
  // Listen for orientation changes
  window.addEventListener('resize', handleOrientation);
  window.addEventListener('orientationchange', handleOrientation);
  
  // Initial check
  handleOrientation();
}

// Initialize mobile optimizations
document.addEventListener('DOMContentLoaded', function() {
  optimizeHeroForMobile();
});

// Re-optimize on resize
window.addEventListener('resize', optimizeHeroForMobile);

// ===== Sidebar Functions for Profile Page =====
function loadUserData() {
    const savedName = localStorage.getItem('profileName');
    const savedEmail = localStorage.getItem('profileEmail');
    
    if (savedName) {
        document.getElementById('sidebarName').textContent = savedName;
    }
    
    if (savedEmail) {
        document.getElementById('sidebarEmail').textContent = savedEmail;
    }
}

function setActivePage() {
    const currentPage = window.location.pathname.split('/').pop();
    const navLinks = document.querySelectorAll('.sidebar nav a');
    
    navLinks.forEach(link => {
        const linkHref = link.getAttribute('href');
        if (linkHref === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Utility function to show notifications
function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : 'alert-circle'}"></i>
        <span>${message}</span>
        <button class="notification-close">
            <i data-lucide="x"></i>
        </button>
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Initialize icons
    lucide.createIcons();
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Close button functionality
    const closeBtn = notification.querySelector('.notification-close');
    closeBtn.addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }
    }, 5000);
}


// Main JavaScript for sidebar functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // DOM Elements
    const menuToggle = document.getElementById('menuToggle');
    const closeSidebar = document.getElementById('closeSidebar');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // Toggle Sidebar
    menuToggle.addEventListener('click', function() {
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });
    
    // Close Sidebar
    function closeSidebarFunc() {
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    closeSidebar.addEventListener('click', closeSidebarFunc);
    overlay.addEventListener('click', closeSidebarFunc);
    
    // Logout Functionality
    logoutBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to sign out?')) {
            // Clear user session data including dashboard progress
            localStorage.removeItem('userToken');
            localStorage.removeItem('userName');
            localStorage.removeItem('userEmail');
            clearDashboardProgress();
            
            // Redirect to login page or home page
            window.location.href = 'index.html';
        }
    });
    
    // Close sidebar when clicking on a link (mobile)
    const sidebarLinks = document.querySelectorAll('.sidebar nav a');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (window.innerWidth < 768) {
                closeSidebarFunc();
            }
        });
    });
    
    // Load user data for sidebar
    function loadSidebarUserData() {
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        
        if (userName) {
            document.getElementById('sidebarName').textContent = userName;
        }
        
        if (userEmail) {
            document.getElementById('sidebarEmail').textContent = userEmail;
        }
    }
    
    // Initialize
    loadSidebarUserData();
    
    // Keyboard accessibility
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar.classList.contains('active')) {
            closeSidebarFunc();
        }
    });
});

// ===== Page Detection Helper =====
function isIndexPage() {
    return window.location.pathname.endsWith('index.html') || 
           window.location.pathname.endsWith('/') || 
           window.location.pathname === '';
}

// ===== Enhanced Recipe Functions - 30 Recipes (Modified for Index Page Only) =====
async function loadRecipes() {
    // Only fetch 30 recipes on the index page
    if (!isIndexPage()) {
        console.log('Not on index page - skipping 30 recipes load');
        return;
    }
    
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoadingState();
        
        // Fetch 30 random recipes (only on index page)
        const recipes = await getRandomRecipes(30);
        allRecipes = recipes;
        currentRecipes = recipes;
        displayRecipes(recipes);
        
        showToast(`Loaded ${recipes.length} delicious recipes! 🍴`);
        
    } catch (error) {
        console.error('Error loading recipes:', error);
        showErrorState('Failed to load recipes. Please check your connection and try again.');
    } finally {
        isLoading = false;
    }
}

// ===== Modified Display Recipes for Index Page Only =====
function displayRecipes(recipes) {
    if (!recipeList) return;
    
    // Check if we're on a page that should show recipes
    if (!isIndexPage()) {
        recipeList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="book-open" class="empty-icon"></i>
                <h3>Browse Recipes</h3>
                <p>Use the navigation to explore different recipe sections.</p>
                <a href="recipes.html" class="btn btn-primary">
                    <i data-lucide="chef-hat"></i> View All Recipes
                </a>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    // Rest of your existing displayRecipes code...
    if (recipes.length === 0) {
        recipeList.innerHTML = `
            <div class="empty-state">
                <i data-lucide="search" class="empty-icon"></i>
                <h3>No recipes found</h3>
                <p>Try adjusting your search terms or browse all recipes.</p>
                <button class="btn btn-primary" onclick="loadRecipes()">
                    <i data-lucide="refresh-cw"></i> Load 30 Recipes
                </button>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    recipeList.innerHTML = recipes.map((recipe, index) => {
        if (!recipe) return '';
        
        // Determine difficulty based on ingredients count
        const ingredientCount = getIngredientCount(recipe);
        const difficulty = getDifficulty(ingredientCount);
        const difficultyClass = `difficulty-${difficulty.level}`;
        const isFav = isFavorite(recipe.idMeal);
        
        return `
            <div class="recipe-card" data-id="${recipe.idMeal}" style="animation-delay: ${index * 0.05}s">
                <div class="recipe-image-container">
                    <img src="${recipe.strMealThumb}" alt="${recipe.strMeal}" class="recipe-image" loading="lazy">
                    <div class="recipe-overlay"></div>
                    <div class="difficulty-badge ${difficultyClass}">
                        ${difficulty.level}
                    </div>
                </div>
                
                <div class="recipe-content">
                    <h3 class="recipe-title">${recipe.strMeal}</h3>
                    
                    <div class="recipe-meta">
                        <span class="recipe-cuisine">
                            <i data-lucide="map-pin"></i>
                            ${recipe.strArea || 'International'}
                        </span>
                        <span class="recipe-category">
                            <i data-lucide="tag"></i>
                            ${recipe.strCategory || 'Main Course'}
                        </span>
                    </div>
                    
                    <div class="recipe-actions">
                        <button class="btn-view view-recipe" data-id="${recipe.idMeal}">
                            <i data-lucide="eye"></i>
                            View Recipe
                        </button>
                        <button class="btn-favorite favorite-btn ${isFav ? 'active' : ''}" 
                                data-id="${recipe.idMeal}" 
                                aria-label="${isFav ? 'Remove from favorites' : 'Add to favorites'}">
                            <i data-lucide="heart"></i>
                        </button>
                    </div>
                </div>
                
                <div class="recipe-stats">
                    <span class="stat-item">
                        <i data-lucide="clock"></i>
                        ${difficulty.time}
                    </span>
                    <span class="stat-item">
                        <i data-lucide="list"></i>
                        ${ingredientCount} ingredients
                    </span>
                </div>
            </div>
        `;
    }).join('');
    
    if (resultCount) {
        resultCount.textContent = recipes.length;
        // Add animation to result count
        resultCount.style.transform = 'scale(1.2)';
        setTimeout(() => {
            resultCount.style.transform = 'scale(1)';
        }, 300);
    }
    
    // Add event listeners
    addRecipeEventListeners();
    lucide.createIcons();
}

// ===== Modified Search Functionality for Index Page Only =====
function handleSearch(event) {
    // Only search on index page
    if (!isIndexPage()) {
        return;
    }
    
    const searchTerm = event.target.value.toLowerCase().trim();
    
    if (!searchTerm) {
        currentRecipes = allRecipes;
        displayRecipes(currentRecipes);
        return;
    }
    
    const filteredRecipes = allRecipes.filter(recipe => 
        recipe.strMeal.toLowerCase().includes(searchTerm) ||
        (recipe.strArea && recipe.strArea.toLowerCase().includes(searchTerm)) ||
        (recipe.strCategory && recipe.strCategory.toLowerCase().includes(searchTerm))
    );
    
    currentRecipes = filteredRecipes;
    displayRecipes(filteredRecipes);
}

// ===== Modified Favorites View for Index Page Only =====
function toggleFavoritesView() {
    // Only toggle favorites on index page
    if (!isIndexPage()) {
        // Redirect to recipes page for favorites view
        window.location.href = 'recipes.html';
        return;
    }
    
    if (favoritesToggle.textContent.includes('Favorites')) {
        // Show favorites
        currentRecipes = favorites;
        favoritesToggle.innerHTML = '<i data-lucide="list"></i> All Recipes';
        showToast(`Showing ${favorites.length} favorite recipes ❤️`);
    } else {
        // Show all recipes
        currentRecipes = allRecipes;
        favoritesToggle.innerHTML = '<i data-lucide="heart"></i> Favorites';
        showToast('Showing all recipes 📚');
    }
    
    displayRecipes(currentRecipes);
    lucide.createIcons();
}

// ===== Override the existing functions with the modified versions =====
// This ensures that when other parts of your code call these functions,
// they use the index-page-only versions

// Update the global exports to use our modified functions
window.loadRecipes = loadRecipes;
window.toggleFavoritesView = toggleFavoritesView;

// ===== Automatic Save Triggers =====

// Save progress before page unload
window.addEventListener('beforeunload', function() {
    saveDashboardProgress();
});

// Save progress when user leaves the page
window.addEventListener('pagehide', function() {
    saveDashboardProgress();
});

// Auto-save progress periodically (every 30 seconds)
setInterval(function() {
    if (!dashboardCleared) {
        saveDashboardProgress();
        console.log('Auto-saved dashboard progress');
    }
}, 30000);

// ===== Enhanced Save Points for User Interactions =====

// Override the toggleFavorite function to ensure saving
const originalToggleFavorite = window.toggleFavorite;
window.toggleFavorite = function(recipeId) {
    originalToggleFavorite(recipeId);
    // Force immediate save after favorite change
    setTimeout(() => {
        saveDashboardProgress();
    }, 100);
};

// Override meal plan functions to ensure saving
const originalRemoveMealFromPlan = window.removeMealFromPlan;
window.removeMealFromPlan = function(day, index) {
    originalRemoveMealFromPlan(day, index);
    setTimeout(() => {
        saveDashboardProgress();
    }, 100);
};

// Ensure autoAddToMealPlan saves progress
window.autoAddToMealPlan = function(recipeName, recipeId) {
    // Find the first available day with less than 3 meals
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
    let availableDay = null;
    
    for (const day of days) {
        if (!mealPlan[day]) {
            mealPlan[day] = [];
        }
        
        // Check if meal already exists in any day
        const existingMeal = Object.values(mealPlan).flat().find(meal => meal.id === recipeId);
        if (existingMeal) {
            showToast(`"${recipeName}" is already in your meal plan!`, 'error');
            closeModal();
            return;
        }
        
        // Find day with available slot (max 3 meals per day)
        if (mealPlan[day].length < 3) {
            availableDay = day;
            break;
        }
    }
    
    if (availableDay) {
        // Add to the available day
        mealPlan[availableDay].push({
            name: recipeName,
            id: recipeId,
            added: new Date().toISOString()
        });
        
        saveMealPlan();
        saveDashboardProgress(); // Force immediate save
        updateDashboard();
        updateMealPlanDisplay();
        
        showToast(`"${recipeName}" automatically added to ${availableDay.charAt(0).toUpperCase() + availableDay.slice(1)}! 📅`);
        closeModal();
    } else {
        // All days are full
        showToast('All days are full! Remove some meals or reset your plan.', 'error');
    }
};

// ===== Session Storage Backup =====
// Use sessionStorage as additional backup for current session

function saveSessionBackup() {
    if (!dashboardCleared) {
        const sessionData = {
            favorites: favorites,
            mealPlan: mealPlan,
            timestamp: new Date().getTime()
        };
        sessionStorage.setItem('sessionBackup', JSON.stringify(sessionData));
    }
}

function loadSessionBackup() {
    const backup = sessionStorage.getItem('sessionBackup');
    if (backup) {
        try {
            const data = JSON.parse(backup);
            // Use session backup if it's from the current session (less than 1 hour old)
            if (new Date().getTime() - data.timestamp < 3600000) {
                favorites = data.favorites || favorites;
                mealPlan = data.mealPlan || mealPlan;
                console.log('Session backup loaded');
            }
        } catch (error) {
            console.error('Error loading session backup:', error);
        }
    }
}

// Initialize session backup
document.addEventListener('DOMContentLoaded', function() {
    // Load session backup in addition to persistent storage
    setTimeout(loadSessionBackup, 100);
    
    // Save to session storage frequently
    setInterval(saveSessionBackup, 10000); // Every 10 seconds
});

// ===== Debugging Helper =====
window.getStorageStatus = function() {
    const persistent = localStorage.getItem(DASHBOARD_STORAGE_KEY);
    const session = sessionStorage.getItem('sessionBackup');
    const individualFavs = localStorage.getItem('favorites');
    const individualMealPlan = localStorage.getItem('mealPlan');
    
    console.log('=== STORAGE STATUS ===');
    console.log('Dashboard Progress:', persistent ? 'EXISTS' : 'MISSING');
    console.log('Session Backup:', session ? 'EXISTS' : 'MISSING');
    console.log('Individual Favorites:', individualFavs ? 'EXISTS' : 'MISSING');
    console.log('Individual Meal Plan:', individualMealPlan ? 'EXISTS' : 'MISSING');
    console.log('Current Favorites:', favorites.length, 'items');
    console.log('Current Meal Plan:', Object.values(mealPlan).flat().length, 'meals');
    console.log('Dashboard Cleared Flag:', dashboardCleared);
    console.log('====================');
};

// Call this function in browser console to check storage status
console.log('Dashboard persistence system loaded. Use getStorageStatus() to check storage state.');

// ===== Final Initialization =====
// Ensure everything is loaded properly
setTimeout(() => {
    updateDashboard();
    updateMealPlanDisplay();
    console.log('Dashboard fully initialized with persistence');
}, 500);


