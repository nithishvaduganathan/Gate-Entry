from flask import Blueprint, render_template, request, redirect, url_for, session, flash, jsonify
from datetime import datetime
from models import db, Authority, Visitor, Notification

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
            name = request.form['name']
            designation = request.form['designation']
            department = request.form.get('department', '')
            phone = request.form.get('phone', '')
            email = request.form.get('email', '')
            role = request.form.get('role', 'staff')
            
            authority = Authority(
                name=name,
                designation=designation,
                department=department,
                phone=phone,
                email=email,
                role=role
            )
            
            db.session.add(authority)
            db.session.commit()
            
            flash('Authority added successfully!', 'success')
            return redirect(url_for('authority.list'))
            
        except Exception as e:
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
            authority.role = request.form.get('role', 'staff')
            authority.is_active = 'is_active' in request.form
            
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