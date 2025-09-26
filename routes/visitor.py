from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime
from models import db, Visitor, Authority, Notification
from utils import allowed_file, save_uploaded_file

visitor_bp = Blueprint('visitor', __name__, url_prefix='/visitor')

def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@visitor_bp.route('/entry', methods=['GET', 'POST'])
@login_required
def entry():
    if request.method == 'POST':
        try:
            # Get form data
            name = request.form['name']
            phone = request.form['phone']
            email = request.form.get('email', '')
            purpose = request.form['purpose']
            authority_id = request.form.get('authority_id', '')
            notes = request.form.get('notes', '')
            
            # Handle photo upload
            photo_url = None
            if 'photo' in request.files:
                file = request.files['photo']
                if file and allowed_file(file.filename):
                    photo_url = save_uploaded_file(file, 'visitors')
            
            # Determine status based on authority selection
            requires_permission = bool(authority_id)
            permission_granted = not requires_permission
            status = 'pending' if requires_permission else 'approved'
            
            # Create visitor record
            visitor = Visitor(
                name=name,
                phone=phone,
                email=email,
                purpose=purpose,
                authority_id=authority_id if authority_id else None,
                photo_url=photo_url,
                status=status,
                authority_permission_granted=permission_granted,
                permission_granted_at=datetime.utcnow() if permission_granted else None,
                created_by=session.get('username', 'System'),
                notes=notes
            )
            
            db.session.add(visitor)
            db.session.commit()
            
            # Create notification if authority is selected
            if authority_id:
                authority = Authority.query.get(authority_id)
                if authority:
                    notification = Notification(
                        visitor_id=visitor.id,
                        authority_id=authority_id,
                        type='visitor_request',
                        title='New Visitor Permission Request',
                        message=f'{name} ({email}) is requesting permission to enter. Purpose: {purpose}'
                    )
                    db.session.add(notification)
                    
                    # Also notify admin if authority is not Principal
                    if authority.designation != 'Principal':
                        admin_authority = Authority.query.filter_by(designation='Principal').first()
                        if admin_authority:
                            admin_notification = Notification(
                                visitor_id=visitor.id,
                                authority_id=admin_authority.id,
                                type='visitor_request',
                                title='New Visitor Permission Request (Admin Copy)',
                                message=f'{name} ({email}) is requesting permission to enter. Purpose: {purpose}. Assigned to: {authority.name}'
                            )
                            db.session.add(admin_notification)
                    
                    db.session.commit()
            
            flash('Visitor registered successfully!', 'success')
            return redirect(url_for('visitor.entry'))
            
        except Exception as e:
            flash(f'Error registering visitor: {str(e)}', 'error')
    
    # Get authorities for dropdown
    authorities = Authority.query.filter_by(is_active=True).order_by(Authority.name).all()
    return render_template('visitor/entry.html', authorities=authorities)

@visitor_bp.route('/exit', methods=['GET', 'POST'])
@login_required
def exit():
    if request.method == 'POST':
        visitor_id = request.form['visitor_id']
        visitor = Visitor.query.get(visitor_id)
        
        if visitor and visitor.status != 'exited':
            visitor.exit_time = datetime.utcnow()
            visitor.status = 'exited'
            db.session.commit()
            flash(f'Visitor {visitor.name} has been marked as exited.', 'success')
        else:
            flash('Visitor not found or already exited.', 'error')
        
        return redirect(url_for('visitor.exit'))
    
    # Get active visitors for exit
    active_visitors = Visitor.query.filter(
        Visitor.status.in_(['approved', 'pending']),
        Visitor.exit_time.is_(None)
    ).order_by(Visitor.entry_time.desc()).all()
    
    return render_template('visitor/exit.html', visitors=active_visitors)

@visitor_bp.route('/list')
@login_required
def list():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    status_filter = request.args.get('status', '')
    
    query = Visitor.query
    
    if search:
        query = query.filter(
            (Visitor.name.contains(search)) |
            (Visitor.phone.contains(search)) |
            (Visitor.email.contains(search))
        )
    
    if status_filter:
        query = query.filter(Visitor.status == status_filter)
    
    visitors = query.order_by(Visitor.entry_time.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('visitor/list.html', visitors=visitors, search=search, status_filter=status_filter)