from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from datetime import datetime
from models import db, Authority, Visitor, Notification, User
from werkzeug.security import generate_password_hash

authority_bp = Blueprint('authority', __name__, url_prefix='/authority')

def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

def admin_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session or session.get('role') != 'admin':
            flash('Access denied. Admin privileges required.', 'error')
            return redirect(url_for('index'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@authority_bp.route('/list')
@login_required
def list():
    authorities = Authority.query.order_by(Authority.name).all()
    return render_template('authority/list.html', authorities=authorities)

@authority_bp.route('/add', methods=['GET', 'POST'])
@admin_required
def add():
    if request.method == 'POST':
        try:
            # Authority details
            name = request.form['name']
            designation = request.form['designation']
            department = request.form.get('department', '')
            phone = request.form.get('phone', '')
            email = request.form.get('email', '')

            # User account details
            password = request.form['password']
            confirm_password = request.form['confirm_password']

            # Validation
            if not email or not password:
                flash('Email and password are required for the user account.', 'error')
                return render_template('authority/add.html')
            
            if password != confirm_password:
                flash('Passwords do not match.', 'error')
                return render_template('authority/add.html')

            if User.query.filter_by(username=email).first():
                flash('A user with this email already exists.', 'error')
                return render_template('authority/add.html')

            # Create Authority
            authority = Authority(
                name=name,
                designation=designation,
                department=department,
                phone=phone,
                email=email
            )
            db.session.add(authority)

            # Determine User role based on designation
            user_role = 'user'  # Default role
            if designation in ['faculty staff', 'hod', 'principal']:
                user_role = 'authority'
            elif designation == 'admin':
                user_role = 'admin'
            
            # Create User
            user = User(
                username=email,
                password=generate_password_hash(password),
                role=user_role
            )
            db.session.add(user)
            
            db.session.commit()
            
            flash('Authority and user account created successfully!', 'success')
            return redirect(url_for('authority.list'))
            
        except Exception as e:
            db.session.rollback()
            flash(f'Error adding authority: {str(e)}', 'error')
    
    return render_template('authority/add.html')

@authority_bp.route('/edit/<authority_id>', methods=['GET', 'POST'])
@admin_required
def edit(authority_id):
    authority = Authority.query.get_or_404(authority_id)
    
    if request.method == 'POST':
        try:
            authority.name = request.form['name']
            authority.designation = request.form['designation']
            authority.department = request.form.get('department', '')
            authority.phone = request.form.get('phone', '')
            authority.email = request.form.get('email', '')
            authority.is_active = 'is_active' in request.form

            # Update user role as well
            user = User.query.filter_by(username=authority.email).first()
            if user:
                user_role = 'user'  # Default role
                if authority.designation in ['faculty staff', 'hod', 'principal']:
                    user_role = 'authority'
                elif authority.designation == 'admin':
                    user_role = 'admin'
                user.role = user_role
            
            db.session.commit()
            
            flash('Authority updated successfully!', 'success')
            return redirect(url_for('authority.list'))
            
        except Exception as e:
            flash(f'Error updating authority: {str(e)}', 'error')
    
    return render_template('authority/edit.html', authority=authority)

@authority_bp.route('/approvals')
@login_required
def approvals():
    # Get pending notifications for this authority or admin
    user_role = session.get('role')
    
    if user_role == 'admin':
        # Admin can see all notifications
        notifications = Notification.query.filter_by(is_read=False).order_by(Notification.created_at.desc()).all()
    else:
        # Regular users don't have authority access
        notifications = []
    
    return render_template('authority/approvals.html', notifications=notifications)

@authority_bp.route('/approve/<visitor_id>', methods=['POST'])
@login_required
def approve_visitor(visitor_id):
    visitor = Visitor.query.get_or_404(visitor_id)
    
    if visitor.status == 'pending':
        visitor.status = 'approved'
        visitor.authority_permission_granted = True
        visitor.permission_granted_at = datetime.utcnow()
        
        # Mark related notifications as read
        notifications = Notification.query.filter_by(visitor_id=visitor_id).all()
        for notification in notifications:
            notification.is_read = True
        
        db.session.commit()
        
        flash(f'Visitor {visitor.name} has been approved.', 'success')
    else:
        flash('Visitor request is no longer pending.', 'error')
    
    return redirect(url_for('authority.approvals'))

@authority_bp.route('/reject/<visitor_id>', methods=['POST'])
@login_required
def reject_visitor(visitor_id):
    visitor = Visitor.query.get_or_404(visitor_id)
    
    if visitor.status == 'pending':
        visitor.status = 'rejected'
        
        # Mark related notifications as read
        notifications = Notification.query.filter_by(visitor_id=visitor_id).all()
        for notification in notifications:
            notification.is_read = True
        
        db.session.commit()
        
        flash(f'Visitor {visitor.name} has been rejected.', 'success')
    else:
        flash('Visitor request is no longer pending.', 'error')
    
    return redirect(url_for('authority.approvals'))

@authority_bp.route('/notifications')
@login_required
def notifications():
    user_role = session.get('role')
    
    if user_role == 'admin':
        notifications = Notification.query.order_by(Notification.created_at.desc()).all()
    else:
        notifications = []
    
    return render_template('authority/notifications.html', notifications=notifications)
