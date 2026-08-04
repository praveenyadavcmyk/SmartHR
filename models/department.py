from database import db
from datetime import datetime


class Department(db.Model):
    __tablename__ = "departments"

    id              = db.Column(db.Integer,     primary_key=True)
    department_name = db.Column(db.String(100), nullable=False, unique=True)
    description     = db.Column(db.Text,        nullable=True)
    created_at      = db.Column(db.DateTime,    default=datetime.utcnow)

    # One Department → Many Employees
    employees = db.relationship("Employee", back_populates="department")

    def __repr__(self):
        return f"<Department {self.department_name}>"
