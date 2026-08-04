# routes/dashboard_routes.py
# Dashboard APIs — Admin only. Aggregates data from all models.

from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func
from datetime import date, datetime, timedelta
from database import db
from models import Employee, Department, Attendance, Leave, Payroll

dashboard_bp = Blueprint("dashboard", __name__)


# ── Helper ────────────────────────────────────────────────────

def admin_only():
    if get_jwt().get("role") != "admin":
        return jsonify({"success": False, "message": "Admin access required."}), 403
    return None


# ── 1. GET /dashboard/overview ────────────────────────────────
@dashboard_bp.route("/overview", methods=["GET"])
@jwt_required()
def overview():
    error = admin_only()
    if error:
        return error

    today = date.today()

    # Employee counts
    total_employees    = Employee.query.count()
    active_employees   = Employee.query.filter_by(is_active=True).count()
    inactive_employees = total_employees - active_employees
    total_departments  = Department.query.count()

    # Today's attendance
    present_today = Attendance.query.filter_by(
        attendance_date=today, status="Present"
    ).count()
    absent_today = active_employees - present_today

    attendance_pct = (
        round((present_today / active_employees) * 100, 1)
        if active_employees > 0 else 0
    )

    # Leave counts
    total_leaves    = Leave.query.count()
    pending_leaves  = Leave.query.filter_by(status="Pending").count()
    approved_leaves = Leave.query.filter_by(status="Approved").count()
    rejected_leaves = Leave.query.filter_by(status="Rejected").count()

    # Payroll
    total_payrolls = Payroll.query.count()
    current_month  = today.month
    current_year   = today.year
    monthly_payroll = db.session.query(func.sum(Payroll.net_salary)).filter_by(
        payroll_month=current_month, payroll_year=current_year
    ).scalar() or 0

    return jsonify({
        "success": True,
        "data": {
            "employees": {
                "total":    total_employees,
                "active":   active_employees,
                "inactive": inactive_employees
            },
            "departments": {
                "total": total_departments
            },
            "attendance": {
                "present_today":    present_today,
                "absent_today":     absent_today,
                "attendance_pct":   attendance_pct
            },
            "leaves": {
                "total":    total_leaves,
                "pending":  pending_leaves,
                "approved": approved_leaves,
                "rejected": rejected_leaves
            },
            "payroll": {
                "total_records":     total_payrolls,
                "monthly_total":     float(monthly_payroll)
            }
        }
    }), 200


# ── 2. GET /dashboard/attendance ──────────────────────────────
@dashboard_bp.route("/attendance", methods=["GET"])
@jwt_required()
def attendance_summary():
    error = admin_only()
    if error:
        return error

    today         = date.today()
    active_count  = Employee.query.filter_by(is_active=True).count()

    present_today = Attendance.query.filter_by(
        attendance_date=today, status="Present"
    ).count()
    absent_today  = active_count - present_today

    # Late = checked in after 09:00
    late_cutoff = datetime.combine(today, datetime.strptime("09:00", "%H:%M").time())
    late_today  = Attendance.query.filter(
        Attendance.attendance_date == today,
        Attendance.check_in > late_cutoff
    ).count()

    attendance_pct = (
        round((present_today / active_count) * 100, 1)
        if active_count > 0 else 0
    )

    # Last 7 days summary — one entry per day
    last_7_days = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = Attendance.query.filter_by(
            attendance_date=day, status="Present"
        ).count()
        last_7_days.append({
            "date":          str(day),
            "present_count": count
        })

    return jsonify({
        "success": True,
        "data": {
            "today": {
                "present":        present_today,
                "absent":         absent_today,
                "late":           late_today,
                "attendance_pct": attendance_pct
            },
            "last_7_days": last_7_days
        }
    }), 200


# ── 3. GET /dashboard/payroll ─────────────────────────────────
@dashboard_bp.route("/payroll", methods=["GET"])
@jwt_required()
def payroll_summary():
    error = admin_only()
    if error:
        return error

    today = date.today()

    # Current month aggregates
    base = Payroll.query.filter_by(
        payroll_month=today.month,
        payroll_year=today.year
    )

    total_records   = base.count()
    gross_salary    = db.session.query(func.sum(Payroll.gross_salary)).filter_by(
        payroll_month=today.month, payroll_year=today.year
    ).scalar() or 0
    net_salary      = db.session.query(func.sum(Payroll.net_salary)).filter_by(
        payroll_month=today.month, payroll_year=today.year
    ).scalar() or 0
    total_bonus     = db.session.query(func.sum(Payroll.bonus)).filter_by(
        payroll_month=today.month, payroll_year=today.year
    ).scalar() or 0
    total_deduction = db.session.query(func.sum(Payroll.deduction)).filter_by(
        payroll_month=today.month, payroll_year=today.year
    ).scalar() or 0

    avg_salary = round(float(net_salary) / total_records, 2) if total_records > 0 else 0

    return jsonify({
        "success": True,
        "data": {
            "period": {
                "month": today.month,
                "year":  today.year
            },
            "total_records":   total_records,
            "gross_salary":    float(gross_salary),
            "net_salary":      float(net_salary),
            "total_bonus":     float(total_bonus),
            "total_deduction": float(total_deduction),
            "average_salary":  avg_salary
        }
    }), 200


# ── 4. GET /dashboard/departments ─────────────────────────────
@dashboard_bp.route("/departments", methods=["GET"])
@jwt_required()
def department_summary():
    error = admin_only()
    if error:
        return error

    departments = Department.query.order_by(Department.department_name).all()

    result = []
    for dept in departments:
        total  = Employee.query.filter_by(department_id=dept.id).count()
        active = Employee.query.filter_by(department_id=dept.id, is_active=True).count()
        result.append({
            "id":              dept.id,
            "department_name": dept.department_name,
            "total_employees": total,
            "active_employees":active
        })

    return jsonify({
        "success": True,
        "data": result
    }), 200


# ── 5. GET /dashboard/recent-activities ───────────────────────
@dashboard_bp.route("/recent-activities", methods=["GET"])
@jwt_required()
def recent_activities():
    error = admin_only()
    if error:
        return error

    activities = []

    # Last 5 employees created
    recent_employees = Employee.query.order_by(
        Employee.created_at.desc()
    ).limit(5).all()
    for emp in recent_employees:
        activities.append({
            "type":        "Employee Created",
            "description": f"{emp.first_name} {emp.last_name} was added.",
            "timestamp":   str(emp.created_at)
        })

    # Last 5 check-ins
    recent_checkins = Attendance.query.filter(
        Attendance.check_in.isnot(None)
    ).order_by(Attendance.check_in.desc()).limit(5).all()
    for att in recent_checkins:
        activities.append({
            "type":        "Check-In",
            "description": f"{att.employee.first_name} {att.employee.last_name} checked in.",
            "timestamp":   str(att.check_in)
        })

    # Last 5 check-outs
    recent_checkouts = Attendance.query.filter(
        Attendance.check_out.isnot(None)
    ).order_by(Attendance.check_out.desc()).limit(5).all()
    for att in recent_checkouts:
        activities.append({
            "type":        "Check-Out",
            "description": f"{att.employee.first_name} {att.employee.last_name} checked out.",
            "timestamp":   str(att.check_out)
        })

    # Last 5 leave applications
    recent_leaves = Leave.query.order_by(Leave.created_at.desc()).limit(5).all()
    for lv in recent_leaves:
        activities.append({
            "type":        f"Leave {lv.status}",
            "description": f"{lv.employee.first_name} {lv.employee.last_name} applied for {lv.leave_type}.",
            "timestamp":   str(lv.created_at)
        })

    # Last 5 payrolls generated
    recent_payrolls = Payroll.query.order_by(Payroll.created_at.desc()).limit(5).all()
    for pay in recent_payrolls:
        activities.append({
            "type":        "Payroll Generated",
            "description": f"Payroll for {pay.employee.first_name} {pay.employee.last_name} — {pay.payroll_month}/{pay.payroll_year}.",
            "timestamp":   str(pay.created_at)
        })

    # Sort all activities by timestamp, newest first
    activities.sort(key=lambda x: x["timestamp"], reverse=True)

    return jsonify({
        "success": True,
        "data":    activities[:20]       # return top 20 most recent
    }), 200


# ── 6. GET /dashboard/today-highlights ───────────────────────
@dashboard_bp.route("/today-highlights", methods=["GET"])
@jwt_required()
def today_highlights():
    error = admin_only()
    if error:
        return error

    today = date.today()

    # New employees added today
    new_employees = Employee.query.filter(
        func.date(Employee.created_at) == today
    ).all()
    new_emp_list = [
        {"id": e.id, "name": f"{e.first_name} {e.last_name}", "designation": e.designation}
        for e in new_employees
    ]

    # Employees on approved leave today
    on_leave = Leave.query.filter(
        Leave.status     == "Approved",
        Leave.start_date <= today,
        Leave.end_date   >= today
    ).all()
    on_leave_list = [
        {"id": l.employee_id, "name": f"{l.employee.first_name} {l.employee.last_name}",
         "leave_type": l.leave_type}
        for l in on_leave
    ]

    # Late employees today (checked in after 09:00)
    late_cutoff = datetime.combine(today, datetime.strptime("09:00", "%H:%M").time())
    late_records = Attendance.query.filter(
        Attendance.attendance_date == today,
        Attendance.check_in > late_cutoff
    ).all()
    late_list = [
        {"id": a.employee_id, "name": f"{a.employee.first_name} {a.employee.last_name}",
         "check_in": str(a.check_in)}
        for a in late_records
    ]

    # Pending payrolls this month
    pending_payrolls = Payroll.query.filter_by(
        payroll_month  = today.month,
        payroll_year   = today.year,
        payment_status = "Pending"
    ).count()

    # Pending leave requests
    pending_leaves = Leave.query.filter_by(status="Pending").count()

    return jsonify({
        "success": True,
        "data": {
            "new_employees":    new_emp_list,
            "on_leave":         on_leave_list,
            "late_employees":   late_list,
            "pending_payrolls": pending_payrolls,
            "pending_leaves":   pending_leaves
        }
    }), 200


# ── 7. GET /dashboard/analytics ───────────────────────────────
@dashboard_bp.route("/analytics", methods=["GET"])
@jwt_required()
def analytics():
    error = admin_only()
    if error:
        return error

    today = date.today()

    # Employee growth — count joined per month for last 6 months
    employee_growth = []
    for i in range(5, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year  = today.year if today.month - i > 0 else today.year - 1
        count = Employee.query.filter(
            func.month(Employee.joining_date) == month,
            func.year(Employee.joining_date)  == year
        ).count()
        employee_growth.append({
            "month": f"{year}-{str(month).zfill(2)}",
            "count": count
        })

    # Attendance trend — present count per day for last 7 days
    attendance_trend = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = Attendance.query.filter_by(
            attendance_date=day, status="Present"
        ).count()
        attendance_trend.append({
            "date":  str(day),
            "count": count
        })

    # Payroll trend — net salary per month for last 6 months
    payroll_trend = []
    for i in range(5, -1, -1):
        month = (today.month - i - 1) % 12 + 1
        year  = today.year if today.month - i > 0 else today.year - 1
        total = db.session.query(func.sum(Payroll.net_salary)).filter_by(
            payroll_month=month, payroll_year=year
        ).scalar() or 0
        payroll_trend.append({
            "month":       f"{year}-{str(month).zfill(2)}",
            "net_salary":  float(total)
        })

    # Department distribution — employee count per department
    departments = Department.query.all()
    dept_distribution = []
    for dept in departments:
        count = Employee.query.filter_by(
            department_id=dept.id, is_active=True
        ).count()
        dept_distribution.append({
            "department": dept.department_name,
            "count":      count
        })

    return jsonify({
        "success": True,
        "data": {
            "employee_growth":     employee_growth,
            "attendance_trend":    attendance_trend,
            "payroll_trend":       payroll_trend,
            "dept_distribution":   dept_distribution
        }
    }), 200

