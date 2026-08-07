# auth/routes.py
# All authentication routes: register, login, protected example.

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt

from database import db
from models import Admin, Employee
from auth.utils import hash_password, check_password, generate_tokens

auth_bp = Blueprint("auth", __name__)


# ── Admin Registration ────────────────────────────────────────
@auth_bp.route("/admin/register", methods=["POST"])
def admin_register():
    data = request.get_json()

    # Check required fields
    if not all(k in data for k in ("username", "email", "password", "full_name")):
        return jsonify({"success": False, "message": "Missing required fields."}), 400

    # Check duplicates
    if Admin.query.filter_by(email=data["email"]).first():
        return jsonify({"success": False, "message": "Email already registered."}), 409

    if Admin.query.filter_by(username=data["username"]).first():
        return jsonify({"success": False, "message": "Username already taken."}), 409

    admin = Admin(
        username  = data["username"],
        email     = data["email"],
        password  = hash_password(data["password"]),
        full_name = data["full_name"],
        role      = data.get("role", "admin")
    )
    try:
      db.session.add(admin)
      db.session.commit()
    except Exception:
      db.session.rollback()
    return jsonify({
        "success": False,
        "message": "Database error. Please try again."
    }), 500

    return jsonify({
    "success": True,
    "message": "Admin registered successfully."
}), 201

# ── Admin Login ───────────────────────────────────────────────
@auth_bp.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.get_json()

    if not all(k in data for k in ("email", "password")):
        return jsonify({"success": False, "message": "Email and password required."}), 400

    admin = Admin.query.filter_by(email=data["email"]).first()

    if not admin or not check_password(data["password"], admin.password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    if not admin.is_active:
        return jsonify({"success": False, "message": "Account is disabled."}), 403

    access_token, refresh_token = generate_tokens(
        identity=f"admin_{admin.id}",
        role="admin"
    )

    return jsonify({
        "success":       True,
        "message":       "Login successful.",
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "admin": {
            "id":        admin.id,
            "username":  admin.username,
            "email":     admin.email,
            "full_name": admin.full_name,
            "role":      admin.role
        }
    }), 200


# ── Employee Login ────────────────────────────────────────────
@auth_bp.route("/employee/login", methods=["POST"])
def employee_login():
    data = request.get_json()

    if not all(k in data for k in ("email", "password")):
        return jsonify({"success": False, "message": "Email and password required."}), 400

    employee = Employee.query.filter_by(email=data["email"]).first()

    if not employee or not check_password(data["password"], employee.password):
        return jsonify({"success": False, "message": "Invalid email or password."}), 401

    if not employee.is_active:
        return jsonify({"success": False, "message": "Account is disabled."}), 403

    access_token, refresh_token = generate_tokens(
        identity=f"employee_{employee.id}",
        role="employee"
    )

    return jsonify({
        "success":       True,
        "message":       "Login successful.",
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "employee": {
            "id":          employee.id,
            "employee_id": employee.employee_id,
            "first_name":  employee.first_name,
            "last_name":   employee.last_name,
            "email":       employee.email
        }
    }), 200


# ── Refresh Access Token ──────────────────────────────────────
@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Use a refresh token to get a new access token without logging in again."""
    identity = get_jwt_identity()
    claims   = get_jwt()
    role     = claims.get("role", "employee")

    access_token, _ = generate_tokens(identity=identity, role=role)

    return jsonify({
        "success":      True,
        "access_token": access_token
    }), 200


# ── Get Current Logged-in User ────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def get_current_user():
    """Protected route — returns the currently logged-in user's info."""
    identity = get_jwt_identity()   # e.g. "admin_3" or "employee_7"
    claims   = get_jwt()
    role     = claims.get("role")

    # Parse the id from the identity string
    user_id = int(identity.split("_")[1])

    if role == "admin":
        user = Admin.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "Admin not found."}), 404
        return jsonify({
            "success": True,
            "role":    "admin",
            "user": {
                "id":        user.id,
                "username":  user.username,
                "email":     user.email,
                "full_name": user.full_name,
                "role":      user.role
            }
        }), 200

    else:
        user = Employee.query.get(user_id)
        if not user:
            return jsonify({"success": False, "message": "Employee not found."}), 404
        return jsonify({
            "success": True,
            "role":    "employee",
            "user": {
                "id":          user.id,
                "employee_id": user.employee_id,
                "first_name":  user.first_name,
                "last_name":   user.last_name,
                "email":       user.email
            }
        }), 200

