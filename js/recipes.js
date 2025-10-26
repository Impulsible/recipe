// main.js - Core application functionality
class SpoonfullApp {
    constructor() {
        this.currentUser = null;
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.init();
    }

    init() {
        this.setupDarkMode();
        this.setupNavigation();
        this.setupEventListeners();
        this.loadUserData();
        this.updateUI();
    }

    setupDarkMode() {
        if (this.darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Update dark mode toggle button
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            const icon = darkModeToggle.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', this.darkMode ? 'sun' : 'moon');
            }
        }
    }

    setupNavigation() {
        const menuBtn = document.getElementById('menuBtn');
        const closeSidebar = document.getElementById('closeSidebar');
        const backdrop = document.getElementById('backdrop');
        const sidebar = document.getElementById('sidebar');

        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                sidebar.classList.add('open');
                backdrop.classList.add('show');
            });
        }

        if (closeSidebar) {
            closeSidebar.addEventListener('click', () => {
                sidebar.classList.remove('open');
                backdrop.classList.remove('show');
            });
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => {
                sidebar.classList.remove('open');
                backdrop.classList.remove('show');
            });
        }

        // Close sidebar when clicking on nav links
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                sidebar.classList.remove('open');
                backdrop.classList.remove('show');
            });
        });
    }

    setupEventListeners() {
        // Dark mode toggle
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('click', () => {
                this.toggleDarkMode();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }

        // Update current year in footer
        const currentYear = document.getElementById('currentYear');
        if (currentYear) {
            currentYear.textContent = new Date().getFullYear();
        }
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        this.setupDarkMode();
        
        // Update Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    loadUserData() {
        const userData = localStorage.getItem('userData');
        if (userData) {
            this.currentUser = JSON.parse(userData);
            this.updateUserUI();
        }
    }

    updateUserUI() {
        const sidebarName = document.getElementById('sidebarName');
        const sidebarEmail = document.getElementById('sidebarEmail');
        const welcomeName = document.getElementById('welcomeName');

        if (this.currentUser) {
            if (sidebarName) sidebarName.textContent = this.currentUser.name;
            if (sidebarEmail) sidebarEmail.textContent = this.currentUser.email;
            if (welcomeName) welcomeName.textContent = this.currentUser.name;
        } else {
            if (sidebarName) sidebarName.textContent = 'Guest';
            if (sidebarEmail) sidebarEmail.textContent = 'Not signed in';
            if (welcomeName) welcomeName.textContent = 'Guest';
        }
    }

    updateUI() {
        // Update today's date
        const todayElement = document.getElementById('today');
        if (todayElement) {
            const today = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            todayElement.textContent = today.toLocaleDateString('en-US', options);
        }

        // Update greeting based on time of day
        this.updateGreeting();
    }

    updateGreeting() {
        const greeting = document.getElementById('greeting');
        if (!greeting) return;

        const hour = new Date().getHours();
        let timeGreeting = '';

        if (hour < 12) {
            timeGreeting = 'Good morning';
        } else if (hour < 18) {
            timeGreeting = 'Good afternoon';
        } else {
            timeGreeting = 'Good evening';
        }

        greeting.textContent = `${timeGreeting} 👋`;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('userData');
        this.updateUserUI();
        this.showToast('Logged out successfully', 'success');
    }

    showToast(message, type = 'info') {
        const toastArea = document.getElementById('toastArea');
        if (!toastArea) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${this.getToastIcon(type)}" class="w-5 h-5"></i>
            <span>${message}</span>
        `;

        toastArea.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    // Quick action methods
    quickAddToPlan(mealType) {
        this.showToast(`Quick ${mealType} added to plan!`, 'success');
        // Implementation would integrate with meal planner
    }

    generateShoppingList() {
        this.showToast('Shopping list generated!', 'success');
        // Implementation would integrate with shopping list
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.spoonfullApp = new SpoonfullApp();
    
    // Initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpoonfullApp;
}

// recipe-manager.js - Recipe data management and API interactions
class RecipeManager {
    constructor() {
        this.API_BASE = 'https://api.edamam.com/api/recipes/v2';
        this.APP_ID = '1edd8316';
        this.APP_KEY = 'fff5581f3438a5bcac6ab5e038dda7ae';
        this.MEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1';
        this.recipes = [];
        this.filteredRecipes = [];
        this.favorites = JSON.parse(localStorage.getItem('favorites')) || [];
        this.recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed')) || [];
        this.mealPlan = JSON.parse(localStorage.getItem('mealPlan')) || {};
        this.shoppingList = JSON.parse(localStorage.getItem('shoppingList')) || [];
        this.nutritionData = JSON.parse(localStorage.getItem('nutritionData')) || {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            history: []
        };
        
        this.currentView = 'grid';
        this.currentCategory = 'all';
        this.currentSearch = '';
        this.currentSort = 'popular';
        this.showFavorites = false;
        this.currentPage = 0;
        this.recipesPerPage = 30;
        
        this.init();
    }

    async init() {
        await this.loadRecipes();
        this.setupEventListeners();
        this.renderRecipes();
        this.updateNutritionDisplay();
        this.renderRecentlyViewed();
        this.updateStats();
    }

    async loadRecipes() {
        try {
            this.showLoadingState();
            
            // Fetch from Edamam API
            const response = await fetch(
                `${this.API_BASE}?type=public&app_id=${this.APP_ID}&app_key=${this.APP_KEY}&random=true&field=label&field=image&field=calories&field=totalTime&field=cuisineType&field=mealType&field=dishType&field=ingredients&field=url&field=totalNutrients`
            );
            
            if (!response.ok) {
                throw new Error('Failed to fetch recipes from Edamam');
            }
            
            const data = await response.json();
            this.processRecipes(data.hits);
            
            // If we don't get enough recipes, supplement with MealDB
            if (this.recipes.length < 30) {
                await this.supplementWithMealDB();
            }
            
            this.filteredRecipes = [...this.recipes];
            this.updateResultCount();
            this.hideLoadingState();
            
        } catch (error) {
            console.error('Error loading recipes:', error);
            this.hideLoadingState();
            this.showEmptyState();
        }
    }

    processRecipes(hits) {
        this.recipes = hits.map(hit => {
            const recipe = hit.recipe;
            const nutrients = recipe.totalNutrients;
            
            return {
                id: recipe.uri.split('#')[1],
                title: recipe.label,
                image: recipe.image,
                calories: Math.round(recipe.calories),
                prepTime: recipe.totalTime || 30,
                difficulty: this.getRandomDifficulty(),
                rating: this.getRandomRating(),
                category: this.mapCategory(recipe.mealType?.[0] || recipe.dishType?.[0]),
                ingredients: recipe.ingredients.map(ing => ing.text),
                instructions: this.generateInstructions(),
                protein: Math.round((nutrients.PROCNT?.quantity || 0) / recipe.yield),
                carbs: Math.round((nutrients.CHOCDF?.quantity || 0) / recipe.yield),
                fats: Math.round((nutrients.FAT?.quantity || 0) / recipe.yield),
                description: `A delicious ${recipe.label} that's perfect for ${recipe.mealType?.[0] || 'any meal'}.`,
                servings: recipe.yield || 4,
                source: recipe.source,
                url: recipe.url,
                isFavorite: this.favorites.includes(recipe.uri.split('#')[1]),
                isQuick: recipe.totalTime <= 30
            };
        });
    }

    async supplementWithMealDB() {
        try {
            // Fetch multiple random meals from MealDB
            const requests = Array.from({ length: 10 }, () => 
                fetch(`${this.MEALDB_BASE}/random.php`)
            );
            
            const responses = await Promise.all(requests);
            const data = await Promise.all(responses.map(r => r.json()));
            
            const mealDBRecipes = data
                .filter(d => d.meals)
                .flatMap(d => d.meals)
                .map(meal => ({
                    id: meal.idMeal,
                    title: meal.strMeal,
                    image: meal.strMealThumb,
                    calories: Math.floor(Math.random() * 500) + 200,
                    prepTime: Math.floor(Math.random() * 60) + 15,
                    difficulty: this.getRandomDifficulty(),
                    rating: this.getRandomRating(),
                    category: this.mapCategory(meal.strCategory),
                    ingredients: this.extractIngredients(meal),
                    instructions: meal.strInstructions ? 
                        meal.strInstructions.split('\r\n').filter(step => step.trim()) : 
                        this.generateInstructions(),
                    protein: Math.floor(Math.random() * 30) + 5,
                    carbs: Math.floor(Math.random() * 50) + 20,
                    fats: Math.floor(Math.random() * 20) + 5,
                    description: meal.strInstructions ? 
                        meal.strInstructions.substring(0, 150) + '...' : 
                        `A delicious ${meal.strMeal} recipe.`,
                    servings: 4,
                    source: 'The Meal DB',
                    url: meal.strSource || '#',
                    isFavorite: this.favorites.includes(meal.idMeal),
                    isQuick: Math.random() > 0.5
                }));
            
            this.recipes = [...this.recipes, ...mealDBRecipes];
        } catch (error) {
            console.error('Error supplementing with MealDB:', error);
        }
    }

    extractIngredients(meal) {
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push(`${measure} ${ingredient}`);
            }
        }
        return ingredients;
    }

    getRandomDifficulty() {
        const difficulties = ['easy', 'medium', 'hard'];
        return difficulties[Math.floor(Math.random() * difficulties.length)];
    }

    getRandomRating() {
        return (Math.random() * 2 + 3).toFixed(1); // 3.0 to 5.0
    }

    mapCategory(category) {
        const categoryMap = {
            'Breakfast': 'breakfast',
            'Lunch': 'lunch',
            'Dinner': 'dinner',
            'Dessert': 'dessert',
            'Vegetarian': 'vegetarian',
            'Vegan': 'vegetarian',
            'Snack': 'quick'
        };
        
        return categoryMap[category] || 'dinner';
    }

    generateInstructions() {
        return [
            'Prepare all ingredients as listed.',
            'Follow the cooking method carefully.',
            'Adjust seasoning to taste.',
            'Cook until perfectly done.',
            'Let rest before serving.',
            'Garnish and serve immediately.'
        ];
    }

    showLoadingState() {
        const loadingState = document.getElementById('loadingState');
        const emptyState = document.getElementById('emptyState');
        if (loadingState) loadingState.classList.remove('hidden');
        if (emptyState) emptyState.classList.add('hidden');
    }

    hideLoadingState() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) loadingState.classList.add('hidden');
    }

    showEmptyState() {
        const emptyState = document.getElementById('emptyState');
        if (emptyState) emptyState.classList.remove('hidden');
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentSearch = e.target.value;
                this.filterRecipes();
            });
        }

        const clearSearch = document.getElementById('clearSearch');
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                if (searchInput) searchInput.value = '';
                this.currentSearch = '';
                this.filterRecipes();
            });
        }

        // View controls
        const gridViewBtn = document.getElementById('gridViewBtn');
        if (gridViewBtn) {
            gridViewBtn.addEventListener('click', () => {
                this.setView('grid');
            });
        }

        const listViewBtn = document.getElementById('listViewBtn');
        if (listViewBtn) {
            listViewBtn.addEventListener('click', () => {
                this.setView('list');
            });
        }

        // Category filters
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.filterRecipes();
            });
        });

        // Advanced filters
        const advancedFiltersBtn = document.getElementById('advancedFiltersBtn');
        if (advancedFiltersBtn) {
            advancedFiltersBtn.addEventListener('click', () => {
                const advancedFilters = document.getElementById('advancedFilters');
                if (advancedFilters) {
                    advancedFilters.classList.toggle('hidden');
                }
            });
        }

        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                this.filterRecipes();
            });
        }

        const resetFilters = document.getElementById('resetFilters');
        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Sort functionality
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.sortRecipes();
            });
        }

        // Favorites toggle
        const favoritesToggle = document.getElementById('favoritesToggle');
        if (favoritesToggle) {
            favoritesToggle.addEventListener('click', () => {
                this.showFavorites = !this.showFavorites;
                this.filterRecipes();
            });
        }

        // Load more
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreRecipes();
            });
        }

        // Reset search
        const resetSearch = document.getElementById('resetSearch');
        if (resetSearch) {
            resetSearch.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Random recipe
        const heroRandomBtn = document.getElementById('heroRandomBtn');
        if (heroRandomBtn) {
            heroRandomBtn.addEventListener('click', () => {
                this.showRandomRecipe();
            });
        }

        // Nutrition reset
        const resetNutritionBtn = document.getElementById('resetNutritionBtn');
        if (resetNutritionBtn) {
            resetNutritionBtn.addEventListener('click', () => {
                this.resetNutrition();
            });
        }

        // Clear recent
        const clearRecent = document.getElementById('clearRecent');
        if (clearRecent) {
            clearRecent.addEventListener('click', () => {
                this.clearRecentlyViewed();
            });
        }

        // Modal close events
        this.setupModalEvents();
    }

    setupModalEvents() {
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const planModalClose = document.getElementById('planModalClose');
        if (planModalClose) {
            planModalClose.addEventListener('click', () => {
                this.closePlanModal();
            });
        }

        const shoppingModalClose = document.getElementById('shoppingModalClose');
        if (shoppingModalClose) {
            shoppingModalClose.addEventListener('click', () => {
                this.closeShoppingModal();
            });
        }

        // Plan modal actions
        const confirmAddToPlan = document.getElementById('confirmAddToPlan');
        if (confirmAddToPlan) {
            confirmAddToPlan.addEventListener('click', () => {
                this.confirmAddToPlan();
            });
        }

        const cancelAddToPlan = document.getElementById('cancelAddToPlan');
        if (cancelAddToPlan) {
            cancelAddToPlan.addEventListener('click', () => {
                this.closePlanModal();
            });
        }

        // Shopping list actions
        const printShoppingList = document.getElementById('printShoppingList');
        if (printShoppingList) {
            printShoppingList.addEventListener('click', () => {
                this.printShoppingList();
            });
        }

        const clearShoppingList = document.getElementById('clearShoppingList');
        if (clearShoppingList) {
            clearShoppingList.addEventListener('click', () => {
                this.clearShoppingList();
            });
        }

        // Close modals on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeModal();
                this.closePlanModal();
                this.closeShoppingModal();
            }
        });

        // Scroll to top
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        // Show/hide scroll to top button
        window.addEventListener('scroll', () => {
            const scrollBtn = document.getElementById('scrollTopBtn');
            if (scrollBtn) {
                if (window.scrollY > 300) {
                    scrollBtn.style.display = 'flex';
                } else {
                    scrollBtn.style.display = 'none';
                }
            }
        });
    }

    setView(view) {
        this.currentView = view;
        const gridViewBtn = document.getElementById('gridViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (gridViewBtn) gridViewBtn.classList.toggle('active', view === 'grid');
        if (listViewBtn) listViewBtn.classList.toggle('active', view === 'list');
        this.renderRecipes();
    }

    filterRecipes() {
        let filtered = [...this.recipes];
        
        // Search filter
        if (this.currentSearch) {
            const searchTerm = this.currentSearch.toLowerCase();
            filtered = filtered.filter(recipe => 
                recipe.title.toLowerCase().includes(searchTerm) ||
                recipe.ingredients.some(ing => ing.toLowerCase().includes(searchTerm)) ||
                recipe.category.toLowerCase().includes(searchTerm)
            );
        }
        
        // Category filter
        if (this.currentCategory !== 'all') {
            filtered = filtered.filter(recipe => {
                if (this.currentCategory === 'quick') {
                    return recipe.isQuick;
                }
                return recipe.category === this.currentCategory;
            });
        }
        
        // Favorites filter
        if (this.showFavorites) {
            filtered = filtered.filter(recipe => recipe.isFavorite);
        }
        
        // Advanced filters
        const difficultyFilter = document.getElementById('difficultyFilter');
        if (difficultyFilter && difficultyFilter.value !== 'all') {
            filtered = filtered.filter(recipe => recipe.difficulty === difficultyFilter.value);
        }
        
        const timeFilter = document.getElementById('timeFilter');
        if (timeFilter && timeFilter.value !== 'all') {
            filtered = filtered.filter(recipe => recipe.prepTime <= parseInt(timeFilter.value));
        }
        
        const caloriesFilter = document.getElementById('caloriesFilter');
        if (caloriesFilter && caloriesFilter.value !== 'all') {
            filtered = filtered.filter(recipe => recipe.calories <= parseInt(caloriesFilter.value));
        }
        
        this.filteredRecipes = filtered;
        this.currentPage = 0;
        this.sortRecipes();
        this.updateResultCount();
    }

    sortRecipes() {
        switch (this.currentSort) {
            case 'newest':
                this.filteredRecipes.sort((a, b) => b.id.localeCompare(a.id));
                break;
            case 'calories':
                this.filteredRecipes.sort((a, b) => a.calories - b.calories);
                break;
            case 'time':
                this.filteredRecipes.sort((a, b) => a.prepTime - b.prepTime);
                break;
            case 'rating':
                this.filteredRecipes.sort((a, b) => b.rating - a.rating);
                break;
            default: // popular
                this.filteredRecipes.sort((a, b) => b.rating - a.rating);
        }
        
        this.renderRecipes();
    }

    resetFilters() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) searchInput.value = '';
        
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.category === 'all') {
                btn.classList.add('active');
            }
        });
        
        const difficultyFilter = document.getElementById('difficultyFilter');
        const timeFilter = document.getElementById('timeFilter');
        const caloriesFilter = document.getElementById('caloriesFilter');
        const advancedFilters = document.getElementById('advancedFilters');
        const sortSelect = document.getElementById('sortSelect');
        
        if (difficultyFilter) difficultyFilter.value = 'all';
        if (timeFilter) timeFilter.value = 'all';
        if (caloriesFilter) caloriesFilter.value = 'all';
        if (advancedFilters) advancedFilters.classList.add('hidden');
        if (sortSelect) sortSelect.value = 'popular';
        
        this.currentSearch = '';
        this.currentCategory = 'all';
        this.showFavorites = false;
        this.currentSort = 'popular';
        
        this.filteredRecipes = [...this.recipes];
        this.currentPage = 0;
        this.sortRecipes();
        this.updateResultCount();
    }

    updateResultCount() {
        const resultCount = document.getElementById('resultCount');
        if (resultCount) {
            resultCount.textContent = this.filteredRecipes.length;
        }
        
        const emptyState = document.getElementById('emptyState');
        const recipeList = document.getElementById('recipeList');
        
        if (this.filteredRecipes.length === 0) {
            if (emptyState) emptyState.classList.remove('hidden');
            if (recipeList) recipeList.innerHTML = '';
        } else {
            if (emptyState) emptyState.classList.add('hidden');
        }
        
        // Show/hide load more button
        const loadMoreBtn = document.getElementById('loadMoreBtn');
        if (loadMoreBtn) {
            if (this.filteredRecipes.length > (this.currentPage + 1) * this.recipesPerPage) {
                loadMoreBtn.classList.remove('hidden');
            } else {
                loadMoreBtn.classList.add('hidden');
            }
        }
    }

    renderRecipes() {
        const recipeList = document.getElementById('recipeList');
        if (!recipeList) return;

        const startIndex = this.currentPage * this.recipesPerPage;
        const endIndex = startIndex + this.recipesPerPage;
        const recipesToShow = this.filteredRecipes.slice(0, endIndex);
        
        recipeList.className = this.currentView === 'grid' ? 'recipe-grid' : 'recipe-list';
        
        if (recipesToShow.length === 0) {
            recipeList.innerHTML = '';
            return;
        }
        
        recipeList.innerHTML = recipesToShow.map(recipe => this.createRecipeCard(recipe)).join('');
        
        // Add event listeners to recipe cards
        recipesToShow.forEach(recipe => {
            const card = document.getElementById(`recipe-${recipe.id}`);
            if (card) {
                card.addEventListener('click', () => this.showRecipeDetails(recipe));
                
                const favoriteBtn = card.querySelector('.favorite-btn');
                if (favoriteBtn) {
                    favoriteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.toggleFavorite(recipe);
                    });
                }
                
                const planBtn = card.querySelector('.plan-btn');
                if (planBtn) {
                    planBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.showPlanModal(recipe);
                    });
                }
                
                const shoppingBtn = card.querySelector('.shopping-btn');
                if (shoppingBtn) {
                    shoppingBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        this.addToShoppingList(recipe);
                    });
                }
            }
        });

        // Update Lucide icons for new content
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    createRecipeCard(recipe) {
        const difficultyClass = {
            easy: 'difficulty-easy',
            medium: 'difficulty-medium',
            hard: 'difficulty-hard'
        }[recipe.difficulty];
        
        const favoriteClass = recipe.isFavorite ? 'active' : '';
        
        if (this.currentView === 'list') {
            return `
                <div class="recipe-card" id="recipe-${recipe.id}">
                    <img src="${recipe.image}" alt="${recipe.title}" class="w-32 h-32 object-cover">
                    <div class="recipe-card-content">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-semibold text-lg">${recipe.title}</h3>
                            <button class="favorite-btn action-btn favorite ${favoriteClass}" aria-label="${recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                                <i data-lucide="heart" class="w-5 h-5"></i>
                            </button>
                        </div>
                        <p class="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">${recipe.description}</p>
                        <div class="flex flex-wrap gap-2 mb-3">
                            <span class="px-2 py-1 rounded-full text-xs ${difficultyClass} text-white">${recipe.difficulty}</span>
                            <span class="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700">⏱️ ${recipe.prepTime} min</span>
                            <span class="px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700">🔥 ${recipe.calories} cal</span>
                        </div>
                        <div class="flex justify-between items-center">
                            <div class="star-rating">
                                ${this.renderStars(recipe.rating)}
                                <span class="text-sm text-gray-600 dark:text-gray-400 ml-1">${recipe.rating}</span>
                            </div>
                            <div class="flex gap-2">
                                <button class="plan-btn inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
                                    <i data-lucide="calendar" class="w-4 h-4"></i>
                                    Plan
                                </button>
                                <button class="shopping-btn inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
                                    <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                                    List
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
        
        // Grid view
        return `
            <div class="recipe-card" id="recipe-${recipe.id}">
                <div class="relative">
                    <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-48 object-cover">
                    <button class="favorite-btn action-btn favorite ${favoriteClass} absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur rounded-full p-2" aria-label="${recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <i data-lucide="heart" class="w-5 h-5"></i>
                    </button>
                    <span class="absolute top-2 left-2 px-2 py-1 rounded-full text-xs ${difficultyClass} text-white">${recipe.difficulty}</span>
                </div>
                <div class="p-4">
                    <h3 class="font-semibold text-lg mb-2 line-clamp-1">${recipe.title}</h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">${recipe.description}</p>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700">
                            <i data-lucide="clock" class="w-3 h-3"></i>
                            ${recipe.prepTime} min
                        </span>
                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-gray-200 dark:bg-gray-700">
                            <i data-lucide="flame" class="w-3 h-3"></i>
                            ${recipe.calories} cal
                        </span>
                    </div>
                    <div class="flex justify-between items-center">
                        <div class="star-rating">
                            ${this.renderStars(recipe.rating)}
                            <span class="text-sm text-gray-600 dark:text-gray-400 ml-1">${recipe.rating}</span>
                        </div>
                        <div class="flex gap-2">
                            <button class="plan-btn action-btn inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors text-sm">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                                Plan
                            </button>
                            <button class="shopping-btn action-btn inline-flex items-center gap-1 px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
                                <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        let stars = '';
        
        for (let i = 0; i < 5; i++) {
            if (i < fullStars) {
                stars += '<i data-lucide="star" class="w-4 h-4 star filled"></i>';
            } else if (i === fullStars && hasHalfStar) {
                stars += '<i data-lucide="star-half" class="w-4 h-4 star filled"></i>';
            } else {
                stars += '<i data-lucide="star" class="w-4 h-4 star"></i>';
            }
        }
        
        return stars;
    }

    showRecipeDetails(recipe) {
        // Add to recently viewed
        this.addToRecentlyViewed(recipe);
        
        const modal = document.getElementById('recipeModal');
        const modalBody = document.getElementById('modalBody');
        const modalTitle = document.getElementById('modalTitle');
        
        if (!modal || !modalBody || !modalTitle) return;
        
        modalTitle.textContent = recipe.title;
        
        modalBody.innerHTML = `
            <div class="space-y-6">
                <!-- Recipe Header -->
                <div class="flex flex-col lg:flex-row gap-6">
                    <img src="${recipe.image}" alt="${recipe.title}" class="w-full lg:w-1/2 h-64 lg:h-80 object-cover rounded-2xl">
                    <div class="flex-1">
                        <h2 class="text-2xl font-bold mb-4">${recipe.title}</h2>
                        <p class="text-gray-600 dark:text-gray-400 mb-6">${recipe.description}</p>
                        
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div class="text-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                                <div class="text-2xl font-bold text-emerald-600">${recipe.calories}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                            </div>
                            <div class="text-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                                <div class="text-2xl font-bold text-emerald-600">${recipe.prepTime}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Minutes</div>
                            </div>
                            <div class="text-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                                <div class="text-2xl font-bold text-emerald-600">${recipe.servings}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Servings</div>
                            </div>
                            <div class="text-center p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                                <div class="text-2xl font-bold text-emerald-600">${recipe.rating}</div>
                                <div class="text-sm text-gray-600 dark:text-gray-400">Rating</div>
                            </div>
                        </div>
                        
                        <div class="flex flex-wrap gap-2 mb-6">
                            <button class="plan-modal-btn inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                                <i data-lucide="calendar" class="w-4 h-4"></i>
                                Add to Plan
                            </button>
                            <button class="shopping-modal-btn inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                                Add to List
                            </button>
                            <button class="favorite-modal-btn action-btn favorite ${recipe.isFavorite ? 'active' : ''} inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                <i data-lucide="heart" class="w-4 h-4"></i>
                                ${recipe.isFavorite ? 'Remove Favorite' : 'Add Favorite'}
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Nutrition Info -->
                <div class="bg-gray-50 dark:bg-gray-800 rounded-2xl p-6">
                    <h3 class="text-xl font-bold mb-4">Nutrition Information</h3>
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <div class="text-center">
                            <div class="text-2xl font-bold text-emerald-600">${recipe.calories}</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Calories</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-blue-600">${recipe.protein}g</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Protein</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-yellow-600">${recipe.carbs}g</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Carbs</div>
                        </div>
                        <div class="text-center">
                            <div class="text-2xl font-bold text-purple-600">${recipe.fats}g</div>
                            <div class="text-sm text-gray-600 dark:text-gray-400">Fats</div>
                        </div>
                    </div>
                </div>
                
                <!-- Ingredients & Instructions -->
                <div class="ingredients-instructions-grid">
                    <div class="ingredients-column">
                        <div class="ingredients-header">
                            <h3 class="text-xl font-bold mb-4">Ingredients</h3>
                            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">Serves ${recipe.servings}</p>
                        </div>
                        <div class="ingredients-list">
                            ${recipe.ingredients.map((ingredient, index) => `
                                <div class="ingredient-item">
                                    <div class="flex items-center gap-3">
                                        <input type="checkbox" class="ingredient-checkbox" id="ingredient-${index}">
                                        <label for="ingredient-${index}" class="flex-1">${ingredient}</label>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="instructions-column">
                        <div class="instructions-header">
                            <h3 class="text-xl font-bold mb-4">Instructions</h3>
                        </div>
                        <div class="instructions-list">
                            ${recipe.instructions.map((instruction, index) => `
                                <div class="instruction-item">
                                    <div class="flex items-start gap-3">
                                        <div class="instruction-number">${index + 1}</div>
                                        <p class="flex-1">${instruction}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Action Buttons -->
                <div class="flex flex-wrap gap-4 justify-center pt-6 border-t border-gray-200 dark:border-gray-800">
                    <button class="print-recipe-btn inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                        <i data-lucide="printer" class="w-5 h-5"></i>
                        Print Recipe
                    </button>
                    <button class="share-recipe-btn inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="share-2" class="w-5 h-5"></i>
                        Share Recipe
                    </button>
                    <button class="nutrition-btn inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <i data-lucide="utensils" class="w-5 h-5"></i>
                        Add to Nutrition
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners to modal buttons
        const favoriteBtn = modalBody.querySelector('.favorite-modal-btn');
        if (favoriteBtn) {
            favoriteBtn.addEventListener('click', () => this.toggleFavorite(recipe));
        }
        
        const planBtn = modalBody.querySelector('.plan-modal-btn');
        if (planBtn) {
            planBtn.addEventListener('click', () => this.showPlanModal(recipe));
        }
        
        const shoppingBtn = modalBody.querySelector('.shopping-modal-btn');
        if (shoppingBtn) {
            shoppingBtn.addEventListener('click', () => this.addToShoppingList(recipe));
        }
        
        const nutritionBtn = modalBody.querySelector('.nutrition-btn');
        if (nutritionBtn) {
            nutritionBtn.addEventListener('click', () => this.addToNutrition(recipe));
        }
        
        const printBtn = modalBody.querySelector('.print-recipe-btn');
        if (printBtn) {
            printBtn.addEventListener('click', () => this.printRecipe(recipe));
        }
        
        const shareBtn = modalBody.querySelector('.share-recipe-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.shareRecipe(recipe));
        }
        
        // Add event listeners to ingredient checkboxes
        modalBody.querySelectorAll('.ingredient-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    const ingredient = e.target.nextElementSibling.textContent;
                    this.addToShoppingListFromIngredient(ingredient);
                }
            });
        });
        
        modal.classList.add('active');

        // Update Lucide icons in modal
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    closeModal() {
        const modal = document.getElementById('recipeModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showPlanModal(recipe) {
        this.currentRecipeForPlan = recipe;
        const planModal = document.getElementById('planModal');
        if (planModal) {
            planModal.classList.add('active');
        }
    }

    closePlanModal() {
        const planModal = document.getElementById('planModal');
        if (planModal) {
            planModal.classList.remove('active');
        }
    }

    confirmAddToPlan() {
        if (!this.currentRecipeForPlan) return;

        const planDay = document.getElementById('planDay');
        const planMealType = document.getElementById('planMealType');
        
        if (!planDay || !planMealType) return;
        
        const day = planDay.value;
        const mealType = planMealType.value;
        
        if (!this.mealPlan[day]) {
            this.mealPlan[day] = {};
        }
        
        if (!this.mealPlan[day][mealType]) {
            this.mealPlan[day][mealType] = [];
        }
        
        this.mealPlan[day][mealType].push({
            id: this.currentRecipeForPlan.id,
            title: this.currentRecipeForPlan.title,
            image: this.currentRecipeForPlan.image,
            calories: this.currentRecipeForPlan.calories
        });
        
        localStorage.setItem('mealPlan', JSON.stringify(this.mealPlan));
        this.closePlanModal();
        this.showToast('Recipe added to meal plan!', 'success');
        this.updateStats();
    }

    showShoppingModal() {
        this.renderShoppingList();
        const shoppingModal = document.getElementById('shoppingModal');
        if (shoppingModal) {
            shoppingModal.classList.add('active');
        }
    }

    closeShoppingModal() {
        const shoppingModal = document.getElementById('shoppingModal');
        if (shoppingModal) {
            shoppingModal.classList.remove('active');
        }
    }

    renderShoppingList() {
        const shoppingListContent = document.getElementById('shoppingListContent');
        if (!shoppingListContent) return;
        
        if (this.shoppingList.length === 0) {
            shoppingListContent.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p>Your shopping list is empty</p>
                </div>
            `;
            return;
        }
        
        shoppingListContent.innerHTML = this.shoppingList.map((item, index) => `
            <div class="shopping-list-item ${item.completed ? 'completed' : ''}">
                <div class="flex items-center gap-3 flex-1">
                    <div class="shopping-list-checkbox ${item.completed ? 'checked' : ''}" data-index="${index}">
                        ${item.completed ? '✓' : ''}
                    </div>
                    <span class="${item.completed ? 'line-through text-gray-500' : ''}">${item.name}</span>
                </div>
                <button class="remove-item text-gray-500 hover:text-red-500 transition-colors" data-index="${index}">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            </div>
        `).join('');
        
        // Add event listeners
        shoppingListContent.querySelectorAll('.shopping-list-checkbox').forEach(checkbox => {
            checkbox.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.toggleShoppingItem(index);
            });
        });
        
        shoppingListContent.querySelectorAll('.remove-item').forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(e.target.closest('.remove-item').dataset.index);
                this.removeShoppingItem(index);
            });
        });

        // Update Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    addToShoppingList(recipe) {
        recipe.ingredients.forEach(ingredient => {
            // Check if ingredient already exists
            const exists = this.shoppingList.some(item => 
                item.name.toLowerCase() === ingredient.toLowerCase()
            );
            
            if (!exists) {
                this.shoppingList.push({
                    name: ingredient,
                    completed: false
                });
            }
        });
        
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
        this.showToast('Ingredients added to shopping list!', 'success');
        this.renderShoppingList();
    }

    addToShoppingListFromIngredient(ingredient) {
        // Check if ingredient already exists
        const exists = this.shoppingList.some(item => 
            item.name.toLowerCase() === ingredient.toLowerCase()
        );
        
        if (!exists) {
            this.shoppingList.push({
                name: ingredient,
                completed: false
            });
            
            localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
            this.showToast('Ingredient added to shopping list!', 'success');
            this.renderShoppingList();
        }
    }

    toggleShoppingItem(index) {
        this.shoppingList[index].completed = !this.shoppingList[index].completed;
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
        this.renderShoppingList();
    }

    removeShoppingItem(index) {
        this.shoppingList.splice(index, 1);
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
        this.renderShoppingList();
    }

    clearShoppingList() {
        this.shoppingList = [];
        localStorage.setItem('shoppingList', JSON.stringify(this.shoppingList));
        this.renderShoppingList();
        this.showToast('Shopping list cleared!', 'success');
    }

    printShoppingList() {
        // Simple print functionality
        const printWindow = window.open('', '_blank');
        const shoppingItems = this.shoppingList.map(item => 
            `<li style="${item.completed ? 'text-decoration: line-through; color: #999;' : ''}">${item.name}</li>`
        ).join('');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Shopping List - Spoonfull</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { color: #10b981; }
                    ul { list-style: none; padding: 0; }
                    li { padding: 5px 0; border-bottom: 1px solid #eee; }
                </style>
            </head>
            <body>
                <h1>Shopping List</h1>
                <ul>${shoppingItems}</ul>
                <p>Generated by Spoonfull on ${new Date().toLocaleDateString()}</p>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    printRecipe(recipe) {
        const printWindow = window.open('', '_blank');
        const ingredients = recipe.ingredients.map(ing => `<li>${ing}</li>`).join('');
        const instructions = recipe.instructions.map((inst, i) => `<li>${i + 1}. ${inst}</li>`).join('');
        
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>${recipe.title} - Spoonfull</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px; }
                    .recipe-meta { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 20px 0; }
                    .meta-item { text-align: center; padding: 10px; background: #f0fdf4; border-radius: 5px; }
                    .section { margin: 30px 0; }
                    .section h2 { color: #10b981; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
                    ul { padding-left: 20px; }
                    li { margin: 5px 0; }
                </style>
            </head>
            <body>
                <h1>${recipe.title}</h1>
                <div class="recipe-meta">
                    <div class="meta-item">
                        <strong>${recipe.calories}</strong><br>Calories
                    </div>
                    <div class="meta-item">
                        <strong>${recipe.prepTime}</strong><br>Minutes
                    </div>
                    <div class="meta-item">
                        <strong>${recipe.servings}</strong><br>Servings
                    </div>
                    <div class="meta-item">
                        <strong>${recipe.rating}</strong><br>Rating
                    </div>
                </div>
                <div class="section">
                    <h2>Ingredients</h2>
                    <ul>${ingredients}</ul>
                </div>
                <div class="section">
                    <h2>Instructions</h2>
                    <ol>${instructions}</ol>
                </div>
                <div class="section">
                    <h2>Nutrition Information</h2>
                    <p>Calories: ${recipe.calories} | Protein: ${recipe.protein}g | Carbs: ${recipe.carbs}g | Fats: ${recipe.fats}g</p>
                </div>
                <p><em>Printed from Spoonfull on ${new Date().toLocaleDateString()}</em></p>
            </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
    }

    shareRecipe(recipe) {
        if (navigator.share) {
            navigator.share({
                title: recipe.title,
                text: `Check out this delicious recipe: ${recipe.title}`,
                url: window.location.href
            });
        } else {
            // Fallback: copy to clipboard
            const recipeUrl = `${window.location.origin}${window.location.pathname}#recipe-${recipe.id}`;
            navigator.clipboard.writeText(recipeUrl).then(() => {
                this.showToast('Recipe link copied to clipboard!', 'success');
            });
        }
    }

    toggleFavorite(recipe) {
        const index = this.favorites.indexOf(recipe.id);
        
        if (index === -1) {
            this.favorites.push(recipe.id);
            recipe.isFavorite = true;
            this.showToast('Recipe added to favorites!', 'success');
        } else {
            this.favorites.splice(index, 1);
            recipe.isFavorite = false;
            this.showToast('Recipe removed from favorites!', 'info');
        }
        
        localStorage.setItem('favorites', JSON.stringify(this.favorites));
        
        // Update UI
        const favoriteBtn = document.querySelector(`#recipe-${recipe.id} .favorite-btn`);
        if (favoriteBtn) {
            favoriteBtn.classList.toggle('active', recipe.isFavorite);
            favoriteBtn.setAttribute('aria-label', recipe.isFavorite ? 'Remove from favorites' : 'Add to favorites');
        }
        
        // If we're in favorites view, update the list
        if (this.showFavorites) {
            this.filterRecipes();
        }
    }

    addToNutrition(recipe) {
        this.nutritionData.calories += recipe.calories;
        this.nutritionData.protein += recipe.protein;
        this.nutritionData.carbs += recipe.carbs;
        this.nutritionData.fats += recipe.fats;
        
        this.nutritionData.history.push({
            name: recipe.title,
            calories: recipe.calories,
            protein: recipe.protein,
            carbs: recipe.carbs,
            fats: recipe.fats,
            timestamp: new Date().toISOString()
        });
        
        localStorage.setItem('nutritionData', JSON.stringify(this.nutritionData));
        this.updateNutritionDisplay();
        this.showToast('Nutrition data updated!', 'success');
    }

    updateNutritionDisplay() {
        const totalCalories = document.getElementById('totalCalories');
        const totalProtein = document.getElementById('totalProtein');
        const totalCarbs = document.getElementById('totalCarbs');
        const totalFats = document.getElementById('totalFats');
        
        if (totalCalories) totalCalories.textContent = this.nutritionData.calories;
        if (totalProtein) totalProtein.textContent = `${this.nutritionData.protein}g`;
        if (totalCarbs) totalCarbs.textContent = `${this.nutritionData.carbs}g`;
        if (totalFats) totalFats.textContent = `${this.nutritionData.fats}g`;
        
        // Update progress bars
        const caloriesGoal = parseInt(document.getElementById('caloriesGoal')?.value) || 2000;
        const proteinGoal = parseInt(document.getElementById('proteinGoal')?.value) || 50;
        const carbsGoal = parseInt(document.getElementById('carbsGoal')?.value) || 250;
        const fatsGoal = parseInt(document.getElementById('fatsGoal')?.value) || 70;
        
        const caloriesPercent = Math.min((this.nutritionData.calories / caloriesGoal) * 100, 100);
        const proteinPercent = Math.min((this.nutritionData.protein / proteinGoal) * 100, 100);
        const carbsPercent = Math.min((this.nutritionData.carbs / carbsGoal) * 100, 100);
        const fatsPercent = Math.min((this.nutritionData.fats / fatsGoal) * 100, 100);
        
        document.querySelector('.nutrition-progress-fill.calories').style.width = `${caloriesPercent}%`;
        document.querySelector('.nutrition-progress-fill.protein').style.width = `${proteinPercent}%`;
        document.querySelector('.nutrition-progress-fill.carbs').style.width = `${carbsPercent}%`;
        document.querySelector('.nutrition-progress-fill.fats').style.width = `${fatsPercent}%`;
        
        // Update stats text
        document.querySelector('.nutrition-progress-stats.calories').textContent = 
            `${this.nutritionData.calories}/${caloriesGoal} (${caloriesGoal - this.nutritionData.calories} left)`;
        document.querySelector('.nutrition-progress-stats.protein').textContent = 
            `${this.nutritionData.protein}/${proteinGoal}g (${proteinGoal - this.nutritionData.protein}g left)`;
        document.querySelector('.nutrition-progress-stats.carbs').textContent = 
            `${this.nutritionData.carbs}/${carbsGoal}g (${carbsGoal - this.nutritionData.carbs}g left)`;
        document.querySelector('.nutrition-progress-stats.fats').textContent = 
            `${this.nutritionData.fats}/${fatsGoal}g (${fatsGoal - this.nutritionData.fats}g left)`;
        
        // Update history
        const historyList = document.getElementById('nutritionHistoryList');
        if (historyList) {
            historyList.innerHTML = this.nutritionData.history.map(item => `
                <div class="nutrition-history-item">
                    <span class="nutrition-history-item-name">${item.name}</span>
                    <div class="nutrition-history-item-stats">
                        <span>${item.calories} cal</span>
                        <span>${item.protein}g protein</span>
                    </div>
                </div>
            `).join('');
        }
    }

    resetNutrition() {
        this.nutritionData = {
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
            history: []
        };
        
        localStorage.setItem('nutritionData', JSON.stringify(this.nutritionData));
        this.updateNutritionDisplay();
        this.showToast('Nutrition data reset!', 'info');
    }

    addToRecentlyViewed(recipe) {
        // Remove if already exists
        this.recentlyViewed = this.recentlyViewed.filter(r => r.id !== recipe.id);
        
        // Add to beginning
        this.recentlyViewed.unshift(recipe);
        
        // Keep only last 6
        this.recentlyViewed = this.recentlyViewed.slice(0, 6);
        
        localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
        this.renderRecentlyViewed();
    }

    renderRecentlyViewed() {
        const recentRecipes = document.getElementById('recentRecipes');
        if (!recentRecipes) return;
        
        if (this.recentlyViewed.length === 0) {
            recentRecipes.innerHTML = `
                <div class="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    <i data-lucide="clock" class="w-12 h-12 mx-auto mb-4 opacity-50"></i>
                    <p>No recently viewed recipes</p>
                </div>
            `;
            return;
        }
        
        recentRecipes.innerHTML = this.recentlyViewed.map(recipe => `
            <div class="recipe-card" onclick="window.recipeManager.showRecipeDetails(${JSON.stringify(recipe).replace(/"/g, '&quot;')})">
                <img src="${recipe.image}" alt="${recipe.title}" class="w-full h-32 object-cover">
                <div class="p-4">
                    <h3 class="font-semibold line-clamp-1">${recipe.title}</h3>
                    <div class="flex items-center gap-2 mt-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>${recipe.calories} cal</span>
                        <span>•</span>
                        <span>${recipe.prepTime} min</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    clearRecentlyViewed() {
        this.recentlyViewed = [];
        localStorage.setItem('recentlyViewed', JSON.stringify(this.recentlyViewed));
        this.renderRecentlyViewed();
        this.showToast('Recently viewed cleared!', 'info');
    }

    loadMoreRecipes() {
        this.currentPage++;
        this.renderRecipes();
    }

    showRandomRecipe() {
        if (this.filteredRecipes.length === 0) return;
        const randomIndex = Math.floor(Math.random() * this.filteredRecipes.length);
        this.showRecipeDetails(this.filteredRecipes[randomIndex]);
    }

    updateStats() {
        // Update stats in the UI if needed
        const plannedMeals = Object.values(this.mealPlan).reduce((total, day) => {
            return total + Object.values(day).reduce((dayTotal, meals) => dayTotal + meals.length, 0);
        }, 0);
        
        const favoritesCount = document.getElementById('favorites');
        if (favoritesCount) {
            favoritesCount.textContent = this.favorites.length;
        }
        
        // You can add more stats updates here
    }

    showToast(message, type = 'info') {
        const toastArea = document.getElementById('toastArea');
        if (!toastArea) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i data-lucide="${this.getToastIcon(type)}" class="w-5 h-5"></i>
            <span>${message}</span>
        `;

        toastArea.appendChild(toast);

        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
            toast.style.opacity = '1';
        }, 10);

        // Remove after delay
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.parentNode.removeChild(toast);
                }
            }, 300);
        }, 3000);

        // Update Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    getToastIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'alert-circle',
            warning: 'alert-triangle',
            info: 'info'
        };
        return icons[type] || 'info';
    }
}

// Initialize the recipe manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.recipeManager = new RecipeManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecipeManager;
}