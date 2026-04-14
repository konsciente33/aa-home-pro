import { useEffect, useState } from "react";
import ChatModal from "./ChatModal";

const API_URL =
  "https://script.google.com/macros/s/AKfycbzjznc0s5r8WB19L5IBOVtBx78y337B1_nhNsFpsrrbE4RaH3MZ0zKJfHUlXKIB_DmS/exec";

export default function Worker({ currentUser }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState("");
  const [noteDrafts, setNoteDrafts] = useState({});
  const [activeChat, setActiveChat] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [photos, setPhotos] = useState({});

  useEffect(() => {
    if (!currentUser) return;

    fetchJobs();

    const interval = setInterval(() => {
      fetchJobs(false);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const loadPhotos = async (jobId) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "getPhotos",
          jobId,
        }),
      });

      const data = await res.json();

      setPhotos((prev) => ({
        ...prev,
        [jobId]: Array.isArray(data) ? data : [],
      }));
    } catch (err) {
      console.error("Error loading photos:", err);
    }
  };

  const uploadPhoto = async (jobId, file) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = async () => {
      try {
        const base64 = reader.result;

        const res = await fetch(API_URL, {
          method: "POST",
          body: JSON.stringify({
            action: "uploadPhoto",
            jobId,
            image: base64,
          }),
        });

        const result = await res.json();

        if (result?.success) {
          showToast("Photo uploaded");
          loadPhotos(jobId);
        } else {
          console.error(result);
          showToast("Could not upload photo");
        }
      } catch (err) {
        console.error("Photo upload error:", err);
        showToast("Photo upload error");
      }
    };

    reader.readAsDataURL(file);
  };

  const fetchJobs = async (showLoader = true) => {
    if (showLoader) setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({ action: "getJobs" }),
      });

      const data = await res.json();

      if (!Array.isArray(data)) {
        setJobs([]);
        if (showLoader) setLoading(false);
        return;
      }

      const userName = String(currentUser?.name || "")
        .toLowerCase()
        .trim();

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
        }))
        .filter((job) => {
          const assignedNames = job.assignedTo
            .toLowerCase()
            .split("&")
            .map((name) => name.trim())
            .filter(Boolean);

          return assignedNames.includes(userName);
        });

      setJobs(cleaned);
      setLastUpdate(new Date());

      cleaned.forEach((job) => loadPhotos(job.id));
    } catch (err) {
      console.error("Error loading worker jobs:", err);
      setJobs([]);
    }

    if (showLoader) setLoading(false);
  };

  const addNote = async (id) => {
    const note = String(noteDrafts[id] || "").trim();

    if (!note) {
      showToast("Write a note first");
      return;
    }

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "addNote",
          id,
          note,
        }),
      });

      const result = await res.json();

      if (result?.result === "note added") {
        showToast("Work update saved");
        setNoteDrafts((prev) => ({ ...prev, [id]: "" }));
        fetchJobs(false);
      } else {
        showToast("Could not save note");
      }
    } catch (err) {
      console.error("Note error:", err);
      showToast("Note error");
    }
  };

  const markCompleted = async (id) => {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
          action: "updateStatus",
          id,
          status: "Completed",
        }),
      });

      const result = await res.json();

      if (result?.result === "status updated") {
        showToast("Job marked completed");
        fetchJobs(false);
      } else {
        showToast("Could not update status");
      }
    } catch (err) {
      console.error("Complete error:", err);
      showToast("Complete error");
    }
  };

  return (
    <>
      <div className="screen-shell">
        <img src="logo/aalogo.png" alt="AA HOME PRO" className="logo" />
        <h2 className="title">PROJECTS</h2>

        <h2 style={{ textAlign: "center", marginTop: "10px" }}>
          {currentUser?.name || ""}
        </h2>

        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            opacity: 0.75,
            marginBottom: 10,
          }}
        >
          Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : "--"}
        </div>

        {loading && <div className="card">Loading jobs...</div>}

        {!loading && jobs.length === 0 && (
          <div className="card">
            No open projects assigned to {currentUser?.name || "this worker"}.
          </div>
        )}

        {!loading && jobs.length > 0 && (
          <div className="jobs-scroll">
            {jobs.map((job, i) => (
              <div key={i} className="card">
                <div className="job-title-pro">{job.client || "No client"}</div>

                <div className="job-row-pro">
                  <span className="job-label-pro">Address</span>
                  <div>{job.address || "No address"}</div>
                </div>

                <div className="job-row-pro">
                  <span className="job-label-pro">Phone</span>
                  <div>{job.phone || "No phone"}</div>
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

                  <label className="photo-btn" title="Add photo">
                    📸
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      hidden
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          uploadPhoto(job.id, e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>

                <button
                  className="action-btn-complete"
                  onClick={() => markCompleted(job.id)}
                >
                  Mark completed
                </button>

                <button className="note-btn" onClick={() => setActiveChat(job)}>
                  Team Chat
                </button>

                <div style={{ marginTop: 16 }}>
                  <textarea
                    className="note-box"
                    placeholder="Write what you completed today..."
                    value={noteDrafts[job.id] || ""}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({
                        ...prev,
                        [job.id]: e.target.value,
                      }))
                    }
                  />
                  <button className="note-btn" onClick={() => addNote(job.id)}>
                    Save work update
                  </button>
                </div>

                {(photos[job.id] || []).length > 0 && (
                  <div className="photos">
                    {photos[job.id].map((p, idx) => (
                      <img
                        key={idx}
                        src={p.url}
                        alt={`Job ${job.id} photo ${idx + 1}`}
                        className="photo-img"
                      />
                    ))}
                  </div>
                )}

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

      {activeChat && (
        <ChatModal
          job={activeChat}
          currentUser={currentUser}
          onClose={() => setActiveChat(null)}
        />
      )}
    </>
  );
}
