from database import db
from datetime import datetime


class Attendance(db.Model):
    __tablename__ = "attendance"

    # Prevent duplicate attendance for the same employee on the same day
    __table_args__ = (
        db.UniqueConstraint(
            "employee_id",
            "attendance_date",
            name="unique_employee_attendance"
        ),
    )

    id = db.Column(db.Integer, primary_key=True)

    attendance_date = db.Column(
        db.Date,
        nullable=False,
        default=datetime.utcnow().date
    )

    check_in = db.Column(db.DateTime, nullable=True)
    check_out = db.Column(db.DateTime, nullable=True)
    working_hours = db.Column(db.Float, nullable=True)

    status = db.Column(
        db.String(20),
        nullable=False,
        default="Present"
    )

    latitude = db.Column(db.Float, nullable=True)
    longitude = db.Column(db.Float, nullable=True)

    location_verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    face_verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    remarks = db.Column(db.Text, nullable=True)

    created_at = db.Column(
        db.DateTime,
        default=datetime.utcnow
    )

    # Foreign Key → Employee
    employee_id = db.Column(
        db.Integer,
        db.ForeignKey("employees.id"),
        nullable=False
    )

    # Relationship
    employee = db.relationship(
        "Employee",
        back_populates="attendances"
    )

    def __repr__(self):
        return f"<Attendance Employee:{self.employee_id} Date:{self.attendance_date}>"