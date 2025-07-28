document.addEventListener('DOMContentLoaded', function() {
    initializeConfigurationsPage();
    
    // Make functions available globally for debugging
    window.viewConfiguration = viewConfiguration;
    window.editConfiguration = editConfiguration;
    window.showDeleteConfirmation = showDeleteConfirmation;
});

let configurations = [];
let filteredConfigurations = [];
let currentConfigToDelete = null;

function initializeConfigurationsPage() {
    setupEventListeners();
    loadConfigurations();
}

function setupEventListeners() {
    // Search and filter functionality
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const refreshBtn = document.getElementById('refresh-btn');
    
    searchInput.addEventListener('input', filterConfigurations);
    statusFilter.addEventListener('change', filterConfigurations);
    refreshBtn.addEventListener('click', loadConfigurations);
    
    // Event delegation for configuration card buttons
    setupConfigurationCardEventListeners();
    
    // Modal event listeners
    setupModalEventListeners();
}

function setupConfigurationCardEventListeners() {
    const configurationsGrid = document.getElementById('configurations-grid');
    
    configurationsGrid.addEventListener('click', function(e) {
        const configId = e.target.getAttribute('data-config-id') || 
                        e.target.closest('[data-config-id]')?.getAttribute('data-config-id');
        
        if (!configId) return;
        
        console.log('Button clicked for config ID:', configId);
        
        if (e.target.classList.contains('view-btn') || e.target.closest('.view-btn')) {
            console.log('View button clicked');
            viewConfiguration(configId);
        } else if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
            console.log('Edit button clicked');
            editConfiguration(configId);
        } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
            console.log('Delete button clicked');
            showDeleteConfirmation(configId);
        }
    });
}

function setupModalEventListeners() {
    // Details modal
    const detailsModal = document.getElementById('config-details-modal');
    const closeDetailsBtn = detailsModal.querySelector('.close-btn');
    const closeDetailsFooterBtn = document.getElementById('close-details');
    const editConfigBtn = document.getElementById('edit-config');
    
    closeDetailsBtn.addEventListener('click', hideDetailsModal);
    closeDetailsFooterBtn.addEventListener('click', hideDetailsModal);
    editConfigBtn.addEventListener('click', editConfiguration);
    
    detailsModal.addEventListener('click', function(e) {
        if (e.target === detailsModal) {
            hideDetailsModal();
        }
    });
    
    // Delete confirmation modal
    const deleteModal = document.getElementById('delete-confirmation-modal');
    const closeDeleteBtn = deleteModal.querySelector('.close-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    closeDeleteBtn.addEventListener('click', hideDeleteModal);
    cancelDeleteBtn.addEventListener('click', hideDeleteModal);
    confirmDeleteBtn.addEventListener('click', confirmDelete);
    
    deleteModal.addEventListener('click', function(e) {
        if (e.target === deleteModal) {
            hideDeleteModal();
        }
    });
}

async function loadConfigurations() {
    showLoadingState();
    
    try {
        const response = await fetch('/api/configurations');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        configurations = await response.json();
        filteredConfigurations = [...configurations];
        
        displayConfigurations();
        
    } catch (error) {
        console.error('Error loading configurations:', error);
        showErrorState('Failed to load configurations. Please try again.');
    }
}

function filterConfigurations() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    
    filteredConfigurations = configurations.filter(config => {
        const matchesSearch = config.client_name.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || (config.configuration_data && 
            JSON.parse(config.configuration_data).status === statusFilter);
        
        return matchesSearch && matchesStatus;
    });
    
    displayConfigurations();
}

function displayConfigurations() {
    const container = document.getElementById('configurations-container');
    const loadingState = document.getElementById('loading-state');
    const emptyState = document.getElementById('empty-state');
    const grid = document.getElementById('configurations-grid');
    
    loadingState.style.display = 'none';
    
    if (filteredConfigurations.length === 0) {
        emptyState.style.display = 'flex';
        grid.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        grid.style.display = 'grid';
        renderConfigurationCards();
    }
}

function renderConfigurationCards() {
    const grid = document.getElementById('configurations-grid');
    
    grid.innerHTML = filteredConfigurations.map(config => {
        const configData = JSON.parse(config.configuration_data || '{}');
        const status = 'completed';
        const createdDate = new Date(config.created_at).toLocaleDateString();
        const updatedDate = new Date(config.updated_at).toLocaleDateString();
        
        return `
            <div class="config-card" data-config-id="${config.id}">
                <div class="config-card-header">
                    <h3 class="config-card-title">${escapeHtml(config.client_name)}</h3>
                    <span class="config-status completed">Completed</span>
                </div>
                
                <div class="config-card-meta">
                    <div class="config-meta-item">
                        <strong>Created:</strong> ${createdDate}
                    </div>
                    <div class="config-meta-item">
                        <strong>Updated:</strong> ${updatedDate}
                    </div>
                    <div class="config-meta-item">
                        <strong>Populations:</strong> ${configData.populations ? configData.populations.length : 0}
                    </div>
                </div>
                
                <div class="config-card-actions">
                    <button class="btn-icon-small view-btn" data-config-id="${config.id}" title="View Summary">
                        👁️ View
                    </button>
                    <button class="btn-icon-small edit-btn" data-config-id="${config.id}" title="Edit">
                        ✏️ Edit
                    </button>
                    <button class="btn-icon-small danger delete-btn" data-config-id="${config.id}" title="Delete">
                        🗑️ Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function viewConfiguration(configId) {
    // Navigate to the dedicated view page
    window.location.href = `view-configuration.html?id=${configId}`;
}

function showConfigurationDetails(configuration) {
    const modal = document.getElementById('config-details-modal');
    const modalTitle = document.getElementById('modal-client-name');
    const modalContent = document.getElementById('config-details-content');
    
    modalTitle.textContent = `${configuration.client_name} - Configuration Details`;
    
    const configData = configuration.configuration_data;
    const createdDate = new Date(configuration.created_at).toLocaleDateString();
    const updatedDate = new Date(configuration.updated_at).toLocaleDateString();
    
    modalContent.innerHTML = `
        <div class="config-details-section">
            <h4>Basic Information</h4>
            <div class="config-details-grid">
                <div class="config-detail-item">
                    <div class="config-detail-label">Client Name</div>
                    <div class="config-detail-value">${escapeHtml(configuration.client_name)}</div>
                </div>
                <div class="config-detail-item">
                    <div class="config-detail-label">Status</div>
                    <div class="config-detail-value">Completed</div>
                </div>
                <div class="config-detail-item">
                    <div class="config-detail-label">Created</div>
                    <div class="config-detail-value">${createdDate}</div>
                </div>
                <div class="config-detail-item">
                    <div class="config-detail-label">Last Updated</div>
                    <div class="config-detail-value">${updatedDate}</div>
                </div>
            </div>
        </div>
        
        <div class="config-details-section">
            <h4>Reporting Configuration</h4>
            <div class="config-details-grid">
                <div class="config-detail-item">
                    <div class="config-detail-label">Frequency</div>
                    <div class="config-detail-value">${configData.reportingCadence ? 
                        formatCadence(configData.reportingCadence.frequency) : 'Not configured'}</div>
                </div>
                ${configData.reportingCadence && configData.reportingCadence.dayOfWeek ? `
                <div class="config-detail-item">
                    <div class="config-detail-label">Day of Week</div>
                    <div class="config-detail-value">${formatDayOfWeek(configData.reportingCadence.dayOfWeek)}</div>
                </div>
                ` : ''}
                ${configData.reportingCadence && configData.reportingCadence.dayOfMonth ? `
                <div class="config-detail-item">
                    <div class="config-detail-label">Day of Month</div>
                    <div class="config-detail-value">${formatDayOfMonth(configData.reportingCadence.dayOfMonth)}</div>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="config-details-section">
            <h4>Populations (${configData.populations ? configData.populations.length : 0})</h4>
            ${configData.populations && configData.populations.length > 0 ? `
                <ul class="populations-list">
                    ${configData.populations.map(pop => `
                        <li>${escapeHtml(pop.name || 'Unnamed Population')}</li>
                    `).join('')}
                </ul>
            ` : '<p class="config-detail-value">No populations configured</p>'}
        </div>
    `;
    
    // Store current config ID for edit functionality
    modal.setAttribute('data-config-id', configuration.id);
    modal.style.display = 'flex';
}

function editConfiguration(configId) {
    // Navigate to custom package page with the configuration ID
    window.location.href = `custom-package.html?edit=${configId}`;
}

function showDeleteConfirmation(configId) {
    console.log('Delete confirmation requested for:', configId);
    
    const config = configurations.find(c => c.id === configId);
    if (!config) {
        console.error('Configuration not found for ID:', configId);
        return;
    }
    
    console.log('Found configuration to delete:', config.client_name);
    currentConfigToDelete = configId;
    
    const modal = document.getElementById('delete-confirmation-modal');
    const clientNameSpan = document.getElementById('delete-client-name');
    
    if (!modal) {
        console.error('Delete confirmation modal not found');
        return;
    }
    
    if (!clientNameSpan) {
        console.error('Client name span not found');
        return;
    }
    
    clientNameSpan.textContent = config.client_name;
    modal.style.display = 'flex';
    console.log('Delete confirmation modal shown');
    console.log('Modal display style:', modal.style.display);
    console.log('Modal computed style:', getComputedStyle(modal).display);
}

async function confirmDelete() {
    if (!currentConfigToDelete) {
        console.error('No configuration selected for deletion');
        return;
    }
    
    console.log('Attempting to delete configuration:', currentConfigToDelete);
    
    try {
        const response = await fetch(`/api/configurations/${currentConfigToDelete}`, {
            method: 'DELETE'
        });
        
        console.log('Delete response status:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('Server error:', errorData);
            throw new Error(`HTTP error! status: ${response.status} - ${errorData.error || 'Unknown error'}`);
        }
        
        const result = await response.json();
        console.log('Delete successful:', result);
        
        showNotification('Configuration deleted successfully.', 'success');
        hideDeleteModal();
        loadConfigurations(); // Refresh the list
        
    } catch (error) {
        console.error('Error deleting configuration:', error);
        showNotification(`Failed to delete configuration: ${error.message}`, 'error');
    }
}

// Modal functions
function hideDetailsModal() {
    document.getElementById('config-details-modal').style.display = 'none';
}

function hideDeleteModal() {
    document.getElementById('delete-confirmation-modal').style.display = 'none';
    currentConfigToDelete = null;
}

// Utility functions
function showLoadingState() {
    document.getElementById('loading-state').style.display = 'flex';
    document.getElementById('empty-state').style.display = 'none';
    document.getElementById('configurations-grid').style.display = 'none';
}

function showErrorState(message) {
    const container = document.getElementById('configurations-container');
    container.innerHTML = `
        <div class="empty-state">
            <div class="empty-state-content">
                <h3>Error Loading Configurations</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="loadConfigurations()">Try Again</button>
            </div>
        </div>
    `;
}

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
    
    // Add CSS for notifications if not already added
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