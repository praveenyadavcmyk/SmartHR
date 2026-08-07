"""
app.py
Main entry point for Smart Employee Management System.
"""
import os
from routes.profile_routes import profile_bp
from routes.settings_routes import settings_bp

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS

from config import Config
from database import init_db

# Import models so SQLAlchemy knows all database tables
import models


# ============================================================
# BLUEPRINT IMPORTS
# ============================================================

from auth.routes import auth_bp
from routes.dashboard_routes import dashboard_bp
from routes.employee_routes import employee_bp
from routes.department_routes import department_bp
from routes.attendance_routes import attendance_bp
from routes.leave_routes import leave_bp
from routes.payroll_routes import payroll_bp
from routes.ai_routes import ai_bp
from routes.profile_routes import profile_bp



# ============================================================
# EXTENSIONS
# ============================================================

jwt = JWTManager()
bcrypt = Bcrypt()


# ============================================================
# APPLICATION FACTORY
# ============================================================

def create_app():

    app = Flask(__name__)

    # --------------------------------------------------------
    # Configuration
    # --------------------------------------------------------

    app.config.from_object(Config)

    # --------------------------------------------------------
    # Database
    # --------------------------------------------------------

    init_db(app)

    # --------------------------------------------------------
    # Extensions
    # --------------------------------------------------------

    jwt.init_app(app)
    bcrypt.init_app(app)

    # --------------------------------------------------------
    # CORS
    # React frontend runs on port 3000
    # --------------------------------------------------------
    
    CORS(
    app,
    resources={r"/api/*": {"origins": [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL")
    ]}},
    supports_credentials=True
)


    # ========================================================
    # REGISTER BLUEPRINTS
    # ========================================================

    # Authentication
    app.register_blueprint(
        auth_bp,
        url_prefix="/api/auth"
    )

    # Dashboard
    app.register_blueprint(
        dashboard_bp,
        url_prefix="/api/dashboard"
    )

    # Employees
    app.register_blueprint(
        employee_bp,
        url_prefix="/api/employees"
    )

    # Departments
    app.register_blueprint(
        department_bp,
        url_prefix="/api/departments"
    )

    # Attendance
    app.register_blueprint(
        attendance_bp,
        url_prefix="/api/attendance"
    )

    # Leaves
    app.register_blueprint(
        leave_bp,
        url_prefix="/api/leaves"
    )

    # Payroll
    app.register_blueprint(
        payroll_bp,
        url_prefix="/api/payroll"
    )

    # AI Analytics
    app.register_blueprint(
        ai_bp,
        url_prefix="/api/ai"
    )

    # Profile
    app.register_blueprint(
        profile_bp,
        url_prefix="/api/profile"
    )

   # Settings
    app.register_blueprint(
    settings_bp,
    url_prefix="/api/settings"
)

    # ========================================================
    # ROOT
    # ========================================================

    @app.route("/", methods=["GET"])
    def index():

        return jsonify({
            "success": True,
            "message": (
                "Welcome to the AI Smart Employee "
                "Management System API"
            ),
            "status": "running",
        }), 200


    # ========================================================
    # HEALTH CHECK
    # ========================================================

    @app.route("/api/health", methods=["GET"])
    def health_check():

        return jsonify({
            "success": True,
            "status": "healthy",
            "service": "smart-employee-management-api",
        }), 200


    # ========================================================
    # JWT ERROR HANDLERS
    # ========================================================

    @jwt.unauthorized_loader
    def missing_token(error):

        return jsonify({
            "success": False,
            "message": "Authorization token is required.",
        }), 401


    @jwt.invalid_token_loader
    def invalid_token(error):

        return jsonify({
            "success": False,
            "message": "Invalid authentication token.",
        }), 422


    @jwt.expired_token_loader
    def expired_token(jwt_header, jwt_payload):

        return jsonify({
            "success": False,
            "message": (
                "Authentication token has expired. "
                "Please login again."
            ),
        }), 401


    # ========================================================
    # API 404
    # ========================================================

    @app.errorhandler(404)
    def route_not_found(error):

        return jsonify({
            "success": False,
            "message": "API route not found.",
        }), 404


    # ========================================================
    # SERVER ERROR
    # ========================================================

    @app.errorhandler(500)
    def internal_server_error(error):

        return jsonify({
            "success": False,
            "message": "Internal server error.",
        }), 500

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            "success": False,
            "message": "Internal server error.",
        }), 500

    return app


# ============================================================
# CREATE APP FOR GUNICORN
# ============================================================

app = create_app()


# ============================================================
# RUN APPLICATION
# ============================================================

if __name__ == "__main__":

    print("\n" + "=" * 70)
    print("SMART EMPLOYEE MANAGEMENT SYSTEM")
    print("=" * 70)

    print("\nREGISTERED API ROUTES:\n")

    for rule in sorted(
        app.url_map.iter_rules(),
        key=lambda route: str(route)
    ):

        methods = ", ".join(
            sorted(
                method
                for method in rule.methods
                if method not in {"HEAD", "OPTIONS"}
            )
        )

        print(f"{methods:<15} {rule}")

    print("\n" + "=" * 70)
    print("Backend running on http://127.0.0.1:5000")
    print("=" * 70 + "\n")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )