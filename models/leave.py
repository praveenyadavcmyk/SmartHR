from database import db
from datetime import datetime


class Leave(db.Model):
    __tablename__ = "leaves"

    id          = db.Column(db.Integer,     primary_key=True)
    leave_type  = db.Column(db.String(50),  nullable=False)
    start_date  = db.Column(db.Date,        nullable=False)
    end_date    = db.Column(db.Date,        nullable=False)
    reason      = db.Column(db.Text,        nullable=True)
    status      = db.Column(db.String(20),  nullable=False, default="Pending")
    approved_by = db.Column(db.String(100), nullable=True)
    approved_at = db.Column(db.DateTime,    nullable=True)
    created_at  = db.Column(db.DateTime,    default=datetime.utcnow)

    # Foreign Key → employees table
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id"), nullable=False)

    # Relationship back to Employee
    employee = db.relationship("Employee", back_populates="leaves")

    def __repr__(self):
        return f"<Leave Employee:{self.employee_id} Type:{self.leave_type} Status:{self.status}>"

