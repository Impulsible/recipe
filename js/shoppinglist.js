// Shopping List Application
class ShoppingList {
    constructor() {
        this.items = this.loadItems();
        this.shoppingTips = [
            "Shop seasonal produce for better flavor and lower prices.",
            "Consider buying in bulk for pantry staples you use frequently.",
            "Make a meal plan before shopping to avoid impulse buys.",
            "Check your pantry before shopping to avoid duplicates.",
            "Shop the perimeter of the store for fresh foods first.",
            "Use a list and stick to it to save money and time.",
            "Compare unit prices to get the best value.",
            "Don't shop hungry - you'll make better choices.",
            "Buy frozen fruits and vegetables for longer shelf life.",
            "Plan meals around weekly sales and discounts."
        ];
        this.currentTipIndex = 0;
        
        this.init();
    }

    init() {
        this.initializeEventListeners();
        this.render();
        this.updateStats();
        this.showShoppingTip();
        this.initializeLucideIcons();
    }

    initializeEventListeners() {
        // Modal triggers
        document.getElementById('addCustomItem').addEventListener('click', () => this.showAddItemModal());
        document.getElementById('addEmptyItem').addEventListener('click', () => this.showAddItemModal());
        document.getElementById('generateFromPlanner').addEventListener('click', () => this.generateFromPlanner());
        document.getElementById('generateEmpty').addEventListener('click', () => this.generateFromPlanner());
        document.getElementById('importRecipes').addEventListener('click', () => this.importRecipes());

        // Modal controls
        document.getElementById('addItemForm').addEventListener('submit', (e) => this.handleAddItem(e));
        document.getElementById('cancelAddItem').addEventListener('click', () => this.hideAddItemModal());
        document.querySelector('#addItemModal .modal-close').addEventListener('click', () => this.hideAddItemModal());

        // List actions
        document.getElementById('printList').addEventListener('click', () => this.printList());
        document.getElementById('shareList').addEventListener('click', () => this.showShareModal());
        document.getElementById('exportList').addEventListener('click', () => this.exportList());
        document.getElementById('clearList').addEventListener('click', () => this.clearList());

        // Share modal
        document.querySelector('#shareListModal .modal-close').addEventListener('click', () => this.hideShareModal());
        document.querySelectorAll('.share-option').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleShare(e.target.closest('.share-option').dataset.method));
        });

        // Section toggles
        document.querySelectorAll('.section-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => this.toggleSection(e.currentTarget.dataset.section));
        });

        // Tips
        document.getElementById('nextTip').addEventListener('click', () => this.nextTip());

        // Backdrop click to close modals
        document.getElementById('backdrop').addEventListener('click', () => {
            this.hideAddItemModal();
            this.hideShareModal();
        });
    }

    initializeLucideIcons() {
        // Re-initialize Lucide icons for dynamically created elements
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    loadItems() {
        const saved = localStorage.getItem('shoppingList');
        return saved ? JSON.parse(saved) : [];
    }

    saveItems() {
        localStorage.setItem('shoppingList', JSON.stringify(this.items));
    }

    render() {
        this.renderSections();
        this.updateEmptyState();
        this.updateStats();
    }

    renderSections() {
        const categories = {
            produce: document.getElementById('produceList'),
            protein: document.getElementById('proteinList'),
            dairy: document.getElementById('dairyList'),
            pantry: document.getElementById('pantryList'),
            bakery: document.getElementById('bakeryList'),
            frozen: document.getElementById('frozenList'),
            other: document.getElementById('otherList')
        };

        // Clear all sections
        Object.values(categories).forEach(section => {
            section.innerHTML = '';
        });

        // Count items per category
        const counts = {
            produce: 0, protein: 0, dairy: 0, 
            pantry: 0, bakery: 0, frozen: 0, other: 0
        };

        // Render items
        this.items.forEach(item => {
            counts[item.category]++;
            const itemElement = this.createItemElement(item);
            categories[item.category].appendChild(itemElement);
        });

        // Update section counts
        Object.keys(counts).forEach(category => {
            const countElement = document.getElementById(`${category}Count`);
            if (countElement) {
                countElement.textContent = `${counts[category]} item${counts[category] !== 1 ? 's' : ''}`;
            }
        });

        this.initializeLucideIcons();
    }

    createItemElement(item) {
        const div = document.createElement('div');
        div.className = `shopping-item ${item.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="item-checkbox">
                <input type="checkbox" ${item.completed ? 'checked' : ''} 
                       data-id="${item.id}" aria-label="Mark ${item.name} as completed">
            </div>
            <div class="item-details">
                <div class="item-name">${this.escapeHtml(item.name)}</div>
                <div class="item-meta">
                    ${item.quantity ? `<span class="item-quantity">${this.escapeHtml(item.quantity)}${item.unit ? ' ' + this.escapeHtml(item.unit) : ''}</span>` : ''}
                    ${item.notes ? `<span class="item-notes">${this.escapeHtml(item.notes)}</span>` : ''}
                </div>
            </div>
            <div class="item-actions">
                <button class="btn-icon edit" data-id="${item.id}" aria-label="Edit ${item.name}">
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="btn-icon delete" data-id="${item.id}" aria-label="Delete ${item.name}">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;

        // Add event listeners
        const checkbox = div.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => this.toggleItem(e.target.dataset.id));

        const editBtn = div.querySelector('.edit');
        editBtn.addEventListener('click', (e) => this.editItem(e.currentTarget.dataset.id));

        const deleteBtn = div.querySelector('.delete');
        deleteBtn.addEventListener('click', (e) => this.deleteItem(e.currentTarget.dataset.id));

        return div;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    toggleItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            item.completed = !item.completed;
            this.saveItems();
            this.render();
            this.showToast(`Item ${item.completed ? 'completed' : 'unchecked'}`);
        }
    }

    editItem(id) {
        const item = this.items.find(item => item.id === id);
        if (item) {
            this.populateEditForm(item);
            this.showAddItemModal();
        }
    }

    populateEditForm(item) {
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemQuantity').value = item.quantity || '';
        document.getElementById('itemUnit').value = item.unit || '';
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemNotes').value = item.notes || '';
        
        const form = document.getElementById('addItemForm');
        form.dataset.editingId = item.id;
        document.getElementById('addItemTitle').textContent = 'Edit Item';
    }

    deleteItem(id) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.items = this.items.filter(item => item.id !== id);
            this.saveItems();
            this.render();
            this.showToast('Item deleted');
        }
    }

    handleAddItem(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const editingId = e.target.dataset.editingId;
        
        const item = {
            id: editingId || this.generateId(),
            name: document.getElementById('itemName').value.trim(),
            quantity: document.getElementById('itemQuantity').value.trim(),
            unit: document.getElementById('itemUnit').value.trim(),
            category: document.getElementById('itemCategory').value,
            notes: document.getElementById('itemNotes').value.trim(),
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (!item.name) {
            this.showToast('Please enter an item name', 'error');
            return;
        }

        if (editingId) {
            // Update existing item
            const index = this.items.findIndex(i => i.id === editingId);
            if (index !== -1) {
                item.completed = this.items[index].completed; // Preserve completion status
                this.items[index] = item;
                this.showToast('Item updated');
            }
        } else {
            // Add new item
            this.items.push(item);
            this.showToast('Item added to list');
        }

        this.saveItems();
        this.render();
        this.hideAddItemModal();
        this.resetForm();
    }

    resetForm() {
        document.getElementById('addItemForm').reset();
        document.getElementById('addItemForm').removeAttribute('data-editing-id');
        document.getElementById('addItemTitle').textContent = 'Add Item to Shopping List';
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    showAddItemModal() {
        document.getElementById('addItemModal').classList.remove('hidden');
        document.getElementById('backdrop').classList.remove('hidden');
        document.getElementById('itemName').focus();
    }

    hideAddItemModal() {
        document.getElementById('addItemModal').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
        this.resetForm();
    }

    showShareModal() {
        this.updateSharePreview();
        document.getElementById('shareListModal').classList.remove('hidden');
        document.getElementById('backdrop').classList.remove('hidden');
    }

    hideShareModal() {
        document.getElementById('shareListModal').classList.add('hidden');
        document.getElementById('backdrop').classList.add('hidden');
    }

    updateSharePreview() {
        const preview = document.getElementById('sharePreview');
        const completedItems = this.items.filter(item => item.completed);
        const pendingItems = this.items.filter(item => !item.completed);
        
        let text = `🛒 Shopping List (${this.items.length} items)\n\n`;
        
        if (pendingItems.length > 0) {
            text += `TO BUY (${pendingItems.length}):\n`;
            const byCategory = this.groupByCategory(pendingItems);
            Object.keys(byCategory).forEach(category => {
                text += `\n${this.getCategoryEmoji(category)} ${this.formatCategoryName(category)}:\n`;
                byCategory[category].forEach(item => {
                    text += `☐ ${item.name}`;
                    if (item.quantity) text += ` (${item.quantity}${item.unit ? ' ' + item.unit : ''})`;
                    if (item.notes) text += ` - ${item.notes}`;
                    text += '\n';
                });
            });
        }
        
        if (completedItems.length > 0) {
            text += `\n✅ PURCHASED (${completedItems.length}):\n`;
            completedItems.forEach(item => {
                text += `✅ ${item.name}`;
                if (item.quantity) text += ` (${item.quantity}${item.unit ? ' ' + item.unit : ''})`;
                text += '\n';
            });
        }
        
        preview.textContent = text;
    }

    groupByCategory(items) {
        return items.reduce((groups, item) => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
            return groups;
        }, {});
    }

    getCategoryEmoji(category) {
        const emojis = {
            produce: '🥬',
            protein: '🥩',
            dairy: '🥛',
            pantry: '🫙',
            bakery: '🍞',
            frozen: '🧊',
            other: '📦'
        };
        return emojis[category] || '📦';
    }

    formatCategoryName(category) {
        const names = {
            produce: 'Fresh Produce',
            protein: 'Protein',
            dairy: 'Dairy & Eggs',
            pantry: 'Pantry',
            bakery: 'Bakery',
            frozen: 'Frozen',
            other: 'Other Items'
        };
        return names[category] || category;
    }

    async handleShare(method) {
        const text = document.getElementById('sharePreview').textContent;
        
        try {
            switch (method) {
                case 'copy':
                    await navigator.clipboard.writeText(text);
                    this.showToast('List copied to clipboard!');
                    break;
                    
                case 'whatsapp':
                    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    this.showToast('Opening WhatsApp...');
                    break;
                    
                case 'email':
                    window.open(`mailto:?subject=Shopping List&body=${encodeURIComponent(text)}`);
                    this.showToast('Opening email client...');
                    break;
            }
            
            this.hideShareModal();
        } catch (error) {
            this.showToast('Failed to share list', 'error');
            console.error('Share error:', error);
        }
    }

    generateFromPlanner() {
        // Mock data - in a real app, this would come from the meal planner
        const sampleItems = [
            { name: "Bananas", quantity: "6", unit: "pieces", category: "produce" },
            { name: "Chicken Breast", quantity: "500", unit: "g", category: "protein" },
            { name: "Milk", quantity: "1", unit: "liter", category: "dairy" },
            { name: "Pasta", quantity: "400", unit: "g", category: "pantry" },
            { name: "Whole Wheat Bread", quantity: "1", unit: "loaf", category: "bakery" },
            { name: "Mixed Vegetables", quantity: "1", unit: "bag", category: "frozen" },
            { name: "Olive Oil", quantity: "1", unit: "bottle", category: "pantry" }
        ];

        sampleItems.forEach(itemData => {
            const item = {
                id: this.generateId(),
                name: itemData.name,
                quantity: itemData.quantity,
                unit: itemData.unit,
                category: itemData.category,
                notes: "From meal planner",
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.items.push(item);
        });

        this.saveItems();
        this.render();
        this.showToast('Shopping list generated from planner!');
    }

    importRecipes() {
        // Mock recipe import - in a real app, this would import from saved recipes
        const recipeIngredients = [
            { name: "Tomatoes", quantity: "4", unit: "pieces", category: "produce" },
            { name: "Basil", quantity: "1", unit: "bunch", category: "produce" },
            { name: "Mozzarella", quantity: "200", unit: "g", category: "dairy" },
            { name: "Pizza Dough", quantity: "1", unit: "package", category: "bakery" }
        ];

        recipeIngredients.forEach(ingredient => {
            const item = {
                id: this.generateId(),
                name: ingredient.name,
                quantity: ingredient.quantity,
                unit: ingredient.unit,
                category: ingredient.category,
                notes: "From recipe import",
                completed: false,
                createdAt: new Date().toISOString()
            };
            this.items.push(item);
        });

        this.saveItems();
        this.render();
        this.showToast('Recipe ingredients imported!');
    }

    printList() {
        const printWindow = window.open('', '_blank');
        const completedItems = this.items.filter(item => item.completed);
        const pendingItems = this.items.filter(item => !item.completed);
        
        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Shopping List</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #4CAF50; }
                    .category { margin: 20px 0; }
                    .category h2 { border-bottom: 2px solid #4CAF50; padding-bottom: 5px; }
                    .item { margin: 5px 0; }
                    .completed { text-decoration: line-through; color: #888; }
                    .notes { font-style: italic; color: #666; margin-left: 10px; }
                </style>
            </head>
            <body>
                <h1>🛒 Shopping List</h1>
                <p>Generated on ${new Date().toLocaleDateString()}</p>
        `;

        if (pendingItems.length > 0) {
            const byCategory = this.groupByCategory(pendingItems);
            Object.keys(byCategory).forEach(category => {
                html += `<div class="category">
                    <h2>${this.getCategoryEmoji(category)} ${this.formatCategoryName(category)}</h2>`;
                byCategory[category].forEach(item => {
                    html += `<div class="item">
                        ☐ ${item.name}
                        ${item.quantity ? `(${item.quantity}${item.unit ? ' ' + item.unit : ''})` : ''}
                        ${item.notes ? `<span class="notes">- ${item.notes}</span>` : ''}
                    </div>`;
                });
                html += `</div>`;
            });
        }

        if (completedItems.length > 0) {
            html += `<div class="category">
                <h2>✅ Purchased Items</h2>`;
            completedItems.forEach(item => {
                html += `<div class="item completed">
                    ✅ ${item.name}
                    ${item.quantity ? `(${item.quantity}${item.unit ? ' ' + item.unit : ''})` : ''}
                </div>`;
            });
            html += `</div>`;
        }

        html += `</body></html>`;
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        this.showToast('Print dialog opened');
    }

    exportList() {
        const data = JSON.stringify(this.items, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `shopping-list-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        this.showToast('List exported successfully');
    }

    clearList() {
        if (this.items.length === 0) {
            this.showToast('List is already empty');
            return;
        }

        if (confirm('Are you sure you want to clear your entire shopping list? This action cannot be undone.')) {
            this.items = [];
            this.saveItems();
            this.render();
            this.showToast('Shopping list cleared');
        }
    }

    toggleSection(sectionId) {
        const section = document.querySelector(`[data-category="${sectionId}"]`);
        const itemsList = section.querySelector('.items-list');
        const toggle = section.querySelector('.section-toggle');
        const isExpanded = itemsList.classList.contains('expanded');

        if (isExpanded) {
            itemsList.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
        } else {
            itemsList.classList.add('expanded');
            toggle.setAttribute('aria-expanded', 'true');
        }

        // Update icon rotation
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.style.transform = isExpanded ? 'rotate(0deg)' : 'rotate(180deg)';
        }
    }

    updateStats() {
        const totalItems = this.items.length;
        const completedItems = this.items.filter(item => item.completed).length;
        const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
        
        // Estimated cost (mock calculation)
        const estimatedCost = this.items.reduce((total, item) => {
            return total + (item.completed ? 0 : (Math.random() * 5 + 1)); // Random price between $1-6
        }, 0);

        // Update DOM
        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('completedItems').textContent = completedItems;
        document.getElementById('estimatedCost').textContent = `$${estimatedCost.toFixed(2)}`;
        
        // Progress bar
        document.getElementById('progressPercent').textContent = `${progress}%`;
        document.getElementById('progressFill').style.width = `${progress}%`;
        
        // Remaining items and ETA
        const remaining = totalItems - completedItems;
        document.getElementById('remainingCount').textContent = `${remaining} item${remaining !== 1 ? 's' : ''} remaining`;
        
        // Estimated time (2 minutes per item)
        const etaMinutes = Math.ceil(remaining * 2);
        document.getElementById('progressETA').textContent = `~${etaMinutes} min`;
    }

    updateEmptyState() {
        const emptyState = document.getElementById('emptyState');
        const shoppingSections = document.querySelector('.shopping-sections');
        
        if (this.items.length === 0) {
            emptyState.classList.remove('hidden');
            shoppingSections.classList.add('hidden');
        } else {
            emptyState.classList.add('hidden');
            shoppingSections.classList.remove('hidden');
        }
    }

    showShoppingTip() {
        document.getElementById('shoppingTip').textContent = this.shoppingTips[this.currentTipIndex];
    }

    nextTip() {
        this.currentTipIndex = (this.currentTipIndex + 1) % this.shoppingTips.length;
        this.showShoppingTip();
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('successToast');
        const messageElement = document.getElementById('toastMessage');
        
        messageElement.textContent = message;
        toast.classList.remove('hidden');
        
        // Update toast style based on type
        toast.style.background = type === 'error' ? '#dc3545' : '#4CAF50';
        
        setTimeout(() => {
            toast.classList.add('hidden');
        }, 3000);
    }
}

// Initialize the shopping list when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shoppingList = new ShoppingList();
});

// Handle page visibility change to sync data
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && window.shoppingList) {
        window.shoppingList.items = window.shoppingList.loadItems();
        window.shoppingList.render();
    }
});