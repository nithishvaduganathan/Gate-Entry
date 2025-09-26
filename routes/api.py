from flask import Blueprint, request, jsonify, session
from datetime import datetime
from models import db, Visitor, BusEntry, Authority, Notification

api_bp = Blueprint('api', __name__, url_prefix='/api')

def api_login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({'error': 'Authentication required'}), 401
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@api_bp.route('/visitors', methods=['GET'])
@api_login_required
def get_visitors():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    
    query = Visitor.query
    
    if status:
        query = query.filter_by(status=status)
    
    visitors = query.order_by(Visitor.entry_time.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'visitors': [{
            'id': v.id,
            'name': v.name,
            'phone': v.phone,
            'email': v.email,
            'purpose': v.purpose,
            'status': v.status,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None,
            'exit_time': v.exit_time.isoformat() if v.exit_time else None,
            'authority_name': v.authority.name if v.authority else None
        } for v in visitors.items],
        'total': visitors.total,
        'pages': visitors.pages,
        'current_page': visitors.page
    })

@api_bp.route('/vehicles', methods=['GET'])
@api_login_required
def get_vehicles():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    vehicle_type = request.args.get('type')
    
    query = BusEntry.query
    
    if vehicle_type:
        query = query.filter_by(vehicle_type=vehicle_type)
    
    vehicles = query.order_by(BusEntry.entry_time.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'vehicles': [{
            'id': v.id,
            'bus_number': v.bus_number,
            'driver_name': v.driver_name,
            'driver_phone': v.driver_phone,
            'vehicle_type': v.vehicle_type,
            'status': v.status,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None,
            'exit_time': v.exit_time.isoformat() if v.exit_time else None,
            'route': v.route,
            'passenger_count': v.passenger_count
        } for v in vehicles.items],
        'total': vehicles.total,
        'pages': vehicles.pages,
        'current_page': vehicles.page
    })

@api_bp.route('/authorities', methods=['GET'])
@api_login_required
def get_authorities():
    authorities = Authority.query.filter_by(is_active=True).order_by(Authority.name).all()
    
    return jsonify({
        'authorities': [{
            'id': a.id,
            'name': a.name,
            'designation': a.designation,
            'department': a.department,
            'email': a.email,
            'phone': a.phone
        } for a in authorities]
    })

@api_bp.route('/notifications', methods=['GET'])
@api_login_required
def get_notifications():
    user_role = session.get('role')
    
    if user_role != 'admin':
        return jsonify({'error': 'Access denied'}), 403
    
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    
    query = Notification.query
    
    if unread_only:
        query = query.filter_by(is_read=False)
    
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    
    return jsonify({
        'notifications': [{
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'type': n.type,
            'is_read': n.is_read,
            'created_at': n.created_at.isoformat(),
            'visitor_name': n.visitor.name if n.visitor else None,
            'authority_name': n.authority.name if n.authority else None
        } for n in notifications]
    })

@api_bp.route('/notifications/<notification_id>/mark-read', methods=['POST'])
@api_login_required
def mark_notification_read(notification_id):
    notification = Notification.query.get_or_404(notification_id)
    notification.is_read = True
    db.session.commit()
    
    return jsonify({'success': True})

@api_bp.route('/search', methods=['GET'])
@api_login_required
def search():
    query = request.args.get('q', '')
    search_type = request.args.get('type', 'all')  # all, visitors, vehicles
    
    if not query:
        return jsonify({'error': 'Search query is required'}), 400
    
    results = {}
    
    if search_type in ['all', 'visitors']:
        visitors = Visitor.query.filter(
            (Visitor.name.contains(query)) |
            (Visitor.phone.contains(query)) |
            (Visitor.email.contains(query))
        ).limit(10).all()
        
        results['visitors'] = [{
            'id': v.id,
            'name': v.name,
            'phone': v.phone,
            'email': v.email,
            'status': v.status,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None
        } for v in visitors]
    
    if search_type in ['all', 'vehicles']:
        vehicles = BusEntry.query.filter(
            (BusEntry.bus_number.contains(query)) |
            (BusEntry.driver_name.contains(query))
        ).limit(10).all()
        
        results['vehicles'] = [{
            'id': v.id,
            'bus_number': v.bus_number,
            'driver_name': v.driver_name,
            'vehicle_type': v.vehicle_type,
            'status': v.status,
            'entry_time': v.entry_time.isoformat() if v.entry_time else None
        } for v in vehicles]
    
    return jsonify(results)