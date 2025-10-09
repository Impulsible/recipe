// =========================
// Meal Planner Functionality
// =========================

class MealPlanner {
    constructor() {
        this.currentWeekStart = this.getMonday(new Date());
        this.plannerData = JSON.parse(localStorage.getItem('plannerData')) || {};
        this.userPreferences = JSON.parse(localStorage.getItem('userPreferences')) || {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateWeekDisplay();
        this.renderPlanner();
        this.updateNutritionSummary();
        this.updateWeeklySummary();
        console.log('Meal Planner initialized');
    }

    // Utility Functions
    getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    formatDate(date) {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    formatWeekDisplay(startDate) {
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        return `Week of ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.classList.remove('hidden');
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    openModal(modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    // Local Storage Management
    savePlannerData() {
        localStorage.setItem('plannerData', JSON.stringify(this.plannerData));
    }

    saveUserPreferences() {
        localStorage.setItem('userPreferences', JSON.stringify(this.userPreferences));
    }

    // Week Management
    updateWeekDisplay() {
        const currentWeekElement = document.getElementById('currentWeek');
        if (currentWeekElement) {
            currentWeekElement.textContent = this.formatWeekDisplay(this.currentWeekStart);
        }
        
        // Update all day dates
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        days.forEach((day, index) => {
            const date = new Date(this.currentWeekStart);
            date.setDate(date.getDate() + index);
            const dateElement = document.getElementById(`${day}Date`);
            if (dateElement) {
                dateElement.textContent = this.formatDate(date);
            }
        });
    }

    navigateWeek(direction) {
        const newDate = new Date(this.currentWeekStart);
        newDate.setDate(newDate.getDate() + (direction * 7));
        this.currentWeekStart = newDate;
        this.updateWeekDisplay();
        this.renderPlanner();
    }

    goToToday() {
        this.currentWeekStart = this.getMonday(new Date());
        this.updateWeekDisplay();
        this.renderPlanner();
        this.showToast('Navigated to current week');
    }

    // Meal Management
    getWeekKey() {
        return this.currentWeekStart.toISOString().split('T')[0];
    }

    getMealsForDay(day, mealType) {
        const weekKey = this.getWeekKey();
        if (!this.plannerData[weekKey]) return [];
        if (!this.plannerData[weekKey][day]) return [];
        return this.plannerData[weekKey][day][mealType] || [];
    }

    addMealToPlanner(day, mealType, meal) {
        const weekKey = this.getWeekKey();
        
        if (!this.plannerData[weekKey]) {
            this.plannerData[weekKey] = {};
        }
        if (!this.plannerData[weekKey][day]) {
            this.plannerData[weekKey][day] = {};
        }
        if (!this.plannerData[weekKey][day][mealType]) {
            this.plannerData[weekKey][day][mealType] = [];
        }
        
        meal.id = meal.id || this.generateId();
        this.plannerData[weekKey][day][mealType].push(meal);
        this.savePlannerData();
        this.renderPlanner();
        this.showToast(`Added ${meal.name} to ${this.capitalizeFirst(day)} ${this.capitalizeFirst(mealType)}`);
    }

    removeMealFromPlanner(day, mealType, mealId) {
        const weekKey = this.getWeekKey();
        
        if (this.plannerData[weekKey] && this.plannerData[weekKey][day] && this.plannerData[weekKey][day][mealType]) {
            this.plannerData[weekKey][day][mealType] = this.plannerData[weekKey][day][mealType].filter(meal => meal.id !== mealId);
            this.savePlannerData();
            this.renderPlanner();
            this.showToast('Meal removed from planner');
        }
    }

    capitalizeFirst(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Recipe Search and API
    async searchRecipes(query) {
        const recipeResults = document.getElementById('recipeResults');
        
        if (!query.trim()) {
            recipeResults.innerHTML = '<p class="no-results">Enter a recipe name to search</p>';
            return;
        }
        
        try {
            recipeResults.innerHTML = '<div class="loading">Searching recipes...</div>';
            
            // Using TheMealDB API
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(query)}`);
            const data = await response.json();
            
            if (data.meals) {
                this.displayRecipeResults(data.meals);
            } else {
                recipeResults.innerHTML = '<p class="no-results">No recipes found. Try a different search term.</p>';
            }
        } catch (error) {
            console.error('Error searching recipes:', error);
            recipeResults.innerHTML = '<p class="no-results">Error searching recipes. Please try again.</p>';
        }
    }

    displayRecipeResults(meals) {
        const recipeResults = document.getElementById('recipeResults');
        recipeResults.innerHTML = meals.map(meal => `
            <div class="recipe-item" data-meal-id="${meal.idMeal}">
                <div class="recipe-info">
                    <h4>${meal.strMeal}</h4>
                    <p class="recipe-category">${meal.strCategory} • ${meal.strArea}</p>
                </div>
                <button class="btn btn-outline add-recipe-btn" data-meal-id="${meal.idMeal}">
                    <i data-lucide="plus"></i> Add
                </button>
            </div>
        `).join('');
        
        // Re-initialize Lucide icons
        lucide.createIcons();
        
        // Add event listeners to recipe items
        recipeResults.querySelectorAll('.recipe-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.add-recipe-btn')) {
                    this.showRecipeDetails(item.dataset.mealId);
                }
            });
        });
        
        recipeResults.querySelectorAll('.add-recipe-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.addRecipeToPlanner(btn.dataset.mealId);
            });
        });
    }

    async showRecipeDetails(mealId) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
            const data = await response.json();
            
            if (data.meals && data.meals[0]) {
                const meal = data.meals[0];
                this.showMealDetailsModal(meal);
            }
        } catch (error) {
            console.error('Error fetching recipe details:', error);
            this.showToast('Error loading recipe details', 'error');
        }
    }

    async addRecipeToPlanner(mealId) {
        try {
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${mealId}`);
            const data = await response.json();
            
            if (data.meals && data.meals[0]) {
                const meal = data.meals[0];
                const activeButton = document.querySelector('.add-meal-btn.active');
                
                if (activeButton) {
                    const day = activeButton.dataset.day;
                    const mealType = activeButton.dataset.meal;
                    
                    const mealData = {
                        id: this.generateId(),
                        name: meal.strMeal,
                        type: 'recipe',
                        recipeId: meal.idMeal,
                        image: meal.strMealThumb,
                        category: meal.strCategory,
                        area: meal.strArea,
                        calories: 0, // Will be updated with nutrition data
                        protein: 0,
                        carbs: 0,
                        fat: 0
                    };
                    
                    // Try to get nutrition data
                    try {
                        const nutrition = await this.getNutritionData(meal.strMeal);
                        if (nutrition) {
                            mealData.calories = nutrition.calories;
                            mealData.protein = nutrition.protein;
                            mealData.carbs = nutrition.carbs;
                            mealData.fat = nutrition.fat;
                        }
                    } catch (error) {
                        console.error('Error fetching nutrition data:', error);
                    }
                    
                    this.addMealToPlanner(day, mealType, mealData);
                    this.closeModal(document.getElementById('addMealModal'));
                }
            }
        } catch (error) {
            console.error('Error adding recipe:', error);
            this.showToast('Error adding recipe to planner', 'error');
        }
    }

    async getNutritionData(mealName) {
        try {
            // Mock nutrition data for demo purposes
            // In a real app, you'd use the Edamam API or similar
            const mockNutrition = {
                calories: Math.floor(Math.random() * 600) + 200,
                protein: Math.floor(Math.random() * 30) + 5,
                carbs: Math.floor(Math.random() * 50) + 20,
                fat: Math.floor(Math.random() * 20) + 5
            };
            
            return mockNutrition;
        } catch (error) {
            console.error('Error getting nutrition data:', error);
            return null;
        }
    }

    showMealDetailsModal(meal) {
        const modal = document.getElementById('mealDetailsModal');
        const modalBody = modal.querySelector('.modal-body');
        
        const ingredients = [];
        for (let i = 1; i <= 20; i++) {
            const ingredient = meal[`strIngredient${i}`];
            const measure = meal[`strMeasure${i}`];
            if (ingredient && ingredient.trim()) {
                ingredients.push({ ingredient, measure });
            }
        }
        
        modalBody.innerHTML = `
            <div class="meal-details">
                <div class="meal-header">
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" class="meal-image">
                    <div class="meal-info">
                        <h4>${meal.strMeal}</h4>
                        <p><strong>Category:</strong> ${meal.strCategory}</p>
                        <p><strong>Cuisine:</strong> ${meal.strArea}</p>
                        <p><strong>Tags:</strong> ${meal.strTags || 'None'}</p>
                    </div>
                </div>
                
                <div class="ingredients-section">
                    <h5>Ingredients</h5>
                    <ul class="ingredients-list">
                        ${ingredients.map(item => `
                            <li>${item.measure} ${item.ingredient}</li>
                        `).join('')}
                    </ul>
                </div>
                
                <div class="instructions-section">
                    <h5>Instructions</h5>
                    <div class="instructions">${this.formatInstructions(meal.strInstructions)}</div>
                </div>
                
                ${meal.strYoutube ? `
                    <div class="video-section">
                        <h5>Video Tutorial</h5>
                        <a href="${meal.strYoutube}" target="_blank" class="btn btn-primary">
                            <i data-lucide="youtube"></i> Watch on YouTube
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
        
        lucide.createIcons();
        this.openModal(modal);
    }

    formatInstructions(instructions) {
        if (!instructions) return '<p>No instructions available.</p>';
        
        return instructions.split('\r\n')
            .filter(step => step.trim())
            .map(step => `<p>${step.trim()}</p>`)
            .join('');
    }

    // Render Functions
    renderPlanner() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        days.forEach(day => {
            mealTypes.forEach(mealType => {
                const container = document.getElementById(`${day}${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`);
                if (container) {
                    const meals = this.getMealsForDay(day, mealType);
                    
                    if (meals.length === 0) {
                        container.innerHTML = '<div class="empty-state">No meals planned</div>';
                    } else {
                        container.innerHTML = meals.map(meal => `
                            <div class="meal-item" data-meal-id="${meal.id}">
                                <div class="meal-info">
                                    <span class="meal-name">${meal.name}</span>
                                    ${meal.calories ? `<span class="meal-calories">${meal.calories} cal</span>` : ''}
                                </div>
                                <button class="icon-btn remove-meal" data-meal-id="${meal.id}">
                                    <i data-lucide="x"></i>
                                </button>
                            </div>
                        `).join('');
                        
                        // Add event listeners to remove buttons
                        container.querySelectorAll('.remove-meal').forEach(btn => {
                            btn.addEventListener('click', () => {
                                const dayCard = btn.closest('.day-card');
                                const day = dayCard.dataset.day;
                                this.removeMealFromPlanner(day, mealType, btn.dataset.mealId);
                            });
                        });
                    }
                }
            });
        });
        
        // Re-initialize Lucide icons
        lucide.createIcons();
        this.updateNutritionSummary();
        this.updateWeeklySummary();
    }

    updateNutritionSummary() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        let totalCalories = 0;
        let totalProtein = 0;
        let totalCarbs = 0;
        let totalFat = 0;
        
        days.forEach(day => {
            mealTypes.forEach(mealType => {
                const meals = this.getMealsForDay(day, mealType);
                meals.forEach(meal => {
                    totalCalories += meal.calories || 0;
                    totalProtein += meal.protein || 0;
                    totalCarbs += meal.carbs || 0;
                    totalFat += meal.fat || 0;
                });
            });
        });
        
        document.getElementById('totalCalories').textContent = Math.round(totalCalories);
        document.getElementById('totalProtein').textContent = Math.round(totalProtein) + 'g';
        document.getElementById('totalCarbs').textContent = Math.round(totalCarbs) + 'g';
        document.getElementById('totalFat').textContent = Math.round(totalFat) + 'g';
    }

    updateWeeklySummary() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        let totalCalories = 0;
        let totalProtein = 0;
        let totalMeals = 0;
        let daysWithMeals = 0;
        
        days.forEach(day => {
            let dayHasMeals = false;
            mealTypes.forEach(mealType => {
                const meals = this.getMealsForDay(day, mealType);
                totalMeals += meals.length;
                meals.forEach(meal => {
                    totalCalories += meal.calories || 0;
                    totalProtein += meal.protein || 0;
                    dayHasMeals = true;
                });
            });
            if (dayHasMeals) daysWithMeals++;
        });
        
        document.getElementById('weeklyCalories').textContent = Math.round(totalCalories);
        document.getElementById('weeklyProtein').textContent = Math.round(totalProtein) + 'g';
        document.getElementById('weeklyMeals').textContent = totalMeals;
        document.getElementById('weeklyDays').textContent = `${daysWithMeals}/7`;
    }

    // Quick Actions
    async generateQuickPlan() {
        try {
            // Clear existing plan for the week
            const weekKey = this.getWeekKey();
            if (this.plannerData[weekKey]) {
                delete this.plannerData[weekKey];
            }
            
            // Generate 7 random meals (one for each day's dinner)
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/filter.php?c=Seafood`);
            const data = await response.json();
            
            if (data.meals) {
                const shuffledMeals = data.meals.sort(() => 0.5 - Math.random()).slice(0, 7);
                const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
                
                for (let i = 0; i < days.length && i < shuffledMeals.length; i++) {
                    const meal = shuffledMeals[i];
                    const mealDetails = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${meal.idMeal}`).then(r => r.json());
                    
                    if (mealDetails.meals && mealDetails.meals[0]) {
                        const fullMeal = mealDetails.meals[0];
                        const nutrition = await this.getNutritionData(fullMeal.strMeal);
                        
                        const mealData = {
                            id: this.generateId(),
                            name: fullMeal.strMeal,
                            type: 'recipe',
                            recipeId: fullMeal.idMeal,
                            image: fullMeal.strMealThumb,
                            category: fullMeal.strCategory,
                            area: fullMeal.strArea,
                            calories: nutrition?.calories || 0,
                            protein: nutrition?.protein || 0,
                            carbs: nutrition?.carbs || 0,
                            fat: nutrition?.fat || 0
                        };
                        
                        this.addMealToPlanner(days[i], 'dinner', mealData);
                    }
                }
                
                this.showToast('Quick meal plan generated! Dinners for the week are now planned.');
            }
        } catch (error) {
            console.error('Error generating quick plan:', error);
            this.showToast('Error generating quick plan. Please try again.', 'error');
        }
    }

    async getSmartSuggestion() {
        try {
            const mealSuggestion = document.getElementById('mealSuggestion');
            const smartSuggestBtn = document.getElementById('smartSuggestBtn');
            const nutritionInfo = document.getElementById('nutritionInfo');
            const cookLink = document.getElementById('cookLink');
            const refreshSuggestion = document.getElementById('refreshSuggestion');
            
            mealSuggestion.innerHTML = '<div class="loading">🤖 Thinking of a delicious meal...</div>';
            smartSuggestBtn.disabled = true;
            
            // Get current meals to avoid duplicates
            const currentMeals = this.getAllCurrentMeals();
            
            // Fetch random meal from API
            const response = await fetch(`https://www.themealdb.com/api/json/v1/1/random.php`);
            const data = await response.json();
            
            if (data.meals && data.meals[0]) {
                const meal = data.meals[0];
                
                // Check if this meal is already in the planner
                if (currentMeals.includes(meal.strMeal.toLowerCase())) {
                    // If duplicate, try again
                    this.getSmartSuggestion();
                    return;
                }
                
                // Get nutrition data
                const nutrition = await this.getNutritionData(meal.strMeal);
                
                // Display suggestion
                mealSuggestion.innerHTML = `
                    <h4>${meal.strMeal}</h4>
                    <p class="meal-category">${meal.strCategory} • ${meal.strArea}</p>
                    <img src="${meal.strMealThumb}" alt="${meal.strMeal}" style="max-width: 200px; border-radius: 8px; margin: 1rem 0;">
                `;
                
                if (nutrition) {
                    nutritionInfo.innerHTML = `
                        <div class="nutrition-facts">
                            <strong>Nutrition (approx.):</strong><br>
                            🍽️ ${nutrition.calories} calories<br>
                            💪 ${nutrition.protein}g protein<br>
                            🌾 ${nutrition.carbs}g carbs<br>
                            🥑 ${nutrition.fat}g fat
                        </div>
                    `;
                    nutritionInfo.classList.remove('hidden');
                }
                
                cookLink.href = `https://www.themealdb.com/meal/${meal.idMeal}`;
                cookLink.classList.remove('hidden');
                refreshSuggestion.classList.remove('hidden');
                
                // Store the current suggestion for quick adding
                window.currentSuggestion = {
                    meal,
                    nutrition,
                    day: null,
                    mealType: null
                };
            }
        } catch (error) {
            console.error('Error getting smart suggestion:', error);
            document.getElementById('mealSuggestion').innerHTML = '<p>Sorry, I couldn\'t find a suggestion right now. Please try again.</p>';
        } finally {
            document.getElementById('smartSuggestBtn').disabled = false;
        }
    }

    getAllCurrentMeals() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        const currentMeals = [];
        
        days.forEach(day => {
            mealTypes.forEach(mealType => {
                const meals = this.getMealsForDay(day, mealType);
                meals.forEach(meal => {
                    currentMeals.push(meal.name.toLowerCase());
                });
            });
        });
        
        return currentMeals;
    }

    // Shopping List Generation
    generateShoppingList() {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const mealTypes = ['breakfast', 'lunch', 'dinner'];
    
    // Enhanced sample ingredients with proper categories
    const sampleIngredients = [
        { name: 'Chicken breast', category: 'protein' },
        { name: 'Brown rice', category: 'pantry' },
        { name: 'Broccoli', category: 'produce' },
        { name: 'Olive oil', category: 'pantry' },
        { name: 'Garlic', category: 'produce' },
        { name: 'Salmon fillet', category: 'protein' },
        { name: 'Quinoa', category: 'pantry' },
        { name: 'Asparagus', category: 'produce' },
        { name: 'Lemon', category: 'produce' },
        { name: 'Sweet potatoes', category: 'produce' },
        { name: 'Ground beef', category: 'protein' },
        { name: 'Pasta', category: 'pantry' },
        { name: 'Tomato sauce', category: 'pantry' },
        { name: 'Bell peppers', category: 'produce' },
        { name: 'Onions', category: 'produce' },
        { name: 'Eggs', category: 'protein' },
        { name: 'Whole wheat bread', category: 'bakery' },
        { name: 'Avocado', category: 'produce' },
        { name: 'Spinach', category: 'produce' },
        { name: 'Mushrooms', category: 'produce' },
        { name: 'Milk', category: 'dairy' },
        { name: 'Cheese', category: 'dairy' },
        { name: 'Yogurt', category: 'dairy' }
    ];
    
    // Add 8-12 random ingredients for the demo
    const shuffled = sampleIngredients.sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, Math.floor(Math.random() * 5) + 8);
    
    const shoppingList = selected.map(item => ({
        id: this.generateId(),
        name: item.name,
        completed: false,
        category: item.category
    }));
    
    localStorage.setItem('shoppingList', JSON.stringify(shoppingList));
    localStorage.setItem('listGeneratedDate', new Date().toISOString());
    
    // Show toast and redirect to shopping list page
    this.showToast('Shopping list generated! Redirecting...');
    
    // Redirect after a short delay
    setTimeout(() => {
        window.location.href = 'shoppinglist.html';
    }, 1000);
}

    // Detailed Summary Modal
    showDetailedSummary() {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        
        let dailyBreakdown = '';
        let totalCalories = 0;
        let totalMeals = 0;
        
        days.forEach(day => {
            let dayCalories = 0;
            let dayMeals = 0;
            
            mealTypes.forEach(mealType => {
                const meals = this.getMealsForDay(day, mealType);
                dayMeals += meals.length;
                meals.forEach(meal => {
                    dayCalories += meal.calories || 0;
                });
            });
            
            totalCalories += dayCalories;
            totalMeals += dayMeals;
            
            dailyBreakdown += `
                <div class="day-summary">
                    <h4>${this.capitalizeFirst(day)}</h4>
                    <p>Meals: ${dayMeals} | Calories: ${Math.round(dayCalories)}</p>
                </div>
            `;
        });
        
        const averageDailyCalories = Math.round(totalCalories / 7);
        
        const modal = document.getElementById('detailedSummaryModal');
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="detailed-summary">
                <div class="summary-stats">
                    <div class="summary-stat">
                        <h4>Total Calories</h4>
                        <p class="stat-value">${Math.round(totalCalories)}</p>
                    </div>
                    <div class="summary-stat">
                        <h4>Total Meals</h4>
                        <p class="stat-value">${totalMeals}</p>
                    </div>
                    <div class="summary-stat">
                        <h4>Avg. Daily Calories</h4>
                        <p class="stat-value">${averageDailyCalories}</p>
                    </div>
                </div>
                
                <div class="daily-breakdown">
                    <h4>Daily Breakdown</h4>
                    ${dailyBreakdown}
                </div>
                
                <div class="nutrition-tips">
                    <h4>💡 Nutrition Tips</h4>
                    <ul>
                        <li>Aim for a balanced plate with protein, carbs, and healthy fats</li>
                        <li>Stay hydrated throughout the day</li>
                        <li>Include colorful vegetables in every meal</li>
                        <li>Listen to your body's hunger and fullness cues</li>
                    </ul>
                </div>
            </div>
        `;
        
        this.openModal(modal);
    }

    // Event Listeners
    setupEventListeners() {
        // Quick Actions
        document.querySelector('.quick-plan-btn').addEventListener('click', () => this.generateQuickPlan());
        document.querySelector('.smart-suggest-btn').addEventListener('click', () => this.getSmartSuggestion());

        // Week Navigation
        document.getElementById('prevWeek').addEventListener('click', () => this.navigateWeek(-1));
        document.getElementById('nextWeek').addEventListener('click', () => this.navigateWeek(1));
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // Add Meal Buttons
        document.querySelectorAll('.add-meal-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.add-meal-btn').forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                this.openModal(document.getElementById('addMealModal'));
            });
        });

        // Modal Management
        document.getElementById('modalClose').addEventListener('click', () => this.closeModal(document.getElementById('addMealModal')));
        
        // Recipe Search
        document.getElementById('searchBtn').addEventListener('click', () => {
            const query = document.getElementById('recipeSearch').value;
            this.searchRecipes(query);
        });
        
        document.getElementById('recipeSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = document.getElementById('recipeSearch').value;
                this.searchRecipes(query);
            }
        });

        // Custom Meal
        document.getElementById('addCustomMeal').addEventListener('click', () => {
            const mealName = document.getElementById('customMealName').value.trim();
            if (mealName) {
                const activeButton = document.querySelector('.add-meal-btn.active');
                if (activeButton) {
                    const day = activeButton.dataset.day;
                    const mealType = activeButton.dataset.meal;
                    
                    const mealData = {
                        id: this.generateId(),
                        name: mealName,
                        type: 'custom',
                        calories: 0,
                        protein: 0,
                        carbs: 0,
                        fat: 0
                    };
                    
                    this.addMealToPlanner(day, mealType, mealData);
                    this.closeModal(document.getElementById('addMealModal'));
                }
            }
        });

        // Planner Actions
        document.getElementById('generateShoppingList').addEventListener('click', () => this.generateShoppingList());
        document.getElementById('clearPlanner').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear all meals for this week?')) {
                const weekKey = this.getWeekKey();
                if (this.plannerData[weekKey]) {
                    delete this.plannerData[weekKey];
                    this.savePlannerData();
                    this.renderPlanner();
                    this.showToast('Planner cleared for this week');
                }
            }
        });

        // Summary Actions
        document.querySelector('.view-details-btn').addEventListener('click', () => this.showDetailedSummary());
        document.querySelector('.export-btn').addEventListener('click', () => {
            this.showToast('Export feature coming soon!');
        });

        // Smart Suggestions
        document.getElementById('smartSuggestBtn').addEventListener('click', () => this.getSmartSuggestion());
        document.getElementById('refreshSuggestion').addEventListener('click', () => this.getSmartSuggestion());

        // Close modals with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal(document.getElementById('addMealModal'));
                this.closeModal(document.getElementById('mealDetailsModal'));
                this.closeModal(document.getElementById('detailedSummaryModal'));
            }
        });
    }
}

// Initialize the meal planner when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Initialize meal planner
    window.mealPlanner = new MealPlanner();
    
    // Set current year in footer
    document.getElementById('year').textContent = new Date().getFullYear();
    
    // Set last modified date
    document.getElementById('lastModified').textContent = `Last updated: ${new Date().toLocaleDateString()}`;
});

// Quick fix for modal close buttons - add this at the bottom
document.addEventListener('DOMContentLoaded', () => {
    // Add close functionality to all modal close buttons
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    });
    
    // Close modals when clicking backdrop
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.classList.add('hidden');
            document.body.style.overflow = '';
        }
    });
    
    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.classList.add('hidden');
                document.body.style.overflow = '';
            });
        }
    });
});

