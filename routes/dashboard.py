from flask import Blueprint, render_template, request, session, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func
from models import db, Visitor, BusEntry, Authority, Notification

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@dashboard_bp.route('/')
@login_required
def index():
    # Get statistics for today
    today = datetime.now().date()
    
    # Visitor statistics
    today_visitors = Visitor.query.filter(
        func.date(Visitor.entry_time) == today
    ).count()
    
    pending_visitors = Visitor.query.filter_by(status='pending').count()
    
    active_visitors = Visitor.query.filter(
        Visitor.status.in_(['approved', 'pending']),
        Visitor.exit_time.is_(None)
    ).count()
    
    # Vehicle statistics
    today_vehicles = BusEntry.query.filter(
        func.date(BusEntry.entry_time) == today
    ).count()
    
    active_vehicles = BusEntry.query.filter_by(status='entered').count()
    
    # Recent activity
    recent_visitors = Visitor.query.order_by(Visitor.entry_time.desc()).limit(5).all()
    recent_vehicles = BusEntry.query.order_by(BusEntry.entry_time.desc()).limit(5).all()
    
    # Get weekly data for chart
    week_data = []
    for i in range(7):
        date = today - timedelta(days=i)
        visitors_count = Visitor.query.filter(
            func.date(Visitor.entry_time) == date
        ).count()
        vehicles_count = BusEntry.query.filter(
            func.date(BusEntry.entry_time) == date
        ).count()
        
        week_data.append({
            'date': date.strftime('%Y-%m-%d'),
            'visitors': visitors_count,
            'vehicles': vehicles_count
        })
    
    week_data.reverse()  # Show chronological order
    
    stats = {
        'today_visitors': today_visitors,
        'pending_visitors': pending_visitors,
        'active_visitors': active_visitors,
        'today_vehicles': today_vehicles,
        'active_vehicles': active_vehicles
    }
    
    return render_template('dashboard/index.html', 
                         stats=stats, 
                         recent_visitors=recent_visitors,
                         recent_vehicles=recent_vehicles,
                         week_data=week_data)

@dashboard_bp.route('/reports')
@login_required
def reports():
    # Get filter parameters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    report_type = request.args.get('type', 'visitors')
    
    # Set default date range (last 30 days)
    if not start_date:
        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
    if not end_date:
        end_date = datetime.now().strftime('%Y-%m-%d')
    
    # Convert to datetime objects
    start_dt = datetime.strptime(start_date, '%Y-%m-%d')
    end_dt = datetime.strptime(end_date, '%Y-%m-%d') + timedelta(days=1)
    
    if report_type == 'visitors':
        # Visitor reports
        visitors = Visitor.query.filter(
            Visitor.entry_time.between(start_dt, end_dt)
        ).order_by(Visitor.entry_time.desc()).all()
        
        # Status breakdown
        status_counts = db.session.query(
            Visitor.status, func.count(Visitor.id)
        ).filter(
            Visitor.entry_time.between(start_dt, end_dt)
        ).group_by(Visitor.status).all()
        
        return render_template('dashboard/visitor_reports.html',
                             visitors=visitors,
                             status_counts=status_counts,
                             start_date=start_date,
                             end_date=end_date)
    
    else:
        # Vehicle/Bus reports
        vehicles = BusEntry.query.filter(
            BusEntry.entry_time.between(start_dt, end_dt)
        ).order_by(BusEntry.entry_time.desc()).all()
        
        # Type breakdown
        type_counts = db.session.query(
            BusEntry.vehicle_type, func.count(BusEntry.id)
        ).filter(
            BusEntry.entry_time.between(start_dt, end_dt)
        ).group_by(BusEntry.vehicle_type).all()
        
        return render_template('dashboard/vehicle_reports.html',
                             vehicles=vehicles,
                             type_counts=type_counts,
                             start_date=start_date,
                             end_date=end_date)

@dashboard_bp.route('/api/stats')
@login_required
def api_stats():
    """API endpoint for real-time dashboard stats"""
    today = datetime.now().date()
    
    stats = {
        'today_visitors': Visitor.query.filter(func.date(Visitor.entry_time) == today).count(),
        'pending_visitors': Visitor.query.filter_by(status='pending').count(),
        'active_visitors': Visitor.query.filter(
            Visitor.status.in_(['approved', 'pending']),
            Visitor.exit_time.is_(None)
        ).count(),
        'today_vehicles': BusEntry.query.filter(func.date(BusEntry.entry_time) == today).count(),
        'active_vehicles': BusEntry.query.filter_by(status='entered').count(),
        'last_updated': datetime.now().isoformat()
    }
    
    return jsonify(stats)