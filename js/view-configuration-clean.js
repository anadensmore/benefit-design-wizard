// CLEAN, PRINTABLE CONFIGURATION SUMMARY
document.addEventListener('DOMContentLoaded', function() {
    initializeViewConfiguration();
});

let currentConfigId = null;

function initializeViewConfiguration() {
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
    
    // Add print button functionality
    const printBtn = document.getElementById('print-btn');
    if (printBtn) {
        printBtn.addEventListener('click', () => window.print());
    }
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
    
    // Generate the complete summary
    const summaryContainer = document.getElementById('config-summary');
    summaryContainer.innerHTML = generateCompleteSummary(configuration, configData);
    
    // Update header
    document.getElementById('config-title').textContent = `${configuration.client_name} - Benefit Configuration`;
    document.getElementById('config-subtitle').textContent = `Configuration Summary`;
    
    // Show buttons
    document.getElementById('edit-config-btn').style.display = 'block';
}

function generateCompleteSummary(configuration, configData) {
    const createdDate = new Date(configuration.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
    });
    
    const populations = configData.populations || [];
    const totalCategories = populations.reduce((total, pop) => total + (pop.categories ? pop.categories.length : 0), 0);
    const totalExpenseTypes = populations.reduce((total, pop) => {
        return total + (pop.categories ? pop.categories.reduce((catTotal, cat) => {
            return catTotal + (cat.expenseTypes ? cat.expenseTypes.length : 0);
        }, 0) : 0);
    }, 0);
    
    return `
        <!-- Executive Summary Box -->
        <div class="executive-summary">
            <div class="summary-header">
                <h2>Configuration Overview</h2>
                <div class="summary-stats">
                    <span class="stat"><strong>${populations.length}</strong> Population${populations.length !== 1 ? 's' : ''}</span>
                    <span class="stat"><strong>${totalCategories}</strong> Categor${totalCategories !== 1 ? 'ies' : 'y'}</span>
                    <span class="stat"><strong>${totalExpenseTypes}</strong> Expense Type${totalExpenseTypes !== 1 ? 's' : ''}</span>
                </div>
            </div>
            
            <div class="summary-details">
                <div class="detail-row">
                    <span class="label">Client:</span>
                    <span class="value">${escapeHtml(configuration.client_name)}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Created:</span>
                    <span class="value">${createdDate}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="value status-completed">Completed</span>
                </div>
                <div class="detail-row">
                    <span class="label">Reporting:</span>
                    <span class="value">${formatReportingCadence(configData.reportingCadence)}</span>
                </div>
            </div>
        </div>

        <!-- Detailed Configuration -->
        <div class="detailed-configuration">
            ${populations.map(population => generatePopulationSummary(population)).join('')}
        </div>
    `;
}

function generatePopulationSummary(population) {
    const categories = population.categories || [];
    
    return `
        <div class="population-section">
            <div class="population-header">
                <h3 class="population-title">${escapeHtml(population.name)}</h3>
                <div class="population-meta">
                    ${population.description ? `<div class="meta-item">Description: ${escapeHtml(population.description)}</div>` : ''}
                    <div class="meta-item">Claim Window: ${population.claimSubmissionWindow || 180} days</div>
                    <div class="meta-item">Runout: ${population.runoutPeriod || 180} days</div>
                    <div class="meta-item">Period: ${formatDate(population.launchDate)} - ${formatDate(population.endDate)}</div>
                </div>
            </div>
            
            ${categories.length > 0 ? `
                <div class="categories-section">
                    ${categories.map(category => generateCategorySummary(category)).join('')}
                </div>
            ` : '<div class="no-categories">No categories configured</div>'}
        </div>
    `;
}

function generateCategorySummary(category) {
    const expenseTypes = category.expenseTypes || [];
    
    return `
        <div class="category-section">
            <div class="category-header">
                <h4 class="category-title">${escapeHtml(category.name)}</h4>
                <div class="category-details">
                    <div class="category-meta">
                        <span><strong>Format:</strong> ${category.format || 'Currency'}</span>
                        <span><strong>Structure:</strong> ${category.structure || 'Lifetime'}</span>
                        ${category.amounts && Object.keys(category.amounts).length > 0 ? 
                            `<span><strong>Amounts:</strong> ${formatAmounts(category.amounts)}</span>` : ''}
                    </div>
                    <div class="category-dates">
                        <span><strong>Start:</strong> ${formatDate(category.startDate)}</span>
                        <span><strong>End:</strong> ${formatDate(category.endDate)}</span>
                    </div>
                </div>
            </div>
            
            ${expenseTypes.length > 0 ? `
                <div class="expense-types-list">
                    ${expenseTypes.map(expenseType => generateExpenseTypeDetails(expenseType)).join('')}
                </div>
            ` : '<div class="no-expense-types">No expense types configured</div>'}
        </div>
    `;
}

function generateExpenseTypeDetails(expenseType) {
    const config = expenseType.configuration;
    
    return `
        <div class="expense-type-detailed">
            <div class="expense-type-header">
                <h5 class="expense-type-title">${formatExpenseTypeName(expenseType.name)}</h5>
            </div>
            
            <div class="expense-type-config">
                <div class="config-section">
                    <h6>Basic Configuration</h6>
                    <div class="config-grid">
                        <div class="config-item">
                            <span class="config-label">Historical Spend:</span>
                            <span class="config-value">${config.historicalSpendSupported ? 'Yes' : 'No'}</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">User Level:</span>
                            <span class="config-value">${formatUserLevel(config.userLevel)}</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">Reimbursement:</span>
                            <span class="config-value">${formatReimbursementMethod(config.reimbursementMethod)}</span>
                        </div>
                        <div class="config-item">
                            <span class="config-label">Period:</span>
                            <span class="config-value">${formatDate(config.startDate)} - ${formatDate(config.endDate)}</span>
                        </div>
                    </div>
                </div>
                
                ${generateEligibilityDetails(config.eligibility, config.expenseCategory)}
                
                ${generateTaxationDetails(config.taxation, config.expenseCategory)}
                
                ${config.subcategories && config.subcategories.length > 0 ? `
                    <div class="config-section">
                        <h6>Subcategories</h6>
                        <div class="subcategories-list">
                            ${config.subcategories.map(sub => `<span class="subcategory-tag">${formatSubcategory(sub)}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${config.directPayment !== undefined ? `
                    <div class="config-section">
                        <h6>Fertility-Specific Settings</h6>
                        <div class="config-grid">
                            <div class="config-item">
                                <span class="config-label">Direct Payment:</span>
                                <span class="config-value">${config.directPayment ? 'Yes' : 'No'}</span>
                            </div>
                            ${config.coverageType ? `
                                <div class="config-item">
                                    <span class="config-label">Coverage Type:</span>
                                    <span class="config-value">${formatCoverageType(config.coverageType)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function generateEligibilityDetails(eligibility, expenseCategory) {
    let details = `
        <div class="config-section">
            <h6>Eligibility</h6>
            <div class="config-grid">
                <div class="config-item">
                    <span class="config-label">Type:</span>
                    <span class="config-value">${formatEligibilityType(eligibility.type)}</span>
                </div>
    `;
    
    if (eligibility.type === 'custom') {
        details += `
                <div class="config-item">
                    <span class="config-label">Tenure Requirement:</span>
                    <span class="config-value">${formatTenureRequirement(eligibility.tenureRequirement)}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Benefits Eligible:</span>
                    <span class="config-value">${eligibility.benefitsEligible ? 'Yes' : 'No'}</span>
                </div>
                <div class="config-item">
                    <span class="config-label">Employee Medically Enrolled:</span>
                    <span class="config-value">${eligibility.employeeMedicallyEnrolled ? 'Yes' : 'No'}</span>
                </div>
        `;
        
        if (eligibility.walletHolderTypes && eligibility.walletHolderTypes.length > 0) {
            details += `
                <div class="config-item config-item-full">
                    <span class="config-label">Wallet Holder Types:</span>
                    <span class="config-value">${eligibility.walletHolderTypes.map(formatWalletHolderType).join(', ')}</span>
                </div>
            `;
        }
        
        if (eligibility.walletHolderGeography && eligibility.walletHolderGeography.length > 0) {
            details += `
                <div class="config-item config-item-full">
                    <span class="config-label">Geography:</span>
                    <span class="config-value">${eligibility.walletHolderGeography.map(formatGeography).join(', ')}</span>
                </div>
            `;
        }
        
        // Add expense category specific eligibility details
        if (expenseCategory === 'adoption') {
            if (eligibility.stepChildAdoptionAllowed !== undefined) {
                details += `
                    <div class="config-item">
                        <span class="config-label">Step Child Adoption:</span>
                        <span class="config-value">${eligibility.stepChildAdoptionAllowed ? 'Allowed' : 'Not Allowed'}</span>
                    </div>
                `;
            }
            if (eligibility.failedAdoptionAllowed !== undefined) {
                details += `
                    <div class="config-item">
                        <span class="config-label">Failed Adoption:</span>
                        <span class="config-value">${eligibility.failedAdoptionAllowed ? 'Allowed' : 'Not Allowed'}</span>
                    </div>
                `;
            }
        }
        
        if ((expenseCategory === 'fertility' || expenseCategory === 'preservation') && eligibility.dxInfertilityRequired !== undefined) {
            details += `
                <div class="config-item">
                    <span class="config-label">Dx Infertility Required:</span>
                    <span class="config-value">${eligibility.dxInfertilityRequired ? 'Yes' : 'No'}</span>
                </div>
            `;
        }
    }
    
    details += `
            </div>
        </div>
    `;
    
    return details;
}

function generateTaxationDetails(taxation, expenseCategory) {
    let details = `
        <div class="config-section">
            <h6>Taxation</h6>
            <div class="config-grid">
                <div class="config-item">
                    <span class="config-label">Type:</span>
                    <span class="config-value">${formatTaxationType(taxation.type)}</span>
                </div>
    `;
    
    if (taxation.type === 'custom') {
        if (taxation.nonTaxPartnerTaxation) {
            details += `
                <div class="config-item">
                    <span class="config-label">Non-Tax Partner:</span>
                    <span class="config-value">${formatTaxationValue(taxation.nonTaxPartnerTaxation)}</span>
                </div>
            `;
        }
        
        if (taxation.internationalTaxation) {
            details += `
                <div class="config-item">
                    <span class="config-label">International:</span>
                    <span class="config-value">${formatTaxationValue(taxation.internationalTaxation)}</span>
                </div>
            `;
        }
        
        // Add expense category specific taxation details
        if (expenseCategory === 'adoption') {
            if (taxation.stepChildTaxation) {
                details += `
                    <div class="config-item">
                        <span class="config-label">Step Child:</span>
                        <span class="config-value">${formatTaxationValue(taxation.stepChildTaxation)}</span>
                    </div>
                `;
            }
            if (taxation.failedAdoptionTaxation) {
                details += `
                    <div class="config-item">
                        <span class="config-label">Failed Adoption:</span>
                        <span class="config-value">${formatTaxationValue(taxation.failedAdoptionTaxation)}</span>
                    </div>
                `;
            }
        }
        
        if ((expenseCategory === 'fertility' || expenseCategory === 'preservation') && taxation.dxInfertilityTaxation) {
            details += `
                <div class="config-item">
                    <span class="config-label">Dx Infertility:</span>
                    <span class="config-value">${formatTaxationValue(taxation.dxInfertilityTaxation)}</span>
                </div>
            `;
        }
    }
    
    details += `
            </div>
        </div>
    `;
    
    return details;
}

// Utility Functions
function formatReportingCadence(cadence) {
    if (!cadence) return 'Not configured';
    
    const frequency = {
        'weekly': 'Weekly',
        'biweekly-odd': 'Bi-weekly (Odd)',
        'biweekly-even': 'Bi-weekly (Even)', 
        'monthly': 'Monthly'
    }[cadence.frequency] || cadence.frequency;
    
    if (cadence.frequency === 'monthly' && cadence.dayOfMonth) {
        return `${frequency} on ${formatDayOfMonth(cadence.dayOfMonth)}`;
    } else if (cadence.dayOfWeek) {
        return `${frequency} on ${cadence.dayOfWeek.charAt(0).toUpperCase() + cadence.dayOfWeek.slice(1)}`;
    }
    
    return frequency;
}

function formatDate(dateString) {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}

function formatDayOfMonth(day) {
    if (day === 'last') return 'last day';
    const suffix = day.endsWith('1') && day !== '11' ? 'st' :
                  day.endsWith('2') && day !== '12' ? 'nd' :
                  day.endsWith('3') && day !== '13' ? 'rd' : 'th';
    return `${day}${suffix}`;
}

function formatExpenseTypeName(name) {
    const nameMap = {
        'fertility': 'Fertility',
        'adoption': 'Adoption',
        'preservation': 'Preservation',
        'surrogacy': 'Surrogacy',
        'donor': 'Donor',
        'maternity': 'Maternity',
        'menopause': 'Menopause',
        'parenting-pediatrics': 'Parenting & Pediatrics'
    };
    return nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

function formatAmounts(amounts) {
    if (!amounts || Object.keys(amounts).length === 0) return 'No limits set';
    
    const formattedAmounts = [];
    if (amounts.lifetime) formattedAmounts.push(`$${amounts.lifetime} lifetime`);
    if (amounts.annual) formattedAmounts.push(`$${amounts.annual} annual`);
    if (amounts.perEvent) formattedAmounts.push(`$${amounts.perEvent} per event`);
    if (amounts.numberOfEvents) formattedAmounts.push(`${amounts.numberOfEvents} events`);
    if (amounts.perLifetime) formattedAmounts.push(`$${amounts.perLifetime} per lifetime`);
    if (amounts.lifetimeCycles) formattedAmounts.push(`${amounts.lifetimeCycles} lifetime cycles`);
    if (amounts.annualCycles) formattedAmounts.push(`${amounts.annualCycles} annual cycles`);
    
    return formattedAmounts.join(', ');
}

// New formatting functions for detailed display
function formatUserLevel(userLevel) {
    const userLevelMap = {
        'individual': 'Individual',
        'household': 'Household',
        'family': 'Family'
    };
    return userLevelMap[userLevel] || userLevel;
}

function formatReimbursementMethod(method) {
    const methodMap = {
        'payroll': 'Payroll',
        'direct-deposit': 'Direct Deposit',
        'check': 'Check',
        'ach': 'ACH'
    };
    return methodMap[method] || method;
}

function formatEligibilityType(type) {
    const typeMap = {
        'anyone-on-file': 'Anyone on File',
        'employee-only': 'Employee Only',
        'custom': 'Custom'
    };
    return typeMap[type] || type;
}

function formatTaxationType(type) {
    const typeMap = {
        'standard': 'Standard',
        'not-taxed': 'Not Taxed',
        'custom': 'Custom'
    };
    return typeMap[type] || type;
}

function formatTenureRequirement(tenure) {
    const tenureMap = {
        'none': 'None',
        '30-days': '30 Days',
        '60-days': '60 Days',
        '90-days': '90 Days',
        '6-months': '6 Months',
        '1-year': '1 Year'
    };
    return tenureMap[tenure] || tenure;
}

function formatTaxationValue(value) {
    const valueMap = {
        'not-taxed': 'Not Taxed',
        'taxed': 'Taxed',
        'standard': 'Standard'
    };
    return valueMap[value] || value;
}

function formatWalletHolderType(type) {
    const typeMap = {
        'employee': 'Employee',
        'spouse': 'Spouse',
        'partner': 'Partner',
        'dependent': 'Dependent'
    };
    return typeMap[type] || type;
}

function formatGeography(geo) {
    const geoMap = {
        'us': 'United States',
        'international': 'International',
        'canada': 'Canada'
    };
    return geoMap[geo] || geo;
}

function formatSubcategory(subcategory) {
    const subcategoryMap = {
        'medical': 'Medical',
        'wellness': 'Wellness',
        'travel': 'Travel',
        'childcare': 'Childcare',
        'general': 'General',
        'ancillary': 'Ancillary'
    };
    return subcategoryMap[subcategory] || subcategory;
}

function formatCoverageType(coverageType) {
    const coverageMap = {
        'deductible-enabled': 'Deductible Enabled',
        'deductible-disabled': 'Deductible Disabled'
    };
    return coverageMap[coverageType] || coverageType;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// State management
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