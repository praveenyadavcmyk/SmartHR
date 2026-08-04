# AI Smart Employee Management System

A Flask + MySQL based backend for managing employees, with AI features planned
for later phases (e.g. smart attendance analysis, performance insights).

This README currently covers **Phase 1: Project Setup & Core Foundation**.

---

## 📁 Project Structure (Phase 1)

```
smart_employee_management/
│
├── app.py              # Main entry point - creates and runs the Flask app
├── config.py            # App configuration (reads settings from .env)
├── database.py          # Sets up SQLAlchemy (db) and Flask-Migrate
├── requirements.txt      # Python package dependencies
├── .env.example          # Template for environment variables
└── README.md             # This file
```

> Note: Authentication and Employee modules are **not** part of Phase 1.
> They will be added in later phases.

---

## 🧠 What Each File Does

- **`app.py`** — Creates the Flask app using the "application factory"
  pattern (`create_app()`). Connects all extensions (database, JWT, bcrypt,
  CORS) to the app. Contains two temporary routes (`/` and `/api/health`)
  just to verify the server works.

- **`config.py`** — Loads settings like `SECRET_KEY` and the database
  connection string from environment variables (via a `.env` file), so
  secrets never live directly in the code.

- **`database.py`** — Creates the shared `db` (SQLAlchemy) and `migrate`
  (Flask-Migrate) objects, kept in their own file to avoid circular imports
  once we add database models in later phases.

- **`requirements.txt`** — Lists all Python packages this project depends
  on, with pinned versions so installs are consistent across machines.

- **`.env.example`** — A template showing which environment variables you
  need to set. Copy it to `.env` and fill in your real values (this actual
  `.env` file should never be committed to version control).

---

## ⚙️ Setup Instructions

### 1. Create and activate a virtual environment

```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Set up your environment variables

Copy the example file and fill in your own values:

```bash
# On Windows
copy .env.example .env

# On macOS/Linux
cp .env.example .env
```

Then open `.env` and set your actual MySQL username, password, and a
random secret key.

### 4. Create the MySQL database

Log into MySQL and create an empty database matching the `DB_NAME` value
in your `.env` file:

```sql
CREATE DATABASE smart_employee_db;
```

### 5. Run the app

```bash
python app.py
```

The server will start at: `http://127.0.0.1:5000`

Test it by visiting these routes in your browser or with a tool like curl/Postman:

- `http://127.0.0.1:5000/` → Welcome message
- `http://127.0.0.1:5000/api/health` → Health check status

---

## ✅ Phase 1 Checklist

- [x] Project structure created
- [x] Flask app factory (`app.py`) set up
- [x] Configuration loaded from `.env` (`config.py`)
- [x] SQLAlchemy + Flask-Migrate initialized (`database.py`)
- [x] JWT, Bcrypt, and CORS extensions wired up (ready for future phases)
- [x] Basic health-check route working

## 🔜 Coming in Later Phases

- **Phase 2:** Authentication module (user registration, login, JWT tokens)
- **Phase 3:** Employee module (CRUD operations, database models)
- **Phase 4+:** AI-powered features (attendance insights, performance analysis, etc.)

---

## 🛠️ Tech Stack

| Tool                 | Purpose                                   |
|----------------------|--------------------------------------------|
| Flask                 | Web framework                             |
| Flask-SQLAlchemy      | ORM for working with MySQL                |
| Flask-Migrate          | Database schema migrations                |
| Flask-JWT-Extended     | JWT-based authentication (used in Phase 2)|
| Flask-Bcrypt           | Password hashing (used in Phase 2)        |
| Flask-CORS             | Allow cross-origin requests from a frontend|
| python-dotenv          | Load environment variables from `.env`    |
| PyMySQL                | MySQL database driver                     |