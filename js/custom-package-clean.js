// CLEAN DATA STORAGE SYSTEM - Single Source of Truth
// Global configuration object - this is our ONLY data store
window.currentConfiguration = {
    clientName: "",
    reportingCadence: {
        frequency: "weekly",
        dayOfWeek: "monday", 
        dayOfMonth: "1"
    },
    populations: []
};

// Current editing state
let currentEditingPopulationIndex = -1;
let currentEditingCategoryIndex = -1;
let currentEditingExpenseTypeIndex = -1;

// Configuration editing state
let isEditingExisting = false;
let currentConfigurationId = null;

document.addEventListener('DOMContentLoaded', function() {
    initializePage();
});

function initializePage() {
    initializeCadenceLogic();
    initializePopulationManagement();
    initializeCategoryManagement();
    initializeExpenseTypeManagement();
    initializeFormHandlers();
    
    // Check if we're editing an existing configuration
    const urlParams = new URLSearchParams(window.location.search);
    const editConfigId = urlParams.get('edit');
    if (editConfigId) {
        loadConfigurationForEditing(editConfigId);
    } else {
        // Initialize form actions for new configuration
        updateFormActions();
    }
}

// ===== CADENCE LOGIC =====
function initializeCadenceLogic() {
    const cadenceSelect = document.getElementById('cadence-select');
    const daySelection = document.getElementById('day-selection');
    const dateSelection = document.getElementById('date-selection');
    
    cadenceSelect.addEventListener('change', function() {
        updateCadenceSelection(this.value);
    });
    
    updateCadenceSelection('weekly');
}

function updateCadenceSelection(selectedCadence) {
    const daySelection = document.getElementById('day-selection');
    const dateSelection = document.getElementById('date-selection');
    
    if (selectedCadence === 'monthly') {
        daySelection.style.display = 'none';
        dateSelection.style.display = 'block';
    } else {
        daySelection.style.display = 'block';
        dateSelection.style.display = 'none';
    }
    
    // Update configuration object
    window.currentConfiguration.reportingCadence.frequency = selectedCadence;
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

// ===== POPULATION MANAGEMENT =====
function initializePopulationManagement() {
    const addPopulationBtn = document.getElementById('add-population-btn');
    const modal = document.getElementById('population-modal');
    const closeBtn = modal.querySelector('.close-btn');
    const cancelBtn = document.getElementById('cancel-population');
    const saveBtn = document.getElementById('save-population');
    
    addPopulationBtn.addEventListener('click', () => showPopulationModal());
    closeBtn.addEventListener('click', hidePopulationModal);
    cancelBtn.addEventListener('click', hidePopulationModal);
    saveBtn.addEventListener('click', savePopulation);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hidePopulationModal();
        }
    });
}

function showPopulationModal(populationIndex = -1) {
    const modal = document.getElementById('population-modal');
    currentEditingPopulationIndex = populationIndex;
    
    if (populationIndex >= 0) {
        // Editing existing population
        const population = window.currentConfiguration.populations[populationIndex];
        populatePopulationForm(population);
    } else {
        // Creating new population
        clearPopulationForm();
    }
    
    modal.style.display = 'flex';
    renderCategoriesInModal(populationIndex);
}

function populatePopulationForm(population) {
    document.getElementById('population-name').value = population.name;
    document.getElementById('population-description').value = population.description;
    document.getElementById('claim-submission-window').value = population.claimSubmissionWindow;
    document.getElementById('runout-period').value = population.runoutPeriod;
    document.getElementById('launch-date').value = population.launchDate;
    document.getElementById('end-date').value = population.endDate;
}

function clearPopulationForm() {
    document.getElementById('population-name').value = '';
    document.getElementById('population-description').value = '';
    document.getElementById('claim-submission-window').value = '180';
    document.getElementById('runout-period').value = '180';
    document.getElementById('launch-date').value = '2025-01-01';
    document.getElementById('end-date').value = '2025-12-31';
}

function savePopulation() {
    const name = document.getElementById('population-name').value.trim();
    if (!name) {
        alert('Please enter a population name.');
        return;
    }
    
    const population = {
        id: Date.now().toString(),
        name: name,
        description: document.getElementById('population-description').value.trim(),
        claimSubmissionWindow: document.getElementById('claim-submission-window').value,
        runoutPeriod: document.getElementById('runout-period').value,
        launchDate: document.getElementById('launch-date').value,
        endDate: document.getElementById('end-date').value,
        categories: []
    };
    
    if (currentEditingPopulationIndex >= 0) {
        // Editing existing population - preserve categories
        population.categories = window.currentConfiguration.populations[currentEditingPopulationIndex].categories;
        window.currentConfiguration.populations[currentEditingPopulationIndex] = population;
    } else {
        // Adding new population
        window.currentConfiguration.populations.push(population);
    }
    
    hidePopulationModal();
    renderPopulations();
}

function hidePopulationModal() {
    document.getElementById('population-modal').style.display = 'none';
    currentEditingPopulationIndex = -1;
}

function renderPopulations() {
    const populationsList = document.getElementById('populations-list');
    
    if (window.currentConfiguration.populations.length === 0) {
        populationsList.innerHTML = '<p class="empty-state">No populations added yet. Click "Add Population" to get started.</p>';
        return;
    }
    
    populationsList.innerHTML = window.currentConfiguration.populations.map((population, index) => {
        const categoriesText = population.categories.length > 0 
            ? population.categories.map(cat => cat.name).join(', ')
            : 'No categories';
            
        return `
            <div class="population-item">
                <div class="population-info">
                    <h4>${escapeHtml(population.name)}</h4>
                    ${population.description ? `<p><strong>Description:</strong> ${escapeHtml(population.description)}</p>` : ''}
                    <p><strong>Claim Window:</strong> ${population.claimSubmissionWindow} days</p>
                    <p><strong>Launch Date:</strong> ${population.launchDate}</p>
                    <p><strong>End Date:</strong> ${population.endDate}</p>
                    <p><strong>Runout Period:</strong> ${population.runoutPeriod} days</p>
                    <p><strong>Categories:</strong> ${escapeHtml(categoriesText)}</p>
                </div>
                <div class="population-actions">
                    <button type="button" class="btn-icon edit" onclick="showPopulationModal(${index})" title="Edit">✏️</button>
                    <button type="button" class="btn-icon delete" onclick="deletePopulation(${index})" title="Delete">🗑️</button>
                </div>
            </div>
        `;
    }).join('');
}

function deletePopulation(index) {
    if (confirm('Are you sure you want to delete this population?')) {
        window.currentConfiguration.populations.splice(index, 1);
        renderPopulations();
    }
}

// ===== CATEGORY MANAGEMENT =====
function initializeCategoryManagement() {
    const addCategoryBtn = document.getElementById('add-category-btn');
    const categoryModal = document.getElementById('category-modal');
    const closeCategoryBtn = document.getElementById('close-category-modal');
    const cancelCategoryBtn = document.getElementById('cancel-category');
    const saveCategoryBtn = document.getElementById('save-category');
    
    addCategoryBtn.addEventListener('click', () => showCategoryModal());
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
}

function showCategoryModal(categoryIndex = -1) {
    if (currentEditingPopulationIndex < 0) {
        alert('Please save the population first before adding categories.');
        return;
    }
    
    const modal = document.getElementById('category-modal');
    currentEditingCategoryIndex = categoryIndex;
    
    if (categoryIndex >= 0) {
        // Editing existing category
        const category = window.currentConfiguration.populations[currentEditingPopulationIndex].categories[categoryIndex];
        populateCategoryForm(category);
    } else {
        // Creating new category
        clearCategoryForm();
    }
    
    modal.style.display = 'flex';
    updateAmountFields();
    
    
    renderExpenseTypesInModal(currentEditingPopulationIndex, categoryIndex);
}

function populateCategoryForm(category) {
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-format').value = category.format;
    document.getElementById('category-structure').value = category.structure;
    document.getElementById('category-start-date').value = category.startDate;
    document.getElementById('category-end-date').value = category.endDate;
    
    // Populate amount fields after a brief delay to ensure they're created
    setTimeout(() => {
        populateAmountFields(category.amounts, category.format, category.structure);
    }, 100);
}

function clearCategoryForm() {
    document.getElementById('category-name').value = '';
    document.getElementById('category-format').value = 'currency';
    document.getElementById('category-structure').value = 'lifetime';
    document.getElementById('category-start-date').value = '2025-01-01';
    document.getElementById('category-end-date').value = '2025-12-31';
}

function saveCategory() {
    const name = document.getElementById('category-name').value.trim();
    if (!name) {
        alert('Please enter a category name.');
        return;
    }
    
    const format = document.getElementById('category-format').value;
    const structure = document.getElementById('category-structure').value;
    
    const category = {
        id: Date.now().toString(),
        name: name,
        format: format,
        structure: structure,
        amounts: collectAmountValues(format, structure),
        startDate: document.getElementById('category-start-date').value,
        endDate: document.getElementById('category-end-date').value,
        expenseTypes: []
    };
    
    if (currentEditingCategoryIndex >= 0) {
        // Editing existing category - preserve expense types
        const existingCategory = window.currentConfiguration.populations[currentEditingPopulationIndex].categories[currentEditingCategoryIndex];
        category.expenseTypes = existingCategory.expenseTypes || [];
        window.currentConfiguration.populations[currentEditingPopulationIndex].categories[currentEditingCategoryIndex] = category;
    } else {
        // Adding new category
        window.currentConfiguration.populations[currentEditingPopulationIndex].categories.push(category);
    }
    
    hideCategoryModal();
    renderCategoriesInModal(currentEditingPopulationIndex);
}

function hideCategoryModal() {
    document.getElementById('category-modal').style.display = 'none';
    currentEditingCategoryIndex = -1;
}

function renderCategoriesInModal(populationIndex) {
    if (populationIndex < 0) return;
    
    const categoriesList = document.getElementById('categories-list');
    const categories = window.currentConfiguration.populations[populationIndex].categories;
    
    if (categories.length === 0) {
        categoriesList.innerHTML = '<p class="empty-state-small">No categories added yet.</p>';
        return;
    }
    
    categoriesList.innerHTML = categories.map((category, index) => `
        <div class="category-item">
            <div class="category-info">
                <h5>${escapeHtml(category.name)}</h5>
                <p>Format: ${category.format}, Structure: ${category.structure}</p>
                <p>Expense Types: ${(category.expenseTypes || []).length}</p>
            </div>
            <div class="category-actions">
                <button type="button" class="btn-icon edit" onclick="showCategoryModal(${index})" title="Edit">✏️</button>
                <button type="button" class="btn-icon delete" onclick="deleteCategory(${index})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function deleteCategory(index) {
    if (confirm('Are you sure you want to delete this category?')) {
        window.currentConfiguration.populations[currentEditingPopulationIndex].categories.splice(index, 1);
        renderCategoriesInModal(currentEditingPopulationIndex);
    }
}

// ===== EXPENSE TYPE MANAGEMENT =====
function initializeExpenseTypeManagement() {
    const addExpenseTypeBtn = document.getElementById('add-expense-type-btn');
    const expenseTypeModal = document.getElementById('expense-type-modal');
    const closeExpenseTypeBtn = document.getElementById('close-expense-type-modal');
    const cancelExpenseTypeBtn = document.getElementById('cancel-expense-type');
    const saveExpenseTypeBtn = document.getElementById('save-expense-type');
    
    addExpenseTypeBtn.addEventListener('click', () => showExpenseTypeModal());
    closeExpenseTypeBtn.addEventListener('click', hideExpenseTypeModal);
    cancelExpenseTypeBtn.addEventListener('click', hideExpenseTypeModal);
    saveExpenseTypeBtn.addEventListener('click', saveExpenseType);
    
    expenseTypeModal.addEventListener('click', function(e) {
        if (e.target === expenseTypeModal) {
            hideExpenseTypeModal();
        }
    });
    
    // Initialize conditional field handlers
    initializeExpenseTypeConditionalFields();
}

function initializeExpenseTypeConditionalFields() {
    // Eligibility conditional fields
    const eligibilitySelect = document.getElementById('eligibility');
    const taxationSelect = document.getElementById('taxation');
    const expenseCategorySelect = document.getElementById('expense-category');
    
    if (eligibilitySelect) {
        eligibilitySelect.addEventListener('change', updateEligibilityFields);
    }
    
    if (taxationSelect) {
        taxationSelect.addEventListener('change', updateTaxationFields);
    }
    
    if (expenseCategorySelect) {
        expenseCategorySelect.addEventListener('change', updateExpenseCategoryFields);
    }
}

function updateEligibilityFields() {
    const eligibilityValue = document.getElementById('eligibility').value;
    const customEligibilityFields = document.getElementById('custom-eligibility-fields');
    
    if (eligibilityValue === 'custom') {
        customEligibilityFields.style.display = 'block';
        updateExpenseCategorySpecificEligibilityFields();
    } else {
        customEligibilityFields.style.display = 'none';
        // Hide all expense category specific fields
        hideExpenseCategorySpecificEligibilityFields();
    }
}

function updateTaxationFields() {
    const taxationValue = document.getElementById('taxation').value;
    const customTaxationFields = document.getElementById('custom-taxation-fields');
    
    if (taxationValue === 'custom') {
        customTaxationFields.style.display = 'block';
        updateExpenseCategorySpecificTaxationFields();
    } else {
        customTaxationFields.style.display = 'none';
        // Hide all expense category specific fields
        hideExpenseCategorySpecificTaxationFields();
    }
}

function updateExpenseCategoryFields() {
    updateExpenseCategorySpecificEligibilityFields();
    updateExpenseCategorySpecificTaxationFields();
}

function updateExpenseCategorySpecificEligibilityFields() {
    const expenseCategory = document.getElementById('expense-category').value;
    const eligibilityValue = document.getElementById('eligibility').value;
    
    // Hide all category-specific fields first
    hideExpenseCategorySpecificEligibilityFields();
    
    // Only show if eligibility is custom
    if (eligibilityValue === 'custom') {
        if (expenseCategory === 'adoption') {
            const adoptionFields = document.getElementById('adoption-custom-fields');
            if (adoptionFields) adoptionFields.style.display = 'block';
        } else if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
            const fertilityFields = document.getElementById('fertility-preservation-custom-fields');
            if (fertilityFields) fertilityFields.style.display = 'block';
        }
    }
}

function updateExpenseCategorySpecificTaxationFields() {
    const expenseCategory = document.getElementById('expense-category').value;
    const taxationValue = document.getElementById('taxation').value;
    
    // Hide all category-specific fields first
    hideExpenseCategorySpecificTaxationFields();
    
    // Only show if taxation is custom
    if (taxationValue === 'custom') {
        if (expenseCategory === 'adoption') {
            const adoptionFields = document.getElementById('adoption-taxation-fields');
            if (adoptionFields) adoptionFields.style.display = 'block';
        } else if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
            const fertilityFields = document.getElementById('fertility-preservation-taxation-fields');
            if (fertilityFields) fertilityFields.style.display = 'block';
        }
    }
}

function hideExpenseCategorySpecificEligibilityFields() {
    const adoptionFields = document.getElementById('adoption-custom-fields');
    const fertilityFields = document.getElementById('fertility-preservation-custom-fields');
    
    if (adoptionFields) adoptionFields.style.display = 'none';
    if (fertilityFields) fertilityFields.style.display = 'none';
}

function hideExpenseCategorySpecificTaxationFields() {
    const adoptionFields = document.getElementById('adoption-taxation-fields');
    const fertilityFields = document.getElementById('fertility-preservation-taxation-fields');
    
    if (adoptionFields) adoptionFields.style.display = 'none';
    if (fertilityFields) fertilityFields.style.display = 'none';
}

function showExpenseTypeModal(expenseTypeIndex = -1) {
    if (currentEditingCategoryIndex < 0) {
        alert('Please save the category first before adding expense types.');
        return;
    }
    
    const modal = document.getElementById('expense-type-modal');
    currentEditingExpenseTypeIndex = expenseTypeIndex;
    
    if (expenseTypeIndex >= 0) {
        // Editing existing expense type
        const expenseType = window.currentConfiguration.populations[currentEditingPopulationIndex].categories[currentEditingCategoryIndex].expenseTypes[expenseTypeIndex];
        populateExpenseTypeForm(expenseType);
    } else {
        // Creating new expense type
        clearExpenseTypeForm();
    }
    
    modal.style.display = 'flex';
    
    // Initialize conditional field visibility
    updateEligibilityFields();
    updateTaxationFields();
    updateExpenseCategoryFields();
}

function populateExpenseTypeForm(expenseType) {
    const config = expenseType.configuration;
    
    document.getElementById('expense-category').value = config.expenseCategory;
    document.getElementById('historical-spend').value = config.historicalSpendSupported ? 'yes' : 'no';
    document.getElementById('user-level').value = config.userLevel;
    document.getElementById('reimbursement-method').value = config.reimbursementMethod;
    document.getElementById('expense-start-date').value = config.startDate;
    document.getElementById('expense-end-date').value = config.endDate;
    document.getElementById('eligibility').value = config.eligibility.type;
    document.getElementById('taxation').value = config.taxation.type;
    
    // Populate custom eligibility fields if eligibility is custom
    if (config.eligibility.type === 'custom') {
        const eligibility = config.eligibility;
        if (eligibility.tenureRequirement) {
            document.getElementById('tenure-requirement').value = eligibility.tenureRequirement;
        }
        if (eligibility.benefitsEligible !== undefined) {
            document.getElementById('benefits-eligible').value = eligibility.benefitsEligible ? 'yes' : 'no';
        }
        if (eligibility.employeeMedicallyEnrolled !== undefined) {
            document.getElementById('employee-medically-enrolled').value = eligibility.employeeMedicallyEnrolled ? 'yes' : 'no';
        }
        // Add other custom eligibility field population as needed
    }
    
    // Populate custom taxation fields if taxation is custom
    if (config.taxation.type === 'custom') {
        const taxation = config.taxation;
        if (taxation.nonTaxPartnerTaxation) {
            document.getElementById('non-tax-partner-taxation').value = taxation.nonTaxPartnerTaxation;
        }
        if (taxation.internationalTaxation) {
            document.getElementById('international-taxation').value = taxation.internationalTaxation;
        }
        // Add other custom taxation field population as needed
    }
}

function clearExpenseTypeForm() {
    document.getElementById('expense-category').value = 'fertility';
    document.getElementById('historical-spend').value = 'no';
    document.getElementById('user-level').value = 'household';
    document.getElementById('reimbursement-method').value = 'payroll';
    document.getElementById('expense-start-date').value = '2025-01-01';
    document.getElementById('expense-end-date').value = '2025-12-31';
    document.getElementById('eligibility').value = 'anyone-on-file';
    document.getElementById('taxation').value = 'standard';
}

function saveExpenseType() {
    const eligibilityType = document.getElementById('eligibility').value;
    const taxationType = document.getElementById('taxation').value;
    
    // Build eligibility object
    const eligibility = { type: eligibilityType };
    if (eligibilityType === 'custom') {
        eligibility.tenureRequirement = document.getElementById('tenure-requirement').value;
        eligibility.benefitsEligible = document.getElementById('benefits-eligible').value === 'yes';
        eligibility.employeeMedicallyEnrolled = document.getElementById('employee-medically-enrolled').value === 'yes';
        
        // Add category-specific eligibility fields
        const expenseCategory = document.getElementById('expense-category').value;
        if (expenseCategory === 'adoption') {
            eligibility.stepChildAdoptionAllowed = document.getElementById('step-child-adoption').value === 'yes';
            eligibility.failedAdoptionAllowed = document.getElementById('failed-adoption').value === 'yes';
        } else if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
            eligibility.dxInfertilityRequired = document.getElementById('dx-infertility-required').value === 'yes';
        }
    }
    
    // Build taxation object
    const taxation = { type: taxationType };
    if (taxationType === 'custom') {
        taxation.nonTaxPartnerTaxation = document.getElementById('non-tax-partner-taxation').value;
        taxation.internationalTaxation = document.getElementById('international-taxation').value;
        
        // Add category-specific taxation fields
        const expenseCategory = document.getElementById('expense-category').value;
        if (expenseCategory === 'adoption') {
            taxation.stepChildTaxation = document.getElementById('step-child-taxation').value;
            taxation.failedAdoptionTaxation = document.getElementById('failed-adoption-taxation').value;
        } else if (expenseCategory === 'fertility' || expenseCategory === 'preservation') {
            taxation.dxInfertilityTaxation = document.getElementById('dx-infertility-taxation').value;
        }
    }

    const expenseType = {
        id: currentEditingExpenseTypeIndex >= 0 ? 
            window.currentConfiguration.populations[currentEditingPopulationIndex].categories[currentEditingCategoryIndex].expenseTypes[currentEditingExpenseTypeIndex].id : 
            Date.now().toString(),
        name: document.getElementById('expense-category').value,
        configuration: {
            expenseCategory: document.getElementById('expense-category').value,
            historicalSpendSupported: document.getElementById('historical-spend').value === 'yes',
            userLevel: document.getElementById('user-level').value,
            reimbursementMethod: document.getElementById('reimbursement-method').value,
            startDate: document.getElementById('expense-start-date').value,
            endDate: document.getElementById('expense-end-date').value,
            eligibility: eligibility,
            taxation: taxation
        }
    };
    
    // Ensure expenseTypes array exists with defensive programming
    const category = window.currentConfiguration.populations[currentEditingPopulationIndex].categories[currentEditingCategoryIndex];
    if (!category.expenseTypes) {
        category.expenseTypes = [];
    }
    
    if (currentEditingExpenseTypeIndex >= 0) {
        // Editing existing expense type
        category.expenseTypes[currentEditingExpenseTypeIndex] = expenseType;
    } else {
        // Adding new expense type
        category.expenseTypes.push(expenseType);
    }
    
    hideExpenseTypeModal();
    renderExpenseTypesInModal(currentEditingPopulationIndex, currentEditingCategoryIndex);
}

function hideExpenseTypeModal() {
    document.getElementById('expense-type-modal').style.display = 'none';
    currentEditingExpenseTypeIndex = -1;
}

function renderExpenseTypesInModal(populationIndex, categoryIndex) {
    if (populationIndex < 0 || categoryIndex < 0) {
        return;
    }
    
    const expenseTypesList = document.getElementById('expense-types-list');
    if (!expenseTypesList) {
        return;
    }
    
    const population = window.currentConfiguration.populations[populationIndex];
    if (!population) {
        return;
    }
    
    const category = population.categories[categoryIndex];
    if (!category) {
        return;
    }
    
    const expenseTypes = category.expenseTypes || [];
    
    if (expenseTypes.length === 0) {
        expenseTypesList.innerHTML = '<p class="empty-state-small">No expense types added yet.</p>';
        return;
    }
    
    expenseTypesList.innerHTML = expenseTypes.map((expenseType, index) => `
        <div class="expense-type-item">
            <div class="expense-type-info">
                <h5>${escapeHtml(expenseType.name.charAt(0).toUpperCase() + expenseType.name.slice(1))}</h5>
                <p><strong>User Level:</strong> ${escapeHtml(expenseType.configuration.userLevel)}</p>
                <p><strong>Eligibility:</strong> ${escapeHtml(expenseType.configuration.eligibility.type)}</p>
            </div>
            <div class="expense-type-actions">
                <button type="button" class="btn-icon edit" onclick="showExpenseTypeModal(${index})" title="Edit">✏️</button>
                <button type="button" class="btn-icon delete" onclick="deleteExpenseType(${index})" title="Delete">🗑️</button>
            </div>
        </div>
    `).join('');
}

function deleteExpenseType(index) {
    if (confirm('Are you sure you want to delete this expense type?')) {
        // Ensure expenseTypes array exists with defensive programming
        const category = window.currentConfiguration.populations[currentEditingPopulationIndex].categories[currentEditingCategoryIndex];
        if (!category.expenseTypes) {
            category.expenseTypes = [];
        }
        category.expenseTypes.splice(index, 1);
        renderExpenseTypesInModal(currentEditingPopulationIndex, currentEditingCategoryIndex);
    }
}

// ===== AMOUNT FIELDS =====
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
    
    if (structure === 'lifetime' && format === 'currency') {
        fieldGroup.innerHTML = `
            <div class="form-group">
                <label for="lifetime-amount">Lifetime ($)</label>
                <input type="number" id="lifetime-amount" placeholder="0.00" step="0.01">
            </div>
        `;
    } else if (structure === 'annual' && format === 'currency') {
        fieldGroup.innerHTML = `
            <div class="form-group">
                <label for="annual-amount">Annual ($)</label>
                <input type="number" id="annual-amount" placeholder="0.00" step="0.01">
            </div>
        `;
    }
    
    if (fieldGroup.innerHTML) {
        amountFieldsContainer.appendChild(fieldGroup);
    }
}

function populateAmountFields(amounts, format, structure) {
    if (structure === 'lifetime' && format === 'currency' && amounts.lifetime) {
        const lifetimeInput = document.getElementById('lifetime-amount');
        if (lifetimeInput) lifetimeInput.value = amounts.lifetime;
    } else if (structure === 'annual' && format === 'currency' && amounts.annual) {
        const annualInput = document.getElementById('annual-amount');
        if (annualInput) annualInput.value = amounts.annual;
    }
}

function collectAmountValues(format, structure) {
    const amounts = {};
    
    if (structure === 'lifetime' && format === 'currency') {
        const lifetimeInput = document.getElementById('lifetime-amount');
        if (lifetimeInput && lifetimeInput.value) {
            amounts.lifetime = lifetimeInput.value;
        }
    } else if (structure === 'annual' && format === 'currency') {
        const annualInput = document.getElementById('annual-amount');
        if (annualInput && annualInput.value) {
            amounts.annual = annualInput.value;
        }
    }
    
    return amounts;
}

// ===== FORM HANDLERS =====
function initializeFormHandlers() {
    const form = document.getElementById('custom-package-form');
    // Update configuration when client name changes
    const clientNameInput = document.getElementById('client-name');
    clientNameInput.addEventListener('input', function() {
        window.currentConfiguration.clientName = this.value;
    });
    
    // Update configuration when cadence changes
    const cadenceSelect = document.getElementById('cadence-select');
    const dayOfWeekSelect = document.getElementById('day-of-week');
    const dayOfMonthSelect = document.getElementById('day-of-month');
    
    cadenceSelect.addEventListener('change', function() {
        window.currentConfiguration.reportingCadence.frequency = this.value;
    });
    
    dayOfWeekSelect.addEventListener('change', function() {
        window.currentConfiguration.reportingCadence.dayOfWeek = this.value;
    });
    
    dayOfMonthSelect.addEventListener('change', function() {
        window.currentConfiguration.reportingCadence.dayOfMonth = this.value;
    });
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        submitConfiguration();
    });
}

async function submitConfiguration() {
    try {
        if (!validateConfiguration()) {
            showNotification('Please fill in all required fields.', 'error');
            return;
        }
        
        if (isEditingExisting) {
            // Update existing configuration
            const result = await updateConfigurationToDatabase();
            showNotification('Configuration updated successfully!', 'success');
        } else {  
            // Create new configuration
            const result = await saveConfigurationToDatabase();
            showNotification('Configuration saved successfully!', 'success');
        }
        
        setTimeout(() => {
            window.location.href = 'configurations.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error submitting configuration:', error);
        const action = isEditingExisting ? 'update' : 'save';
        showNotification(`Failed to ${action} configuration. Please try again.`, 'error');
    }
}

function validateConfiguration() {
    if (!window.currentConfiguration.clientName.trim()) {
        return false;
    }
    
    if (window.currentConfiguration.populations.length === 0) {
        return false;
    }
    
    return true;
}

// ===== DATABASE FUNCTIONS =====
async function saveConfigurationToDatabase() {
    const configData = {
        ...window.currentConfiguration,
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    
    const response = await fetch('/api/configurations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function updateConfigurationToDatabase() {
    const configData = {
        ...window.currentConfiguration,
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    
    const response = await fetch(`/api/configurations/${currentConfigurationId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(configData)
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
}

async function loadConfigurationForEditing(configId) {
    try {
        showNotification('Loading configuration...', 'info');
        
        const response = await fetch(`/api/configurations/${configId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const configuration = await response.json();
        
        // Parse configuration_data if it's a string
        let configData;
        if (typeof configuration.configuration_data === 'string') {
            configData = JSON.parse(configuration.configuration_data);
        } else {
            configData = configuration.configuration_data;
        }
        
        // Set editing state
        isEditingExisting = true;
        currentConfigurationId = configId;
        
        // Update page title
        document.querySelector('.page-header h1').textContent = 'Edit Configuration';
        document.querySelector('.page-header p').textContent = `Editing configuration for ${configuration.client_name}`;
        
        // Load data into our global object and ensure proper structure
        window.currentConfiguration = {
            clientName: configData.clientName || "",
            reportingCadence: configData.reportingCadence || { frequency: "weekly", dayOfWeek: "monday", dayOfMonth: "1" },
            populations: (configData.populations || []).map(population => ({
                ...population,
                categories: (population.categories || []).map(category => ({
                    ...category,
                    expenseTypes: category.expenseTypes || []
                }))
            }))
        };
        
        // Populate the form
        populateFormFromConfiguration();
        
        showNotification('Configuration loaded successfully!', 'success');
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        showNotification('Failed to load configuration for editing.', 'error');
    }
}

function populateFormFromConfiguration() {
    // Populate basic information
    document.getElementById('client-name').value = window.currentConfiguration.clientName;
    
    // Populate reporting cadence
    const cadence = window.currentConfiguration.reportingCadence;
    document.getElementById('cadence-select').value = cadence.frequency;
    document.getElementById('day-of-week').value = cadence.dayOfWeek;
    document.getElementById('day-of-month').value = cadence.dayOfMonth;
    
    updateCadenceSelection(cadence.frequency);
    
    // Render populations
    renderPopulations();
    
    // Update form actions for editing mode
    updateFormActions();
}

function updateFormActions() {
    const formActions = document.getElementById('form-actions');
    
    if (isEditingExisting) {
        formActions.innerHTML = `
            <button type="button" class="btn-outline" id="save-as-new-btn">Save as New Configuration</button>
            <button type="submit" class="btn-primary">Update Configuration</button>
        `;
        
        // Add event listener for save as new
        document.getElementById('save-as-new-btn').addEventListener('click', function(e) {
            e.preventDefault();
            showSaveAsNewModal();
        });
    } else {
        formActions.innerHTML = `
            <button type="submit" class="btn-primary">Save Configuration</button>
        `;
    }
}

function showSaveAsNewModal() {
    const modal = document.getElementById('save-as-new-modal');
    const closeBtn = document.getElementById('close-save-as-new-modal');
    const cancelBtn = document.getElementById('cancel-save-as-new');
    const confirmBtn = document.getElementById('confirm-save-as-new');
    const nameInput = document.getElementById('new-config-name');
    
    // Clear previous input
    nameInput.value = '';
    
    modal.style.display = 'flex';
    nameInput.focus();
    
    // Remove existing event listeners to prevent duplicates
    closeBtn.replaceWith(closeBtn.cloneNode(true));
    cancelBtn.replaceWith(cancelBtn.cloneNode(true));
    confirmBtn.replaceWith(confirmBtn.cloneNode(true));
    
    // Get fresh references after cloning
    const newCloseBtn = document.getElementById('close-save-as-new-modal');
    const newCancelBtn = document.getElementById('cancel-save-as-new');
    const newConfirmBtn = document.getElementById('confirm-save-as-new');
    
    newCloseBtn.addEventListener('click', hideSaveAsNewModal);
    newCancelBtn.addEventListener('click', hideSaveAsNewModal);
    newConfirmBtn.addEventListener('click', handleSaveAsNew);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            hideSaveAsNewModal();
        }
    });
}

function hideSaveAsNewModal() {
    document.getElementById('save-as-new-modal').style.display = 'none';
}

async function handleSaveAsNew() {
    const newName = document.getElementById('new-config-name').value.trim();
    
    if (!newName) {
        showNotification('Please enter a configuration name.', 'error');
        return;
    }
    
    // Check if name already exists
    try {
        const response = await fetch('/api/configurations');
        const existingConfigs = await response.json();
        
        const nameExists = existingConfigs.some(config => 
            config.client_name.toLowerCase() === newName.toLowerCase()
        );
        
        if (nameExists) {
            showNotification('A configuration with this name already exists. Please choose a unique name.', 'error');
            return;
        }
        
        // Save as new configuration
        const originalName = window.currentConfiguration.clientName;
        window.currentConfiguration.clientName = newName;
        
        await saveConfigurationToDatabase();
        
        hideSaveAsNewModal();
        showNotification('Configuration saved as new successfully!', 'success');
        
        setTimeout(() => {
            window.location.href = 'configurations.html';
        }, 2000);
        
    } catch (error) {
        console.error('Error checking configuration names:', error);
        showNotification('Failed to save as new configuration. Please try again.', 'error');
    }
}

// ===== CONFIGURATION LOADING =====
async function loadConfigurationForEditing(configId) {
    try {
        const response = await fetch(`/api/configurations/${configId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const configuration = await response.json();
        const configData = JSON.parse(configuration.configuration_data);
        
        // Set editing state
        isEditingExisting = true;
        currentConfigurationId = configId;
        
        // Normalize and populate configuration data with defensive programming
        window.currentConfiguration = {
            clientName: configData.clientName || "",
            reportingCadence: configData.reportingCadence || { 
                frequency: "weekly", 
                dayOfWeek: "monday", 
                dayOfMonth: "1" 
            },
            populations: (configData.populations || []).map(population => ({
                ...population,
                categories: (population.categories || []).map(category => ({
                    ...category,
                    expenseTypes: category.expenseTypes || []
                }))
            }))
        };
        
        // Populate form fields
        document.getElementById('client-name').value = window.currentConfiguration.clientName;
        
        // Populate reporting cadence
        const cadenceSelect = document.getElementById('cadence-select');
        const dayOfWeekSelect = document.getElementById('day-of-week');
        const dayOfMonthSelect = document.getElementById('day-of-month');
        
        cadenceSelect.value = window.currentConfiguration.reportingCadence.frequency;
        updateCadenceSelection(window.currentConfiguration.reportingCadence.frequency);
        
        if (window.currentConfiguration.reportingCadence.dayOfWeek) {
            dayOfWeekSelect.value = window.currentConfiguration.reportingCadence.dayOfWeek;
        }
        if (window.currentConfiguration.reportingCadence.dayOfMonth) {
            dayOfMonthSelect.value = window.currentConfiguration.reportingCadence.dayOfMonth;
        }
        
        // Render populations
        renderPopulations();
        
        // Update form actions for editing mode
        updateFormActions();
        
    } catch (error) {
        console.error('Error loading configuration for editing:', error);
        showNotification('Failed to load configuration for editing. Please try again.', 'error');
    }
}

// ===== UTILITY FUNCTIONS =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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