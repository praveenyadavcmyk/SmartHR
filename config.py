"""
config.py
---------
This file defines the configuration settings for our Flask application.

Instead of hardcoding sensitive values (like database passwords or secret
keys) directly in our code, we read them from environment variables.
These environment variables are loaded from a `.env` file using
python-dotenv.

Why do this?
- Keeps secrets (passwords, keys) out of the source code.
- Makes it easy to use different settings for development, testing,
  and production without changing any code.
"""

import os
from dotenv import load_dotenv

# Load variables from the .env file into the environment.
# This must happen before we try to read any variables with os.getenv().
load_dotenv()


class Config:
    """
    Base configuration class.

    All configuration values used by the Flask app and its extensions
    are defined here as class attributes. Flask automatically reads
    attributes from this class when we call app.config.from_object(Config).
    """

    # -----------------------------
    # Flask Core Settings
    # -----------------------------
    # SECRET_KEY is used by Flask to sign session cookies and other
    # security-related tokens. It should always be kept secret in production.
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key")

    # -----------------------------
    # JWT Settings
    # -----------------------------
    # This will be used later (Phase 2) when we add login/authentication.
    # We configure it now so the app is ready for it.
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key")

    # -----------------------------
    # MySQL Database Settings
    # -----------------------------
    
    DATABASE_URL = os.getenv("DATABASE_URL")

    if DATABASE_URL:
     DATABASE_URL = DATABASE_URL.replace(
        "postgres://",
        "postgresql://",
        1
    )

    SQLALCHEMY_DATABASE_URI = (
      DATABASE_URL
    or
    f"mysql+pymysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}:{os.getenv('DB_PORT')}/{os.getenv('DB_NAME')}"
)


    # Disables a SQLAlchemy feature that tracks object changes for signals.
    # It uses extra memory and is not needed for most apps, so we turn it off.
    SQLALCHEMY_TRACK_MODIFICATIONS = False