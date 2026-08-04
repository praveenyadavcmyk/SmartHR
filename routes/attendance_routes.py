# routes/attendance_routes.py
# Attendance APIs:
# - Employee Check-In
# - Employee Check-Out
# - Admin View All Attendance
# - Admin View Employee Attendance
# - Employee View Own Attendance

from flask import Blueprint, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
    get_jwt_identity
)
from datetime import datetime, date

from database import db
from models import Attendance, Employee


attendance_bp = Blueprint("attendance", __name__)


# ============================================================
# HELPERS
# ============================================================

def get_employee_id_from_token():
    """
    Get employee database ID from JWT.

    Expected JWT identity:
        employee_1
        employee_2
        employee_3
    """

    identity = get_jwt_identity()
    claims = get_jwt()

    # Only employees can use employee attendance actions
    if claims.get("role") != "employee":
        return None, jsonify({
            "success": False,
            "message": "Employee access required."
        }), 403

    try:
        employee_id = int(
            str(identity).split("_")[1]
        )

    except (ValueError, IndexError, AttributeError):
        return None, jsonify({
            "success": False,
            "message": "Invalid employee token."
        }), 401

    return employee_id, None, None


def is_admin():
    """
    Check whether current logged-in user is admin.
    """

    return get_jwt().get("role") == "admin"


# ============================================================
# EMPLOYEE CHECK-IN
# POST /api/attendance/check-in
# ============================================================

@attendance_bp.route("/check-in", methods=["POST"])
@jwt_required()
def check_in():

    employee_id, err_response, status_code = (
        get_employee_id_from_token()
    )

    if err_response:
        return err_response, status_code

    # --------------------------------------------------------
    # Check employee exists
    # --------------------------------------------------------

    employee = db.session.get(
        Employee,
        employee_id
    )

    if not employee:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    if not employee.is_active:
        return jsonify({
            "success": False,
            "message": "Employee account is inactive."
        }), 403

    today = date.today()

    # --------------------------------------------------------
    # Prevent duplicate check-in
    # --------------------------------------------------------

    existing_record = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=today
    ).first()

    if existing_record:

        if existing_record.check_out:
            message = "Attendance already completed for today."
        else:
            message = "Already checked in today."

        return jsonify({
            "success": False,
            "message": message,
            "data": {
                "id": existing_record.id,
                "attendance_date": str(
                    existing_record.attendance_date
                ),
                "check_in": (
                    str(existing_record.check_in)
                    if existing_record.check_in
                    else None
                ),
                "check_out": (
                    str(existing_record.check_out)
                    if existing_record.check_out
                    else None
                ),
                "status": existing_record.status
            }
        }), 409

    now = datetime.utcnow()

    # --------------------------------------------------------
    # Create attendance record
    # --------------------------------------------------------

    record = Attendance(
        employee_id=employee_id,
        attendance_date=today,
        check_in=now,
        status="Present",
        created_at=now
    )

    try:

        db.session.add(record)
        db.session.commit()

    except Exception as e:

        db.session.rollback()

        print(
            "Attendance check-in database error:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Database error. Please try again."
        }), 500

    return jsonify({
        "success": True,
        "message": "Check-in successful.",
        "data": {
            "id": record.id,
            "employee_id": employee_id,
            "employee_code": employee.employee_id,
            "employee_name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ),
            "attendance_date": str(today),
            "check_in": str(record.check_in),
            "check_out": None,
            "working_hours": None,
            "status": record.status
        }
    }), 201


# ============================================================
# EMPLOYEE CHECK-OUT
# POST /api/attendance/check-out
# ============================================================

@attendance_bp.route("/check-out", methods=["POST"])
@jwt_required()
def check_out():

    employee_id, err_response, status_code = (
        get_employee_id_from_token()
    )

    if err_response:
        return err_response, status_code

    employee = db.session.get(
        Employee,
        employee_id
    )

    if not employee:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    if not employee.is_active:
        return jsonify({
            "success": False,
            "message": "Employee account is inactive."
        }), 403

    today = date.today()

    # --------------------------------------------------------
    # Find today's attendance
    # --------------------------------------------------------

    record = Attendance.query.filter_by(
        employee_id=employee_id,
        attendance_date=today
    ).first()

    # --------------------------------------------------------
    # Employee must check in first
    # --------------------------------------------------------

    if not record:

        return jsonify({
            "success": False,
            "message": "Please check in before checking out."
        }), 400

    if not record.check_in:

        return jsonify({
            "success": False,
            "message": "No check-in found for today."
        }), 400

    # --------------------------------------------------------
    # Prevent duplicate checkout
    # --------------------------------------------------------

    if record.check_out:

        return jsonify({
            "success": False,
            "message": "Already checked out today.",
            "data": {
                "check_out": str(record.check_out),
                "working_hours": record.working_hours
            }
        }), 409

    now = datetime.utcnow()

    # --------------------------------------------------------
    # Calculate working hours
    # --------------------------------------------------------

    delta = now - record.check_in

    working_hours = round(
        delta.total_seconds() / 3600,
        2
    )

    record.check_out = now
    record.working_hours = working_hours

    try:

        db.session.commit()

    except Exception as e:

        db.session.rollback()

        print(
            "Attendance check-out database error:",
            e
        )

        return jsonify({
            "success": False,
            "message": "Database error. Please try again."
        }), 500

    return jsonify({
        "success": True,
        "message": "Check-out successful.",
        "data": {
            "id": record.id,
            "employee_id": employee_id,
            "employee_code": employee.employee_id,
            "employee_name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ),
            "attendance_date": str(
                record.attendance_date
            ),
            "check_in": str(record.check_in),
            "check_out": str(record.check_out),
            "working_hours": record.working_hours,
            "status": record.status
        }
    }), 200


# ============================================================
# ADMIN - GET ALL ATTENDANCE
# GET /api/attendance/
# ============================================================

@attendance_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_attendance():

    if not is_admin():

        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    records = (
        Attendance.query
        .order_by(
            Attendance.attendance_date.desc(),
            Attendance.id.desc()
        )
        .all()
    )

    result = []

    for record in records:

        employee = record.employee

        result.append({
            "id": record.id,
            "employee_id": record.employee_id,

            "employee_code": (
                employee.employee_id
                if employee
                else None
            ),

            "employee_name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
                if employee
                else "Unknown Employee"
            ),

            "attendance_date": str(
                record.attendance_date
            ),

            "check_in": (
                str(record.check_in)
                if record.check_in
                else None
            ),

            "check_out": (
                str(record.check_out)
                if record.check_out
                else None
            ),

            "working_hours": record.working_hours,

            "status": record.status,

            "remarks": getattr(
                record,
                "remarks",
                None
            )
        })

    return jsonify({
        "success": True,
        "message": f"{len(result)} record(s) found.",
        "data": result
    }), 200


# ============================================================
# GET ATTENDANCE FOR ONE EMPLOYEE
#
# ADMIN:
# Can view any employee.
#
# EMPLOYEE:
# Can view ONLY their own attendance.
#
# GET /api/attendance/<employee_id>
# ============================================================

@attendance_bp.route(
    "/<int:employee_id>",
    methods=["GET"]
)
@jwt_required()
def get_employee_attendance(employee_id):

    identity = get_jwt_identity()
    claims = get_jwt()

    role = claims.get("role")

    # --------------------------------------------------------
    # AUTHORIZATION
    # --------------------------------------------------------

    if role == "employee":

        try:

            logged_in_employee_id = int(
                str(identity).split("_")[1]
            )

        except (
            ValueError,
            IndexError,
            AttributeError
        ):

            return jsonify({
                "success": False,
                "message": "Invalid employee token."
            }), 401

        # Employee cannot access another employee
        if logged_in_employee_id != employee_id:

            return jsonify({
                "success": False,
                "message": (
                    "You can only view your own "
                    "attendance."
                )
            }), 403

    elif role == "admin":

        # Admin can access any employee
        pass

    else:

        return jsonify({
            "success": False,
            "message": "Unauthorized access."
        }), 403

    # --------------------------------------------------------
    # FIND EMPLOYEE
    # --------------------------------------------------------

    employee = db.session.get(
        Employee,
        employee_id
    )

    if not employee:

        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    # --------------------------------------------------------
    # FETCH ATTENDANCE
    # --------------------------------------------------------

    records = (
        Attendance.query
        .filter_by(
            employee_id=employee_id
        )
        .order_by(
            Attendance.attendance_date.desc(),
            Attendance.id.desc()
        )
        .all()
    )

    result = []

    for record in records:

        result.append({

            "id": record.id,

            "employee_id": employee.id,

            "employee_code": employee.employee_id,

            "employee_name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ),

            "attendance_date": str(
                record.attendance_date
            ),

            "check_in": (
                str(record.check_in)
                if record.check_in
                else None
            ),

            "check_out": (
                str(record.check_out)
                if record.check_out
                else None
            ),

            "working_hours": record.working_hours,

            "status": record.status,

            "remarks": getattr(
                record,
                "remarks",
                None
            )
        })

    return jsonify({

        "success": True,

        "message": (
            f"{len(result)} record(s) found."
        ),

        "employee": {

            "id": employee.id,

            "employee_id": employee.employee_id,

            "name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ),

            "email": employee.email
        },

        "data": result

    }), 200