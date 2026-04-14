import { useEffect, useState } from "react";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzjznc0s5r8WB19L5IBOVtBx78y337B1_nhNsFpsrrbE4RaH3MZ0zKJfHUlXKIB_DmS/exec";

const DEFAULT_WORKERS = [
  { id: "default-alfredo", name: "Alfredo", phone: "" },
  { id: "default-samuel", name: "Samuel", phone: "" },
  { id: "default-juan", name: "Juan", phone: "" },
  { id: "default-brian", name: "Brian", phone: "" },
];

export default function Admin() {
  const [jobs, setJobs] = useState([]);
  const [users, setUsers] = useState([]);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchJobs(), fetchUsers()]);
    setLoading(false);
  };

  const fetchJobs = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getJobs" }),
      });

      const data = await res.json();

      if (!Array.isArray(data)) {
        setJobs([]);
        showToast("Could not load jobs");
        return;
      }

      const cleaned = data
        .filter((job) => String(job.client || "").trim() !== "")
        .map((job) => ({
          id: String(job.id || "").trim(),
          client: String(job.client || "")
            .replace(/\|/g, "")
            .replace(/\n/g, "")
            .trim(),
          address: String(job.address || "").trim(),
          phone: String(job.phone || "").trim(),
          date: String(job.date || "").trim(),
          time: String(job.time || "").trim(),
          scope: String(job.scope || "").trim(),
          status: String(job.status || "").trim(),
          assignedTo: String(job.assignedTo || "").trim(),
          notes: String(job.notes || "").trim(),
        }));

      setJobs(cleaned);
    } catch (err) {
      console.error("Error loading jobs:", err);
      setJobs([]);
      showToast("Error loading jobs");
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getUsers" }),
      });

      const data = await res.json();

      const dbUsers = Array.isArray(data)
        ? data
            .filter((user) => String(user.name || "").trim() !== "")
            .map((user) => ({
              id: String(user.id || "").trim(),
              name: String(user.name || "").trim(),
              phone: String(user.phone || "").trim(),
            }))
        : [];

      const merged = [...DEFAULT_WORKERS, ...dbUsers];
      const seen = new Set();

      const uniqueUsers = merged.filter((user) => {
        const key = String(user.name || "")
          .trim()
          .toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setUsers(uniqueUsers);
    } catch (err) {
      console.error("Error loading users:", err);
      setUsers(DEFAULT_WORKERS);
    }
  };

  const assignWorker = async (id, worker) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "assignWorker",
          id,
          worker,
        }),
      });

      const result = await res.json();

      if (result?.result === "worker assigned") {
        showToast("Worker assigned");
        fetchJobs();
      } else {
        showToast("Could not assign worker");
      }
    } catch (err) {
      console.error("Assign error:", err);
      showToast("Assign error");
    }
  };

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updateStatus",
          id,
          status,
        }),
      });

      const result = await res.json();

      if (result?.result === "status updated") {
        showToast("Status updated");
        fetchJobs();
      } else {
        showToast("Could not update status");
      }
    } catch (err) {
      console.error("Status error:", err);
      showToast("Status error");
    }
  };

  return (
    <div className="screen-shell">
      <img src="logo/aalogo.png" alt="AA HOME PRO" className="logo" />
      <h2 className="title">ADMIN PANEL</h2>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Workers database</h3>

        {users.length === 0 ? (
          <p>No workers found</p>
        ) : (
          users.map((user) => (
            <div key={user.id} className="job-row-pro">
              <span className="job-label-pro">{user.name}</span>
              {user.phone ? <span>{user.phone}</span> : null}
            </div>
          ))
        )}
      </div>

      {loading && <div className="card">Loading jobs...</div>}

      {!loading && jobs.length === 0 && (
        <div className="card">No jobs found in Sheet1.</div>
      )}

      {!loading && jobs.length > 0 && (
        <div className="jobs-scroll">
          {jobs.map((job, i) => (
            <div key={i} className="card">
              <div className="job-title-pro">{job.client || "No client"}</div>

              <div className="job-row-pro">
                <span className="job-label-pro">Address</span>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    job.address || ""
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="job-link"
                >
                  {job.address || "No address"}
                </a>
              </div>

              <div className="job-row-pro">
                <span className="job-label-pro">Phone</span>
                <a href={`tel:${job.phone || ""}`} className="job-link">
                  {job.phone || "No phone"}
                </a>
              </div>

              <div className="job-row-pro">
                <span className="job-label-pro">Date</span>
                <span>{job.date || "-"}</span>
              </div>

              <div className="job-row-pro">
                <span className="job-label-pro">Time</span>
                <span>{job.time || "-"}</span>
              </div>

              <div className="job-row-pro">
                <span className="job-label-pro">Scope</span>
                <span>{job.scope || "-"}</span>
              </div>

              <div className="job-row-pro">
                <span className="job-label-pro">Status</span>
                <span>{job.status || "-"}</span>
              </div>

              <div className="job-row-pro">
                <span className="job-label-pro">Assigned</span>
                <span>{job.assignedTo || "None"}</span>
              </div>

              <div className="action-icons">
                <a
                  href={`tel:${job.phone || ""}`}
                  className="icon-btn icon-call"
                  aria-label="Call client"
                  title="Call client"
                >
                  📞
                </a>

                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    job.address || ""
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="icon-btn icon-map"
                  aria-label="Open maps"
                  title="Open maps"
                >
                  <img
                    src="https://cdn-icons-png.flaticon.com/512/684/684908.png"
                    alt="Maps"
                    className="map-icon"
                  />
                </a>
              </div>

              <select
                className="select-pro"
                value={job.assignedTo || ""}
                onChange={(e) => assignWorker(job.id, e.target.value)}
                style={{ marginTop: 12 }}
              >
                <option value="">Assign worker</option>

                {users.map((user) => (
                  <option key={user.id} value={user.name}>
                    {user.name}
                  </option>
                ))}

                <option value="Juan & Brian">Juan & Brian</option>
                <option value="Samuel & Alfredo">Samuel & Alfredo</option>
              </select>

              <select
                className="select-pro"
                value={job.status || ""}
                onChange={(e) => updateStatus(job.id, e.target.value)}
                style={{ marginTop: 12 }}
              >
                <option value="Pending">Pending</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
              </select>

              {job.notes && (
                <div className="notes-history">
                  <div className="notes-title">Work updates</div>
                  {job.notes.split("\n").map((line, idx) => (
                    <div key={idx} className="notes-line-pro">
                      {line}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
