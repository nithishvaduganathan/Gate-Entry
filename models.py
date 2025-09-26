from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import uuid

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='user')  # admin, authority, user
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Authority(db.Model):
    __tablename__ = 'authorities'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    designation = db.Column(db.String(50), nullable=False)  # HOD, Principal, Staff
    department = db.Column(db.String(100))
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120))
    role = db.Column(db.String(20), default='staff')  # admin, hod, staff
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    visitors = db.relationship('Visitor', backref='authority', lazy=True)
    notifications = db.relationship('Notification', backref='authority', lazy=True)
    
    def __repr__(self):
        return f'<Authority {self.name}>'

class Visitor(db.Model):
    __tablename__ = 'visitors'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120))
    purpose = db.Column(db.Text, nullable=False)
    photo_url = db.Column(db.String(200))
    entry_time = db.Column(db.DateTime, default=datetime.utcnow)
    exit_time = db.Column(db.DateTime)
    authority_id = db.Column(db.String(36), db.ForeignKey('authorities.id'))
    authority_permission_granted = db.Column(db.Boolean, default=False)
    permission_granted_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')  # pending, approved, rejected, exited
    created_by = db.Column(db.String(100))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    notifications = db.relationship('Notification', backref='visitor', lazy=True)
    
    def __repr__(self):
        return f'<Visitor {self.name}>'

class BusEntry(db.Model):
    __tablename__ = 'bus_entries'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    bus_number = db.Column(db.String(50), nullable=False)
    driver_name = db.Column(db.String(100))
    driver_phone = db.Column(db.String(20))
    entry_time = db.Column(db.DateTime, default=datetime.utcnow)
    exit_time = db.Column(db.DateTime)
    route = db.Column(db.String(100))
    passenger_count = db.Column(db.Integer)
    status = db.Column(db.String(20), default='entered')  # entered, exited
    created_by = db.Column(db.String(100))
    notes = db.Column(db.Text)
    vehicle_type = db.Column(db.String(20), default='bus')  # bus, vehicle
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<BusEntry {self.bus_number}>'

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    visitor_id = db.Column(db.String(36), db.ForeignKey('visitors.id'))
    authority_id = db.Column(db.String(36), db.ForeignKey('authorities.id'))
    type = db.Column(db.String(50), default='visitor_request')
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Notification {self.title}>'