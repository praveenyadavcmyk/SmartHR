from database import db
from datetime import datetime
from sqlalchemy import Numeric


class Payroll(db.Model):
    __tablename__ = "payroll"

    id              = db.Column(db.Integer,     primary_key=True)
    payroll_month   = db.Column(db.Integer,     nullable=False)
    payroll_year    = db.Column(db.Integer,     nullable=False)
    working_days    = db.Column(db.Integer,     nullable=True)
    present_days    = db.Column(db.Integer,     nullable=True)
    absent_days     = db.Column(db.Integer,     nullable=True)
    leave_days      = db.Column(db.Integer,     nullable=True)
    overtime_hours  = db.Column(db.Float,       nullable=True, default=0)
    overtime_amount = db.Column(Numeric(10, 2), nullable=True, default=0)
    bonus           = db.Column(Numeric(10, 2), nullable=True, default=0)
    deduction       = db.Column(Numeric(10, 2), nullable=True, default=0)
    gross_salary    = db.Column(Numeric(10, 2), nullable=False)
    net_salary      = db.Column(Numeric(10, 2), nullable=False)
    payment_status  = db.Column(db.String(20),  nullable=False, default="Pending")
    payment_date    = db.Column(db.Date,        nullable=True)
    remarks         = db.Column(db.Text,        nullable=True)
    created_at      = db.Column(db.DateTime,    default=datetime.utcnow)

    # Foreign Key → employees table
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=False)

    # Relationship back to Employee
    employee = db.relationship("Employee", back_populates="payrolls")

    def __repr__(self):
        return f"<Payroll Employee:{self.employee_id} {self.payroll_month}/{self.payroll_year}>"

