import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(
          "http://127.0.0.1:5000/api/settings/",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (data.success) {
          setTheme(data.data.theme.toLowerCase());
        }
      } catch (err) {
        console.log(err);
      }
    };

    loadTheme();
  }, []);

  return (
    <div
      className={`flex h-screen overflow-hidden ${
        theme === "light"
          ? "bg-gray-100 text-gray-900"
          : "bg-dark-900 text-white"
      }`}
    >
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}