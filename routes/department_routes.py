# routes/department_routes.py
# Department APIs: Create, View, Update, Delete. Admin only.

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt

from database import db
from models import Department, Employee


department_bp = Blueprint("department", __name__)


# ============================================================
# ADMIN ONLY HELPER
# ============================================================

def admin_only():
    if get_jwt().get("role") != "admin":
        return jsonify({
            "success": False,
            "message": "Admin access required."
        }), 403

    return None


# ============================================================
# CREATE DEPARTMENT
# POST /api/departments/
# ============================================================

@department_bp.route("/", methods=["POST"])
@jwt_required()
def create_department():

    error = admin_only()

    if error:
        return error

    data = request.get_json() or {}

    department_name = str(
        data.get("department_name", "")
    ).strip()

    description = str(
        data.get("description", "")
    ).strip()


    # Validate department name
    if not department_name:
        return jsonify({
            "success": False,
            "message": "Department name is required."
        }), 400


    # Check duplicate department
    existing_department = Department.query.filter_by(
        department_name=department_name
    ).first()

    if existing_department:
        return jsonify({
            "success": False,
            "message": "Department name already exists."
        }), 409


    department = Department(
        department_name=department_name,
        description=description or None
    )


    try:

        db.session.add(department)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Department created successfully.",
            "data": {
                "id": department.id,
                "department_name": department.department_name,
                "description": department.description
            }
        }), 201


    except Exception as e:

        db.session.rollback()

        print("DEPARTMENT CREATE ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to create department."
        }), 500


# ============================================================
# GET ALL DEPARTMENTS
# GET /api/departments/
# ============================================================

@department_bp.route("/", methods=["GET"])
@jwt_required()
def get_all_departments():

    error = admin_only()

    if error:
        return error


    departments = Department.query.order_by(
        Department.department_name.asc()
    ).all()


    result = []


    for department in departments:

        employee_count = Employee.query.filter_by(
            department_id=department.id,
            is_active=True
        ).count()


        result.append({
            "id": department.id,
            "department_name": department.department_name,
            "description": department.description,
            "employee_count": employee_count,
            "created_at": (
                department.created_at.isoformat()
                if department.created_at
                else None
            )
        })


    return jsonify({
        "success": True,
        "message": f"{len(result)} department(s) found.",
        "data": result
    }), 200


# ============================================================
# GET SINGLE DEPARTMENT
# GET /api/departments/<id>
# ============================================================

@department_bp.route("/<int:id>", methods=["GET"])
@jwt_required()
def get_department(id):

    error = admin_only()

    if error:
        return error


    department = db.session.get(
        Department,
        id
    )


    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found."
        }), 404


    employees = Employee.query.filter_by(
        department_id=department.id,
        is_active=True
    ).all()


    employee_list = []


    for employee in employees:

        employee_list.append({
            "id": employee.id,
            "employee_id": employee.employee_id,
            "name": (
                f"{employee.first_name} "
                f"{employee.last_name}"
            ).strip(),
            "designation": employee.designation
        })


    return jsonify({
        "success": True,
        "data": {
            "id": department.id,
            "department_name": department.department_name,
            "description": department.description,
            "created_at": (
                department.created_at.isoformat()
                if department.created_at
                else None
            ),
            "employee_count": len(employee_list),
            "employees": employee_list
        }
    }), 200


# ============================================================
# UPDATE DEPARTMENT
# PUT /api/departments/<id>
# ============================================================

@department_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
def update_department(id):

    error = admin_only()

    if error:
        return error


    department = db.session.get(
        Department,
        id
    )


    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found."
        }), 404


    data = request.get_json() or {}


    # --------------------------------------------------------
    # UPDATE DEPARTMENT NAME
    # --------------------------------------------------------

    if "department_name" in data:

        new_name = str(
            data.get("department_name", "")
        ).strip()


        if not new_name:
            return jsonify({
                "success": False,
                "message": "Department name cannot be empty."
            }), 400


        if new_name != department.department_name:

            existing_department = (
                Department.query.filter(
                    Department.department_name == new_name,
                    Department.id != department.id
                ).first()
            )


            if existing_department:
                return jsonify({
                    "success": False,
                    "message": "Department name already exists."
                }), 409


            department.department_name = new_name


    # --------------------------------------------------------
    # UPDATE DESCRIPTION
    # --------------------------------------------------------

    if "description" in data:

        description = str(
            data.get("description") or ""
        ).strip()

        department.description = (
            description or None
        )


    try:

        db.session.commit()


        return jsonify({
            "success": True,
            "message": "Department updated successfully.",
            "data": {
                "id": department.id,
                "department_name": department.department_name,
                "description": department.description
            }
        }), 200


    except Exception as e:

        db.session.rollback()

        print("DEPARTMENT UPDATE ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to update department."
        }), 500


# ============================================================
# DELETE DEPARTMENT
# DELETE /api/departments/<id>
# ============================================================

@department_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
def delete_department(id):

    error = admin_only()

    if error:
        return error


    department = db.session.get(
        Department,
        id
    )


    if not department:
        return jsonify({
            "success": False,
            "message": "Department not found."
        }), 404


    # --------------------------------------------------------
    # CHECK ACTIVE EMPLOYEES
    # --------------------------------------------------------

    assigned_employees = Employee.query.filter_by(
        department_id=department.id,
        is_active=True
    ).count()


    if assigned_employees > 0:

        return jsonify({
            "success": False,
            "message": (
                f"Cannot delete. "
                f"{assigned_employees} active employee(s) "
                f"are assigned to this department."
            )
        }), 409


    department_name = department.department_name


    try:

        db.session.delete(department)

        db.session.commit()


        return jsonify({
            "success": True,
            "message": (
                f"Department '{department_name}' "
                f"deleted successfully."
            )
        }), 200


    except Exception as e:

        db.session.rollback()

        print("DEPARTMENT DELETE ERROR:", e)

        return jsonify({
            "success": False,
            "message": "Failed to delete department."
        }), 500
    