import { useEffect, useMemo, useState } from "react";
import AdminNavbar from "./components/AdminNavbar";
import "./adminUsers.css";
import { getToken } from "./auth/authStore";

/* ================= API ================= */

async function fetchUsersApi() {
  const token = getToken();
  if (!token) throw new Error("Missing auth token.");

  const res = await fetch("/api/admin/users", {
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  const data = await res.json().catch(() => []);
  if (!res.ok) throw new Error(data.message || "Failed to fetch users.");
  return Array.isArray(data) ? data : [];
}

async function deleteUserApi(userId) {
  const token = getToken();
  if (!token) throw new Error("Missing auth token.");

  const res = await fetch(`/api/admin/users/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
    credentials: "include",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Failed to delete user.");
  return data;
}

/* ================= MODAL ================= */

function ConfirmDeleteModal({ open, onClose, onConfirm, busy }) {
  if (!open) return null;

  return (
    <div
      className="audm-overlay"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target.classList.contains("audm-overlay")) onClose();
      }}
    >
      <div className="audm-modal" onMouseDown={(e) => e.stopPropagation()}>
        <h2 className="audm-title">Are you sure you want to<br />delete this user?</h2>

        <div className="audm-actions">
          <button
            type="button"
            className="audm-yes"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? "Deleting..." : "Yes"}
          </button>

          <button
            type="button"
            className="audm-no"
            onClick={onClose}
            disabled={busy}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================= PAGE ================= */

export default function AdminUsers() {
  const [q, setQ] = useState("");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // delete flow
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingUser, setPendingUser] = useState(null); // user object
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr("");
        const data = await fetchUsersApi();
        if (!alive) return;
        setUsers(data);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Failed to load users.");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) => {
      const id = String(u._id || "").toLowerCase();
      const email = String(u.email || "").toLowerCase();
      const phone = String(u.phone || "").toLowerCase();
      const lastName = String(u.lastName || "").toLowerCase();

      return (
        id.includes(term) ||
        email.includes(term) ||
        phone.includes(term) ||
        lastName.includes(term)
      );
    });
  }, [q, users]);

  const openDelete = (u) => {
    setPendingUser(u);
    setConfirmOpen(true);
  };

  const closeDelete = () => {
    if (deleting) return;
    setConfirmOpen(false);
    setPendingUser(null);
  };

  const confirmDelete = async () => {
    if (!pendingUser?._id) return;

    try {
      setDeleting(true);
      setErr("");
      await deleteUserApi(pendingUser._id);

      // remove from UI immediately
      setUsers((prev) => prev.filter((x) => x._id !== pendingUser._id));

      closeDelete();
    } catch (e) {
      setErr(e?.message || "Failed to delete user.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="au-page">
      <AdminNavbar />

      <main className="au-content">
        <section className="au-shell">
          <div className="au-topRow">
            <div className="au-search">
              <span className="au-searchIcon">⌕</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search User"
              />
            </div>

            <h1 className="au-title">User List</h1>

            <div className="au-rightSpacer" />
          </div>

          <div className="au-headings">
            <div>User id</div>
            <div>Email</div>
            <div>Phone number</div>
            <div>Last name</div>
            <div>Actions</div>
          </div>

          {loading && <div className="au-empty">Loading users...</div>}
          {err && !loading && <div className="au-empty">{err}</div>}

          <div className="au-list">
            {!loading &&
              filtered.map((u) => {
                // Figma shows short ids like "482"
                const shortId = String(u._id || "").slice(-3);

                return (
                  <div className="au-row" key={u._id}>
                    <div className="au-cell au-cell--id">{shortId}</div>
                    <div className="au-divider" />
                    <div className="au-cell">{u.email || "-"}</div>
                    <div className="au-divider" />
                    <div className="au-cell">{u.phone || "-"}</div>
                    <div className="au-divider" />
                    <div className="au-cell">{u.lastName || "-"}</div>
                    <div className="au-divider" />

                    <div className="au-actions">
                      <button
                        type="button"
                        className="au-trashBtn"
                        onClick={() => openDelete(u)}
                        aria-label={`Delete user ${shortId}`}
                        title="Delete user"
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })}

            {!loading && filtered.length === 0 && (
              <div className="au-empty">No users found.</div>
            )}
          </div>
        </section>
      </main>

      <ConfirmDeleteModal
        open={confirmOpen}
        onClose={closeDelete}
        onConfirm={confirmDelete}
        busy={deleting}
      />
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 11v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 11v7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 7l1 14h10l1-14" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M9 7V4h6v3" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}
//MAIN