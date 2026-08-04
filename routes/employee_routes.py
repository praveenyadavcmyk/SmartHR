# routes/employee_routes.py
# Employee CRUD APIs — Admin only, JWT protected.

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from database import db
from models import Employee, Department
from auth.utils import hash_password

employee_bp = Blueprint("employee", __name__)


# ── Helper: Admin Only ────────────────────────────────────────
def admin_required():
    """Returns an error response if the logged-in user is not an admin."""
    claims = get_jwt()
    if claims.get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403
    return None


# ── POST /employees — Create Employee ─────────────────────────
@employee_bp.route("/", methods=["POST"])
@jwt_required()
def create_employee():
   
    error = admin_required()

    if error:

        return error
    data = request.get_json() or {}
    print("=" * 50)
    print(data)
    print("=" * 50)


    # Validate required fields
    required = ["employee_id", "first_name", "last_name", "email", "password"]
    if not all(k in data for k in required):
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    # Duplicate checks
    if Employee.query.filter_by(email=data["email"]).first():
        return jsonify({"success": False, "message": "Email already exists."}), 409

    if Employee.query.filter_by(employee_id=data["employee_id"]).first():
        return jsonify({"success": False, "message": "Employee ID already exists."}), 409

    # Validate department if provided
    department_id = data.get("department_id")

    print("Department ID from request:", department_id)

    department = Department.query.filter_by(id=department_id).first()

    print("Department found:", department)

    if department is None:
     return jsonify({
        "success": False,
        "message": "Department not found."
    }), 404

    employee = Employee(
        employee_id     = data["employee_id"],
        first_name      = data["first_name"],
        last_name       = data["last_name"],
        email           = data["email"],
        password        = hash_password(data["password"]),
        gender          = data.get("gender"),
        phone           = data.get("phone"),
        address         = data.get("address"),
        designation     = data.get("designation"),
        employment_type = data.get("employment_type"),
        daily_salary    = data.get("daily_salary"),
        monthly_salary  = data.get("monthly_salary"),
        joining_date    = data.get("joining_date"),
        department_id   = department_id
    )
    try:
      db.session.add(employee)
      db.session.commit()

    except Exception as e:
      db.session.rollback()
      print(e)
      return jsonify({
        "success": False,
        "message": "Database error. Please try again."
    }), 500

    return jsonify({
    "success": True,
    "message": "Employee created successfully.",
    "data": {
        "id": employee.id,
        "employee_id": employee.employee_id
    }
}), 201
    
    

   

# ── GET /employees — List All Employees ───────────────────────
@employee_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_employees():
    error = admin_required()
    if error:
        return error

    employees = Employee.query.filter_by(is_active=True).all()

    result = []
    for emp in employees:
        result.append({
            "id":             emp.id,
            "employee_id":    emp.employee_id,
            "first_name":     emp.first_name,
            "last_name":      emp.last_name,
            "email":          emp.email,
            "phone":          emp.phone,
            "designation":    emp.designation,
            "employment_type":emp.employment_type,
            "department":     emp.department.department_name if emp.department else None,
            "is_active":      emp.is_active,
            "joining_date":   str(emp.joining_date) if emp.joining_date else None,
            "created_at":     str(emp.created_at)
        })

    return jsonify({
        "success": True,
        "message": f"{len(result)} employee(s) found.",
        "data":    result
    }), 200


# ── GET /employees/<id> — Get Single Employee ─────────────────
@employee_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_employee(id):
    error = admin_required()
    if error:
        return error

    emp = Employee.query.get(id)

    if not emp:
        return jsonify({"success": False, "message": "Employee not found."}), 404

    return jsonify({
        "success": True,
        "data": {
            "id":             emp.id,
            "employee_id":    emp.employee_id,
            "first_name":     emp.first_name,
            "last_name":      emp.last_name,
            "email":          emp.email,
            "gender":         emp.gender,
            "phone":          emp.phone,
            "address":        emp.address,
            "designation":    emp.designation,
            "employment_type":emp.employment_type,
            "daily_salary":   str(emp.daily_salary)  if emp.daily_salary  else None,
            "monthly_salary": str(emp.monthly_salary) if emp.monthly_salary else None,
            "joining_date":   str(emp.joining_date)  if emp.joining_date  else None,
            "department":     emp.department.department_name if emp.department else None,
            "is_active":      emp.is_active,
            "created_at":     str(emp.created_at)
        }
    }), 200


# ── PUT /employees/<id> — Update Employee ─────────────────────
@employee_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_employee(id):
    error = admin_required()
    if error:
        return error

    emp = Employee.query.get(id)
    if not emp:
        return jsonify({"success": False, "message": "Employee not found."}), 404

    data = request.get_json() or {}


    # Check email uniqueness only if email is being changed
    new_email = data.get("email")
    if new_email and new_email != emp.email:
        if Employee.query.filter_by(email=new_email).first():
            return jsonify({"success": False, "message": "Email already in use."}), 409

    # Check department exists if being changed
    new_dept = data.get("department_id")
    if new_dept and not Department.query.get(new_dept):
        return jsonify({"success": False, "message": "Department not found."}), 404

    # Update only the fields that were sent
    emp.first_name      = data.get("first_name",      emp.first_name)
    emp.last_name       = data.get("last_name",       emp.last_name)
    emp.email           = data.get("email",           emp.email)
    emp.gender          = data.get("gender",          emp.gender)
    emp.phone           = data.get("phone",           emp.phone)
    emp.address         = data.get("address",         emp.address)
    emp.designation     = data.get("designation",     emp.designation)
    emp.employment_type = data.get("employment_type", emp.employment_type)
    emp.daily_salary    = data.get("daily_salary",    emp.daily_salary)
    emp.monthly_salary  = data.get("monthly_salary",  emp.monthly_salary)
    emp.joining_date    = data.get("joining_date",    emp.joining_date)
    emp.department_id   = data.get("department_id",   emp.department_id)
    emp.is_active       = data.get("is_active",       emp.is_active)

    # Hash new password only if provided
    if data.get("password"):
        emp.password = hash_password(data["password"])

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Employee updated successfully.",
        "data":    {"id": emp.id, "employee_id": emp.employee_id}
    }), 200


# ── DELETE /employees/<id> — Soft Delete Employee ─────────────
@employee_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_employee(id):
    error = admin_required()
    if error:
        return error

    emp = Employee.query.get(id)
    if not emp:
        return jsonify({"success": False, "message": "Employee not found."}), 404

    # Soft delete — set is_active to False instead of removing the row.
    # This preserves attendance, payroll, and leave history.
    emp.is_active = False
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Employee {emp.employee_id} deactivated successfully."
    }), 200

