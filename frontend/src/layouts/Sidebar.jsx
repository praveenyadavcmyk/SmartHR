import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  MdDashboard,
  MdPeople,
  MdAccessTime,
  MdBeachAccess,
  MdPayments,
  MdBusiness,
  MdAutoAwesome,
  MdPerson,
  MdSettings,
  MdLogout,
  MdClose,
  MdKeyboardArrowRight,
} from "react-icons/md";

import {
  useMemo,
} from "react";

import { useAuth } from "../hooks/useAuth";

const menuItems = [
  {
    label: "Dashboard",
    path: "/",
    icon: MdDashboard,
    color: "from-blue-600 to-cyan-500",
  },
  {
    label: "Employees",
    path: "/employees",
    icon: MdPeople,
    color: "from-indigo-600 to-blue-500",
  },
  {
    label: "Attendance",
    path: "/attendance",
    icon: MdAccessTime,
    color: "from-emerald-600 to-green-500",
  },
  {
    label: "Leave",
    path: "/leave",
    icon: MdBeachAccess,
    color: "from-orange-500 to-yellow-500",
  },
  {
    label: "Payroll",
    path: "/payroll",
    icon: MdPayments,
    color: "from-purple-600 to-pink-500",
  },
  {
    label: "Departments",
    path: "/departments",
    icon: MdBusiness,
    color: "from-sky-500 to-cyan-500",
  },
  {
    label: "AI Analytics",
    path: "/ai-analytics",
    icon: MdAutoAwesome,
    color: "from-fuchsia-600 to-violet-500",
  },
];

const accountItems = [
  {
    label: "Profile",
    path: "/profile",
    icon: MdPerson,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: MdSettings,
  },
];

export default function Sidebar({
  open,
  onClose,
}) {
  const location = useLocation();

  const {
    logout,
    user,
  } = useAuth();

  const initials = useMemo(() => {
    if (!user?.full_name) return "A";

    return user.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  }, [user]);

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          className="
          fixed
          inset-0
          z-40
          bg-slate-950/70
          backdrop-blur-sm
          lg:hidden
        "
        />
      )}

      <aside
        className={`
        fixed
        left-0
        top-0
        z-50
        flex
        h-screen
        w-72
        flex-col
        overflow-hidden
        border-r
        border-white/10
        bg-[#07111f]
        transition-transform
        duration-300

        ${
          open
            ? "translate-x-0"
            : "-translate-x-full"
        }

        lg:static
        lg:translate-x-0
      `}
      >
        {/* Background Effects */}

        <div className="absolute inset-0 overflow-hidden">

          <div
            className="
            absolute
            -left-20
            -top-20
            h-72
            w-72
            rounded-full
            bg-blue-600/20
            blur-[130px]
          "
          />

          <div
            className="
            absolute
            bottom-0
            right-0
            h-64
            w-64
            rounded-full
            bg-cyan-500/10
            blur-[120px]
          "
          />

        </div>

        <div className="relative flex h-full flex-col">

          {/* ========================= */}

          {/* Logo */}

          {/* ========================= */}

          <div className="border-b border-white/10 px-6 py-6">

            <div className="flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div
                  className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-3xl
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  shadow-xl
                  shadow-blue-500/30
                "
                >
                  <MdAutoAwesome
                    className="text-2xl text-white"
                  />
                </div>

                <div>

                  <h1
                    className="
                    text-xl
                    font-bold
                    tracking-wide
                    text-white
                  "
                  >
                    SmartHR
                  </h1>

                  <p
                    className="
                    text-[11px]
                    uppercase
                    tracking-[0.35em]
                    text-slate-400
                  "
                  >
                    Enterprise
                  </p>

                </div>

              </div>

              <button
                onClick={onClose}
                className="
                rounded-xl
                p-2
                text-slate-400
                transition
                hover:bg-white/10
                hover:text-white
                lg:hidden
              "
              >
                <MdClose size={22} />
              </button>

            </div>

          </div>

          {/* ========================= */}

          {/* USER */}

          {/* ========================= */}

          <div className="px-5 pt-6">

            <div
              className="
              rounded-3xl
              border
              border-white/10
              bg-white/5
              p-4
              backdrop-blur-xl
            "
            >
              <div className="flex items-center gap-4">

                <div
                  className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-full
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-500
                  text-lg
                  font-bold
                  text-white
                "
                >
                  {initials}
                </div>

                <div className="min-w-0 flex-1">

                  <h2
                    className="
                    truncate
                    text-sm
                    font-semibold
                    text-white
                  "
                  >
                    {user?.full_name || "Administrator"}
                  </h2>

                  <p
                    className="
                    truncate
                    text-xs
                    text-slate-400
                  "
                  >
                    {user?.email}
                  </p>

                  <span
                    className="
                    mt-2
                    inline-flex
                    rounded-full
                    bg-emerald-500/15
                    px-2
                    py-1
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wider
                    text-emerald-400
                  "
                  >
                    {user?.role || "Admin"}
                  </span>

                </div>

              </div>

            </div>

          </div>

          {/* Navigation starts here */}
                    {/* ========================= */}

          {/* Navigation */}

          {/* ========================= */}

          <div
            className="
              mt-7
              flex-1
              overflow-y-auto
              px-4
              scrollbar-thin
              scrollbar-thumb-slate-700
              scrollbar-track-transparent
            "
          >

            <p
              className="
                mb-3
                px-3
                text-xs
                font-bold
                uppercase
                tracking-[0.3em]
                text-slate-500
              "
            >
              Main Menu
            </p>

            {menuItems.map(
              ({
                label,
                path,
                icon: Icon,
                color,
              }) => {

                const active =
                  path === "/"
                    ? location.pathname === "/"
                    : location.pathname.startsWith(path);

                return (

                  <NavLink
                    key={path}
                    to={path}
                    end={path === "/"}
                    onClick={onClose}
                    className={`
                      group
                      relative
                      mb-2
                      flex
                      items-center
                      overflow-hidden
                      rounded-2xl
                      px-3
                      py-3
                      transition-all
                      duration-300

                      ${
                        active
                          ? "border border-white/10 bg-white/10 shadow-xl shadow-blue-500/10"
                          : "hover:bg-white/5"
                      }
                    `}
                  >

                    {active && (

                      <div
                        className={`
                          absolute
                          left-0
                          top-2
                          bottom-2
                          w-1
                          rounded-r-full
                          bg-gradient-to-b
                          ${color}
                        `}
                      />

                    )}

                    <div
                      className={`
                        flex
                        h-12
                        w-12
                        items-center
                        justify-center
                        rounded-2xl
                        bg-gradient-to-r
                        ${color}
                        shadow-lg
                        transition-all
                        duration-300
                        group-hover:scale-110
                        group-hover:rotate-3
                      `}
                    >
                      <Icon
                        className="
                          text-xl
                          text-white
                        "
                      />
                    </div>

                    <div className="ml-4 flex-1">

                      <h3
                        className={`
                          text-sm
                          font-semibold
                          transition-colors

                          ${
                            active
                              ? "text-white"
                              : "text-slate-300 group-hover:text-white"
                          }
                        `}
                      >
                        {label}
                      </h3>

                    </div>

                    <MdKeyboardArrowRight
                      className={`
                        text-xl
                        transition-all
                        duration-300

                        ${
                          active
                            ? "translate-x-0 text-blue-400"
                            : "translate-x-1 text-slate-600 group-hover:text-slate-300"
                        }
                      `}
                    />

                  </NavLink>

                );

              }
            )}

            {/* ========================= */}

            {/* ACCOUNT */}

            {/* ========================= */}

            <div className="mt-8">

              <p
                className="
                  mb-3
                  px-3
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.3em]
                  text-slate-500
                "
              >
                Account
              </p>

              {accountItems.map(
                ({
                  label,
                  path,
                  icon: Icon,
                }) => {

                  const active =
                    location.pathname === path;

                  return (

                    <NavLink
                      key={path}
                      to={path}
                      onClick={onClose}
                      className={`
                        group
                        mb-2
                        flex
                        items-center
                        rounded-2xl
                        px-3
                        py-3
                        transition-all
                        duration-300

                        ${
                          active
                            ? "border border-blue-500/20 bg-blue-600/10"
                            : "hover:bg-white/5"
                        }
                      `}
                    >

                      <div
                        className={`
                          flex
                          h-11
                          w-11
                          items-center
                          justify-center
                          rounded-xl

                          ${
                            active
                              ? "bg-blue-600"
                              : "bg-slate-800 group-hover:bg-slate-700"
                          }
                        `}
                      >

                        <Icon
                          className={`
                            text-lg

                            ${
                              active
                                ? "text-white"
                                : "text-slate-300"
                            }
                          `}
                        />

                      </div>

                      <span
                        className={`
                          ml-4
                          text-sm
                          font-semibold

                          ${
                            active
                              ? "text-white"
                              : "text-slate-300"
                          }
                        `}
                      >
                        {label}
                      </span>

                    </NavLink>

                  );

                }
              )}

            </div>
                      {/* ====================================== */}

          {/* BOTTOM SECTION */}

          {/* ====================================== */}

          <div
            className="
              mt-auto
              border-t
              border-white/10
              p-5
            "
          >

            {/* Workspace Card */}

            <div
              className="
                relative
                overflow-hidden
                rounded-3xl
                border
                border-blue-500/20
                bg-gradient-to-br
                from-blue-600/15
                via-cyan-500/10
                to-slate-900
                p-5
              "
            >

              {/* Glow */}

              <div
                className="
                  absolute
                  -right-8
                  -top-8
                  h-24
                  w-24
                  rounded-full
                  bg-cyan-400/20
                  blur-3xl
                "
              />

              <div className="relative">

                <div
                  className="
                    mb-4
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-2xl
                    bg-gradient-to-r
                    from-blue-600
                    to-cyan-500
                    shadow-lg
                    shadow-blue-500/30
                  "
                >
                  <MdAutoAwesome
                    className="text-2xl text-white"
                  />
                </div>

                <h3
                  className="
                    text-lg
                    font-bold
                    text-white
                  "
                >
                  SmartHR Enterprise
                </h3>

                <p
                  className="
                    mt-2
                    text-sm
                    leading-6
                    text-slate-300
                  "
                >
                  AI Powered Employee Management
                  Platform with Payroll,
                  Attendance & Analytics.
                </p>

                <div
                  className="
                    mt-5
                    flex
                    items-center
                    justify-between
                  "
                >

                  <div>

                    <p
                      className="
                        text-xs
                        uppercase
                        tracking-widest
                        text-slate-500
                      "
                    >
                      Version
                    </p>

                    <h4
                      className="
                        mt-1
                        text-lg
                        font-bold
                        text-white
                      "
                    >
                      v2.0
                    </h4>

                  </div>

                  <span
                    className="
                      rounded-full
                      bg-emerald-500/15
                      px-3
                      py-1
                      text-xs
                      font-semibold
                      text-emerald-400
                    "
                  >
                    Stable
                  </span>

                </div>

              </div>

            </div>

            {/* Logout */}

            <button
              onClick={logout}
              className="
                group
                mt-5
                flex
                w-full
                items-center
                justify-center
                gap-3
                rounded-2xl
                border
                border-red-500/20
                bg-red-500/10
                px-4
                py-3.5
                text-sm
                font-semibold
                text-red-400
                transition-all
                duration-300

                hover:-translate-y-1
                hover:bg-red-500
                hover:text-white
                hover:shadow-xl
                hover:shadow-red-500/30
              "
            >

              <MdLogout
                size={20}
                className="
                  transition-transform
                  duration-300
                  group-hover:-translate-x-1
                "
              />

              Sign Out

            </button>

            {/* Footer */}

            <div
              className="
                mt-6
                text-center
              "
            >

              <p
                className="
                  text-xs
                  text-slate-500
                "
              >
                SmartHR Enterprise Dashboard
              </p>

              <p
                className="
                  mt-1
                  text-[11px]
                  text-slate-600
                "
              >
                React • Flask • MySQL • AI
              </p>

            </div>
         </div>
          </div>
        </div>

      </aside>

    </>
  );
}