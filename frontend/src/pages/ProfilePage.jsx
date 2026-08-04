import { useEffect, useState } from "react";

const API_URL = "http://127.0.0.1:5000/api/profile";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  // =========================================================
  // LOAD PROFILE
  // =========================================================

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load profile.");
      }

      const user = data.data || data.user || data;

      setProfile(user);

      setForm({
        full_name: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
        address: user.address || "",
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // =========================================================
  // EDIT PROFILE
  // =========================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const updateProfile = async (e) => {
    e.preventDefault();

    try {
      setMessage("");
      setError("");

      const response = await fetch(`${API_URL}/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to update profile.");
      }

      setMessage(data.message || "Profile updated successfully.");
      setEditing(false);

      await fetchProfile();
    } catch (err) {
      setError(err.message);
    }
  };

  // =========================================================
  // CHANGE PASSWORD
  // =========================================================

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;

    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const changePassword = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (
      passwordForm.new_password !== passwordForm.confirm_password
    ) {
      setError("New password and confirm password do not match.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/change-password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          current_password: passwordForm.current_password,
          new_password: passwordForm.new_password,
          confirm_password: passwordForm.confirm_password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to change password.");
      }

      setMessage(data.message || "Password changed successfully.");

      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setShowPassword(false);
    } catch (err) {
      setError(err.message);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="p-6 text-slate-300">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="p-6 text-slate-100">

      {/* HEADER */}

      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          My Profile
        </h1>

        <p className="mt-1 text-sm text-slate-400">
          Manage your personal information and account security
        </p>
      </div>

      {/* MESSAGE */}

      {message && (
        <div className="mb-5 rounded-lg border border-green-700 bg-green-950/40 p-3 text-sm text-green-400">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-700 bg-red-950/40 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* PROFILE CARD */}

      <div className="mb-6 rounded-xl border border-slate-700 bg-slate-800 p-6">

        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white">
            {profile?.first_name?.[0] ||
              profile?.full_name?.[0] ||
              profile?.username?.[0] ||
              "U"}
          </div>

          <div className="flex-1">

            <h2 className="text-xl font-semibold">
              {profile?.full_name ||
                `${profile?.first_name || ""} ${profile?.last_name || ""}`}
            </h2>

            <p className="mt-1 text-slate-400">
              {profile?.email}
            </p>

            <div className="mt-2 flex flex-wrap gap-2">

              {profile?.role && (
                <span className="rounded-full bg-blue-950 px-3 py-1 text-xs text-blue-400">
                  {profile.role}
                </span>
              )}

              {profile?.designation && (
                <span className="rounded-full bg-slate-700 px-3 py-1 text-xs text-slate-300">
                  {profile.designation}
                </span>
              )}

            </div>

          </div>

          <button
            onClick={() => setEditing(!editing)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            {editing ? "Cancel Edit" : "Edit Profile"}
          </button>

        </div>
      </div>

      {/* INFORMATION */}

      <div className="grid gap-6 lg:grid-cols-2">

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">

          <h3 className="mb-5 text-lg font-semibold">
            Personal Information
          </h3>

          {!editing ? (
            <div className="space-y-5">

              <Info
                label="Employee ID"
                value={profile?.employee_id}
              />

              <Info
                label="Username"
                value={profile?.username}
              />

              <Info
                label="Email Address"
                value={profile?.email}
              />

              <Info
                label="Phone"
                value={profile?.phone}
              />

              <Info
                label="Gender"
                value={profile?.gender}
              />

              <Info
                label="Address"
                value={profile?.address}
              />

            </div>
          ) : (
            <form
              onSubmit={updateProfile}
              className="space-y-4"
            >

              {profile?.full_name !== undefined && (
                <>
                  <Input
                    label="Full Name"
                    name="full_name"
                    value={form.full_name}
                    onChange={handleChange}
                  />

                  <Input
                    label="Username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                  />

                  <Input
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </>
              )}

              {profile?.first_name !== undefined && (
                <>
                  <Input
                    label="First Name"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                  />

                  <Input
                    label="Last Name"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                  />

                  <Input
                    label="Email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </>
              )}

              {profile?.phone !== undefined && (
                <Input
                  label="Phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              )}

              {profile?.address !== undefined && (
                <div>
                  <label className="mb-2 block text-sm text-slate-400">
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium hover:bg-blue-700"
              >
                Save Changes
              </button>

            </form>
          )}

        </div>

        {/* WORK INFORMATION */}

        <div className="rounded-xl border border-slate-700 bg-slate-800 p-6">

          <h3 className="mb-5 text-lg font-semibold">
            Work Information
          </h3>

          <div className="space-y-5">

            <Info
              label="Designation"
              value={profile?.designation}
            />

            <Info
              label="Department"
              value={profile?.department?.department_name}
            />

            <Info
              label="Employment Type"
              value={profile?.employment_type}
            />

            <Info
              label="Joining Date"
              value={profile?.joining_date}
            />

            <Info
              label="Account Role"
              value={profile?.role}
            />

            <Info
              label="Account Status"
              value={
                profile?.is_active === false
                  ? "Inactive"
                  : "Active"
              }
            />

          </div>
        </div>

      </div>

      {/* SECURITY */}

      <div className="mt-6 rounded-xl border border-slate-700 bg-slate-800 p-6">

        <div className="flex items-center justify-between">

          <div>
            <h3 className="text-lg font-semibold">
              Account Security
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Update your account password
            </p>
          </div>

          <button
            onClick={() => setShowPassword(!showPassword)}
            className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Change Password
          </button>

        </div>

        {showPassword && (
          <form
            onSubmit={changePassword}
            className="mt-6 grid gap-4 md:grid-cols-3"
          >

            <PasswordInput
              label="Current Password"
              name="current_password"
              value={passwordForm.current_password}
              onChange={handlePasswordChange}
            />

            <PasswordInput
              label="New Password"
              name="new_password"
              value={passwordForm.new_password}
              onChange={handlePasswordChange}
            />

            <PasswordInput
              label="Confirm Password"
              name="confirm_password"
              value={passwordForm.confirm_password}
              onChange={handlePasswordChange}
            />

            <div className="md:col-span-3">

              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium hover:bg-blue-700"
              >
                Update Password
              </button>

            </div>

          </form>
        )}

      </div>

    </div>
  );
}


// ============================================================
// COMPONENTS
// ============================================================

function Info({ label, value }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm text-slate-200">
        {value || "Not provided"}
      </p>
    </div>
  );
}


function Input({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-400">
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-blue-500"
      />
    </div>
  );
}


function PasswordInput({
  label,
  name,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-400">
        {label}
      </label>

      <input
        type="password"
        name={name}
        value={value}
        onChange={onChange}
        required
        className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 outline-none focus:border-blue-500"
      />
    </div>
  );
}