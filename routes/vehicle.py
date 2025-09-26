from flask import Blueprint, render_template, request, redirect, url_for, session, flash
from datetime import datetime
from models import db, BusEntry

vehicle_bp = Blueprint('vehicle', __name__, url_prefix='/vehicle')

def login_required(f):
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

@vehicle_bp.route('/entry', methods=['GET', 'POST'])
@login_required
def entry():
    if request.method == 'POST':
        try:
            vehicle_number = request.form['vehicle_number']
            driver_name = request.form.get('driver_name', '')
            driver_phone = request.form.get('driver_phone', '')
            route = request.form.get('route', '')
            passenger_count = request.form.get('passenger_count', 0, type=int)
            notes = request.form.get('notes', '')
            vehicle_type = request.form.get('vehicle_type', 'vehicle')
            
            # Create vehicle entry record
            vehicle_entry = BusEntry(
                bus_number=vehicle_number,
                driver_name=driver_name,
                driver_phone=driver_phone,
                route=route,
                passenger_count=passenger_count,
                vehicle_type=vehicle_type,
                status='entered',
                created_by=session.get('username', 'System'),
                notes=notes
            )
            
            db.session.add(vehicle_entry)
            db.session.commit()
            
            flash(f'{vehicle_type.title()} entry registered successfully!', 'success')
            return redirect(url_for('vehicle.entry'))
            
        except Exception as e:
            flash(f'Error registering {vehicle_type}: {str(e)}', 'error')
    
    return render_template('vehicle/entry.html')

@vehicle_bp.route('/exit', methods=['GET', 'POST'])
@login_required
def exit():
    if request.method == 'POST':
        vehicle_id = request.form['vehicle_id']
        vehicle = BusEntry.query.get(vehicle_id)
        
        if vehicle and vehicle.status != 'exited':
            vehicle.exit_time = datetime.utcnow()
            vehicle.status = 'exited'
            db.session.commit()
            flash(f'{vehicle.vehicle_type.title()} {vehicle.bus_number} has been marked as exited.', 'success')
        else:
            flash('Vehicle not found or already exited.', 'error')
        
        return redirect(url_for('vehicle.exit'))
    
    # Get active vehicles for exit
    active_vehicles = BusEntry.query.filter_by(status='entered').order_by(BusEntry.entry_time.desc()).all()
    
    return render_template('vehicle/exit.html', vehicles=active_vehicles)

@vehicle_bp.route('/list')
@login_required
def list():
    page = request.args.get('page', 1, type=int)
    search = request.args.get('search', '')
    vehicle_type = request.args.get('type', '')
    
    query = BusEntry.query
    
    if search:
        query = query.filter(
            (BusEntry.bus_number.contains(search)) |
            (BusEntry.driver_name.contains(search))
        )
    
    if vehicle_type:
        query = query.filter(BusEntry.vehicle_type == vehicle_type)
    
    vehicles = query.order_by(BusEntry.entry_time.desc()).paginate(
        page=page, per_page=20, error_out=False
    )
    
    return render_template('vehicle/list.html', vehicles=vehicles, search=search, vehicle_type=vehicle_type)

# Bus-specific routes (using same underlying model but different templates)
@vehicle_bp.route('/bus/entry', methods=['GET', 'POST'])
@login_required
def bus_entry():
    if request.method == 'POST':
        request.form = request.form.copy()
        request.form['vehicle_type'] = 'bus'
        return entry()
    
    return render_template('vehicle/bus_entry.html')

@vehicle_bp.route('/bus/exit', methods=['GET', 'POST'])
@login_required
def bus_exit():
    if request.method == 'POST':
        return exit()
    
    # Get active buses for exit
    active_buses = BusEntry.query.filter_by(status='entered', vehicle_type='bus').order_by(BusEntry.entry_time.desc()).all()
    
    return render_template('vehicle/bus_exit.html', vehicles=active_buses)