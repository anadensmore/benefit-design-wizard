document.addEventListener('DOMContentLoaded', function() {
    const templateCards = document.querySelectorAll('.template-card');
    const startScratchBtn = document.querySelector('.btn-outline.large');
    
    templateCards.forEach(card => {
        const button = card.querySelector('.btn-primary');
        button.addEventListener('click', function() {
            const templateType = card.getAttribute('data-template');
            selectTemplate(templateType);
        });
    });
    
    if (startScratchBtn) {
        startScratchBtn.addEventListener('click', function() {
            selectTemplate('custom');
        });
    }
    
    animateTemplateCards();
});

function selectTemplate(templateType) {
    localStorage.setItem('selectedTemplate', templateType);
    
    if (templateType === 'custom') {
        window.location.href = 'custom-package.html';
    } else {
        showLoadingMessage(templateType);
        
        setTimeout(() => {
            console.log(`Selected template: ${templateType}`);
            alert(`You've selected the ${getTemplateName(templateType)} template. The configuration wizard will be available soon!`);
            document.querySelector('.loading-overlay').remove();
        }, 1500);
    }
}

function getTemplateName(templateType) {
    const names = {
        'small-business': 'Small Business Package',
        'enterprise': 'Enterprise Solution',
        'startup': 'Startup Package',
        'nonprofit': 'Non-Profit Benefits',
        'custom': 'Custom Package'
    };
    return names[templateType] || 'Unknown';
}

function showLoadingMessage(templateType) {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="spinner"></div>
            <h3>Loading ${getTemplateName(templateType)}</h3>
            <p>Preparing your configuration wizard...</p>
        </div>
    `;
    
    const style = document.createElement('style');
    style.textContent = `
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(255, 255, 255, 0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        
        .loading-content {
            text-align: center;
        }
        
        .spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #DEE3E3;
            border-top-color: #00856F;
            border-radius: 50%;
            margin: 0 auto 1.5rem;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loading-content h3 {
            color: #263633;
            margin-bottom: 0.5rem;
        }
        
        .loading-content p {
            color: #64726F;
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(overlay);
}

function animateTemplateCards() {
    const cards = document.querySelectorAll('.template-card, .scratch-card');
    
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}