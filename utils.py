import os
import uuid
from werkzeug.utils import secure_filename
from flask import current_app

def allowed_file(filename):
    """Check if file extension is allowed"""
    if not filename:
        return False
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']

def save_uploaded_file(file, folder):
    """Save uploaded file and return the file path"""
    if not file or not allowed_file(file.filename):
        return None
    
    # Generate unique filename
    filename = secure_filename(file.filename)
    name, ext = os.path.splitext(filename)
    unique_filename = f"{name}_{uuid.uuid4().hex[:8]}{ext}"
    
    # Create directory if it doesn't exist
    upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], folder)
    os.makedirs(upload_path, exist_ok=True)
    
    # Save file
    file_path = os.path.join(upload_path, unique_filename)
    file.save(file_path)
    
    # Return relative path for database storage
    return f"/static/uploads/{folder}/{unique_filename}"

def format_datetime(dt):
    """Format datetime for display"""
    if not dt:
        return 'N/A'
    return dt.strftime('%Y-%m-%d %H:%M:%S')

def get_status_badge_class(status):
    """Return Bootstrap badge class for status"""
    status_classes = {
        'pending': 'badge-warning',
        'approved': 'badge-success', 
        'rejected': 'badge-danger',
        'exited': 'badge-secondary',
        'entered': 'badge-info'
    }
    return status_classes.get(status, 'badge-secondary')