// Safe Weekly Goals Manager - No conflicts guaranteed
class SafeWeeklyGoalsManager {
    constructor() {
        this.namespace = 'safeGoals_';
        this.goals = {
            'plan-dinners': { completed: true },
            'try-new-recipe': { completed: false },
            'meal-prep-lunch': { completed: false }
        };
        this.isInitialized = false;
    }

    // Safe initialization with error handling
    safeInit() {
        if (this.isInitialized) return;
        
        try {
            this.setupSafeEventListeners();
            this.loadGoalsState();
            this.updateProgressDisplay();
            this.safeEnhanceQuickActions();
            this.isInitialized = true;
            console.log('Safe Weekly Goals Manager initialized');
        } catch (error) {
            console.warn('Safe goals manager initialization failed:', error);
        }
    }

    setupSafeEventListeners() {
        // Use event delegation with unique class names
        document.addEventListener('click', (e) => {
            const goalItem = e.target.closest('[data-goal]');
            if (goalItem) {
                setTimeout(() => {
                    this.safeToggleGoal(goalItem.dataset.goal);
                }, 10);
            }
        }, { passive: true });

        // Safe reset button handler
        const resetButton = document.getElementById('resetPlannerLink');
        if (resetButton && !resetButton.hasAttribute('data-safe-goals-bound')) {
            resetButton.setAttribute('data-safe-goals-bound', 'true');
            resetButton.addEventListener('click', (e) => {
                if (!e.defaultPrevented) {
                    setTimeout(() => {
                        if (confirm('Are you sure you want to reset all goals?')) {
                            this.safeResetGoals();
                        }
                    }, 10);
                }
            }, { passive: true });
        }
    }

    safeToggleGoal(goalId) {
        if (this.goals[goalId]) {
            this.goals[goalId].completed = !this.goals[goalId].completed;
            this.safeUpdateGoalVisual(goalId);
            this.updateProgressDisplay();
            this.saveGoalsState();
            this.safeEnhanceQuickActions();
        }
    }

    safeUpdateGoalVisual(goalId) {
        try {
            const checkbox = document.querySelector(`[data-goal="${goalId}"] .goal-checkbox`);
            const goal = this.goals[goalId];
            
            if (checkbox) {
                if (goal.completed) {
                    checkbox.innerHTML = '✓';
                    checkbox.classList.add('bg-emerald-500', 'border-emerald-500');
                    checkbox.classList.remove('border-gray-300', 'dark:border-gray-600');
                } else {
                    checkbox.innerHTML = '';
                    checkbox.classList.remove('bg-emerald-500', 'border-emerald-500');
                    checkbox.classList.add('border-gray-300', 'dark:border-gray-600');
                }
            }
        } catch (error) {
            console.warn('Error updating goal visual:', error);
        }
    }

    loadGoalsState() {
        try {
            const savedGoals = localStorage.getItem(this.namespace + 'weeklyGoals');
            if (savedGoals) {
                const parsedGoals = JSON.parse(savedGoals);
                Object.keys(this.goals).forEach(goalId => {
                    if (parsedGoals[goalId] !== undefined) {
                        this.goals[goalId].completed = parsedGoals[goalId].completed;
                    }
                });
                this.safeUpdateAllGoalVisuals();
            }
        } catch (error) {
            console.warn('Error loading goals state:', error);
        }
    }

    safeUpdateAllGoalVisuals() {
        Object.keys(this.goals).forEach(goalId => {
            this.safeUpdateGoalVisual(goalId);
        });
    }

    saveGoalsState() {
        try {
            localStorage.setItem(this.namespace + 'weeklyGoals', JSON.stringify(this.goals));
        } catch (error) {
            console.warn('Error saving goals state:', error);
        }
    }

    updateProgressDisplay() {
        try {
            const completed = Object.values(this.goals).filter(goal => goal.completed).length;
            const total = Object.keys(this.goals).length;
            const progressElement = document.getElementById('goalsProgress');
            if (progressElement) {
                progressElement.textContent = `${completed}/${total} completed`;
            }
        } catch (error) {
            console.warn('Error updating progress display:', error);
        }
    }

    safeEnhanceQuickActions() {
        // Use requestAnimationFrame for non-blocking UI updates
        requestAnimationFrame(() => {
            this.safeResetQuickActions();
            
            if (this.goals['plan-dinners'].completed) {
                this.safeEnhanceDinnerAction();
            }
            
            if (this.goals['try-new-recipe'].completed) {
                this.safeEnhanceNewRecipeActions();
            }
            
            if (this.goals['meal-prep-lunch'].completed) {
                this.safeEnhanceLunchAction();
            }

            this.safeUpdateQuickTip();
        });
    }

    safeResetQuickActions() {
        // Only modify visual aspects, never functionality
        const buttons = document.querySelectorAll('.quick-action-btn');
        buttons.forEach(button => {
            button.classList.remove(
                'bg-amber-50', 'border-amber-200', 'dark:bg-amber-900/20', 'dark:border-amber-800',
                'bg-purple-50', 'border-purple-200', 'dark:bg-purple-900/20', 'dark:border-purple-800',
                'ring-2', 'ring-offset-2'
            );
            
            const icon = button.querySelector('i');
            if (icon) {
                icon.classList.remove('text-amber-600', 'text-purple-600');
                icon.classList.add('text-emerald-600');
            }

            this.safeRemoveBadges(button);
        });
    }

    safeRemoveBadges(button) {
        const badges = button.querySelectorAll('.safe-goal-badge, .safe-new-recipe-badge');
        badges.forEach(badge => badge.remove());
    }

    safeEnhanceDinnerAction() {
        const dinnerButton = this.safeFindQuickActionButton('dinner');
        if (dinnerButton) {
            dinnerButton.classList.add('bg-amber-50', 'border-amber-200', 'dark:bg-amber-900/20', 'dark:border-amber-800');
            
            const icon = dinnerButton.querySelector('i');
            if (icon) {
                icon.classList.remove('text-emerald-600');
                icon.classList.add('text-amber-600');
            }
            
            this.safeAddBadge(dinnerButton, '✓', '3 dinners planned', 'safe-goal-badge');
        }
    }

    safeEnhanceLunchAction() {
        const lunchButton = this.safeFindQuickActionButton('lunch');
        if (lunchButton) {
            lunchButton.classList.add('bg-purple-50', 'border-purple-200', 'dark:bg-purple-900/20', 'dark:border-purple-800');
            
            const icon = lunchButton.querySelector('i');
            if (icon) {
                icon.classList.remove('text-emerald-600');
                icon.classList.add('text-purple-600');
            }
            
            this.safeAddBadge(lunchButton, '🥡', 'Meal prep ready', 'safe-goal-badge');
        }
    }

    safeEnhanceNewRecipeActions() {
        ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
            const button = this.safeFindQuickActionButton(mealType);
            if (button) {
                this.safeAddBadge(button, '✨', 'Try new recipe!', 'safe-new-recipe-badge');
            }
        });
    }

    safeFindQuickActionButton(type) {
        // Safe button finding without interfering with existing functionality
        const buttons = document.querySelectorAll('.quick-action-btn');
        for (let button of buttons) {
            const text = button.querySelector('span')?.textContent.toLowerCase();
            const onclick = button.getAttribute('onclick');
            
            if ((onclick && onclick.includes(type)) || (text && text.includes(type))) {
                return button;
            }
        }
        return null;
    }

    safeAddBadge(button, emoji, tooltip, badgeClass) {
        this.safeRemoveBadges(button);
        
        const badge = document.createElement('span');
        badge.className = `${badgeClass} absolute -top-1 -right-1 bg-white border border-gray-200 text-xs rounded-full w-5 h-5 flex items-center justify-center shadow-sm`;
        badge.textContent = emoji;
        badge.title = tooltip;
        button.style.position = 'relative';
        button.appendChild(badge);
    }

    safeUpdateQuickTip() {
        try {
            const completedGoals = Object.values(this.goals).filter(goal => goal.completed).length;
            const quickTipElement = document.getElementById('quickTip');
            
            if (quickTipElement) {
                let tip = "Plan 3 meals ahead to save time!";
                
                if (completedGoals === 3) {
                    tip = "All goals completed! You're ready for a great week of cooking!";
                } else if (completedGoals === 2) {
                    tip = "Almost there! Complete your goals to unlock meal planning features.";
                } else if (completedGoals === 1) {
                    tip = "Great start! Complete more goals to enhance your quick actions.";
                }
                
                quickTipElement.textContent = tip;
            }
        } catch (error) {
            console.warn('Error updating quick tip:', error);
        }
    }

    safeResetGoals() {
        Object.keys(this.goals).forEach(goalId => {
            this.goals[goalId].completed = false;
        });
        this.safeUpdateAllGoalVisuals();
        this.updateProgressDisplay();
        this.saveGoalsState();
        this.safeEnhanceQuickActions();
    }
}

// Ultra-safe initialization
document.addEventListener('DOMContentLoaded', function() {
    // Wait a bit to ensure other code runs first
    setTimeout(() => {
        // Check if already exists
        if (window.safeWeeklyGoalsManager) {
            return;
        }
        
        try {
            // Create instance but don't initialize immediately
            window.safeWeeklyGoalsManager = new SafeWeeklyGoalsManager();
            
            // Wait for everything else to settle
            setTimeout(() => {
                window.safeWeeklyGoalsManager.safeInit();
            }, 1000);
            
        } catch (error) {
            console.warn('Could not initialize safe goals manager:', error);
        }
    }, 500);
});

// Optional: Manual initialization function
function initSafeGoalsManager() {
    if (window.safeWeeklyGoalsManager && !window.safeWeeklyGoalsManager.isInitialized) {
        window.safeWeeklyGoalsManager.safeInit();
    }
}

// Export for manual control if needed
window.initSafeGoalsManager = initSafeGoalsManager;