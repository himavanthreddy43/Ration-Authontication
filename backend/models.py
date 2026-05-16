from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class RationShop(db.Model):
    __tablename__ = 'ration_shops'
    
    shop_id = db.Column(db.Integer, primary_key=True)
    shop_name = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(255))
    operator_name = db.Column(db.String(150))
    
    monthly_distributions = db.relationship('MonthlyRation', backref='shop', lazy=True)

class Family(db.Model):
    __tablename__ = 'families'

    family_id = db.Column(db.Integer, primary_key=True)
    ration_card_number = db.Column(db.String(50), unique=True, nullable=False)
    head_of_family_name = db.Column(db.String(150), nullable=False)
    village_name = db.Column(db.String(100))
    phone_number = db.Column(db.String(20))
    address = db.Column(db.Text)
    
    # We delay defining the ForeignKey to FamilyMember here due to mutual dependency in ORM (specify in string format)
    default_face_member = db.Column(db.Integer, db.ForeignKey('family_members.member_id', ondelete='SET NULL'), nullable=True)
    
    family_members_count = db.Column(db.Integer, default=1)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    members = db.relationship('FamilyMember', backref='family', lazy=True, foreign_keys="[FamilyMember.family_id]", cascade='all, delete-orphan')
    monthly_rations = db.relationship('MonthlyRation', backref='family_ref', lazy=True, cascade='all, delete-orphan')
    face_data = db.relationship('FaceData', backref='family_ref', lazy=True, cascade='all, delete-orphan')

class FamilyMember(db.Model):
    __tablename__ = 'family_members'

    member_id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('families.family_id', ondelete='CASCADE'), nullable=False)
    member_name = db.Column(db.String(150), nullable=False)
    gender = db.Column(db.String(10))
    age = db.Column(db.Integer)
    relationship = db.Column(db.String(50))
    is_default_member = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    faces = db.relationship('FaceData', backref='member_ref', lazy=True, cascade='all, delete-orphan')

class FaceData(db.Model):
    __tablename__ = 'face_data'
    
    face_id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey('family_members.member_id', ondelete='CASCADE'), nullable=False)
    family_id = db.Column(db.Integer, db.ForeignKey('families.family_id', ondelete='CASCADE'), nullable=False)
    face_embedding_vector = db.Column(db.Text, nullable=False)  # Stored as JSON string or Base64 string
    face_image_path = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class MonthlyRation(db.Model):
    __tablename__ = 'monthly_ration'
    
    ration_id = db.Column(db.Integer, primary_key=True)
    family_id = db.Column(db.Integer, db.ForeignKey('families.family_id', ondelete='CASCADE'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    received_status = db.Column(db.Boolean, default=False)
    received_by_member_id = db.Column(db.Integer, db.ForeignKey('family_members.member_id', ondelete='SET NULL'), nullable=True)
    received_time = db.Column(db.DateTime, nullable=True)
    shop_id = db.Column(db.Integer, db.ForeignKey('ration_shops.shop_id', ondelete='SET NULL'), nullable=True)
    admin_override = db.Column(db.Boolean, default=False)
    
    __table_args__ = (
        db.UniqueConstraint('family_id', 'month', 'year', name='uq_family_month_year'),
    )

class FailedScanLog(db.Model):
    __tablename__ = 'failed_scan_logs'
    
    log_id = db.Column(db.Integer, primary_key=True)
    image_path = db.Column(db.String(255), nullable=True)
    reason = db.Column(db.String(255))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
