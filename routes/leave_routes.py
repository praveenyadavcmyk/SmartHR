# routes/leave_routes.py
# Leave APIs: Apply, View, Approve, Reject.

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity
from datetime import datetime, date
from database import db
from models import Leave, Employee

leave_bp = Blueprint("leave", __name__)


# ── Helpers ───────────────────────────────────────────────────

def get_role_and_id():
    """Return (role, numeric_id) from the JWT token."""
    identity = get_jwt_identity()           # "employee_7" or "admin_3"
    role     = get_jwt().get("role")
    user_id  = int(identity.split("_")[1])
    return role, user_id


# ── POST /leave/apply — Employee Applies for Leave ────────────
@leave_bp.route("/apply", methods=["POST"])
@jwt_required()
def apply_leave():
    role, user_id = get_role_and_id()

    if role != "employee":
        return jsonify({"success": False, "message": "Employees only."}), 403

    data = request.get_json() or {}


    # Validate required fields
    required = ["leave_type", "start_date", "end_date"]
    if not all(k in data for k in required):
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    # Parse dates
    try:
        start_date = datetime.strptime(data["start_date"], "%Y-%m-%d").date()
        end_date   = datetime.strptime(data["end_date"],   "%Y-%m-%d").date()
    except ValueError:
        return jsonify({"success": False, "message": "Invalid date format. Use YYYY-MM-DD."}), 400

    # End date cannot be before start date
    if end_date < start_date:
        return jsonify({"success": False, "message": "End date cannot be before start date."}), 400

    # Start date cannot be in the past
    if start_date < date.today():
        return jsonify({"success": False, "message": "Start date cannot be in the past."}), 400

    # Check employee exists
    employee = Employee.query.get(user_id)
    if not employee or not employee.is_active:
        return jsonify({"success": False, "message": "Employee not found or inactive."}), 404

    leave = Leave(
        employee_id = user_id,
        leave_type  = data["leave_type"],
        start_date  = start_date,
        end_date    = end_date,
        reason      = data.get("reason"),
        status      = "Pending"
    )
    db.session.add(leave)

    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()

        print("=" * 80)
        print("LEAVE ERROR")
        print(type(e))
        print(e)

        import traceback
        traceback.print_exc()

        print("=" * 80)

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    return jsonify({
    "success": True,
    "message": "Leave application submitted successfully.",
    "data": {
        "id": leave.id,
        "leave_type": leave.leave_type,
        "start_date": str(leave.start_date),
        "end_date": str(leave.end_date),
        "status": leave.status
    }
}), 201


# ── GET /leave — Admin: All Leave Requests ────────────────────
@leave_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_leaves():
    role, _ = get_role_and_id()

    if role != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403

    records = Leave.query.order_by(Leave.created_at.desc()).all()

    result = []
    for r in records:
        result.append({
            "id":           r.id,
            "employee_id":  r.employee_id,
            "employee_name":f"{r.employee.first_name} {r.employee.last_name}",
            "leave_type":   r.leave_type,
            "start_date":   str(r.start_date),
            "end_date":     str(r.end_date),
            "reason":       r.reason,
            "status":       r.status,
            "approved_by":  r.approved_by,
            "approved_at":  str(r.approved_at) if r.approved_at else None,
            "created_at":   str(r.created_at)
        })

    return jsonify({
        "success": True,
        "message": f"{len(result)} leave request(s) found.",
        "data":    result
    }), 200


# ── GET /leave/<employee_id> — Leave History of One Employee ──
@leave_bp.route("/employee/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_employee_leaves(employee_id):
    role, user_id = get_role_and_id()

    # Admin can view any employee; employee can only view their own
    if role == "employee" and user_id != employee_id:
        return jsonify({"success": False, "message": "Access denied."}), 403

    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"success": False, "message": "Employee not found."}), 404

    records = Leave.query.filter_by(employee_id=employee_id)\
                         .order_by(Leave.created_at.desc()).all()

    result = []
    for r in records:
        result.append({
            "id":          r.id,
            "leave_type":  r.leave_type,
            "start_date":  str(r.start_date),
            "end_date":    str(r.end_date),
            "reason":      r.reason,
            "status":      r.status,
            "approved_by": r.approved_by,
            "approved_at": str(r.approved_at) if r.approved_at else None
        })

    return jsonify({
        "success": True,
        "message": f"{len(result)} leave record(s) found.",
        "employee": {
            "id":          employee.id,
            "employee_id": employee.employee_id,
            "name":        f"{employee.first_name} {employee.last_name}"
        },
        "data": result
    }), 200


# ── PUT /leave/<leave_id>/approve — Admin Approves Leave ──────
@leave_bp.route("/<int:leave_id>/approve", methods=["PUT"])
@jwt_required()
def approve_leave(leave_id):
    role, user_id = get_role_and_id()

    if role != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403

    leave = Leave.query.get(leave_id)
    if not leave:
        return jsonify({"success": False, "message": "Leave request not found."}), 404

    # Only Pending leaves can be approved
    if leave.status != "Pending":
        return jsonify({
            "success": False,
            "message": f"Cannot approve. Leave is already '{leave.status}'."
        }), 409

    leave.status      = "Approved"
    leave.approved_by = f"admin_{user_id}"
    leave.approved_at = datetime.utcnow()

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Leave approved successfully.",
        "data": {
            "id":          leave.id,
            "status":      leave.status,
            "approved_by": leave.approved_by,
            "approved_at": str(leave.approved_at)
        }
    }), 200


# ── PUT /leave/<leave_id>/reject — Admin Rejects Leave ────────
@leave_bp.route("/<int:leave_id>/reject", methods=["PUT"])
@jwt_required()
def reject_leave(leave_id):
    role, user_id = get_role_and_id()

    if role != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403

    leave = Leave.query.get(leave_id)
    if not leave:
        return jsonify({"success": False, "message": "Leave request not found."}), 404

    # Only Pending leaves can be rejected
    if leave.status != "Pending":
        return jsonify({
            "success": False,
            "message": f"Cannot reject. Leave is already '{leave.status}'."
        }), 409

    data = request.get_json() or {}

    leave.status      = "Rejected"
    leave.approved_by = f"admin_{user_id}"
    leave.approved_at = datetime.utcnow()
    leave.reason      = data.get("reason", leave.reason)  # optional rejection reason

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Leave rejected successfully.",
        "data": {
            "id":     leave.id,
            "status": leave.status
        }
    }), 200

