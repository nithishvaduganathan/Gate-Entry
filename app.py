from flask import Flask, render_template, redirect, url_for, session, request, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
from datetime import datetime, timedelta
import uuid
import logging

from models import db, User, Visitor, Authority, BusEntry, Notification
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Initialize database
    db.init_app(app)
    
    # Import routes
    from routes.auth import auth_bp
    from routes.visitor import visitor_bp
    from routes.vehicle import vehicle_bp
    from routes.authority import authority_bp
    from routes.dashboard import dashboard_bp
    from routes.api import api_bp
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(visitor_bp)
    app.register_blueprint(vehicle_bp)
    app.register_blueprint(authority_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(api_bp)
    
    # Create tables
    with app.app_context():
        db.create_all()
        
        # Create default admin user if not exists
        admin_user = User.query.filter_by(username='admin').first()
        if not admin_user:
            admin_user = User(
                username='admin',
                password=generate_password_hash('admin123'),
                role='admin'
            )
            db.session.add(admin_user)
            db.session.commit()
    
    @app.route('/')
    def index():
        if 'user_id' not in session:
            return redirect(url_for('auth.login'))
        
        user = User.query.get(session['user_id'])
        if not user:
            session.clear()
            return redirect(url_for('auth.login'))
        
        return render_template('index.html', user=user)
    
    @app.context_processor
    def inject_user():
        if 'user_id' in session:
            user = User.query.get(session['user_id'])
            return {'current_user': user}
        return {'current_user': None}
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)