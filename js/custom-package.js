// Global configuration data store
let configurationData = {
    populations: {}
};

document.addEventListener('DOMContentLoaded', function() {
    initializeCadenceLogic();
    initializePopulationManagement();
    initializeFormHandlers();
    
    // Check if we're editing an existing configuration
    const urlParams = new URLSearchParams(window.location.search);
    const editConfigId = urlParams.get('edit');
    if (editConfigId) {
        loadConfigurationForEditing(editConfigId);
    }
});

function initializeCadenceLogic() {
    const cadenceRadios = document.querySelectorAll('input[name="cadence"]');
    const daySelection = document.getElementById('day-selection');
    const dateSelection = document.getElementById('date-selection');
    
    cadenceRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            updateCadenceSelection(this.value);
            updateRadioStyles();
        });
    });
    
    updateCadenceSelection('weekly');
    updateRadioStyles();
}

function updateCadenceSelection(selectedCadence) {
    const daySelection = document.getElementById('day-selection');
    const dateSelection = document.getElementById('date-selection');
    
    if (selectedCadence === 'monthly') {
        daySelection.style.display = 'none';
        dateSelection.style.display = 'block';
    } else if (selectedCadence === 'weekly' || selectedCadence.startsWith('biweekly')) {
        daySelection.style.display = 'block';
        dateSelection.style.display = 'none';
    }
}

function updateRadioStyles() {
    const radioOptions = document.querySelectorAll('.radio-option');
    radioOptions.forEach(option => {
        const radio = option.querySelector('input[type="radio"]');
        if (radio.checked) {
            option.classList.add('checked');
        } else {
            option.classList.remove('checked');
        }
    });
}

function initializePopulationManagement() {
    const addPopulationBtn = document.getElementById('add-population-btn');
    const modal = document.getElementById('population-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-population');
    const saveBtn = document.getElementById('save-population');
    
    addPopulationBtn.addEventListener('click', function() {
        showPopulationModal();
    });
    
    closeBtn.addEventListener('click', hidePopulationModal);
    cancelBtn.addEventListener('click', hidePopulationModal);
    saveBtn.addEventListener('click', savePopulation);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hidePopulationModal();
        }
    });
    
    initializeCategoryManagement();
}

function showPopulationModal() {
    const modal = document.getElementById('population-modal');
    
    // Clear editing state and form if not editing
    if (!modal.getAttribute('data-editing-population-id')) {
        clearPopulationForm();
        // Set a new population ID for new populations
        modal.setAttribute('data-current-population-id', Date.now().toString());
    }
    
    modal.style.display = 'flex';
}

function hidePopulationModal() {
    const modal = document.getElementById('population-modal');
    modal.style.display = 'none';
    clearPopulationForm();
    modal.removeAttribute('data-editing-population-id');
    modal.removeAttribute('data-current-population-id');
}

function clearPopulationForm() {
    document.getElementById('population-name').value = '';
    document.getElementById('population-description').value = '';
    document.getElementById('claim-submission-window').value = '180';
    document.getElementById('runout-period').value = '180';
    document.getElementById('launch-date').value = '2025-01-01';
    document.getElementById('end-date').value = '2025-12-31';
    
    // Clear categories list
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = '<p class="empty-state-small">No categories added yet.</p>';
}

function initializeCategoryManagement() {
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeCategoryBtn = document.getElementById('close-category-modal');
    const cancelCategoryBtn = document.getElementById('cancel-category');
    const saveCategoryBtn = document.getElementById('save-category');
    
    addCategoryBtn.addEventListener('click', function() {
        showCategoryModal();
    });
    
    closeCategoryBtn.addEventListener('click', hideCategoryModal);
    cancelCategoryBtn.addEventListener('click', hideCategoryModal);
    saveCategoryBtn.addEventListener('click', saveCategory);
    
    categoryModal.addEventListener('click', function(e) {
        if (e.target === categoryModal) {
            hideCategoryModal();
        }
    });
    
    const formatSelect = document.getElementById('category-format');
    const structureSelect = document.getElementById('category-structure');
    
    formatSelect.addEventListener('change', updateAmountFields);
    structureSelect.addEventListener('change', updateAmountFields);
    
    initializeExpenseTypeManagement();
}

function savePopulation() {
    const name = document.getElementById('population-name').value.trim();
    const description = document.getElementById('population-description').value.trim();
    const claimWindow = document.getElementById('claim-submission-window').value.trim();
    const runoutPeriod = document.getElementById('runout-period').value.trim();
    const launchDate = document.getElementById('launch-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!name) {
        alert('Please enter a population name.');
        document.getElementById('population-name').focus();
        return;
    }
    
    const categories = collectCategoriesFromModal();
    const modal = document.getElementById('population-modal');
    const editingPopulationId = modal.getAttribute('data-editing-population-id');
    
    const population = {
        id: editingPopulationId || Date.now().toString(),
        name: name,
        description: description,
        claimSubmissionWindow: claimWindow || '180',
        runoutPeriod: runoutPeriod || '180',
        launchDate: launchDate,
        endDate: endDate,
        categories: categories
    };
    
    // Store in global configuration data
    configurationData.populations[population.id] = population;
    console.log('=== DEBUGGING savePopulation ===');
    console.log('Saved population:', population);
    console.log('Global configurationData after save:', configurationData);
    
    // If editing, remove the old population first
    if (editingPopulationId) {
        const existingElement = document.querySelector(`[data-population-id="${editingPopulationId}"]`);
        if (existingElement) {
            existingElement.remove();
        }
    }
    
    addPopulationToList(population);
    hidePopulationModal();
    
    // Clear editing state
    modal.removeAttribute('data-editing-population-id');
}

function addPopulationToList(population) {
    const populationsList = document.getElementById('populations-list');
    const emptyState = populationsList.querySelector('.empty-state');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const populationElement = createPopulationElement(population);
    populationsList.appendChild(populationElement);
}

function createPopulationElement(population) {
    const div = document.createElement('div');
    div.className = 'population-item';
    div.setAttribute('data-population-id', population.id);
    
    const categoriesText = population.categories && population.categories.length > 0 
        ? population.categories.map(cat => cat.name).join(', ')
        : 'No categories';
    
    div.innerHTML = `
        <div class="population-info">
            <h4>${escapeHtml(population.name)}</h4>
            ${population.description ? `<p><strong>Description:</strong> ${escapeHtml(population.description)}</p>` : ''}
            ${population.claimSubmissionWindow ? `<p><strong>Claim Window:</strong> ${escapeHtml(population.claimSubmissionWindow)} days</p>` : ''}
            ${population.launchDate ? `<p><strong>Launch Date:</strong> ${escapeHtml(population.launchDate)}</p>` : ''}
            ${population.endDate ? `<p><strong>End Date:</strong> ${escapeHtml(population.endDate)}</p>` : ''}
            <p><strong>Runout Period:</strong> ${escapeHtml(population.runoutPeriod)} days</p>
            <p><strong>Categories:</strong> ${escapeHtml(categoriesText)}</p>
        </div>
        <div class="population-actions">
            <button type="button" class="btn-icon edit" onclick="editPopulation('${population.id}')" title="Edit">
                ✏️
            </button>
            <button type="button" class="btn-icon delete" onclick="deletePopulation('${population.id}')" title="Delete">
                🗑️
            </button>
        </div>
    `;
    
    return div;
}

function editPopulation(populationId) {
    // Get population data from global configuration store
    const population = configurationData.populations[populationId];
    if (!population) {
        console.error('Population not found in configuration data:', populationId);
        return;
    }
    
    // Populate the modal form with population data
    document.getElementById('population-name').value = population.name || '';
    document.getElementById('population-description').value = population.description || '';
    document.getElementById('claim-submission-window').value = population.claimSubmissionWindow || '180';
    document.getElementById('runout-period').value = population.runoutPeriod || '180';
    document.getElementById('launch-date').value = population.launchDate || '';
    document.getElementById('end-date').value = population.endDate || '';
    
    // Store the population ID for updating instead of creating new
    const modal = document.getElementById('population-modal');
    modal.setAttribute('data-editing-population-id', populationId);
    modal.setAttribute('data-current-population-id', populationId);
    
    // Clear categories list first
    const categoriesList = document.getElementById('categories-list');
    categoriesList.innerHTML = '';
    
    // Load categories if they exist
    if (population.categories && Object.keys(population.categories).length > 0) {
        for (const categoryId in population.categories) {
            const category = population.categories[categoryId];
            addCategoryToModal(category);
        }
    } else {
        categoriesList.innerHTML = '<p class="empty-state-small">No categories added yet.</p>';
    }
    
    showPopulationModal();
}

function deletePopulation(populationId) {
    const populationElement = document.querySelector(`[data-population-id="${populationId}"]`);
    populationElement.remove();
    
    // Remove from global configuration data
    delete configurationData.populations[populationId];
    
    const populationsList = document.getElementById('populations-list');
    if (!populationsList.hasChildNodes() || populationsList.children.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state';
        emptyState.textContent = 'No populations added yet. Click "Add Population" to get started.';
        populationsList.appendChild(emptyState);
    }
}

function initializeFormHandlers() {
    const form = document.getElementById('custom-package-form');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        handleFormSubmit();
    });
    
    const saveAsDraftBtn = form.querySelector('.btn-outline');
    saveAsDraftBtn.addEventListener('click', function() {
        saveFormAsDraft();
    });
}

function handleFormSubmit() {
    const formData = collectFormData();
    
    if (!validateForm(formData)) {
        return;
    }
    
    console.log('Form submitted with data:', formData);
    alert('Configuration saved! The next step (Benefits configuration) will be available soon.');
}

function saveFormAsDraft() {
    const formData = collectFormData();
    localStorage.setItem('customPackageDraft', JSON.stringify(formData));
    
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: var(--primary-green);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = 'Draft saved successfully!';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

function collectFormData() {
    const clientName = document.getElementById('client-name').value.trim();
    const cadence = document.querySelector('input[name="cadence"]:checked').value;
    const dayOfWeek = document.getElementById('day-of-week').value;
    const dayOfMonth = document.getElementById('day-of-month').value;
    
    const populations = Array.from(document.querySelectorAll('.population-item')).map(item => {
        const id = item.getAttribute('data-population-id');
        const info = item.querySelector('.population-info');
        const name = info.querySelector('h4').textContent;
        const descriptionP = info.querySelector('p:nth-child(2)');
        const sizeP = info.querySelector('p:last-child');
        
        return {
            id: id,
            name: name,
            description: descriptionP && descriptionP.textContent.includes('Description:') 
                ? descriptionP.textContent.replace('Description: ', '') : '',
            size: sizeP && sizeP.textContent.includes('Size:') 
                ? sizeP.textContent.replace('Size: ', '').replace(' employees', '') : ''
        };
    });
    
    return {
        clientName: clientName,
        reportingCadence: {
            frequency: cadence,
            dayOfWeek: cadence !== 'monthly' ? dayOfWeek : null,
            dayOfMonth: cadence === 'monthly' ? dayOfMonth : null
        },
        populations: populations
    };
}

function validateForm(formData) {
    if (!formData.clientName) {
        alert('Please enter a client name.');
        document.getElementById('client-name').focus();
        return false;
    }
    
    if (formData.populations.length === 0) {
        alert('Please add at least one population.');
        return false;
    }
    
    return true;
}

function showCategoryModal() {
    const modal = document.getElementById('category-modal');
    
    // Clear form only if not editing
    if (!modal.getAttribute('data-editing-category-id')) {
        clearCategoryForm();
        // Set a new category ID for new categories
        const newCategoryId = Date.now().toString();
        modal.setAttribute('data-current-category-id', newCategoryId);
        console.log('showCategoryModal: Set new category ID:', newCategoryId);
    } else {
        console.log('showCategoryModal: Editing existing category, current ID:', modal.getAttribute('data-current-category-id'));
    }
    
    modal.style.display = 'flex';
    updateAmountFields();
    document.getElementById('category-name').focus();
}

function clearCategoryForm() {
    document.getElementById('category-name').value = '';
    document.getElementById('category-format').value = 'currency';
    document.getElementById('category-structure').value = 'lifetime';
    document.getElementById('category-start-date').value = '2025-01-01';
    document.getElementById('category-end-date').value = '2025-12-31';
    
    const expenseTypesList = document.getElementById('expense-types-list');
    expenseTypesList.innerHTML = '<p class="empty-state-small">No expense types added yet.</p>';
}

function hideCategoryModal() {
    const modal = document.getElementById('category-modal');
    modal.style.display = 'none';
    clearCategoryForm();
    modal.removeAttribute('data-editing-category-id');
    modal.removeAttribute('data-current-category-id');
}

function saveCategory() {
    const name = document.getElementById('category-name').value.trim();
    const format = document.getElementById('category-format').value;
    const structure = document.getElementById('category-structure').value;
    const startDate = document.getElementById('category-start-date').value;
    const endDate = document.getElementById('category-end-date').value;
    
    if (!name) {
        alert('Please enter a category name.');
        document.getElementById('category-name').focus();
        return;
    }
    
    const amounts = collectAmountValues(format, structure);
    const modal = document.getElementById('category-modal');
    const editingCategoryId = modal.getAttribute('data-editing-category-id');
    const currentCategoryId = modal.getAttribute('data-current-category-id');
    const categoryId = editingCategoryId || currentCategoryId || Date.now().toString();
    
    // Get expense types from global store if they exist for this category
    const currentPopulationId = getCurrentPopulationId();
    let expenseTypes = {};
    
    console.log('=== DEBUGGING saveCategory ===');
    console.log('currentPopulationId:', currentPopulationId);
    console.log('editingCategoryId:', editingCategoryId);
    console.log('currentCategoryId:', currentCategoryId);
    console.log('final categoryId:', categoryId);
    
    // Look for expense types using the current category ID
    if (currentPopulationId && configurationData.populations[currentPopulationId] &&
        configurationData.populations[currentPopulationId].categories) {
        
        // Try multiple possible category IDs
        const possibleIds = [categoryId, currentCategoryId, editingCategoryId].filter(Boolean);
        
        for (const id of possibleIds) {
            if (configurationData.populations[currentPopulationId].categories[id] &&
                configurationData.populations[currentPopulationId].categories[id].expenseTypes) {
                
                expenseTypes = configurationData.populations[currentPopulationId].categories[id].expenseTypes;
                console.log('Found expense types using ID', id, ':', expenseTypes);
                break;
            }
        }
    }
    
    console.log('Final expense types for category:', expenseTypes);
    
    const category = {
        id: categoryId,
        name: name,
        format: format,
        structure: structure,
        amounts: amounts,
        startDate: startDate,
        endDate: endDate,
        expenseTypes: expenseTypes
    };
    
    // Store in current population's categories
    if (currentPopulationId && configurationData.populations[currentPopulationId]) {
        if (!configurationData.populations[currentPopulationId].categories) {
            configurationData.populations[currentPopulationId].categories = {};
        }
        configurationData.populations[currentPopulationId].categories[category.id] = category;
    }
    
    // If editing, remove the old category first
    if (editingCategoryId) {
        const existingElement = document.querySelector(`[data-category-id="${editingCategoryId}"]`);
        if (existingElement) {
            existingElement.remove();
        }
    }
    
    addCategoryToModal(category);
    hideCategoryModal();
    
    // Clear editing state
    modal.removeAttribute('data-editing-category-id');
}

function getCurrentPopulationId() {
    // When category modal is open, we need to know which population it belongs to
    // This can be tracked when population modal opens
    const populationModal = document.getElementById('population-modal');
    return populationModal.getAttribute('data-current-population-id');
}

function getCurrentCategoryId() {
    // When expense type modal is open, we need to know which category it belongs to
    const categoryModal = document.getElementById('category-modal');
    const currentCategoryId = categoryModal.getAttribute('data-current-category-id');
    console.log('getCurrentCategoryId() returning:', currentCategoryId);
    return currentCategoryId;
}

function collectAmountValues(format, structure) {
    const amounts = {};
    
    if (structure === 'unlimited') {
        return amounts;
    }
    
    if (structure === 'hybrid') {
        const lifetimeAmount = document.getElementById('lifetime-amount');
        const annualAmount = document.getElementById('annual-amount');
        if (lifetimeAmount) amounts.lifetime = lifetimeAmount.value;
        if (annualAmount) amounts.annual = annualAmount.value;
    } else if (structure === 'lifetime') {
        if (format === 'currency') {
            const lifetimeAmount = document.getElementById('lifetime-amount');
            if (lifetimeAmount) amounts.lifetime = lifetimeAmount.value;
        } else if (format === 'cycles') {
            const lifetimeCycles = document.getElementById('lifetime-cycles');
            if (lifetimeCycles) amounts.lifetimeCycles = lifetimeCycles.value;
        }
    } else if (structure === 'per-event') {
        const perEventAmount = document.getElementById('per-event-amount');
        const numberOfEvents = document.getElementById('number-of-events');
        const perLifetimeAmount = document.getElementById('per-lifetime-amount');
        if (perEventAmount) amounts.perEvent = perEventAmount.value;
        if (numberOfEvents) amounts.numberOfEvents = numberOfEvents.value;
        if (perLifetimeAmount) amounts.perLifetime = perLifetimeAmount.value;
    } else if (structure === 'annual') {
        if (format === 'currency') {
            const annualAmount = document.getElementById('annual-amount');
            if (annualAmount) amounts.annual = annualAmount.value;
        } else if (format === 'cycles') {
            const annualCycles = document.getElementById('annual-cycles');
            if (annualCycles) amounts.annualCycles = annualCycles.value;
        }
    }
    
    return amounts;
}

function addCategoryToModal(category) {
    const categoriesList = document.getElementById('categories-list');
    const emptyState = categoriesList.querySelector('.empty-state-small');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const categoryElement = createCategoryElement(category);
    categoriesList.appendChild(categoryElement);
}

function createCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'category-item';
    div.setAttribute('data-category-id', category.id);
    
    div.innerHTML = `
        <div class="category-info">
            <h5>${escapeHtml(category.name)}</h5>
            ${category.description ? `<p>${escapeHtml(category.description)}</p>` : ''}
        </div>
        <div class="category-actions">
            <button type="button" class="btn-icon edit" onclick="editCategory('${category.id}')" title="Edit">
                ✏️
            </button>
            <button type="button" class="btn-icon delete" onclick="deleteCategory('${category.id}')" title="Delete">
                🗑️
            </button>
        </div>
    `;
    
    return div;
}

function editCategory(categoryId) {
    // Get category data from global configuration store
    const currentPopulationId = getCurrentPopulationId();
    console.log('=== DEBUGGING editCategory ===');
    console.log('categoryId:', categoryId);
    console.log('currentPopulationId:', currentPopulationId);
    console.log('configurationData:', configurationData);
    console.log('populations in configurationData:', configurationData.populations);
    
    if (!currentPopulationId || !configurationData.populations[currentPopulationId] || 
        !configurationData.populations[currentPopulationId].categories ||
        !configurationData.populations[currentPopulationId].categories[categoryId]) {
        console.error('Category not found in configuration data:', categoryId);
        console.log('Population exists:', !!configurationData.populations[currentPopulationId]);
        if (configurationData.populations[currentPopulationId]) {
            console.log('Categories exist:', !!configurationData.populations[currentPopulationId].categories);
            console.log('Categories:', configurationData.populations[currentPopulationId].categories);
        }
        return;
    }
    
    const category = configurationData.populations[currentPopulationId].categories[categoryId];
    console.log('Found category:', category);
    
    // Populate the category form with category data
    document.getElementById('category-name').value = category.name || '';
    document.getElementById('category-format').value = category.format || 'currency';
    document.getElementById('category-structure').value = category.structure || 'lifetime';
    document.getElementById('category-start-date').value = category.startDate || '2025-01-01';
    document.getElementById('category-end-date').value = category.endDate || '2025-12-31';
    
    // Store the category ID for updating instead of creating new
    const modal = document.getElementById('category-modal');
    modal.setAttribute('data-editing-category-id', categoryId);
    modal.setAttribute('data-current-category-id', categoryId);
    
    // Clear expense types list first
    const expenseTypesList = document.getElementById('expense-types-list');
    expenseTypesList.innerHTML = '';
    
    // Load expense types if they exist
    console.log('Category expense types:', category.expenseTypes);
    console.log('Expense types keys:', category.expenseTypes ? Object.keys(category.expenseTypes) : 'none');
    
    if (category.expenseTypes && Object.keys(category.expenseTypes).length > 0) {
        console.log('Loading', Object.keys(category.expenseTypes).length, 'expense types');
        for (const expenseTypeId in category.expenseTypes) {
            const expenseType = category.expenseTypes[expenseTypeId];
            console.log('Loading expense type:', expenseType);
            addExpenseTypeToCategory(expenseType);
        }
        console.log('Expense types list after loading:', document.getElementById('expense-types-list').innerHTML);
    } else {
        console.log('No expense types found - showing empty state');
        expenseTypesList.innerHTML = '<p class="empty-state-small">No expense types added yet.</p>';
    }
    
    // Populate amount fields based on format and structure
    if (category.amounts) {
        populateCategoryAmountFields(category.amounts, category.format, category.structure);
    }
    
    showCategoryModal();
    
    // Update amount fields display after modal is shown
    updateAmountFields();
}

function populateCategoryAmountFields(amounts, format, structure) {
    // This function will be called after updateAmountFields() creates the input fields
    // We need to set a timeout to ensure the fields are created first
    setTimeout(() => {
        if (structure === 'hybrid') {
            if (amounts.lifetime) {
                const lifetimeInput = document.getElementById('lifetime-amount');
                if (lifetimeInput) lifetimeInput.value = amounts.lifetime;
            }
            if (amounts.annual) {
                const annualInput = document.getElementById('annual-amount');
                if (annualInput) annualInput.value = amounts.annual;
            }
        } else if (structure === 'lifetime') {
            if (format === 'currency' && amounts.lifetime) {
                const lifetimeInput = document.getElementById('lifetime-amount');
                if (lifetimeInput) lifetimeInput.value = amounts.lifetime;
            } else if (format === 'cycles' && amounts.lifetimeCycles) {
                const lifetimeCyclesInput = document.getElementById('lifetime-cycles');
                if (lifetimeCyclesInput) lifetimeCyclesInput.value = amounts.lifetimeCycles;
            }
        } else if (structure === 'per-event') {
            if (amounts.perEvent) {
                const perEventInput = document.getElementById('per-event-amount');
                if (perEventInput) perEventInput.value = amounts.perEvent;
            }
            if (amounts.numberOfEvents) {
                const numberOfEventsInput = document.getElementById('number-of-events');
                if (numberOfEventsInput) numberOfEventsInput.value = amounts.numberOfEvents;
            }
            if (amounts.perLifetime) {
                const perLifetimeInput = document.getElementById('per-lifetime-amount');
                if (perLifetimeInput) perLifetimeInput.value = amounts.perLifetime;
            }
        } else if (structure === 'annual') {
            if (format === 'currency' && amounts.annual) {
                const annualInput = document.getElementById('annual-amount');
                if (annualInput) annualInput.value = amounts.annual;
            } else if (format === 'cycles' && amounts.annualCycles) {
                const annualCyclesInput = document.getElementById('annual-cycles');
                if (annualCyclesInput) annualCyclesInput.value = amounts.annualCycles;
            }
        }
    }, 100);
}

function deleteCategory(categoryId) {
    const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`);
    categoryElement.remove();
    
    // Remove from global configuration data
    const currentPopulationId = getCurrentPopulationId();
    if (currentPopulationId && configurationData.populations[currentPopulationId] && 
        configurationData.populations[currentPopulationId].categories) {
        delete configurationData.populations[currentPopulationId].categories[categoryId];
    }
    
    const categoriesList = document.getElementById('categories-list');
    if (!categoriesList.hasChildNodes() || categoriesList.children.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state-small';
        emptyState.textContent = 'No categories added yet.';
        categoriesList.appendChild(emptyState);
    }
}

function collectCategoriesFromModal() {
    const categoryItems = document.querySelectorAll('#categories-list .category-item');
    return Array.from(categoryItems).map(item => {
        const id = item.getAttribute('data-category-id');
        const info = item.querySelector('.category-info');
        const name = info.querySelector('h5').textContent;
        const descriptionP = info.querySelector('p');
        const description = descriptionP ? descriptionP.textContent : '';
        
        return {
            id: id,
            name: name,
            description: description
        };
    });
}

function updateAmountFields() {
    const format = document.getElementById('category-format').value;
    const structure = document.getElementById('category-structure').value;
    const amountFieldsContainer = document.getElementById('amount-fields');
    
    amountFieldsContainer.innerHTML = '';
    
    if (structure === 'unlimited') {
        return;
    }
    
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'amount-field-group';
    
    if (structure === 'hybrid') {
        fieldGroup.innerHTML = `
            <div class="form-group">
                <label for="lifetime-amount">Lifetime ($)</label>
                <input type="number" id="lifetime-amount" placeholder="0.00" step="0.01">
            </div>
            <div class="form-group">
                <label for="annual-amount">Annual ($)</label>
                <input type="number" id="annual-amount" placeholder="0.00" step="0.01">
            </div>
        `;
    } else if (structure === 'lifetime') {
        if (format === 'currency') {
            fieldGroup.innerHTML = `
                <div class="form-group">
                    <label for="lifetime-amount">Lifetime ($)</label>
                    <input type="number" id="lifetime-amount" placeholder="0.00" step="0.01">
                </div>
            `;
        } else if (format === 'cycles') {
            fieldGroup.innerHTML = `
                <div class="form-group">
                    <label for="lifetime-cycles">Lifetime (number)</label>
                    <input type="number" id="lifetime-cycles" placeholder="0">
                </div>
            `;
        }
    } else if (structure === 'per-event') {
        fieldGroup.innerHTML = `
            <div class="form-group">
                <label for="per-event-amount">Per Event ($)</label>
                <input type="number" id="per-event-amount" placeholder="0.00" step="0.01">
            </div>
            <div class="form-group">
                <label for="number-of-events">Number of Events</label>
                <input type="number" id="number-of-events" placeholder="0">
            </div>
            <div class="form-group">
                <label for="per-lifetime-amount">Per Lifetime ($)</label>
                <input type="number" id="per-lifetime-amount" placeholder="0.00" step="0.01">
            </div>
        `;
    } else if (structure === 'annual') {
        if (format === 'currency') {
            fieldGroup.innerHTML = `
                <div class="form-group">
                    <label for="annual-amount">Annual ($)</label>
                    <input type="number" id="annual-amount" placeholder="0.00" step="0.01">
                </div>
            `;
        } else if (format === 'cycles') {
            fieldGroup.innerHTML = `
                <div class="form-group">
                    <label for="annual-cycles">Annual (number)</label>
                    <input type="number" id="annual-cycles" placeholder="0">
                </div>
            `;
        }
    }
    
    if (fieldGroup.innerHTML) {
        amountFieldsContainer.appendChild(fieldGroup);
    }
}

function initializeExpenseTypeManagement() {
    const addExpenseTypeBtn = document.getElementById('add-expense-type-btn');
    const expenseTypeModal = document.getElementById('expense-type-modal');
    const closeExpenseTypeBtn = document.getElementById('close-expense-type-modal');
    const cancelExpenseTypeBtn = document.getElementById('cancel-expense-type');
    const saveExpenseTypeBtn = document.getElementById('save-expense-type');
    
    addExpenseTypeBtn.addEventListener('click', function() {
        showExpenseTypeModal();
    });
    
    closeExpenseTypeBtn.addEventListener('click', hideExpenseTypeModal);
    cancelExpenseTypeBtn.addEventListener('click', hideExpenseTypeModal);
    saveExpenseTypeBtn.addEventListener('click', saveExpenseType);
    
    expenseTypeModal.addEventListener('click', function(e) {
        if (e.target === expenseTypeModal) {
            hideExpenseTypeModal();
        }
    });
    
    const expenseCategorySelect = document.getElementById('expense-category');
    const eligibilitySelect = document.getElementById('eligibility');
    const taxationSelect = document.getElementById('taxation');
    const directPaymentSelect = document.getElementById('direct-payment');
    
    expenseCategorySelect.addEventListener('change', updateExpenseTypeConditionalFields);
    eligibilitySelect.addEventListener('change', updateExpenseTypeConditionalFields);
    taxationSelect.addEventListener('change', updateExpenseTypeConditionalFields);
    directPaymentSelect.addEventListener('change', updateExpenseTypeConditionalFields);
    
    initializeCheckboxGroups();
}

function showExpenseTypeModal() {
    const modal = document.getElementById('expense-type-modal');
    modal.style.display = 'flex';
    
    clearExpenseTypeForm();
    updateExpenseTypeConditionalFields();
}

function clearExpenseTypeForm() {
    document.getElementById('expense-category').value = 'fertility';
    document.getElementById('historical-spend').value = 'no';
    document.getElementById('user-level').value = 'household';
    document.getElementById('reimbursement-method').value = 'payroll';
    document.getElementById('expense-start-date').value = '2025-01-01';
    document.getElementById('expense-end-date').value = '2025-12-31';
    document.getElementById('direct-payment').value = 'no';
    document.getElementById('coverage-type').value = 'deductible-enabled';
    document.getElementById('eligibility').value = 'anyone-on-file';
    document.getElementById('taxation').value = 'standard';
    
    resetAllCheckboxes();
    resetAllConditionalSelects();
}

function resetAllCheckboxes() {
    const checkboxGroups = ['wallet-holder-type', 'wallet-holder-geography', 'reimbursement-recipient-type'];
    checkboxGroups.forEach(groupName => {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = true;
        });
    });
    
    // Reset subcategory checkboxes to their defaults
    resetSubcategoryCheckboxes();
}

function resetSubcategoryCheckboxes() {
    const subcategoryDefaults = {
        'fertility-subcategories': ['medical'],
        'preservation-subcategories': ['medical'],
        'parenting-pediatrics-subcategories': ['childcare'],
        'maternity-subcategories': ['medical', 'wellness', 'travel'],
        'menopause-subcategories': ['general'],
        'surrogacy-subcategories': ['general'],
        'donor-subcategories': ['general', 'ancillary'],
        'adoption-subcategories': ['general']
    };
    
    Object.entries(subcategoryDefaults).forEach(([groupName, defaults]) => {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = defaults.includes(checkbox.value);
            updateCheckboxOptionStyle(checkbox.closest('.checkbox-option'), checkbox.checked);
        });
    });
}

function resetAllConditionalSelects() {
    const selects = [
        'tenure-requirement', 'benefits-eligible', 'employee-medically-enrolled',
        'wallet-holder-medically-enrolled', 'reimbursement-recipient-medically-enrolled',
        'step-child-adoption', 'failed-adoption', 'dx-infertility-required',
        'non-tax-partner-taxation', 'international-taxation', 'step-child-taxation',
        'failed-adoption-taxation', 'dx-infertility-taxation'
    ];
    
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (select) {
            if (selectId === 'tenure-requirement') {
                select.value = 'none';
            } else if (selectId.includes('taxation')) {
                select.value = 'not-taxed';
            } else {
                select.value = 'no';
            }
        }
    });
}

function hideExpenseTypeModal() {
    const modal = document.getElementById('expense-type-modal');
    modal.style.display = 'none';
    modal.removeAttribute('data-editing-expense-type-id');
}

function saveExpenseType() {
    const configuration = collectExpenseTypeConfiguration();
    const modal = document.getElementById('expense-type-modal');
    const editingExpenseTypeId = modal.getAttribute('data-editing-expense-type-id');
    
    const expenseType = {
        id: editingExpenseTypeId || Date.now().toString(),
        name: configuration.expenseCategory,
        configuration: configuration
    };
    
    // Store in current category's expense types
    const currentPopulationId = getCurrentPopulationId();
    const currentCategoryId = getCurrentCategoryId();
    
    if (currentPopulationId && currentCategoryId && 
        configurationData.populations[currentPopulationId] && 
        configurationData.populations[currentPopulationId].categories &&
        configurationData.populations[currentPopulationId].categories[currentCategoryId]) {
        
        if (!configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes) {
            configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes = {};
        }
        
        configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes[expenseType.id] = expenseType;
        
        console.log('=== DEBUGGING saveExpenseType ===');
        console.log('Saved expense type:', expenseType);
        console.log('To population:', currentPopulationId);
        console.log('To category:', currentCategoryId);
        console.log('Updated global config:', configurationData);
    }
    
    // If editing, remove the old expense type element first
    if (editingExpenseTypeId) {
        const existingElement = document.querySelector(`[data-expense-type-id="${editingExpenseTypeId}"]`);
        if (existingElement) {
            existingElement.remove();
        }
    }
    
    addExpenseTypeToCategory(expenseType);
    hideExpenseTypeModal();
    
    // Clear editing state
    modal.removeAttribute('data-editing-expense-type-id');
}

function addExpenseTypeToCategory(expenseType) {
    const expenseTypesList = document.getElementById('expense-types-list');
    const emptyState = expenseTypesList.querySelector('.empty-state-small');
    
    if (emptyState) {
        emptyState.remove();
    }
    
    const expenseTypeElement = createExpenseTypeElement(expenseType);
    expenseTypesList.appendChild(expenseTypeElement);
}

function createExpenseTypeElement(expenseType) {
    const div = document.createElement('div');
    div.className = 'expense-type-item';
    div.setAttribute('data-expense-type-id', expenseType.id);
    
    div.innerHTML = `
        <div class="expense-type-info">
            <h5>${escapeHtml(expenseType.name.charAt(0).toUpperCase() + expenseType.name.slice(1))}</h5>
            <p><strong>User Level:</strong> ${escapeHtml(expenseType.configuration.userLevel)}</p>
            <p><strong>Eligibility:</strong> ${escapeHtml(expenseType.configuration.eligibility.type)}</p>
        </div>
        <div class="expense-type-actions">
            <button type="button" class="btn-icon edit" onclick="editExpenseType('${expenseType.id}')" title="Edit">
                ✏️
            </button>
            <button type="button" class="btn-icon delete" onclick="deleteExpenseType('${expenseType.id}')" title="Delete">
                🗑️
            </button>
        </div>
    `;
    
    return div;
}

function editExpenseType(expenseTypeId) {
    // Get expense type data from global configuration store
    const currentPopulationId = getCurrentPopulationId();
    const currentCategoryId = getCurrentCategoryId();
    
    if (!currentPopulationId || !currentCategoryId || 
        !configurationData.populations[currentPopulationId] || 
        !configurationData.populations[currentPopulationId].categories ||
        !configurationData.populations[currentPopulationId].categories[currentCategoryId] ||
        !configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes ||
        !configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes[expenseTypeId]) {
        console.error('Expense type not found in configuration data:', expenseTypeId);
        return;
    }
    
    const expenseType = configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes[expenseTypeId];
    const config = expenseType.configuration;
    
    // Store the expense type ID for updating instead of creating new
    const modal = document.getElementById('expense-type-modal');
    modal.setAttribute('data-editing-expense-type-id', expenseTypeId);
    
    // Clear form first
    clearExpenseTypeForm();
    
    // Populate basic fields
    document.getElementById('expense-category').value = config.expenseCategory || 'fertility';
    document.getElementById('historical-spend').value = config.historicalSpendSupported ? 'yes' : 'no';
    document.getElementById('user-level').value = config.userLevel || 'household';
    document.getElementById('reimbursement-method').value = config.reimbursementMethod || 'payroll';
    document.getElementById('expense-start-date').value = config.startDate || '2025-01-01';
    document.getElementById('expense-end-date').value = config.endDate || '2025-12-31';
    document.getElementById('eligibility').value = config.eligibility.type || 'anyone-on-file';
    document.getElementById('taxation').value = config.taxation.type || 'standard';
    
    // Populate fertility-specific fields
    if (config.expenseCategory === 'fertility') {
        document.getElementById('direct-payment').value = config.directPayment ? 'yes' : 'no';
        if (config.directPayment && config.coverageType) {
            document.getElementById('coverage-type').value = config.coverageType;
        }
    }
    
    // Populate subcategories checkboxes
    if (config.subcategories && config.subcategories.length > 0) {
        populateSubcategoryCheckboxes(config.expenseCategory, config.subcategories);
    }
    
    // Populate custom eligibility fields
    if (config.eligibility.type === 'custom') {
        populateCustomEligibilityFields(config.eligibility, config.expenseCategory);
    }
    
    // Populate custom taxation fields
    if (config.taxation.type === 'custom') {
        populateCustomTaxationFields(config.taxation, config.expenseCategory);
    }
    
    // Update conditional fields and show modal
    updateExpenseTypeConditionalFields();
    modal.style.display = 'flex';
}

function populateSubcategoryCheckboxes(expenseCategory, selectedSubcategories) {
    const subcategoryGroupMap = {
        'fertility': 'fertility-subcategories',
        'preservation': 'preservation-subcategories',
        'parenting-pediatrics': 'parenting-pediatrics-subcategories',
        'maternity': 'maternity-subcategories',
        'menopause': 'menopause-subcategories',
        'surrogacy': 'surrogacy-subcategories',
        'donor': 'donor-subcategories',
        'adoption': 'adoption-subcategories'
    };
    
    const groupName = subcategoryGroupMap[expenseCategory];
    if (groupName && selectedSubcategories) {
        const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectedSubcategories.includes(checkbox.value);
            updateCheckboxOptionStyle(checkbox.closest('.checkbox-option'), checkbox.checked);
        });
    }
}

function populateCustomEligibilityFields(eligibility, expenseCategory) {
    // Basic custom eligibility fields
    if (eligibility.tenureRequirement !== undefined) {
        document.getElementById('tenure-requirement').value = eligibility.tenureRequirement;
    }
    if (eligibility.benefitsEligible !== undefined) {
        document.getElementById('benefits-eligible').value = eligibility.benefitsEligible ? 'yes' : 'no';
    }
    if (eligibility.employeeMedicallyEnrolled !== undefined) {
        document.getElementById('employee-medically-enrolled').value = eligibility.employeeMedicallyEnrolled ? 'yes' : 'no';
    }
    if (eligibility.walletHolderMedicallyEnrolled !== undefined) {
        document.getElementById('wallet-holder-medically-enrolled').value = eligibility.walletHolderMedicallyEnrolled ? 'yes' : 'no';
    }
    if (eligibility.reimbursementRecipientMedicallyEnrolled !== undefined) {
        document.getElementById('reimbursement-recipient-medically-enrolled').value = eligibility.reimbursementRecipientMedicallyEnrolled ? 'yes' : 'no';
    }
    
    // Populate checkbox groups
    if (eligibility.walletHolderTypes) {
        populateCheckboxGroup('wallet-holder-type', eligibility.walletHolderTypes);
    }
    if (eligibility.walletHolderGeography) {
        populateCheckboxGroup('wallet-holder-geography', eligibility.walletHolderGeography);
    }
    if (eligibility.reimbursementRecipientTypes) {
        populateCheckboxGroup('reimbursement-recipient-type', eligibility.reimbursementRecipientTypes);
    }
    
    // Adoption-specific fields
    if (expenseCategory === 'adoption') {
        if (eligibility.stepChildAdoptionAllowed !== undefined) {
            document.getElementById('step-child-adoption').value = eligibility.stepChildAdoptionAllowed ? 'yes' : 'no';
        }
        if (eligibility.failedAdoptionAllowed !== undefined) {
            document.getElementById('failed-adoption').value = eligibility.failedAdoptionAllowed ? 'yes' : 'no';
        }
    }
    
    // Fertility/preservation-specific fields
    if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
        if (eligibility.dxInfertilityRequired !== undefined) {
            document.getElementById('dx-infertility-required').value = eligibility.dxInfertilityRequired ? 'yes' : 'no';
        }
    }
}

function populateCustomTaxationFields(taxation, expenseCategory) {
    // Basic custom taxation fields
    if (taxation.nonTaxPartnerTaxation !== undefined) {
        document.getElementById('non-tax-partner-taxation').value = taxation.nonTaxPartnerTaxation;
    }
    if (taxation.internationalTaxation !== undefined) {
        document.getElementById('international-taxation').value = taxation.internationalTaxation;
    }
    
    // Adoption-specific taxation fields
    if (expenseCategory === 'adoption') {
        if (taxation.stepChildTaxation !== undefined) {
            document.getElementById('step-child-taxation').value = taxation.stepChildTaxation;
        }
        if (taxation.failedAdoptionTaxation !== undefined) {
            document.getElementById('failed-adoption-taxation').value = taxation.failedAdoptionTaxation;
        }
    }
    
    // Fertility/preservation-specific taxation fields
    if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
        if (taxation.dxInfertilityTaxation !== undefined) {
            document.getElementById('dx-infertility-taxation').value = taxation.dxInfertilityTaxation;
        }
    }
}

function populateCheckboxGroup(groupName, selectedValues) {
    const checkboxes = document.querySelectorAll(`input[name="${groupName}"]`);
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectedValues.includes(checkbox.value);
        updateCheckboxOptionStyle(checkbox.closest('.checkbox-option'), checkbox.checked);
    });
}

function deleteExpenseType(expenseTypeId) {
    const expenseTypeElement = document.querySelector(`[data-expense-type-id="${expenseTypeId}"]`);
    expenseTypeElement.remove();
    
    // Remove from global configuration data
    const currentPopulationId = getCurrentPopulationId();
    const currentCategoryId = getCurrentCategoryId();
    
    if (currentPopulationId && currentCategoryId && 
        configurationData.populations[currentPopulationId] && 
        configurationData.populations[currentPopulationId].categories &&
        configurationData.populations[currentPopulationId].categories[currentCategoryId] &&
        configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes) {
        delete configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes[expenseTypeId];
    }
    
    const expenseTypesList = document.getElementById('expense-types-list');
    if (!expenseTypesList.hasChildNodes() || expenseTypesList.children.length === 0) {
        const emptyState = document.createElement('p');
        emptyState.className = 'empty-state-small';
        emptyState.textContent = 'No expense types added yet.';
        expenseTypesList.appendChild(emptyState);
    }
}

function collectExpenseTypesFromCategory() {
    const expenseTypeItems = document.querySelectorAll('#expense-types-list .expense-type-item');
    const currentPopulationId = getCurrentPopulationId();
    const currentCategoryId = getCurrentCategoryId();
    
    return Array.from(expenseTypeItems).map(item => {
        const id = item.getAttribute('data-expense-type-id');
        
        // Get the full expense type data from global configuration store
        if (currentPopulationId && currentCategoryId && 
            configurationData.populations[currentPopulationId] &&
            configurationData.populations[currentPopulationId].categories &&
            configurationData.populations[currentPopulationId].categories[currentCategoryId] &&
            configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes &&
            configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes[id]) {
            
            return configurationData.populations[currentPopulationId].categories[currentCategoryId].expenseTypes[id];
        }
        
        // Fallback: extract basic info from DOM if not found in store
        const info = item.querySelector('.expense-type-info');
        const name = info.querySelector('h5').textContent.toLowerCase();
        
        return {
            id: id,
            name: name,
            configuration: {
                expenseCategory: name
            }
        };
    });
}

function updateExpenseTypeConditionalFields() {
    const expenseCategory = document.getElementById('expense-category').value;
    const eligibility = document.getElementById('eligibility').value;
    const taxation = document.getElementById('taxation').value;
    const directPayment = document.getElementById('direct-payment').value;
    
    // Show/hide fertility-specific fields
    const fertilityFields = document.getElementById('fertility-fields');
    fertilityFields.classList.toggle('show', expenseCategory === 'fertility');
    
    // Show/hide coverage type field (only when Direct Payment is Yes and expense category is fertility)
    const coverageTypeField = document.getElementById('coverage-type-field');
    coverageTypeField.classList.toggle('show', expenseCategory === 'fertility' && directPayment === 'yes');
    
    // Show/hide user level field (only for fertility or preservation)
    const userLevelField = document.getElementById('user-level-field');
    userLevelField.classList.toggle('show', expenseCategory === 'fertility' || expenseCategory === 'preservation');
    
    // Show/hide subcategory sections based on expense type
    const subcategorySections = [
        'fertility-subcategories',
        'preservation-subcategories', 
        'parenting-pediatrics-subcategories',
        'maternity-subcategories',
        'menopause-subcategories',
        'surrogacy-subcategories',
        'donor-subcategories',
        'adoption-subcategories'
    ];
    
    subcategorySections.forEach(sectionId => {
        const section = document.getElementById(sectionId);
        section.classList.remove('show');
    });
    
    // Show the appropriate subcategory section
    const subcategoryMap = {
        'fertility': 'fertility-subcategories',
        'preservation': 'preservation-subcategories',
        'parenting-pediatrics': 'parenting-pediatrics-subcategories',
        'maternity': 'maternity-subcategories',
        'menopause': 'menopause-subcategories',
        'surrogacy': 'surrogacy-subcategories',
        'donor': 'donor-subcategories',
        'adoption': 'adoption-subcategories'
    };
    
    const activeSubcategorySection = subcategoryMap[expenseCategory];
    if (activeSubcategorySection) {
        document.getElementById(activeSubcategorySection).classList.add('show');
    }
    
    // Show/hide custom eligibility fields
    const customEligibilityFields = document.getElementById('custom-eligibility-fields');
    customEligibilityFields.classList.toggle('show', eligibility === 'custom');
    
    // Show/hide adoption-specific custom eligibility fields
    const adoptionCustomFields = document.getElementById('adoption-custom-fields');
    adoptionCustomFields.classList.toggle('show', eligibility === 'custom' && expenseCategory === 'adoption');
    
    // Show/hide fertility/preservation-specific custom eligibility fields
    const fertilityPreservationCustomFields = document.getElementById('fertility-preservation-custom-fields');
    fertilityPreservationCustomFields.classList.toggle('show', 
        eligibility === 'custom' && (expenseCategory === 'fertility' || expenseCategory === 'preservation'));
    
    // Show/hide custom taxation fields
    const customTaxationFields = document.getElementById('custom-taxation-fields');
    customTaxationFields.classList.toggle('show', taxation === 'custom');
    
    // Show/hide specific custom taxation field based on reimbursement recipient selection
    if (taxation === 'custom') {
        updateCustomTaxationFields();
    }
    
    // Show/hide adoption-specific custom taxation fields
    const adoptionTaxationFields = document.getElementById('adoption-taxation-fields');
    adoptionTaxationFields.classList.toggle('show', taxation === 'custom' && expenseCategory === 'adoption');
    
    // Show/hide fertility/preservation-specific custom taxation fields
    const fertilityPreservationTaxationFields = document.getElementById('fertility-preservation-taxation-fields');
    fertilityPreservationTaxationFields.classList.toggle('show', 
        taxation === 'custom' && (expenseCategory === 'fertility' || expenseCategory === 'preservation'));
}

function initializeCheckboxGroups() {
    const checkboxOptions = document.querySelectorAll('.checkbox-option');
    checkboxOptions.forEach(option => {
        const checkbox = option.querySelector('input[type="checkbox"]');
        
        option.addEventListener('click', function(e) {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            updateCheckboxOptionStyle(option, checkbox.checked);
            
            // Update custom taxation fields when reimbursement recipient type changes
            if (checkbox.name === 'reimbursement-recipient-type') {
                updateCustomTaxationFields();
            }
        });
        
        checkbox.addEventListener('change', function() {
            updateCheckboxOptionStyle(option, this.checked);
            
            // Update custom taxation fields when reimbursement recipient type changes
            if (this.name === 'reimbursement-recipient-type') {
                updateCustomTaxationFields();
            }
        });
        
        updateCheckboxOptionStyle(option, checkbox.checked);
    });
}

function updateCustomTaxationFields() {
    // Check if non-tax dependent partner is selected as reimbursement recipient
    const nonTaxPartnerSelected = document.querySelector('input[name="reimbursement-recipient-type"][value="non-tax-partner"]:checked');
    const nonTaxPartnerTaxationField = document.getElementById('non-tax-partner-taxation-field');
    
    if (nonTaxPartnerTaxationField) {
        nonTaxPartnerTaxationField.classList.toggle('show', !!nonTaxPartnerSelected);
    }
}

function updateCheckboxOptionStyle(option, isChecked) {
    option.classList.toggle('checked', isChecked);
}

function collectCheckboxValues(groupName) {
    const checkboxes = document.querySelectorAll(`input[name="${groupName}"]:checked`);
    return Array.from(checkboxes).map(cb => cb.value);
}

function collectSubcategories(expenseCategory) {
    const subcategoryGroupMap = {
        'fertility': 'fertility-subcategories',
        'preservation': 'preservation-subcategories',
        'parenting-pediatrics': 'parenting-pediatrics-subcategories',
        'maternity': 'maternity-subcategories',
        'menopause': 'menopause-subcategories',
        'surrogacy': 'surrogacy-subcategories',
        'donor': 'donor-subcategories',
        'adoption': 'adoption-subcategories'
    };
    
    const groupName = subcategoryGroupMap[expenseCategory];
    if (groupName) {
        return collectCheckboxValues(groupName);
    }
    return [];
}

function collectExpenseTypeConfiguration() {
    const expenseCategory = document.getElementById('expense-category').value;
    const eligibility = document.getElementById('eligibility').value;
    const taxation = document.getElementById('taxation').value;
    
    const config = {
        expenseCategory: expenseCategory,
        historicalSpendSupported: document.getElementById('historical-spend').value === 'yes',
        userLevel: document.getElementById('user-level').value,
        reimbursementMethod: document.getElementById('reimbursement-method').value,
        startDate: document.getElementById('expense-start-date').value,
        endDate: document.getElementById('expense-end-date').value,
        subcategories: collectSubcategories(expenseCategory),
        eligibility: {
            type: eligibility
        },
        taxation: {
            type: taxation
        }
    };
    
    // Add fertility-specific fields
    if (expenseCategory === 'fertility') {
        config.directPayment = document.getElementById('direct-payment').value === 'yes';
        if (config.directPayment) {
            config.coverageType = document.getElementById('coverage-type').value;
        }
    }
    
    // Add custom eligibility fields
    if (eligibility === 'custom') {
        config.eligibility.tenureRequirement = document.getElementById('tenure-requirement').value;
        config.eligibility.benefitsEligible = document.getElementById('benefits-eligible').value === 'yes';
        config.eligibility.employeeMedicallyEnrolled = document.getElementById('employee-medically-enrolled').value === 'yes';
        config.eligibility.walletHolderMedicallyEnrolled = document.getElementById('wallet-holder-medically-enrolled').value === 'yes';
        config.eligibility.reimbursementRecipientMedicallyEnrolled = document.getElementById('reimbursement-recipient-medically-enrolled').value === 'yes';
        config.eligibility.walletHolderTypes = collectCheckboxValues('wallet-holder-type');
        config.eligibility.walletHolderGeography = collectCheckboxValues('wallet-holder-geography');
        config.eligibility.reimbursementRecipientTypes = collectCheckboxValues('reimbursement-recipient-type');
        
        // Add adoption-specific fields
        if (expenseCategory === 'adoption') {
            config.eligibility.stepChildAdoptionAllowed = document.getElementById('step-child-adoption').value === 'yes';
            config.eligibility.failedAdoptionAllowed = document.getElementById('failed-adoption').value === 'yes';
        }
        
        // Add fertility/preservation-specific fields
        if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
            config.eligibility.dxInfertilityRequired = document.getElementById('dx-infertility-required').value === 'yes';
        }
    }
    
    // Add custom taxation fields
    if (taxation === 'custom') {
        config.taxation.nonTaxPartnerTaxation = document.getElementById('non-tax-partner-taxation').value;
        config.taxation.internationalTaxation = document.getElementById('international-taxation').value;
        
        // Add adoption-specific taxation fields
        if (expenseCategory === 'adoption') {
            config.taxation.stepChildTaxation = document.getElementById('step-child-taxation').value;
            config.taxation.failedAdoptionTaxation = document.getElementById('failed-adoption-taxation').value;
        }
        
        // Add fertility/preservation-specific taxation fields
        if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
            config.taxation.dxInfertilityTaxation = document.getElementById('dx-infertility-taxation').value;
        }
    }
    
    return config;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Form submission and data collection functions
function initializeFormHandlers() {
    const form = document.getElementById('custom-package-form');
    const saveDraftBtn = document.querySelector('.btn-outline');
    const continueBtn = document.querySelector('.btn-primary[type="submit"]');
    
    saveDraftBtn.addEventListener('click', function(e) {
        e.preventDefault();
        saveDraft();
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitConfiguration();
    });
}

async function saveDraft() {
    try {
        const configData = collectAllFormData();
        configData.status = 'draft';
        
        const result = await saveConfigurationToDatabase(configData, true);
        
        showNotification('Draft saved successfully!', 'success');
        
        // Store the configuration ID for future updates
        localStorage.setItem('currentConfigId', result.id);
    } catch (error) {
        console.error('Error saving draft:', error);
        showNotification('Failed to save draft. Please try again.', 'error');
    }
}

async function submitConfiguration() {
    try {
        const configData = collectAllFormData();
        configData.status = 'completed';
        
        // Validate required fields
        if (!validateConfiguration(configData)) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }
        
        const result = await saveConfigurationToDatabase(configData, false);
        
        showNotification('Configuration saved successfully!', 'success');
        
        // Redirect to configurations list or success page
        setTimeout(() => {
            window.location.href = 'configurations.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting configuration:', error);
        showNotification('Failed to save configuration. Please try again.', 'error');
    }
}

function collectAllFormData() {
    const formData = {
        clientName: document.getElementById('client-name').value,
        reportingCadence: {
            frequency: document.querySelector('input[name="cadence"]:checked').value,
            dayOfWeek: document.getElementById('day-of-week').value,
            dayOfMonth: document.getElementById('day-of-month').value
        },
        populations: collectPopulationsData()
    };
    
    return formData;
}

function collectPopulationsData() {
    // Use the stored configuration data instead of parsing from display
    const populations = [];
    
    for (const populationId in configurationData.populations) {
        const population = configurationData.populations[populationId];
        
        // Convert categories object to array for saving
        const categoriesArray = [];
        if (population.categories) {
            for (const categoryId in population.categories) {
                const category = population.categories[categoryId];
                
                // Convert expense types object to array
                const expenseTypesArray = [];
                if (category.expenseTypes) {
                    for (const expenseTypeId in category.expenseTypes) {
                        expenseTypesArray.push(category.expenseTypes[expenseTypeId]);
                    }
                }
                
                categoriesArray.push({
                    ...category,
                    expenseTypes: expenseTypesArray
                });
            }
        }
        
        populations.push({
            ...population,
            categories: categoriesArray
        });
    }
    
    return populations;
}

function validateConfiguration(configData) {
    // Basic validation
    if (!configData.clientName || configData.clientName.trim() === '') {
        return false;
    }
    
    if (!configData.populations || configData.populations.length === 0) {
        return false;
    }
    
    return true;
}

// API functions for backend integration
async function saveConfigurationToDatabase(configData, isDraft = false) {
    try {
        const response = await fetch('/api/configurations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...configData,
                isDraft: isDraft,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error saving configuration:', error);
        throw error;
    }
}

async function loadConfigurationFromDatabase(configId) {
    try {
        const response = await fetch(`/api/configurations/${configId}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const configuration = await response.json();
        return configuration;
    } catch (error) {
        console.error('Error loading configuration:', error);
        throw error;
    }
}

async function loadConfigurationForEditing(configId) {
    try {
        showNotification('Loading configuration...', 'info');
        
        const configuration = await loadConfigurationFromDatabase(configId);
        if (!configuration) {
            showNotification('Configuration not found.', 'error');
            return;
        }
        
        const configData = configuration.configuration_data;
        
        // Update page title to indicate editing mode
        document.querySelector('.page-header h1').textContent = 'Edit Configuration';
        document.querySelector('.page-header p').textContent = `Editing configuration for ${configuration.client_name}`;
        
        // Populate basic information
        populateBasicInformation(configData);
        
        // Populate reporting cadence
        populateReportingCadence(configData.reportingCadence);
        
        // Populate populations
        populatePopulations(configData.populations || []);
        
        // Store configuration ID for updates
        localStorage.setItem('editingConfigId', configId);
        
        // Update form submission to use PUT instead of POST
        const form = document.getElementById('custom-package-form');
        form.setAttribute('data-editing', 'true');
        
        showNotification('Configuration loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        showNotification('Failed to load configuration for editing.', 'error');
    }
}

function populateBasicInformation(configData) {
    const clientNameInput = document.getElementById('client-name');
    if (clientNameInput && configData.clientName) {
        clientNameInput.value = configData.clientName;
    }
}

function populateReportingCadence(reportingCadence) {
    if (!reportingCadence) return;
    
    // Set frequency radio button
    const frequencyRadio = document.querySelector(`input[name="cadence"][value="${reportingCadence.frequency}"]`);
    if (frequencyRadio) {
        frequencyRadio.checked = true;
        updateCadenceSelection(reportingCadence.frequency);
        updateRadioStyles();
    }
    
    // Set day of week
    if (reportingCadence.dayOfWeek) {
        const dayOfWeekSelect = document.getElementById('day-of-week');
        if (dayOfWeekSelect) {
            dayOfWeekSelect.value = reportingCadence.dayOfWeek;
        }
    }
    
    // Set day of month
    if (reportingCadence.dayOfMonth) {
        const dayOfMonthSelect = document.getElementById('day-of-month');
        if (dayOfMonthSelect) {
            dayOfMonthSelect.value = reportingCadence.dayOfMonth;
        }
    }
}

function populatePopulations(populations) {
    console.log('=== DEBUGGING populatePopulations ===');
    console.log('Raw populations from database:', populations);
    
    if (!populations || populations.length === 0) return;
    
    const populationsList = document.getElementById('populations-list');
    
    // Clear empty state and global data
    populationsList.innerHTML = '';
    configurationData.populations = {};
    
    populations.forEach(population => {
        console.log('Processing population:', population);
        // Convert categories array back to object structure for global store
        const categoriesObject = {};
        if (population.categories) {
            population.categories.forEach(category => {
                // Convert expense types array back to object structure
                const expenseTypesObject = {};
                console.log('Processing category:', category.name, 'with expense types:', category.expenseTypes);
                if (category.expenseTypes) {
                    category.expenseTypes.forEach(expenseType => {
                        console.log('Converting expense type to object:', expenseType);
                        expenseTypesObject[expenseType.id] = expenseType;
                    });
                }
                console.log('Final expense types object:', expenseTypesObject);
                
                categoriesObject[category.id] = {
                    ...category,
                    expenseTypes: expenseTypesObject
                };
            });
        }
        
        const populationForStore = {
            ...population,
            categories: categoriesObject
        };
        
        // Store in global configuration data
        configurationData.populations[population.id] = populationForStore;
        console.log('Final stored population:', populationForStore);
        console.log('Final global configurationData:', configurationData);
        
        // Create and add UI element
        const populationElement = createPopulationElement(population);
        populationsList.appendChild(populationElement);
    });
}

async function submitConfiguration() {
    try {
        const configData = collectAllFormData();
        configData.status = 'completed';
        
        // Validate required fields
        if (!validateConfiguration(configData)) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }
        
        const form = document.getElementById('custom-package-form');
        const isEditing = form.getAttribute('data-editing') === 'true';
        const editingConfigId = localStorage.getItem('editingConfigId');
        
        let result;
        if (isEditing && editingConfigId) {
            // Update existing configuration
            result = await updateConfigurationInDatabase(editingConfigId, configData);
        } else {
            // Create new configuration
            result = await saveConfigurationToDatabase(configData, false);
        }
        
        showNotification('Configuration saved successfully!', 'success');
        
        // Redirect to configurations list
        setTimeout(() => {
            window.location.href = 'configurations.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting configuration:', error);
        showNotification('Failed to save configuration. Please try again.', 'error');
    }
}

async function updateConfigurationInDatabase(configId, configData) {
    try {
        const response = await fetch(`/api/configurations/${configId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...configData,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error updating configuration:', error);
        throw error;
    }
}

function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span>${message}</span>
            <button class="notification-close">&times;</button>
        </div>
    `;
    
    // Add CSS for notifications
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 3000;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                animation: slideIn 0.3s ease;
            }
            
            .notification-success {
                background-color: #00856F;
            }
            
            .notification-error {
                background-color: #dc3545;
            }
            
            .notification-info {
                background-color: #17a2b8;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .notification-close {
                background: none;
                border: none;
                color: white;
                font-size: 1.2rem;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }
            
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    // Close button functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
}