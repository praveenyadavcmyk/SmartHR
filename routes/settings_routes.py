from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt, get_jwt_identity

from database import db
from models import Settings


settings_bp = Blueprint("settings", __name__)


# ============================================================
# HELPER
# ============================================================

def get_current_user():

    identity = get_jwt_identity()
    role = get_jwt().get("role")

    if not identity or not role:
        return None, None

    try:
        user_id = int(identity.split("_")[1])
    except Exception:
        return None, None

    return role, user_id


# ============================================================
# GET SETTINGS
# ============================================================

@settings_bp.route("/", methods=["GET"])
@jwt_required()
def get_settings():

    role, user_id = get_current_user()

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid user."
        }), 401

    settings = Settings.query.filter_by(
        user_type=role,
        user_id=user_id
    ).first()

    if not settings:

        settings = Settings(
            user_type=role,
            user_id=user_id
        )

        db.session.add(settings)
        db.session.commit()

    return jsonify({
        "success": True,
        "data": {
            "theme": settings.theme,
            "language": settings.language,
            "timezone": settings.timezone,
            "email_notifications": settings.email_notifications,
            "browser_notifications": settings.browser_notifications,
            "two_factor_auth": settings.two_factor_auth
        }
    }), 200


# ============================================================
# UPDATE SETTINGS
# ============================================================

@settings_bp.route("/", methods=["PUT"])
@jwt_required()
def update_settings():

    role, user_id = get_current_user()

    if not user_id:
        return jsonify({
            "success": False,
            "message": "Invalid user."
        }), 401

    settings = Settings.query.filter_by(
        user_type=role,
        user_id=user_id
    ).first()

    if not settings:

        settings = Settings(
            user_type=role,
            user_id=user_id
        )

        db.session.add(settings)

    data = request.get_json() or {}

    if "theme" in data:
        settings.theme = data["theme"]

    if "language" in data:
        settings.language = data["language"]

    if "timezone" in data:
        settings.timezone = data["timezone"]

    if "email_notifications" in data:
        settings.email_notifications = data["email_notifications"]

    if "browser_notifications" in data:
        settings.browser_notifications = data["browser_notifications"]

    if "two_factor_auth" in data:
        settings.two_factor_auth = data["two_factor_auth"]

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Settings updated successfully."
    }), 200


# ============================================================
# RESET SETTINGS
# ============================================================

@settings_bp.route("/reset", methods=["POST"])
@jwt_required()
def reset_settings():

    role, user_id = get_current_user()

    settings = Settings.query.filter_by(
        user_type=role,
        user_id=user_id
    ).first()

    if not settings:
        return jsonify({
            "success": False,
            "message": "Settings not found."
        }), 404

    settings.theme = "dark"
    settings.language = "English"
    settings.timezone = "Asia/Kolkata"
    settings.email_notifications = True
    settings.browser_notifications = True
    settings.two_factor_auth = False

    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Settings reset successfully."
    }), 200