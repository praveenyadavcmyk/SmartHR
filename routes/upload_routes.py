# routes/upload_routes.py
# File upload APIs: Profile images and face encoding registration.

import os
import numpy
import face_recognition
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt
from werkzeug.utils import secure_filename
from database import db
from models import Employee

upload_bp = Blueprint("upload", __name__)

# ── Config ────────────────────────────────────────────────────

ALLOWED_EXTENSIONS  = {"jpg", "jpeg", "png", "webp"}
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024          # 5 MB
PROFILE_FOLDER      = "uploads/profiles"
FACE_FOLDER         = "uploads/faces"


# ── Helpers ───────────────────────────────────────────────────

def admin_only():
    if get_jwt().get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403
    return None


def allowed_file(filename):
    """Return True if the file extension is permitted."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def get_employee_or_404(employee_id):
    """Return employee or a 404 JSON response."""
    employee = Employee.query.get(employee_id)
    if not employee or not employee.is_active:
        return None, jsonify({"success": False, "message": "Employee not found."}), 404
    return employee, None, None


def delete_file_if_exists(filepath):
    """Silently delete a file from disk if it exists."""
    if filepath and os.path.exists(filepath):
        os.remove(filepath)


# ── POST /upload/profile/<employee_id> ───────────────────────
@upload_bp.route("/upload/profile/<int:employee_id>", methods=["POST"])
@jwt_required()
def upload_profile(employee_id):
    error = admin_only()
    if error:
        return error

    employee, err, status = get_employee_or_404(employee_id)
    if err:
        return err, status

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided."}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"success": False, "message": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file type. Allowed: jpg, jpeg, png, webp."}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
        return jsonify({"success": False, "message": "File too large. Maximum size is 5 MB."}), 400

    # Build filename: profile_<employee_id>.<ext>
    ext      = file.filename.rsplit(".", 1)[1].lower()
    filename = f"profile_{employee.employee_id}.{ext}"
    filepath = os.path.join(PROFILE_FOLDER, filename)

    os.makedirs(PROFILE_FOLDER, exist_ok=True)
    file.save(filepath)

    # Update database
    employee.profile_image = filepath
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Profile image uploaded successfully.",
        "data":    {"profile_image": filepath}
    }), 201


# ── GET /upload/profile/<employee_id> ────────────────────────
@upload_bp.route("/upload/profile/<int:employee_id>", methods=["GET"])
@jwt_required()
def view_profile(employee_id):
    error = admin_only()
    if error:
        return error

    employee, err, status = get_employee_or_404(employee_id)
    if err:
        return err, status

    if not employee.profile_image or not os.path.exists(employee.profile_image):
        return jsonify({"success": False, "message": "No profile image found."}), 404

    # send_file streams the image file back to the client
    return send_file(employee.profile_image)


# ── PUT /upload/profile/<employee_id> ────────────────────────
@upload_bp.route("/upload/profile/<int:employee_id>", methods=["PUT"])
@jwt_required()
def replace_profile(employee_id):
    error = admin_only()
    if error:
        return error

    employee, err, status = get_employee_or_404(employee_id)
    if err:
        return err, status

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided."}), 400

    file = request.files["file"]

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file type. Allowed: jpg, jpeg, png, webp."}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
        return jsonify({"success": False, "message": "File too large. Maximum size is 5 MB."}), 400

    # Delete old profile image from disk before saving the new one
    delete_file_if_exists(employee.profile_image)

    ext      = file.filename.rsplit(".", 1)[1].lower()
    filename = f"profile_{employee.employee_id}.{ext}"
    filepath = os.path.join(PROFILE_FOLDER, filename)

    os.makedirs(PROFILE_FOLDER, exist_ok=True)
    file.save(filepath)

    employee.profile_image = filepath
    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Profile image replaced successfully.",
        "data":    {"profile_image": filepath}
    }), 200


# ── DELETE /upload/profile/<employee_id> ─────────────────────
@upload_bp.route("/upload/profile/<int:employee_id>", methods=["DELETE"])
@jwt_required()
def delete_profile(employee_id):
    error = admin_only()
    if error:
        return error

    employee, err, status = get_employee_or_404(employee_id)
    if err:
        return err, status

    if not employee.profile_image:
        return jsonify({"success": False, "message": "No profile image to delete."}), 404

    delete_file_if_exists(employee.profile_image)

    # Clear the path in database
    employee.profile_image = None
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Profile image deleted successfully."
    }), 200


# ── POST /upload/face/register/<employee_id> ─────────────────
@upload_bp.route("/upload/face/register/<int:employee_id>", methods=["POST"])
@jwt_required()
def register_face(employee_id):
    """
    Upload a clear face photo.
    Generates a face encoding using face_recognition library.
    Saves the encoding as a .npy file for later matching.
    """
    error = admin_only()
    if error:
        return error

    employee, err, status = get_employee_or_404(employee_id)
    if err:
        return err, status

    if "file" not in request.files:
        return jsonify({"success": False, "message": "No file provided."}), 400

    file = request.files["file"]

    if not allowed_file(file.filename):
        return jsonify({"success": False, "message": "Invalid file type. Allowed: jpg, jpeg, png, webp."}), 400

    # Check file size
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > MAX_FILE_SIZE_BYTES:
        return jsonify({"success": False, "message": "File too large. Maximum size is 5 MB."}), 400

    # Save the uploaded image temporarily for processing
    ext          = file.filename.rsplit(".", 1)[1].lower()
    image_name   = f"face_{employee.employee_id}.{ext}"
    image_path   = os.path.join(FACE_FOLDER, image_name)

    os.makedirs(FACE_FOLDER, exist_ok=True)
    file.save(image_path)

    # Load image and generate face encoding
    image    = face_recognition.load_image_file(image_path)
    encodings = face_recognition.face_encodings(image)

    if len(encodings) == 0:
        # Clean up the saved image — no face was detected
        delete_file_if_exists(image_path)
        return jsonify({
            "success": False,
            "message": "No face detected in the image. Please upload a clear front-facing photo."
        }), 400

    if len(encodings) > 1:
        delete_file_if_exists(image_path)
        return jsonify({
            "success": False,
            "message": "Multiple faces detected. Please upload a photo with only one face."
        }), 400

    # Save encoding as a .npy file (NumPy binary format)
    # Each encoding is a 128-number array that uniquely represents a face
    encoding_filename = f"encoding_{employee.employee_id}.npy"
    encoding_path     = os.path.join(FACE_FOLDER, encoding_filename)

    # Delete old encoding if it exists
    delete_file_if_exists(employee.face_encoding_path)

    numpy.save(encoding_path, encodings[0])

    # Update database with encoding file path
    employee.face_encoding_path = encoding_path
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "Face registered successfully.",
        "data": {
            "employee_id":       employee.employee_id,
            "face_image":        image_path,
            "encoding_path":     encoding_path,
            "encoding_size":     len(encodings[0])    # always 128
        }
    }), 201

