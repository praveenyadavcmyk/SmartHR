import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/settings";

export default function SettingsPage() {

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [settings, setSettings] = useState({
    theme: "dark",
    language: "English",
    timezone: "Asia/Kolkata",
    email_notifications: true,
    browser_notifications: true,
    two_factor_auth: false,
  });

  const token = localStorage.getItem("access_token");

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    try {

      setLoading(true);

      const response = await fetch(
        `${API_URL}/`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load settings."
        );
      }

      setSettings(data.data);

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  }

  function handleChange(e) {

    const { name, value, type, checked } = e.target;

    setSettings((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));
  }

  async function saveSettings(e) {

    e.preventDefault();

    setMessage("");
    setError("");

    try {

      const response = await fetch(
        `${API_URL}/`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(settings),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to save settings."
        );
      }

      setMessage(data.message);

    } catch (err) {

      setError(err.message);

    }
  }

  async function resetSettings() {

    if (
      !window.confirm(
        "Reset all settings?"
      )
    ) {
      return;
    }

    try {

      const response = await fetch(
        `${API_URL}/reset`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Reset failed."
        );
      }

      setMessage(data.message);

      fetchSettings();

    } catch (err) {

      setError(err.message);

    }
  }

  if (loading) {

    return (
      <div className="p-6 text-white">
        Loading settings...
      </div>
    );

  }

  return (

    <div className="p-6 text-white">

      <h1 className="text-3xl font-bold">
        Settings
      </h1>

      <p className="mt-2 mb-6 text-gray-400">
        Manage your account preferences
      </p>

      {message && (
        <div className="mb-4 rounded bg-green-700 p-3">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded bg-red-700 p-3">
          {error}
        </div>
      )}

      <form
        onSubmit={saveSettings}
        className="space-y-6 rounded-xl bg-slate-800 p-6"
      >

        <div>

          <label className="mb-2 block">
            Theme
          </label>

          <select
            name="theme"
            value={settings.theme}
            onChange={handleChange}
            className="w-full rounded border border-slate-600 bg-slate-900 p-3"
          >

            <option value="dark">
              Dark
            </option>

            <option value="light">
              Light
            </option>

          </select>

        </div>

        <div>

          <label className="mb-2 block">
            Language
          </label>

          <select
            name="language"
            value={settings.language}
            onChange={handleChange}
            className="w-full rounded border border-slate-600 bg-slate-900 p-3"
          >

            <option>
              English
            </option>

            <option>
              Hindi
            </option>

          </select>

        </div>

        <div>

          <label className="mb-2 block">
            Timezone
          </label>

          <input
            type="text"
            name="timezone"
            value={settings.timezone}
            onChange={handleChange}
            className="w-full rounded border border-slate-600 bg-slate-900 p-3"
          />

        </div>
                <div className="space-y-4">

          <label className="flex items-center justify-between rounded border border-slate-700 p-4">

            <span>Email Notifications</span>

            <input
              type="checkbox"
              name="email_notifications"
              checked={settings.email_notifications}
              onChange={handleChange}
              className="h-5 w-5"
            />

          </label>

          <label className="flex items-center justify-between rounded border border-slate-700 p-4">

            <span>Browser Notifications</span>

            <input
              type="checkbox"
              name="browser_notifications"
              checked={settings.browser_notifications}
              onChange={handleChange}
              className="h-5 w-5"
            />

          </label>

          <label className="flex items-center justify-between rounded border border-slate-700 p-4">

            <span>Two Factor Authentication</span>

            <input
              type="checkbox"
              name="two_factor_auth"
              checked={settings.two_factor_auth}
              onChange={handleChange}
              className="h-5 w-5"
            />

          </label>

        </div>

        <div className="flex gap-4">

          <button
            type="submit"
            className="rounded bg-blue-600 px-6 py-2 font-medium hover:bg-blue-700"
          >
            Save Settings
          </button>

          <button
            type="button"
            onClick={resetSettings}
            className="rounded bg-red-600 px-6 py-2 font-medium hover:bg-red-700"
          >
            Reset Settings
          </button>

        </div>

      </form>

    </div>

  );

}