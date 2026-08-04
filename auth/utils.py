# auth/utils.py
# Helper functions used by auth routes.

from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token, create_refresh_token
from datetime import timedelta

bcrypt = Bcrypt()


def hash_password(plain_password):
    """Hash a plain password before saving to database."""
    return bcrypt.generate_password_hash(plain_password).decode("utf-8")


def check_password(plain_password, hashed_password):
    """Return True if the plain password matches the stored hash."""
    return bcrypt.check_password_hash(hashed_password, plain_password)


def generate_tokens(identity, role):
    """
    Generate access + refresh tokens.
    identity: unique string to identify the user (e.g. "admin_5" or "employee_12")
    role:     "admin" or "employee" — stored inside the token
    """
    additional_claims = {"role": role}

    access_token = create_access_token(
        identity=identity,
        additional_claims=additional_claims,
        expires_delta=timedelta(minutes=30)
    )
    refresh_token = create_refresh_token(
        identity=identity,
        additional_claims=additional_claims,
        expires_delta=timedelta(days=30)
    )
    return access_token, refresh_token
