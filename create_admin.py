from config import Config

print("URI:", Config.SQLALCHEMY_DATABASE_URI)
print("DB_USER:", Config.DB_USER)
print("DB_PASSWORD:", Config.DB_PASSWORD)
print("DB_HOST:", Config.DB_HOST)
print("DB_NAME:", Config.DB_NAME)
print("=" * 50)

from app import create_app
from database import db
from models.admin import Admin
from auth.utils import hash_password

app = create_app()

with app.app_context():

    existing_admin = Admin.query.filter_by(
        email="py9936325@gmail.com"
    ).first()

    if existing_admin:
        print("Admin already exists!")
        exit()

    admin = Admin(
        username="praveen",
        full_name="Praveen Yadav",
        email="py9936325@gmail.com",
        password=hash_password("Admin@123"),
        role="admin",
        is_active=True
    )

    db.session.add(admin)
    db.session.commit()

    print("================================")
    print("Admin created successfully!")
    print("Email    : py9936325@gmail.com")
    print("Password : Admin@123")
    print("================================")