import { useEffect, useState } from 'react'
import {
  MdPeople, MdAccessTime, MdBeachAccess, MdPayments,
  MdTrendingUp, MdBusiness, MdCheckCircle, MdWarning
} from 'react-icons/md'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts'
import api from '../services/api'
import StatCard from '../components/common/StatCard'
import Loader   from '../components/common/Loader'

// Recharts custom tooltip
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-800 border border-gray-700 rounded-lg px-3 py-2 text-xs">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  )
}

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function Dashboard() {
  const [overview,   setOverview]   = useState(null)
  const [attendance, setAttendance] = useState(null)
  const [payroll,    setPayroll]    = useState(null)
  const [depts,      setDepts]      = useState([])
  const [activities, setActivities] = useState([])
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ov, att, pay, dept, act] = await Promise.all([
          api.get('/dashboard/overview'),
          api.get('/dashboard/attendance'),
          api.get('/dashboard/payroll'),
          api.get('/dashboard/departments'),
          api.get('/dashboard/recent-activities'),
        ])
        setOverview(ov.data.data)
        setAttendance(att.data.data)
        setPayroll(pay.data.data)
        setDepts(dept.data.data)
        setActivities(act.data.data)
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) return <Loader text="Loading dashboard..." />

  const ov  = overview
  const att = attendance

  return (
    <div className="space-y-6">

      {/* ── Stat Cards ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Employees"
          value={ov?.employees?.total ?? 0}
          icon={MdPeople}
          color="blue"
          sub={`${ov?.employees?.active} active`}
        />
        <StatCard
          title="Present Today"
          value={att?.today?.present ?? 0}
          icon={MdCheckCircle}
          color="green"
          sub={`${att?.today?.attendance_pct ?? 0}% attendance rate`}
        />
        <StatCard
          title="Pending Leaves"
          value={ov?.leaves?.pending ?? 0}
          icon={MdBeachAccess}
          color="yellow"
          sub={`${ov?.leaves?.approved} approved`}
        />
        <StatCard
          title="Monthly Payroll"
          value={ov?.payroll?.monthly_total
            ? `₹${Number(ov.payroll.monthly_total).toLocaleString('en-IN')}`
            : '₹0'
          }
          icon={MdPayments}
          color="purple"
          sub={`${ov?.payroll?.total_records} records`}
        />
      </div>

      {/* ── Second Row: smaller stats ──────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Departments',   value: ov?.departments?.total,     color: 'text-blue-400'   },
          { label: 'Late Today',    value: att?.today?.late,           color: 'text-yellow-400' },
          { label: 'Absent Today',  value: att?.today?.absent,         color: 'text-red-400'    },
          { label: 'Leaves Taken',  value: ov?.leaves?.approved,       color: 'text-green-400'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className={`text-2xl font-bold ${color}`}>{value ?? 0}</p>
            <p className="text-gray-500 text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Charts Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Attendance Bar Chart — takes 2 cols */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-100 font-semibold text-sm">Attendance — Last 7 Days</h3>
              <p className="text-gray-500 text-xs mt-0.5">Daily present employee count</p>
            </div>
            <MdTrendingUp className="text-primary-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={att?.last_7_days ?? []} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
              <XAxis
                dataKey="date"
                tickFormatter={d => d.slice(5)}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#374151', opacity: 0.3 }} />
              <Bar dataKey="present_count" name="Present" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Department Pie Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-100 font-semibold text-sm">Departments</h3>
              <p className="text-gray-500 text-xs mt-0.5">Employee distribution</p>
            </div>
            <MdBusiness className="text-primary-400" size={20} />
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie
                data={depts}
                dataKey="active_employees"
                nameKey="department_name"
                cx="50%"
                cy="50%"
                outerRadius={65}
                innerRadius={35}
              >
                {depts.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v, n) => [v, n]}
                contentStyle={{
                  background: '#1e2433', border: '1px solid #374151',
                  borderRadius: '8px', fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="mt-3 space-y-1.5">
            {depts.slice(0, 4).map((d, i) => (
              <div key={d.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="text-gray-400 text-xs truncate max-w-[110px]">
                    {d.department_name}
                  </span>
                </div>
                <span className="text-gray-300 text-xs font-medium">
                  {d.active_employees}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Payroll Trend + Recent Activity ────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Payroll summary cards */}
        <div className="card space-y-4">
          <div>
            <h3 className="text-gray-100 font-semibold text-sm">Payroll Summary</h3>
            <p className="text-gray-500 text-xs mt-0.5">Current month</p>
          </div>
          {[
            { label: 'Gross Salary',    value: payroll?.gross_salary,    color: 'text-blue-400'   },
            { label: 'Net Salary',      value: payroll?.net_salary,      color: 'text-green-400'  },
            { label: 'Total Bonus',     value: payroll?.total_bonus,     color: 'text-yellow-400' },
            { label: 'Total Deduction', value: payroll?.total_deduction, color: 'text-red-400'    },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex items-center justify-between
                                        py-2 border-b border-gray-700/50 last:border-0">
              <span className="text-gray-400 text-sm">{label}</span>
              <span className={`font-semibold text-sm ${color}`}>
                ₹{Number(value || 0).toLocaleString('en-IN')}
              </span>
            </div>
          ))}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-gray-400 text-xs">Avg. Salary</span>
            <span className="text-gray-200 text-sm font-semibold">
              ₹{Number(payroll?.average_salary || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Recent Activities feed — takes 2 cols */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-gray-100 font-semibold text-sm">Recent Activity</h3>
              <p className="text-gray-500 text-xs mt-0.5">Latest system events</p>
            </div>
          </div>

          <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
            {activities.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No recent activity.</p>
            )}
            {activities.map((a, i) => (
              <div key={i}
                className="flex items-start gap-3 py-2.5 border-b border-gray-700/30 last:border-0">
                {/* Color dot by type */}
                <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                  a.type.includes('Check-In')  ? 'bg-green-400'  :
                  a.type.includes('Check-Out') ? 'bg-blue-400'   :
                  a.type.includes('Approved')  ? 'bg-green-400'  :
                  a.type.includes('Rejected')  ? 'bg-red-400'    :
                  a.type.includes('Payroll')   ? 'bg-purple-400' :
                  'bg-yellow-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-300 text-xs leading-snug">{a.description}</p>
                  <p className="text-gray-600 text-xs mt-0.5">
                    {new Date(a.timestamp).toLocaleString('en-IN', {
                      day: '2-digit', month: 'short',
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className="text-gray-600 text-xs bg-gray-700/40 px-2 py-0.5
                                 rounded-full flex-shrink-0">
                  {a.type.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
