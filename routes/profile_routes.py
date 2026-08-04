# routes/profile_routes.py
# Profile APIs for Admin and Employee

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    jwt_required,
    get_jwt,
    get_jwt_identity
)

from database import db
from models import Admin, Employee
from auth.utils import hash_password, check_password


profile_bp = Blueprint("profile", __name__)


# ============================================================
# HELPER - GET CURRENT USER
# ============================================================

def get_current_user():

    identity = get_jwt_identity()
    role = get_jwt().get("role")

    if not identity or not role:
        return None, None

    try:
        user_id = int(identity.split("_")[1])
    except (ValueError, IndexError, AttributeError):
        return None, None

    if role == "admin":
        user = db.session.get(Admin, user_id)

    elif role == "employee":
        user = db.session.get(Employee, user_id)

    else:
        return None, None

    return role, user


# ============================================================
# GET PROFILE
# GET /api/profile
# ============================================================

@profile_bp.route("/", methods=["GET"])
@jwt_required()
def get_profile():

    role, user = get_current_user()

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    # --------------------------------------------------------
    # ADMIN PROFILE
    # --------------------------------------------------------

    if role == "admin":

        return jsonify({
            "success": True,
            "role": "admin",

            "data": {
                "id": user.id,
                "username": user.username,
                "full_name": user.full_name,
                "email": user.email,
                "role": user.role,
                "is_active": user.is_active,

                "created_at": (
                    user.created_at.isoformat()
                    if user.created_at
                    else None
                )
            }
        }), 200

    # --------------------------------------------------------
    # EMPLOYEE PROFILE
    # --------------------------------------------------------

    department = None

    if user.department:
        department = {
            "id": user.department.id,
            "department_name":
                user.department.department_name
        }

    return jsonify({
        "success": True,
        "role": "employee",

        "data": {
            "id": user.id,

            "employee_id":
                user.employee_id,

            "first_name":
                user.first_name,

            "last_name":
                user.last_name,

            "full_name":
                f"{user.first_name} {user.last_name}",

            "email":
                user.email,

            "phone":
                user.phone,

            "gender":
                user.gender,

            "date_of_birth": (
                user.date_of_birth.isoformat()
                if user.date_of_birth
                else None
            ),

            "address":
                user.address,

            "joining_date": (
                user.joining_date.isoformat()
                if user.joining_date
                else None
            ),

            "designation":
                user.designation,

            "employment_type":
                user.employment_type,

            "daily_salary": (
                str(user.daily_salary)
                if user.daily_salary is not None
                else None
            ),

            "monthly_salary": (
                str(user.monthly_salary)
                if user.monthly_salary is not None
                else None
            ),

            "profile_image":
                user.profile_image,

            "department":
                department,

            "is_active":
                user.is_active,

            "created_at": (
                user.created_at.isoformat()
                if user.created_at
                else None
            )
        }
    }), 200


# ============================================================
# UPDATE PROFILE
# PUT /api/profile
# ============================================================

@profile_bp.route("/", methods=["PUT"])
@jwt_required()
def update_profile():

    role, user = get_current_user()

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    data = request.get_json() or {}

    # ========================================================
    # ADMIN UPDATE
    # ========================================================

    if role == "admin":

        # ----------------------------------------------------
        # Username
        # ----------------------------------------------------

        if "username" in data:

            username = data["username"].strip()

            if not username:
                return jsonify({
                    "success": False,
                    "message": "Username cannot be empty."
                }), 400

            existing = (
                Admin.query
                .filter(
                    Admin.username == username,
                    Admin.id != user.id
                )
                .first()
            )

            if existing:
                return jsonify({
                    "success": False,
                    "message":
                        "Username is already taken."
                }), 409

            user.username = username

        # ----------------------------------------------------
        # Email
        # ----------------------------------------------------

        if "email" in data:

            email = data["email"].strip().lower()

            if not email:
                return jsonify({
                    "success": False,
                    "message": "Email cannot be empty."
                }), 400

            existing = (
                Admin.query
                .filter(
                    Admin.email == email,
                    Admin.id != user.id
                )
                .first()
            )

            if existing:
                return jsonify({
                    "success": False,
                    "message":
                        "Email is already registered."
                }), 409

            user.email = email

        # ----------------------------------------------------
        # Full Name
        # ----------------------------------------------------

        if "full_name" in data:

            full_name = data["full_name"].strip()

            if not full_name:
                return jsonify({
                    "success": False,
                    "message":
                        "Full name cannot be empty."
                }), 400

            user.full_name = full_name

    # ========================================================
    # EMPLOYEE UPDATE
    # ========================================================

    elif role == "employee":

        # Employees can update personal information only.
        # Employment information remains admin-controlled.

        if "first_name" in data:

            first_name = data["first_name"].strip()

            if not first_name:
                return jsonify({
                    "success": False,
                    "message":
                        "First name cannot be empty."
                }), 400

            user.first_name = first_name

        if "last_name" in data:

            last_name = data["last_name"].strip()

            if not last_name:
                return jsonify({
                    "success": False,
                    "message":
                        "Last name cannot be empty."
                }), 400

            user.last_name = last_name

        # ----------------------------------------------------
        # Email
        # ----------------------------------------------------

        if "email" in data:

            email = data["email"].strip().lower()

            if not email:
                return jsonify({
                    "success": False,
                    "message":
                        "Email cannot be empty."
                }), 400

            existing = (
                Employee.query
                .filter(
                    Employee.email == email,
                    Employee.id != user.id
                )
                .first()
            )

            if existing:
                return jsonify({
                    "success": False,
                    "message":
                        "Email is already registered."
                }), 409

            user.email = email

        # ----------------------------------------------------
        # Phone
        # ----------------------------------------------------

        if "phone" in data:

            phone = data["phone"]

            if phone:
                phone = phone.strip()

                existing = (
                    Employee.query
                    .filter(
                        Employee.phone == phone,
                        Employee.id != user.id
                    )
                    .first()
                )

                if existing:
                    return jsonify({
                        "success": False,
                        "message":
                            "Phone number is already registered."
                    }), 409

            user.phone = phone or None

        # ----------------------------------------------------
        # Address
        # ----------------------------------------------------

        if "address" in data:

            address = data["address"]

            if address:
                address = address.strip()

            user.address = address or None

    # ========================================================
    # SAVE CHANGES
    # ========================================================

    try:

        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print(
            "PROFILE UPDATE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to update profile."
        }), 500

    return jsonify({
        "success": True,
        "message":
            "Profile updated successfully."
    }), 200


# ============================================================
# CHANGE PASSWORD
# PUT /api/profile/change-password
# ============================================================

@profile_bp.route(
    "/change-password",
    methods=["PUT"]
)
@jwt_required()
def change_password():

    role, user = get_current_user()

    if not user:
        return jsonify({
            "success": False,
            "message": "User not found."
        }), 404

    data = request.get_json() or {}

    current_password = data.get(
        "current_password"
    )

    new_password = data.get(
        "new_password"
    )

    confirm_password = data.get(
        "confirm_password"
    )

    # --------------------------------------------------------
    # Validate fields
    # --------------------------------------------------------

    if (
        not current_password
        or not new_password
        or not confirm_password
    ):
        return jsonify({
            "success": False,
            "message":
                "Current password, new password "
                "and confirmation are required."
        }), 400

    # --------------------------------------------------------
    # Verify current password
    # --------------------------------------------------------

    if not check_password(
        current_password,
        user.password
    ):
        return jsonify({
            "success": False,
            "message":
                "Current password is incorrect."
        }), 401

    # --------------------------------------------------------
    # Password confirmation
    # --------------------------------------------------------

    if new_password != confirm_password:
        return jsonify({
            "success": False,
            "message":
                "New password and confirmation "
                "do not match."
        }), 400

    # --------------------------------------------------------
    # Password length
    # --------------------------------------------------------

    if len(new_password) < 6:
        return jsonify({
            "success": False,
            "message":
                "New password must contain "
                "at least 6 characters."
        }), 400

    # --------------------------------------------------------
    # Prevent same password
    # --------------------------------------------------------

    if check_password(
        new_password,
        user.password
    ):
        return jsonify({
            "success": False,
            "message":
                "New password must be different "
                "from current password."
        }), 400

    # --------------------------------------------------------
    # Hash new password
    # --------------------------------------------------------

    user.password = hash_password(
        new_password
    )

    try:

        db.session.commit()

    except Exception as error:

        db.session.rollback()

        print(
            "PASSWORD UPDATE ERROR:",
            error
        )

        return jsonify({
            "success": False,
            "message":
                "Unable to change password."
        }), 500

    return jsonify({
        "success": True,
        "message":
            "Password changed successfully."
    }), 200