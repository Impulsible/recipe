// Profile Page JavaScript - Merged Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Initialize profile page
    initProfilePage();
});

function initProfilePage() {
    // Load all user data
    loadUserData();
    loadProfileData();
    loadPreferences();
    loadAllergies();
    loadNutritionalGoals();
    
    // Set up event listeners
    setupEventListeners();
    
    // Update sidebar with current user data
    updateSidebarUserInfo();
}

function setupEventListeners() {
    // DOM Elements
    const changeAvatarBtn = document.getElementById('changeAvatar');
    const avatarUpload = document.getElementById('avatarUpload');
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const savePreferencesBtn = document.getElementById('savePreferences');
    const saveAllergiesBtn = document.getElementById('saveAllergies');
    const saveGoalsBtn = document.getElementById('saveGoals');
    const exportDataBtn = document.getElementById('exportData');
    const deleteAccountBtn = document.getElementById('deleteAccount');
    
    // Avatar functionality
    if (changeAvatarBtn) {
        changeAvatarBtn.addEventListener('click', function() {
            avatarUpload.click();
        });
    }
    
    if (avatarUpload) {
        avatarUpload.addEventListener('change', handleAvatarUpload);
    }
    
    // Form submissions
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileSubmit);
    }
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }
    
    // Save buttons
    if (savePreferencesBtn) {
        savePreferencesBtn.addEventListener('click', handlePreferencesSave);
    }
    
    if (saveAllergiesBtn) {
        saveAllergiesBtn.addEventListener('click', handleAllergiesSave);
    }
    
    if (saveGoalsBtn) {
        saveGoalsBtn.addEventListener('click', handleGoalsSave);
    }
    
    // Account management
    if (exportDataBtn) {
        exportDataBtn.addEventListener('click', handleDataExport);
    }
    
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', handleAccountDelete);
    }
    
    // Real-time validation
    const nameInput = document.getElementById('profileName');
    const emailInput = document.getElementById('profileEmail');
    
    if (nameInput) {
        nameInput.addEventListener('input', debounce(validateName, 300));
    }
    
    if (emailInput) {
        emailInput.addEventListener('input', debounce(validateEmail, 300));
    }
}

// Avatar Handling
function handleAvatarUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        showErrorMessage('Please select a valid image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        showErrorMessage('Image size must be less than 5MB');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        updateProfileAvatar(e.target.result);
        localStorage.setItem('userAvatar', e.target.result);
        showSuccessMessage('Profile picture updated successfully!');
    };
    reader.readAsDataURL(file);
}

function updateProfileAvatar(imageData) {
    const profileAvatar = document.getElementById('profileAvatar');
    if (!profileAvatar) return;
    
    const img = document.createElement('img');
    img.src = imageData;
    img.alt = 'Profile Picture';
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.borderRadius = '50%';
    img.style.objectFit = 'cover';
    
    profileAvatar.innerHTML = '';
    profileAvatar.appendChild(img);
}

// Profile Form Handling
function handleProfileSubmit(e) {
    e.preventDefault();
    
    if (!validateProfileForm()) {
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoadingState(submitBtn, true, 'Saving...');
    
    // Simulate API call
    setTimeout(() => {
        saveProfileData();
        showLoadingState(submitBtn, false, 'Save Changes');
        showSuccessMessage('Profile updated successfully!');
        
        // Optional: Clear form after saving (uncomment if needed)
        // clearProfileForm();
    }, 1000);
}

function handlePasswordSubmit(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (!validatePasswordForm(currentPassword, newPassword, confirmPassword)) {
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    showLoadingState(submitBtn, true, 'Updating...');
    
    // Simulate API call
    setTimeout(() => {
        // In a real app, you would send this to your backend
        console.log('Password change requested');
        
        showLoadingState(submitBtn, false, 'Update Password');
        passwordForm.reset();
        showSuccessMessage('Password updated successfully!');
    }, 1000);
}

// Preferences Handling
function handlePreferencesSave() {
    const saveBtn = document.getElementById('savePreferences');
    showLoadingState(saveBtn, true, 'Saving...');
    
    setTimeout(() => {
        savePreferences();
        showLoadingState(saveBtn, false, 'Save Preferences');
        showSuccessMessage('Dietary preferences saved successfully!');
    }, 800);
}

function handleAllergiesSave() {
    const saveBtn = document.getElementById('saveAllergies');
    showLoadingState(saveBtn, true, 'Saving...');
    
    setTimeout(() => {
        saveAllergies();
        showLoadingState(saveBtn, false, 'Save Allergies');
        showSuccessMessage('Allergies saved successfully!');
    }, 800);
}

function handleGoalsSave() {
    const saveBtn = document.getElementById('saveGoals');
    showLoadingState(saveBtn, true, 'Saving...');
    
    setTimeout(() => {
        saveNutritionalGoals();
        showLoadingState(saveBtn, false, 'Save Goals');
        showSuccessMessage('Nutritional goals saved successfully!');
    }, 800);
}

// Data Management
function handleDataExport() {
    const exportBtn = document.getElementById('exportData');
    showLoadingState(exportBtn, true, 'Exporting...');
    
    setTimeout(() => {
        exportUserData();
        showLoadingState(exportBtn, false, 'Export My Data');
        showSuccessMessage('Data exported successfully!');
    }, 1500);
}

function handleAccountDelete() {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
        if (confirm('This will permanently delete all your data. Are you absolutely sure?')) {
            // In a real app, you would send a request to your backend
            console.log('Account deletion requested');
            
            // Clear localStorage
            localStorage.clear();
            
            // Redirect to home page
            window.location.href = 'index.html';
        }
    }
}

// Data Loading Functions
function loadUserData() {
    // Profile picture
    const userAvatar = localStorage.getItem('userAvatar');
    if (userAvatar) {
        updateProfileAvatar(userAvatar);
    }
    
    // Basic profile data
    const userName = localStorage.getItem('userName');
    const userEmail = localStorage.getItem('userEmail');
    
    if (userName) {
        document.getElementById('profileName').value = userName;
    }
    
    if (userEmail) {
        document.getElementById('profileEmail').value = userEmail;
    }
}

function loadProfileData() {
    // Legacy support - check both storage locations
    const savedName = localStorage.getItem('profileName') || localStorage.getItem('userName');
    const savedEmail = localStorage.getItem('profileEmail') || localStorage.getItem('userEmail');
    
    if (savedName) {
        document.getElementById('profileName').value = savedName;
    }
    
    if (savedEmail) {
        document.getElementById('profileEmail').value = savedEmail;
    }
}

function loadPreferences() {
    const preferences = ['vegetarian', 'vegan', 'glutenFree', 'dairyFree'];
    
    preferences.forEach(pref => {
        // Check both storage formats for compatibility
        let savedValue = localStorage.getItem(`preference_${pref}`);
        if (savedValue === null) {
            const dietaryPrefs = JSON.parse(localStorage.getItem('dietaryPreferences') || '{}');
            savedValue = dietaryPrefs[pref];
        }
        
        const checkbox = document.getElementById(pref);
        if (checkbox) {
            checkbox.checked = Boolean(savedValue);
            if (checkbox.checked) {
                checkbox.parentElement.classList.add('checked');
            }
        }
    });
}

function loadAllergies() {
    const allergies = ['nuts', 'shellfish', 'eggs', 'soy'];
    const savedAllergies = JSON.parse(localStorage.getItem('allergies') || '{}');
    
    allergies.forEach(allergy => {
        const checkbox = document.getElementById(allergy);
        if (checkbox) {
            checkbox.checked = Boolean(savedAllergies[allergy]);
            if (checkbox.checked) {
                checkbox.parentElement.classList.add('checked');
            }
        }
    });
}

function loadNutritionalGoals() {
    const savedGoals = JSON.parse(localStorage.getItem('nutritionalGoals') || '{}');
    
    document.getElementById('calorieGoal').value = savedGoals.calorieGoal || '';
    document.getElementById('proteinGoal').value = savedGoals.proteinGoal || '';
    document.getElementById('carbsGoal').value = savedGoals.carbsGoal || '';
    document.getElementById('fatGoal').value = savedGoals.fatGoal || '';
}

// Data Saving Functions
function saveProfileData() {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    
    // Save to both formats for compatibility
    localStorage.setItem('userName', name);
    localStorage.setItem('userEmail', email);
    localStorage.setItem('profileName', name);
    localStorage.setItem('profileEmail', email);
    
    // Update sidebar
    updateSidebarUserInfo();
}

function savePreferences() {
    const preferences = {
        vegetarian: document.getElementById('vegetarian').checked,
        vegan: document.getElementById('vegan').checked,
        glutenFree: document.getElementById('glutenFree').checked,
        dairyFree: document.getElementById('dairyFree').checked
    };
    
    // Save to both formats for compatibility
    localStorage.setItem('dietaryPreferences', JSON.stringify(preferences));
    
    preferences.forEach((value, key) => {
        localStorage.setItem(`preference_${key}`, value);
    });
}

function saveAllergies() {
    const allergies = {
        nuts: document.getElementById('nuts').checked,
        shellfish: document.getElementById('shellfish').checked,
        eggs: document.getElementById('eggs').checked,
        soy: document.getElementById('soy').checked
    };
    
    localStorage.setItem('allergies', JSON.stringify(allergies));
}

function saveNutritionalGoals() {
    const goals = {
        calorieGoal: document.getElementById('calorieGoal').value,
        proteinGoal: document.getElementById('proteinGoal').value,
        carbsGoal: document.getElementById('carbsGoal').value,
        fatGoal: document.getElementById('fatGoal').value
    };
    
    localStorage.setItem('nutritionalGoals', JSON.stringify(goals));
}

function exportUserData() {
    const userData = {
        profile: {
            name: localStorage.getItem('userName'),
            email: localStorage.getItem('userEmail')
        },
        dietaryPreferences: JSON.parse(localStorage.getItem('dietaryPreferences') || '{}'),
        allergies: JSON.parse(localStorage.getItem('allergies') || '{}'),
        nutritionalGoals: JSON.parse(localStorage.getItem('nutritionalGoals') || '{}'),
        exportDate: new Date().toISOString()
    };
    
    // Create and download JSON file
    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `recipe-finder-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// Form Validation
function validateProfileForm() {
    const name = document.getElementById('profileName').value.trim();
    const email = document.getElementById('profileEmail').value.trim();
    
    if (!name) {
        showError('Please enter your name');
        return false;
    }
    
    if (!email) {
        showError('Please enter your email address');
        return false;
    }
    
    if (!isValidEmail(email)) {
        showError('Please enter a valid email address');
        return false;
    }
    
    return true;
}

function validatePasswordForm(currentPassword, newPassword, confirmPassword) {
    if (!currentPassword) {
        showError('Please enter your current password');
        return false;
    }
    
    if (!newPassword) {
        showError('Please enter a new password');
        return false;
    }
    
    if (newPassword.length < 6) {
        showError('Password must be at least 6 characters long');
        return false;
    }
    
    if (newPassword !== confirmPassword) {
        showError('New passwords do not match');
        return false;
    }
    
    return true;
}

function validateName() {
    const name = document.getElementById('profileName').value.trim();
    const nameInput = document.getElementById('profileName');
    
    if (name && name.length < 2) {
        nameInput.style.borderColor = '#f44336';
        return false;
    } else {
        nameInput.style.borderColor = '';
        return true;
    }
}

function validateEmail() {
    const email = document.getElementById('profileEmail').value.trim();
    const emailInput = document.getElementById('profileEmail');
    
    if (email && !isValidEmail(email)) {
        emailInput.style.borderColor = '#f44336';
        return false;
    } else {
        emailInput.style.borderColor = '';
        return true;
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// UI Utilities
function updateSidebarUserInfo() {
    const savedName = localStorage.getItem('userName') || localStorage.getItem('profileName');
    const savedEmail = localStorage.getItem('userEmail') || localStorage.getItem('profileEmail');
    
    const sidebarName = document.getElementById('sidebarName');
    const sidebarEmail = document.getElementById('sidebarEmail');
    
    if (sidebarName && savedName) {
        sidebarName.textContent = savedName;
    }
    
    if (sidebarEmail && savedEmail) {
        sidebarEmail.textContent = savedEmail;
    }
}

function showLoadingState(button, isLoading, loadingText = 'Loading...') {
    if (!button) return;
    
    if (isLoading) {
        const originalHTML = button.innerHTML;
        button.setAttribute('data-original-html', originalHTML);
        
        button.classList.add('loading');
        button.disabled = true;
        button.innerHTML = `<i data-lucide="loader-2" class="animate-spin"></i>${loadingText}`;
        lucide.createIcons();
    } else {
        const originalHTML = button.getAttribute('data-original-html') || 
                            '<i data-lucide="save"></i>Save Changes';
        
        button.classList.remove('loading');
        button.disabled = false;
        button.innerHTML = originalHTML;
        lucide.createIcons();
    }
}

function showSuccessMessage(message) {
    // Remove any existing messages
    const existingMessages = document.querySelectorAll('.success-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create new message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message show';
    successMessage.innerHTML = `
        <i data-lucide="check-circle"></i>
        <span>${message}</span>
    `;
    
    // Add to the page
    const profileContainer = document.querySelector('.profile-container');
    if (profileContainer) {
        profileContainer.insertBefore(successMessage, profileContainer.firstChild);
    }
    
    // Initialize icon
    lucide.createIcons();
    
    // Remove after 3 seconds
    setTimeout(() => {
        successMessage.remove();
    }, 3000);
}

function showError(message) {
    // Use the global notification function if available
    if (typeof showNotification === 'function') {
        showNotification(message, 'error');
    } else {
        // Fallback alert
        alert('Error: ' + message);
    }
}

function showErrorMessage(message) {
    showError(message);
}

function clearProfileForm() {
    // Clear the form inputs (optional - uncomment if you want this behavior)
    // document.getElementById('profileName').value = '';
    // document.getElementById('profileEmail').value = '';
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
    .animate-spin {
        animation: spin 1s linear infinite;
    }
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    .btn.loading {
        opacity: 0.8;
        cursor: not-allowed;
    }
    .success-message {
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        color: #155724;
        padding: 12px 15px;
        border-radius: 8px;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        animation: slideDown 0.3s ease;
    }
    .success-message i {
        color: #155724;
    }
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);