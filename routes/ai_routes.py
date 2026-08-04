# routes/ai_routes.py

import os
import math
import numpy as np

from datetime import datetime, date

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
    get_jwt_identity,
)

from database import db
from models import Employee, Attendance, Leave


# ============================================================
# OPTIONAL FACE RECOGNITION IMPORT
# ============================================================

try:
    import face_recognition
    FACE_RECOGNITION_AVAILABLE = True
except ImportError:
    face_recognition = None
    FACE_RECOGNITION_AVAILABLE = False
    print(
        "WARNING: face_recognition is not installed. "
        "Face check-in/out will be unavailable."
    )


ai_bp = Blueprint("ai", __name__)


# ============================================================
# COMPANY CONFIG
# ============================================================

OFFICE_LATITUDE = 26.8467
OFFICE_LONGITUDE = 80.9462
OFFICE_RADIUS_M = 100
LATE_CUTOFF_HOUR = 9


# ============================================================
# AUTH HELPERS
# ============================================================

def get_role_and_id():
    identity = get_jwt_identity()
    role = get_jwt().get("role")

    try:
        user_id = int(identity.split("_")[1])
    except (AttributeError, IndexError, ValueError):
        return role, None

    return role, user_id


def admin_only():
    if get_jwt().get("role") != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    return None


# ============================================================
# HAVERSINE DISTANCE
# ============================================================

def haversine_distance(lat1, lon1, lat2, lon2):
    radius = 6371000

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)

    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    value = (
        math.sin(delta_phi / 2) ** 2
        + math.cos(phi1)
        * math.cos(phi2)
        * math.sin(delta_lambda / 2) ** 2
    )

    c = 2 * math.atan2(
        math.sqrt(value),
        math.sqrt(1 - value)
    )

    return radius * c


# ============================================================
# FACE VERIFICATION
# ============================================================

def verify_face(uploaded_image_path, stored_encoding_path):

    if not FACE_RECOGNITION_AVAILABLE:
        return False, None

    if (
        not stored_encoding_path
        or not os.path.exists(stored_encoding_path)
    ):
        return False, None

    try:
        stored_encoding = np.load(stored_encoding_path)

        image = face_recognition.load_image_file(
            uploaded_image_path
        )

        encodings = face_recognition.face_encodings(image)

        if not encodings:
            return False, None

        uploaded_encoding = encodings[0]

        matches = face_recognition.compare_faces(
            [stored_encoding],
            uploaded_encoding,
            tolerance=0.6
        )

        distances = face_recognition.face_distance(
            [stored_encoding],
            uploaded_encoding
        )

        return (
            bool(matches[0]),
            round(float(distances[0]), 4)
        )

    except Exception as error:
        print("FACE VERIFICATION ERROR:", error)
        return False, None


# ============================================================
# SAVE TEMP IMAGE
# ============================================================

def save_temp_image(file, employee_id, prefix):

    if not file.filename:
        raise ValueError("Invalid image file.")

    if "." not in file.filename:
        raise ValueError(
            "Image file must have an extension."
        )

    extension = (
        file.filename
        .rsplit(".", 1)[1]
        .lower()
    )

    allowed_extensions = {
        "jpg",
        "jpeg",
        "png"
    }

    if extension not in allowed_extensions:
        raise ValueError(
            "Only JPG, JPEG and PNG images are allowed."
        )

    directory = "uploads/faces"

    os.makedirs(
        directory,
        exist_ok=True
    )

    filename = (
        f"{prefix}_{employee_id}_temp.{extension}"
    )

    path = os.path.join(
        directory,
        filename
    )

    file.save(path)

    return path


# ============================================================
# FACE CHECK-IN
# POST /api/ai/attendance/face-checkin
# ============================================================

@ai_bp.route(
    "/attendance/face-checkin",
    methods=["POST"]
)
@jwt_required()
def face_checkin():

    if not FACE_RECOGNITION_AVAILABLE:
        return jsonify({
            "success": False,
            "message":
                "Face recognition is currently unavailable."
        }), 503

    role, user_id = get_role_and_id()

    if role != "employee":
        return jsonify({
            "success": False,
            "message": "Employees only."
        }), 403

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid user identity."
        }), 401

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "Face image is required."
        }), 400

    latitude = request.form.get("latitude")
    longitude = request.form.get("longitude")

    if latitude is None or longitude is None:
        return jsonify({
            "success": False,
            "message":
                "Latitude and longitude are required."
        }), 400

    try:
        latitude = float(latitude)
        longitude = float(longitude)

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Invalid coordinates."
        }), 400

    employee = db.session.get(
        Employee,
        user_id
    )

    if not employee or not employee.is_active:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    today = date.today()

    existing = (
        Attendance.query
        .filter_by(
            employee_id=user_id,
            attendance_date=today
        )
        .first()
    )

    if existing:
        return jsonify({
            "success": False,
            "message": "Already checked in today."
        }), 409

    temp_path = None

    try:
        file = request.files["file"]

        temp_path = save_temp_image(
            file,
            employee.employee_id,
            "checkin"
        )

        face_match, face_distance = verify_face(
            temp_path,
            employee.face_encoding_path
        )

    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    finally:
        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.remove(temp_path)

    if not face_match:
        return jsonify({
            "success": False,
            "message": "Face verification failed.",
            "face_match": False,
            "face_distance": face_distance
        }), 401

    distance_m = haversine_distance(
        latitude,
        longitude,
        OFFICE_LATITUDE,
        OFFICE_LONGITUDE
    )

    if distance_m > OFFICE_RADIUS_M:
        return jsonify({
            "success": False,
            "message":
                f"Outside office radius. "
                f"You are {round(distance_m)}m away. "
                f"Limit: {OFFICE_RADIUS_M}m.",
            "face_match": True,
            "location_verified": False,
            "distance_m": round(distance_m, 1)
        }), 403

    now = datetime.utcnow()

    status = (
        "Late"
        if now.hour >= LATE_CUTOFF_HOUR
        else "Present"
    )

    record = Attendance(
        employee_id=user_id,
        attendance_date=today,
        check_in=now,
        status=status,
        latitude=latitude,
        longitude=longitude,
        location_verified=True,
        face_verified=True,
        created_at=now
    )

    try:
        db.session.add(record)
        db.session.commit()

    except Exception as error:
        db.session.rollback()

        print(
            "FACE CHECK-IN DATABASE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to save attendance."
        }), 500

    return jsonify({
        "success": True,
        "message":
            f"Check-in successful. Status: {status}.",
        "data": {
            "attendance_id": record.id,
            "check_in": str(record.check_in),
            "status": status,
            "face_match": True,
            "face_distance": face_distance,
            "location_verified": True,
            "distance_m": round(distance_m, 1)
        }
    }), 201


# ============================================================
# FACE CHECK-OUT
# POST /api/ai/attendance/face-checkout
# ============================================================

@ai_bp.route(
    "/attendance/face-checkout",
    methods=["POST"]
)
@jwt_required()
def face_checkout():

    if not FACE_RECOGNITION_AVAILABLE:
        return jsonify({
            "success": False,
            "message":
                "Face recognition is currently unavailable."
        }), 503

    role, user_id = get_role_and_id()

    if role != "employee":
        return jsonify({
            "success": False,
            "message": "Employees only."
        }), 403

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid user identity."
        }), 401

    if "file" not in request.files:
        return jsonify({
            "success": False,
            "message": "Face image is required."
        }), 400

    employee = db.session.get(
        Employee,
        user_id
    )

    if not employee or not employee.is_active:
        return jsonify({
            "success": False,
            "message": "Employee not found."
        }), 404

    today = date.today()

    record = (
        Attendance.query
        .filter_by(
            employee_id=user_id,
            attendance_date=today
        )
        .first()
    )

    if not record:
        return jsonify({
            "success": False,
            "message":
                "No check-in found for today."
        }), 400

    if record.check_out:
        return jsonify({
            "success": False,
            "message":
                "Already checked out today."
        }), 409

    temp_path = None

    try:
        file = request.files["file"]

        temp_path = save_temp_image(
            file,
            employee.employee_id,
            "checkout"
        )

        face_match, face_distance = verify_face(
            temp_path,
            employee.face_encoding_path
        )

    except ValueError as error:
        return jsonify({
            "success": False,
            "message": str(error)
        }), 400

    finally:
        if (
            temp_path
            and os.path.exists(temp_path)
        ):
            os.remove(temp_path)

    if not face_match:
        return jsonify({
            "success": False,
            "message": "Face verification failed.",
            "face_match": False,
            "face_distance": face_distance
        }), 401

    now = datetime.utcnow()

    delta = now - record.check_in

    working_hours = round(
        delta.total_seconds() / 3600,
        2
    )

    record.check_out = now
    record.working_hours = working_hours
    record.face_verified = True

    try:
        db.session.commit()

    except Exception as error:
        db.session.rollback()

        print(
            "FACE CHECK-OUT DATABASE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Unable to save check-out."
        }), 500

    return jsonify({
        "success": True,
        "message": "Check-out successful.",
        "data": {
            "check_in": str(record.check_in),
            "check_out": str(record.check_out),
            "working_hours": working_hours,
            "face_match": True,
            "face_distance": face_distance
        }
    }), 200


# ============================================================
# AI ANALYTICS OVERVIEW
# GET /api/ai/analytics
# ============================================================

@ai_bp.route("/analytics", methods=["GET"])
@jwt_required()
def ai_analytics():

    error = admin_only()

    if error:
        return error

    today = date.today()

    total_employees = (
        Employee.query
        .filter_by(is_active=True)
        .count()
    )

    total_records = Attendance.query.count()

    present_records = (
        Attendance.query
        .filter(
            Attendance.status.in_(
                ["Present", "Late"]
            )
        )
        .count()
    )

    late_records = (
        Attendance.query
        .filter_by(status="Late")
        .count()
    )

    absent_records = (
        Attendance.query
        .filter_by(status="Absent")
        .count()
    )

    face_verified = (
        Attendance.query
        .filter_by(face_verified=True)
        .count()
    )

    face_failed = max(
        total_records - face_verified,
        0
    )

    face_success_pct = (
        round(
            face_verified / total_records * 100,
            1
        )
        if total_records
        else 0
    )

    face_failure_pct = (
        round(
            face_failed / total_records * 100,
            1
        )
        if total_records
        else 0
    )

    todays_attendance = (
        Attendance.query
        .filter_by(attendance_date=today)
        .count()
    )

    todays_face_checkins = (
        Attendance.query
        .filter_by(
            attendance_date=today,
            face_verified=True
        )
        .count()
    )

    geofence_violations = (
        Attendance.query
        .filter_by(location_verified=False)
        .count()
    )

    both_verified = (
        Attendance.query
        .filter_by(
            face_verified=True,
            location_verified=True
        )
        .count()
    )

    verification_accuracy = (
        round(
            both_verified / total_records * 100,
            1
        )
        if total_records
        else 0
    )

    pending_leaves = (
        Leave.query
        .filter_by(status="Pending")
        .count()
    )

    approved_leaves = (
        Leave.query
        .filter_by(status="Approved")
        .count()
    )

    rejected_leaves = (
        Leave.query
        .filter_by(status="Rejected")
        .count()
    )

    attendance_rate = (
        round(
            present_records / total_records * 100,
            1
        )
        if total_records
        else 0
    )

    return jsonify({
        "success": True,
        "data": {
            "employees": {
                "total_active": total_employees
            },

            "attendance": {
                "total_records": total_records,
                "present_records": present_records,
                "late_records": late_records,
                "absent_records": absent_records,
                "attendance_rate": attendance_rate,
                "today": todays_attendance
            },

            "face_verification": {
                "available":
                    FACE_RECOGNITION_AVAILABLE,
                "verified": face_verified,
                "failed": face_failed,
                "success_percentage":
                    face_success_pct,
                "failure_percentage":
                    face_failure_pct,
                "today_verified":
                    todays_face_checkins
            },

            "geofence": {
                "violations":
                    geofence_violations,
                "both_verified":
                    both_verified,
                "verification_accuracy":
                    verification_accuracy
            },

            "leaves": {
                "pending": pending_leaves,
                "approved": approved_leaves,
                "rejected": rejected_leaves
            }
        }
    }), 200


# ============================================================
# EMPLOYEE PERFORMANCE
# GET /api/ai/performance
# ============================================================

@ai_bp.route("/performance", methods=["GET"])
@jwt_required()
def employee_performance():

    error = admin_only()

    if error:
        return error

    employees = (
        Employee.query
        .filter_by(is_active=True)
        .all()
    )

    result = []

    for employee in employees:

        records = (
            Attendance.query
            .filter_by(
                employee_id=employee.id
            )
            .all()
        )

        total_records = len(records)

        present_days = sum(
            1
            for record in records
            if record.status in (
                "Present",
                "Late"
            )
        )

        late_days = sum(
            1
            for record in records
            if record.status == "Late"
        )

        absent_days = sum(
            1
            for record in records
            if record.status == "Absent"
        )

        total_hours = sum(
            float(record.working_hours or 0)
            for record in records
        )

        average_hours = (
            round(
                total_hours / present_days,
                2
            )
            if present_days
            else 0
        )

        approved_leaves = (
            Leave.query
            .filter_by(
                employee_id=employee.id,
                status="Approved"
            )
            .count()
        )

        attendance_percentage = (
            round(
                present_days
                / total_records
                * 100,
                1
            )
            if total_records
            else 0
        )

        attendance_score = (
            attendance_percentage * 0.50
        )

        hours_score = (
            min(
                average_hours / 8,
                1
            ) * 30
        )

        punctuality_score = max(
            0,
            20 - late_days * 2
        )

        performance_score = round(
            attendance_score
            + hours_score
            + punctuality_score,
            1
        )

        if performance_score >= 85:
            category = "Excellent"

        elif performance_score >= 70:
            category = "Good"

        elif performance_score >= 50:
            category = "Average"

        else:
            category = "Needs Improvement"

        if (
            attendance_percentage < 60
            or late_days >= 5
        ):
            risk_level = "High"

        elif (
            attendance_percentage < 80
            or late_days >= 3
        ):
            risk_level = "Medium"

        else:
            risk_level = "Low"

        result.append({
            "id":
                employee.id,

            "employee_id":
                employee.employee_id,

            "name":
                f"{employee.first_name} "
                f"{employee.last_name}",

            "designation":
                employee.designation,

            "present_days":
                present_days,

            "absent_days":
                absent_days,

            "late_days":
                late_days,

            "approved_leaves":
                approved_leaves,

            "average_working_hours":
                average_hours,

            "attendance_percentage":
                attendance_percentage,

            "performance_score":
                performance_score,

            "performance_category":
                category,

            "risk_level":
                risk_level
        })

    result.sort(
        key=lambda employee:
            employee["performance_score"],
        reverse=True
    )

    return jsonify({
        "success": True,
        "message":
            f"Performance analytics generated "
            f"for {len(result)} employee(s).",
        "data": result
    }), 200


# ============================================================
# ATTENDANCE RISK
# GET /api/ai/attendance-risk
# ============================================================

@ai_bp.route(
    "/attendance-risk",
    methods=["GET"]
)
@jwt_required()
def attendance_risk():

    error = admin_only()

    if error:
        return error

    employees = (
        Employee.query
        .filter_by(is_active=True)
        .all()
    )

    result = []

    for employee in employees:

        records = (
            Attendance.query
            .filter_by(
                employee_id=employee.id
            )
            .all()
        )

        total = len(records)

        if total == 0:
            result.append({
                "employee_id":
                    employee.employee_id,

                "name":
                    f"{employee.first_name} "
                    f"{employee.last_name}",

                "attendance_percentage": 0,
                "late_days": 0,
                "absent_days": 0,
                "risk_level": "High",

                "reason":
                    "No attendance records available."
            })

            continue

        present = sum(
            1
            for record in records
            if record.status in (
                "Present",
                "Late"
            )
        )

        late = sum(
            1
            for record in records
            if record.status == "Late"
        )

        absent = sum(
            1
            for record in records
            if record.status == "Absent"
        )

        percentage = round(
            present / total * 100,
            1
        )

        reasons = []

        if percentage < 60:
            risk = "High"
            reasons.append(
                "Very low attendance"
            )

        elif percentage < 80:
            risk = "Medium"
            reasons.append(
                "Attendance below 80%"
            )

        else:
            risk = "Low"

        if late >= 5:
            risk = "High"
            reasons.append(
                "Frequent late arrivals"
            )

        elif late >= 3:
            if risk == "Low":
                risk = "Medium"

            reasons.append(
                "Multiple late arrivals"
            )

        if absent >= 5:
            risk = "High"
            reasons.append(
                "Frequent absences"
            )

        if not reasons:
            reasons.append(
                "Attendance pattern is healthy"
            )

        result.append({
            "employee_id":
                employee.employee_id,

            "name":
                f"{employee.first_name} "
                f"{employee.last_name}",

            "attendance_percentage":
                percentage,

            "late_days":
                late,

            "absent_days":
                absent,

            "risk_level":
                risk,

            "reason":
                ", ".join(reasons)
        })

    risk_order = {
        "High": 0,
        "Medium": 1,
        "Low": 2
    }

    result.sort(
        key=lambda employee:
            risk_order.get(
                employee["risk_level"],
                3
            )
    )

    return jsonify({
        "success": True,
        "message":
            "Attendance risk analysis generated.",
        "data": result
    }), 200