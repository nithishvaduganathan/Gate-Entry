// SINCET Gate Entry System JavaScript

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Global variables for camera and speech
let videoStream = null;
let speechRecognition = null;
let isRecording = false;

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

    if (document.getElementById('speechModal')) {
        initializeSpeechRecognition();
    }

    // Auto-refresh dashboard stats
    if (document.querySelector('.dashboard-stats')) {
        // Refresh immediately on load, then every 30 seconds
        refreshDashboardStats();
        setInterval(refreshDashboardStats, 30000); // Refresh every 30 seconds
    }
}

// Camera functionality
function initializeCamera() {
    const cameraModal = document.getElementById('cameraModal');
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('photoCanvas');
    const captureBtn = document.getElementById('captureBtn');
    
    if (!cameraModal || !video || !canvas || !captureBtn) return;

    // Start camera when modal opens
    cameraModal.addEventListener('shown.bs.modal', function() {
        startCamera();
    });

    // Stop camera when modal closes
    cameraModal.addEventListener('hidden.bs.modal', function() {
        stopCamera();
    });

    captureBtn.addEventListener('click', function() {
        capturePhoto();
    });
}

function startCamera() {
    const video = document.getElementById('cameraPreview');
    
    navigator.mediaDevices.getUserMedia({ 
        video: { 
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        } 
    })
    .then(function(stream) {
        videoStream = stream;
        video.srcObject = stream;
    })
    .catch(function(err) {
        console.error('Error accessing camera:', err);
        alert('Could not access camera. Please check permissions or try uploading a photo instead.');
    });
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => {
            track.stop();
        });
        videoStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('photoCanvas');
    
    if (!video.videoWidth || !video.videoHeight) {
        alert('Camera not ready. Please wait a moment and try again.');
        return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);
    
    // Convert to blob and update form
    canvas.toBlob(function(blob) {
        if (!blob) {
            alert('Failed to capture photo. Please try again.');
            return;
        }

        // Create file from blob
        const file = new File([blob], 'captured_photo.jpg', { type: 'image/jpeg' });
        
        // Update file input
        const photoInput = document.getElementById('photo');
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        photoInput.files = dataTransfer.files;
        
        // Show preview
        const preview = document.getElementById('photoPreview');
        const previewContainer = document.getElementById('photoPreviewContainer');
        const actionsContainer = document.getElementById('photoActionsContainer');
        
        preview.src = URL.createObjectURL(blob);
        previewContainer.style.display = 'block';
        actionsContainer.style.display = 'none';
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('cameraModal'));
        modal.hide();
        
        // Stop camera
        stopCamera();
    }, 'image/jpeg', 0.8);
}

// Speech recognition functionality
function initializeSpeechRecognition() {
    const speechModal = document.getElementById('speechModal');
    if (!speechModal) return;

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        console.warn('Speech recognition not supported');
        // Hide speech input buttons if not supported
        document.querySelectorAll('[data-bs-target="#speechModal"]').forEach(btn => {
            btn.style.display = 'none';
        });
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();
    
    speechRecognition.continuous = false;
    speechRecognition.interimResults = true;
    speechRecognition.lang = 'en-US';

    const startSpeechBtn = document.getElementById('startSpeechBtn');
    const stopSpeechBtn = document.getElementById('stopSpeechBtn');
    const applySpeechBtn = document.getElementById('applySpeechBtn');
    const speechStatus = document.getElementById('speechStatus');
    const speechResult = document.getElementById('speechResult');
    const speechIcon = document.getElementById('speechIcon');
    
    if (!startSpeechBtn) return;

    startSpeechBtn.addEventListener('click', function() {
        startSpeechRecognition();
    });

    stopSpeechBtn.addEventListener('click', function() {
        stopSpeechRecognition();
    });

    applySpeechBtn.addEventListener('click', function() {
        applySpeechToForm();
    });

    speechRecognition.onstart = function() {
        isRecording = true;
        startSpeechBtn.style.display = 'none';
        stopSpeechBtn.style.display = 'inline-block';
        speechStatus.textContent = 'Listening... Speak clearly';
        speechStatus.className = 'text-primary';
        speechIcon.className = 'bi bi-mic-fill fs-1 text-danger mb-3 speech-indicator';
    };

    speechRecognition.onresult = function(event) {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                transcript += event.results[i][0].transcript;
            }
        }
        
        if (transcript.trim()) {
            speechResult.textContent = transcript;
            applySpeechBtn.disabled = false;
        }
    };

    speechRecognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        speechStatus.textContent = 'Error: ' + event.error;
        speechStatus.className = 'text-danger';
        resetSpeechUI();
    };

    speechRecognition.onend = function() {
        isRecording = false;
        if (speechResult.textContent.trim()) {
            speechStatus.textContent = 'Speech captured successfully';
            speechStatus.className = 'text-success';
        } else {
            speechStatus.textContent = 'No speech detected. Please try again.';
            speechStatus.className = 'text-warning';
        }
        resetSpeechUI();
    };
}

function startSpeechRecognition() {
    if (!speechRecognition) return;
    
    const speechResult = document.getElementById('speechResult');
    speechResult.textContent = 'Speech will appear here...';
    document.getElementById('applySpeechBtn').disabled = true;
    
    try {
        speechRecognition.start();
    } catch (error) {
        console.error('Failed to start speech recognition:', error);
        alert('Failed to start speech recognition. Please try again.');
    }
}

function stopSpeechRecognition() {
    if (speechRecognition && isRecording) {
        speechRecognition.stop();
    }
}

function resetSpeechUI() {
    document.getElementById('startSpeechBtn').style.display = 'inline-block';
    document.getElementById('stopSpeechBtn').style.display = 'none';
    document.getElementById('speechIcon').className = 'bi bi-mic-fill fs-1 text-primary mb-3';
}

function applySpeechToForm() {
    const speechResult = document.getElementById('speechResult');
    const speechField = document.getElementById('speechField');
    const targetFieldId = speechField.value;
    const targetElement = document.getElementById(targetFieldId);
    
    if (targetElement && speechResult.textContent.trim() !== 'Speech will appear here...') {
        targetElement.value = speechResult.textContent.trim();
        
        // Hide modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('speechModal'));
        modal.hide();
        
        // Reset speech UI
        speechResult.textContent = 'Speech will appear here...';
        document.getElementById('applySpeechBtn').disabled = true;
        document.getElementById('speechStatus').textContent = 'Click start to begin voice input';
        document.getElementById('speechStatus').className = 'text-muted';
    }
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