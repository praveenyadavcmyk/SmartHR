from database import db
from datetime import datetime
from sqlalchemy import Numeric


class Employee(db.Model):
    __tablename__ = "employees"

    id                = db.Column(db.Integer,     primary_key=True)
    employee_id       = db.Column(db.String(20),  nullable=False, unique=True)
    first_name        = db.Column(db.String(50),  nullable=False)
    last_name         = db.Column(db.String(50),  nullable=False)
    gender            = db.Column(db.String(10),  nullable=True)
    date_of_birth     = db.Column(db.Date,        nullable=True)
    phone             = db.Column(db.String(20),  nullable=True,  unique=True)
    email             = db.Column(db.String(120), nullable=False, unique=True)
    password          = db.Column(db.String(255), nullable=False)
    address           = db.Column(db.Text,        nullable=True)
    joining_date      = db.Column(db.Date,        nullable=True)
    designation       = db.Column(db.String(100), nullable=True)
    employment_type   = db.Column(db.String(50),  nullable=True)
    daily_salary      = db.Column(Numeric(10, 2), nullable=True)
    monthly_salary    = db.Column(Numeric(10, 2), nullable=True)
    profile_image     = db.Column(db.String(255), nullable=True)
    face_encoding_path= db.Column(db.String(255), nullable=True)
    latitude          = db.Column(db.Float,       nullable=True)
    longitude         = db.Column(db.Float,       nullable=True)
    is_active         = db.Column(db.Boolean,     nullable=False, default=True)
    created_at        = db.Column(db.DateTime,    default=datetime.utcnow)

    # Foreign Key → departments table
    department_id = db.Column(db.Integer, db.ForeignKey("departments.id"), nullable=True)

    # Relationships
    department  = db.relationship("Department",  back_populates="employees")
    attendances = db.relationship("Attendance",  back_populates="employee")
    leaves      = db.relationship("Leave",       back_populates="employee")
    payrolls    = db.relationship("Payroll",     back_populates="employee")

    def __repr__(self):
        return f"<Employee {self.employee_id} - {self.first_name} {self.last_name}>"

