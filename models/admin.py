from database import db
from datetime import datetime


class Admin(db.Model):
    __tablename__ = "admins"

    id         = db.Column(db.Integer, primary_key=True)
    username   = db.Column(db.String(50),  nullable=False, unique=True)
    email      = db.Column(db.String(120), nullable=False, unique=True)
    password   = db.Column(db.String(255), nullable=False)
    full_name  = db.Column(db.String(100), nullable=False)
    role       = db.Column(db.String(50),  nullable=False, default="admin")
    is_active  = db.Column(db.Boolean,     nullable=False, default=True)
    created_at = db.Column(db.DateTime,    default=datetime.utcnow)

    def __repr__(self):
        return f"<Admin {self.username}>"
