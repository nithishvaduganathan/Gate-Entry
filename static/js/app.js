// SINCET Gate Entry System JavaScript

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Auto-dismiss alerts after 5 seconds
    setTimeout(function() {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(function(alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        });
    }, 5000);

    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function(tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize camera functionality if present
    if (document.getElementById('cameraModal')) {
        initializeCamera();
    }

    // Initialize speech recognition if present
    if (document.getElementById('speechModal')) {
        initializeSpeechRecognition();
    }

    // Auto-refresh dashboard stats
    if (document.querySelector('.dashboard-stats')) {
        setInterval(refreshDashboardStats, 30000); // Refresh every 30 seconds
    }
}

// Camera functionality
function initializeCamera() {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('photoCanvas');
    const captureBtn = document.getElementById('captureBtn');
    
    if (!video || !canvas || !captureBtn) return;

    navigator.mediaDevices.getUserMedia({ video: true })
        .then(function(stream) {
            video.srcObject = stream;
        })
        .catch(function(err) {
            console.error('Error accessing camera:', err);
            alert('Could not access camera. Please check permissions.');
        });

    captureBtn.addEventListener('click', function() {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        // Convert to blob and send to form
        canvas.toBlob(function(blob) {
            const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
            const photoInput = document.getElementById('photoInput');
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            photoInput.files = dataTransfer.files;
            
            // Show preview
            const preview = document.getElementById('photoPreview');
            preview.src = URL.createObjectURL(blob);
            preview.style.display = 'block';
            
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('cameraModal'));
            modal.hide();
        });
    });
}

// Speech recognition functionality
function initializeSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    const startSpeechBtn = document.getElementById('startSpeech');
    const speechStatus = document.getElementById('speechStatus');
    
    if (!startSpeechBtn) return;

    startSpeechBtn.addEventListener('click', function() {
        const targetField = this.getAttribute('data-target');
        
        recognition.start();
        speechStatus.textContent = 'Listening...';
        speechStatus.classList.add('text-danger');
        
        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const targetElement = document.getElementById(targetField);
            if (targetElement) {
                targetElement.value = transcript;
            }
            speechStatus.textContent = 'Complete';
            speechStatus.classList.remove('text-danger');
            speechStatus.classList.add('text-success');
        };
        
        recognition.onerror = function(event) {
            speechStatus.textContent = 'Error: ' + event.error;
            speechStatus.classList.remove('text-danger');
            speechStatus.classList.add('text-warning');
        };
        
        recognition.onend = function() {
            setTimeout(function() {
                speechStatus.textContent = '';
                speechStatus.classList.remove('text-danger', 'text-success', 'text-warning');
            }, 3000);
        };
    });
}

// Dashboard stats refresh
function refreshDashboardStats() {
    fetch('/dashboard/api/stats')
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error refreshing stats:', data.error);
                return;
            }
            
            // Update stat cards
            updateStatCard('today-visitors', data.today_visitors);
            updateStatCard('pending-visitors', data.pending_visitors);
            updateStatCard('active-visitors', data.active_visitors);
            updateStatCard('today-vehicles', data.today_vehicles);
            updateStatCard('active-vehicles', data.active_vehicles);
            
            // Update last refreshed time
            const lastUpdated = document.getElementById('last-updated');
            if (lastUpdated) {
                const time = new Date(data.last_updated).toLocaleTimeString();
                lastUpdated.textContent = `Last updated: ${time}`;
            }
        })
        .catch(error => {
            console.error('Error refreshing dashboard stats:', error);
        });
}

function updateStatCard(elementId, value) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value;
    }
}

// Form validation helpers
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return true;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(function(field) {
        if (!field.value.trim()) {
            field.classList.add('is-invalid');
            isValid = false;
        } else {
            field.classList.remove('is-invalid');
        }
    });
    
    return isValid;
}

// Utility functions
function showLoading(buttonId) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = true;
        button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Loading...';
    }
}

function hideLoading(buttonId, originalText) {
    const button = document.getElementById(buttonId);
    if (button) {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// Search functionality
function initializeSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    let searchTimeout;
    
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(function() {
            performSearch(searchInput.value);
        }, 300);
    });
}

function performSearch(query) {
    if (query.length < 2) return;
    
    fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(data => {
            displaySearchResults(data);
        })
        .catch(error => {
            console.error('Search error:', error);
        });
}

function displaySearchResults(results) {
    const resultsContainer = document.getElementById('searchResults');
    if (!resultsContainer) return;
    
    resultsContainer.innerHTML = '';
    
    if (results.visitors && results.visitors.length > 0) {
        const visitorsSection = createSearchSection('Visitors', results.visitors);
        resultsContainer.appendChild(visitorsSection);
    }
    
    if (results.vehicles && results.vehicles.length > 0) {
        const vehiclesSection = createSearchSection('Vehicles', results.vehicles);
        resultsContainer.appendChild(vehiclesSection);
    }
}

function createSearchSection(title, items) {
    const section = document.createElement('div');
    section.className = 'search-section mb-3';
    
    const header = document.createElement('h6');
    header.textContent = title;
    header.className = 'text-muted mb-2';
    section.appendChild(header);
    
    items.forEach(function(item) {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'search-item p-2 border rounded mb-1';
        itemDiv.innerHTML = `
            <div class="fw-bold">${item.name || item.bus_number}</div>
            <div class="text-muted small">${item.phone || item.driver_name || ''}</div>
        `;
        section.appendChild(itemDiv);
    });
    
    return section;
}