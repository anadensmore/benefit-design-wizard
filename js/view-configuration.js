document.addEventListener('DOMContentLoaded', function() {
    initializeViewConfiguration();
});

let currentConfigId = null;

function initializeViewConfiguration() {
    // Get configuration ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const configId = urlParams.get('id');
    
    if (!configId) {
        showErrorState('No configuration ID provided');
        return;
    }
    
    currentConfigId = configId;
    loadConfigurationSummary(configId);
    setupEventListeners();
}

function setupEventListeners() {
    const editBtn = document.getElementById('edit-config-btn');
    editBtn.addEventListener('click', function() {
        if (currentConfigId) {
            window.location.href = `custom-package.html?edit=${currentConfigId}`;
        }
    });
}

async function loadConfigurationSummary(configId) {
    try {
        showLoadingState();
        
        const response = await fetch(`/api/configurations/${configId}`);
        
        if (!response.ok) {
            if (response.status === 404) {
                showErrorState('Configuration not found');
            } else {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return;
        }
        
        const configuration = await response.json();
        displayConfigurationSummary(configuration);
        
    } catch (error) {
        console.error('Error loading configuration:', error);
        showErrorState('Failed to load configuration');
    }
}

function displayConfigurationSummary(configuration) {
    hideLoadingState();
    showConfigContent();
    
    const configData = configuration.configuration_data;
    
    // Update header
    updateHeader(configuration, configData);
    
    // Update basic information
    updateBasicInformation(configuration, configData);
    
    // Update reporting configuration
    updateReportingConfiguration(configData);
    
    // Update populations
    updatePopulations(configData.populations || []);
    
    // Show edit button
    document.getElementById('edit-config-btn').style.display = 'block';
}

function updateHeader(configuration, configData) {
    const title = document.getElementById('config-title');
    const subtitle = document.getElementById('config-subtitle');
    const status = document.getElementById('config-status');
    
    title.textContent = `${configuration.client_name} - Configuration`;
    subtitle.textContent = 'Complete benefit configuration summary';
    
    const configStatus = 'completed';
    status.textContent = 'Completed';
    status.className = `config-status completed`;
}

function updateBasicInformation(configuration, configData) {
    document.getElementById('summary-client-name').textContent = configuration.client_name;
    document.getElementById('summary-status').textContent = 'Completed';
    document.getElementById('summary-created').textContent = 
        new Date(configuration.created_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    document.getElementById('summary-updated').textContent = 
        new Date(configuration.updated_at).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
}

function updateReportingConfiguration(configData) {
    const reportingCadence = configData.reportingCadence;
    
    if (reportingCadence) {
        // Update frequency
        document.getElementById('summary-frequency').textContent = 
            formatCadence(reportingCadence.frequency);
        
        // Update day information
        const daySection = document.getElementById('summary-day-section');
        const dayLabel = document.getElementById('summary-day-label');
        const dayValue = document.getElementById('summary-day-value');
        
        if (reportingCadence.frequency === 'monthly' && reportingCadence.dayOfMonth) {
            dayLabel.textContent = 'Day of Month';
            dayValue.textContent = formatDayOfMonth(reportingCadence.dayOfMonth);
            daySection.style.display = 'block';
        } else if (reportingCadence.dayOfWeek) {
            dayLabel.textContent = 'Day of Week';
            dayValue.textContent = formatDayOfWeek(reportingCadence.dayOfWeek);
            daySection.style.display = 'block';
        } else {
            daySection.style.display = 'none';
        }
    } else {
        document.getElementById('summary-frequency').textContent = 'Not configured';
        document.getElementById('summary-day-section').style.display = 'none';
    }
}

function updatePopulations(populations) {
    const countBadge = document.getElementById('population-count');
    const populationsContainer = document.getElementById('populations-summary');
    
    countBadge.textContent = populations.length;
    
    if (populations.length === 0) {
        populationsContainer.innerHTML = '<div class="empty-summary">No populations configured</div>';
        return;
    }
    
    populationsContainer.innerHTML = populations.map(population => 
        createPopulationSummaryCard(population)
    ).join('');
}

function createPopulationSummaryCard(population) {
    const categories = population.categories || [];
    const totalExpenseTypes = categories.reduce((total, category) => {
        return total + (category.expenseTypes ? category.expenseTypes.length : 0);
    }, 0);
    
    return `
        <div class="population-summary-card">
            <div class="population-summary-header">
                <h3 class="population-summary-title">${escapeHtml(population.name || 'Unnamed Population')}</h3>
            </div>
            
            ${population.description ? `
                <div class="population-meta-item">
                    <div class="population-meta-label">Description</div>
                    <div class="population-meta-value">${escapeHtml(population.description)}</div>
                </div>
            ` : ''}
            
            <div class="population-summary-meta">
                <div class="population-meta-item">
                    <div class="population-meta-label">Claim Submission Window</div>
                    <div class="population-meta-value">${population.claimSubmissionWindow || 180} days</div>
                </div>
                <div class="population-meta-item">
                    <div class="population-meta-label">Runout Period</div>
                    <div class="population-meta-value">${population.runoutPeriod || 180} days</div>
                </div>
                <div class="population-meta-item">
                    <div class="population-meta-label">Launch Date</div>
                    <div class="population-meta-value">${formatDate(population.launchDate)}</div>
                </div>
                <div class="population-meta-item">
                    <div class="population-meta-label">End Date</div>
                    <div class="population-meta-value">${formatDate(population.endDate)}</div>
                </div>
            </div>
            
            <div class="categories-summary">
                <h4>Categories <span class="count-badge">${categories.length}</span></h4>
                ${categories.length > 0 ? `
                    <div class="category-summary-list">
                        ${categories.map(category => createCategorySummaryItem(category)).join('')}
                    </div>
                ` : '<div class="empty-summary">No categories configured</div>'}
            </div>
        </div>
    `;
}

function createCategorySummaryItem(category) {
    const expenseTypes = category.expenseTypes || [];
    
    return `
        <div class="category-summary-item">
            <div class="category-summary-name">${escapeHtml(category.name || 'Unnamed Category')}</div>
            <div class="category-summary-details">
                <span>Format: ${category.format || 'Currency'}</span>
                <span>Structure: ${category.structure || 'Lifetime'}</span>
                <span>Expense Types: ${expenseTypes.length}</span>
            </div>
        </div>
        ${expenseTypes.length > 0 ? `
            <div class="expense-types-summary">
                <h5>Expense Types <span class="count-badge">${expenseTypes.length}</span></h5>
                <div class="expense-type-summary-list">
                    ${expenseTypes.map(expenseType => 
                        `<span class="expense-type-tag">${formatExpenseType(expenseType.name || expenseType.expenseCategory)}</span>`
                    ).join('')}
                </div>
            </div>
        ` : ''}
    `;
}

// Utility functions
function formatCadence(frequency) {
    const cadenceMap = {
        'weekly': 'Weekly',
        'biweekly-odd': 'Bi-weekly (Odd weeks)',
        'biweekly-even': 'Bi-weekly (Even weeks)',
        'monthly': 'Monthly'
    };
    return cadenceMap[frequency] || frequency;
}

function formatDayOfWeek(day) {
    return day.charAt(0).toUpperCase() + day.slice(1);
}

function formatDayOfMonth(day) {
    if (day === 'last') return 'Last day of month';
    const suffix = day.endsWith('1') && day !== '11' ? 'st' :
                  day.endsWith('2') && day !== '12' ? 'nd' :
                  day.endsWith('3') && day !== '13' ? 'rd' : 'th';
    return `${day}${suffix}`;
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatExpenseType(expenseType) {
    const expenseTypeMap = {
        'fertility': 'Fertility',
        'adoption': 'Adoption',
        'preservation': 'Preservation',
        'surrogacy': 'Surrogacy',
        'donor': 'Donor',
        'maternity': 'Maternity',
        'menopause': 'Menopause',
        'parenting-pediatrics': 'Parenting & Pediatrics'
    };
    return expenseTypeMap[expenseType] || expenseType;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// State management functions
function showLoadingState() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('config-content').style.display = 'none';
    document.getElementById('error-state').style.display = 'none';
}

function hideLoadingState() {
    document.getElementById('loading-state').style.display = 'none';
}

function showConfigContent() {
    document.getElementById('config-content').style.display = 'block';
    document.getElementById('error-state').style.display = 'none';
}

function showErrorState(message) {
    hideLoadingState();
    const errorState = document.getElementById('error-state');
    const errorContent = errorState.querySelector('.error-content p');
    if (errorContent && message) {
        errorContent.textContent = message;
    }
    errorState.style.display = 'flex';
    document.getElementById('config-content').style.display = 'none';
}