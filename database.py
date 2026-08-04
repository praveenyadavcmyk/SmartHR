"""
database.py
------------
This file is responsible for setting up the database connection for our
Flask app using Flask-SQLAlchemy (the ORM) and Flask-Migrate (for handling
database schema changes/migrations over time).

Why is this in its own file (separate from app.py)?
- It avoids "circular imports". Later, when we create models (like an
  Employee model in Phase 2), those model files will need to import the
  `db` object. If `db` were created inside app.py, and app.py also needed
  to import the models, we'd end up with two files trying to import each
  other, which Python does not allow.
- By keeping `db` here in its own file, both app.py AND future model files
  can safely import it from `database.py` without any conflicts.
"""

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate

# `db` is the main SQLAlchemy object. We will use this object later to
# define database models (tables) as Python classes, e.g.:
#   class Employee(db.Model):
#       id = db.Column(db.Integer, primary_key=True)
db = SQLAlchemy()

# `migrate` handles database migrations - a way to update your database
# tables (add columns, create new tables, etc.) as your models change,
# without losing existing data.
migrate = Migrate()


def init_db(app):
    """
    Connects the `db` and `migrate` objects to our Flask app.

    This function is called once, inside the create_app() factory function
    in app.py, right after the app is created and configured.

    Args:
        app (Flask): The Flask application instance.
    """
    db.init_app(app)
    migrate.init_app(app, db)