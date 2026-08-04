from database import db
from datetime import datetime


class Settings(db.Model):
    __tablename__ = "settings"

    id = db.Column(db.Integer, primary_key=True)

    user_type = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, nullable=False)

    theme = db.Column(db.String(20), default="dark")

    email_notifications = db.Column(
        db.Boolean,
        default=True
    )

    browser_notifications = db.Column(
        db.Boolean,
        default=True
    )

    two_factor_auth = db.Column(
        db.Boolean,
        default=False
    )

    language = db.Column(
        db.String(20),
        default="English"
    )

    timezone = db.Column(
        db.String(50),
        default="Asia/Kolkata"
    )

    updated_at = db.Column(
        db.DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def __repr__(self):
        return (
            f"<Settings {self.user_type}:{self.user_id}>"
        )