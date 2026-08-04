# routes/payroll_routes.py
# Payroll APIs: Create, View, Update, Delete. Admin only.

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from database import db
from models import Payroll, Employee

payroll_bp = Blueprint("payroll", __name__)


# ── Helper ────────────────────────────────────────────────────

def admin_only():
    """Return error response if user is not admin."""
    if get_jwt().get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403
    return None


def calculate_salaries(daily_salary, present_days, bonus, overtime_amount, deduction):
    """
    Gross Salary = Daily Salary × Present Days
    Net Salary   = Gross + Bonus + Overtime - Deduction
    """
    gross = float(daily_salary or 0) * int(present_days or 0)
    net   = gross + float(bonus or 0) + float(overtime_amount or 0) - float(deduction or 0)
    return round(gross, 2), round(net, 2)


# ── POST /payroll — Create Payroll ────────────────────────────
@payroll_bp.route("/", methods=["POST"])
@jwt_required()
def create_payroll():
    error = admin_only()
    if error:
        return error

    data = request.get_json() or {}

    # Validate required fields
    required = ["employee_id", "payroll_month", "payroll_year", "present_days"]
    if not all(k in data for k in required):
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    # Validate month and year ranges
    month = int(data["payroll_month"])
    year  = int(data["payroll_year"])
    if not (1 <= month <= 12):
        return jsonify({"success": False, "message": "Month must be between 1 and 12."}), 400
    if year < 2000:
        return jsonify({"success": False, "message": "Invalid payroll year."}), 400

    # Confirm employee exists
    employee = Employee.query.get(data["employee_id"])
    if not employee or not employee.is_active:
        return jsonify({"success": False, "message": "Employee not found or inactive."}), 404

    # Prevent duplicate payroll for same employee + month + year
    existing = Payroll.query.filter_by(
        employee_id   = data["employee_id"],
        payroll_month = month,
        payroll_year  = year
    ).first()
    if existing:
        return jsonify({"success": False, "message": "Payroll already exists for this month."}), 409

    # Pull optional fields with defaults
    present_days    = int(data.get("present_days", 0))
    working_days    = int(data.get("working_days", 0))
    absent_days     = int(data.get("absent_days",  0))
    leave_days      = int(data.get("leave_days",   0))
    overtime_hours  = float(data.get("overtime_hours",  0))
    overtime_amount = float(data.get("overtime_amount", 0))
    bonus           = float(data.get("bonus",      0))
    deduction       = float(data.get("deduction",  0))

    gross_salary, net_salary = calculate_salaries(
        employee.daily_salary, present_days, bonus, overtime_amount, deduction
    )

    payroll = Payroll(
        employee_id     = employee.id,
        payroll_month   = month,
        payroll_year    = year,
        working_days    = working_days,
        present_days    = present_days,
        absent_days     = absent_days,
        leave_days      = leave_days,
        overtime_hours  = overtime_hours,
        overtime_amount = overtime_amount,
        bonus           = bonus,
        deduction       = deduction,
        gross_salary    = gross_salary,
        net_salary      = net_salary,
        payment_status  = data.get("payment_status", "Pending"),
        payment_date    = data.get("payment_date"),
        remarks         = data.get("remarks")
    )

    db.session.add(payroll)
    try:
        db.session.commit()

    except Exception as e:
        db.session.rollback()

        print("=" * 80)
        print("PAYROLL DATABASE ERROR:")
        print(type(e))
        print(e)
        print("=" * 80)
    
        return jsonify({
           "success": False,
           "message": str(e)
        }), 500


    return jsonify({
    "success": True,
    "message": "Payroll created successfully.",
    "data": {
        "id": payroll.id,
        "employee_id": payroll.employee_id,
        "month": payroll.payroll_month,
        "year": payroll.payroll_year,
        "gross_salary": str(payroll.gross_salary),
        "net_salary": str(payroll.net_salary)
    }
}), 201
    


# ── GET /payroll — Admin: All Payroll Records ─────────────────
@payroll_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_payroll():
    error = admin_only()
    if error:
        return error

    records = Payroll.query.order_by(
        Payroll.payroll_year.desc(),
        Payroll.payroll_month.desc()
    ).all()

    result = []
    for r in records:
        result.append({
            "id":             r.id,
            "employee_id":    r.employee_id,
            "employee_name":  f"{r.employee.first_name} {r.employee.last_name}",
            "month":          r.payroll_month,
            "year":           r.payroll_year,
            "present_days":   r.present_days,
            "gross_salary":   str(r.gross_salary),
            "net_salary":     str(r.net_salary),
            "payment_status": r.payment_status,
            "payment_date":   str(r.payment_date) if r.payment_date else None
        })

    return jsonify({
        "success": True,
        "message": f"{len(result)} payroll record(s) found.",
        "data":    result
    }), 200


# ── GET /payroll/<employee_id> — One Employee's Payroll ───────
@payroll_bp.route("/employee/<int:employee_id>", methods=["GET"])
@jwt_required()
def get_employee_payroll(employee_id):
    error = admin_only()
    if error:
        return error

    employee = Employee.query.get(employee_id)
    if not employee:
        return jsonify({"success": False, "message": "Employee not found."}), 404

    records = Payroll.query.filter_by(employee_id=employee_id)\
                           .order_by(Payroll.payroll_year.desc(),
                                     Payroll.payroll_month.desc()).all()

    result = []
    for r in records:
        result.append({
            "id":             r.id,
            "month":          r.payroll_month,
            "year":           r.payroll_year,
            "working_days":   r.working_days,
            "present_days":   r.present_days,
            "absent_days":    r.absent_days,
            "leave_days":     r.leave_days,
            "overtime_hours": r.overtime_hours,
            "overtime_amount":str(r.overtime_amount),
            "bonus":          str(r.bonus),
            "deduction":      str(r.deduction),
            "gross_salary":   str(r.gross_salary),
            "net_salary":     str(r.net_salary),
            "payment_status": r.payment_status,
            "payment_date":   str(r.payment_date) if r.payment_date else None,
            "remarks":        r.remarks
        })

    return jsonify({
        "success": True,
        "message": f"{len(result)} payroll record(s) found.",
        "employee": {
            "id":          employee.id,
            "employee_id": employee.employee_id,
            "name":        f"{employee.first_name} {employee.last_name}"
        },
        "data": result
    }), 200


# ── PUT /payroll/<payroll_id> — Update Payroll ────────────────
@payroll_bp.route("/<int:payroll_id>", methods=["PUT"])
@jwt_required()
def update_payroll(payroll_id):
    error = admin_only()
    if error:
        return error

    payroll = Payroll.query.get(payroll_id)
    if not payroll:
        return jsonify({"success": False, "message": "Payroll record not found."}), 404

    data =  request.get_json() or {}


    # Update only fields that are sent
    payroll.working_days    = data.get("working_days",    payroll.working_days)
    payroll.present_days    = data.get("present_days",    payroll.present_days)
    payroll.absent_days     = data.get("absent_days",     payroll.absent_days)
    payroll.leave_days      = data.get("leave_days",      payroll.leave_days)
    payroll.overtime_hours  = data.get("overtime_hours",  payroll.overtime_hours)
    payroll.overtime_amount = data.get("overtime_amount", payroll.overtime_amount)
    payroll.bonus           = data.get("bonus",           payroll.bonus)
    payroll.deduction       = data.get("deduction",       payroll.deduction)
    payroll.payment_status  = data.get("payment_status",  payroll.payment_status)
    payroll.payment_date    = data.get("payment_date",    payroll.payment_date)
    payroll.remarks         = data.get("remarks",         payroll.remarks)

    # Recalculate salaries with updated values
    employee = Employee.query.get(payroll.employee_id)
    payroll.gross_salary, payroll.net_salary = calculate_salaries(
        employee.daily_salary,
        payroll.present_days,
        payroll.bonus,
        payroll.overtime_amount,
        payroll.deduction
    )

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Payroll updated successfully.",
        "data": {
            "id":           payroll.id,
            "gross_salary": str(payroll.gross_salary),
            "net_salary":   str(payroll.net_salary),
            "payment_status": payroll.payment_status
        }
    }), 200


# ── DELETE /payroll/<payroll_id> — Delete Payroll ─────────────
@payroll_bp.route("/<int:payroll_id>", methods=["DELETE"])
@jwt_required()
def delete_payroll(payroll_id):
    error = admin_only()
    if error:
        return error

    payroll = Payroll.query.get(payroll_id)
    if not payroll:
        return jsonify({"success": False, "message": "Payroll record not found."}), 404

    # Hard delete — payroll records that are Paid should not be deleted
    if payroll.payment_status == "Paid":
        return jsonify({
            "success": False,
            "message": "Cannot delete a payroll record that has already been paid."
        }), 409

    db.session.delete(payroll)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Payroll record deleted successfully."
    }), 200

