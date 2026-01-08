import { useMemo, useState } from "react";
import AdminNavbar from "./components/AdminNavbar";
import "./adminUsers.css";

export default function AdminUsers() {
  const [q, setQ] = useState("");

  // Front-end mock data (replace with backend later)
  const users = [
    { id: "482", email: "billclark@gmail.com", phone: "07765467269", lastName: "Clark" },
    { id: "125", email: "willbrook@gmail.com", phone: "07762556372", lastName: "Brook" },
    { id: "251", email: "SamPayne@gmail.com", phone: "07362509817", lastName: "Payne" },
    { id: "761", email: "RobMcdonald@gmail.com", phone: "07354568901", lastName: "Mcdonald" },
  ];

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return users;

    return users.filter((u) => {
      return (
        u.id.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.phone.toLowerCase().includes(term) ||
        u.lastName.toLowerCase().includes(term)
      );
    });
  }, [q]);

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

          <div className="au-list">
            {filtered.map((u) => (
              <div className="au-row" key={u.id}>
                <div className="au-cell au-cell--id">{u.id}</div>
                <div className="au-divider" />
                <div className="au-cell">{u.email}</div>
                <div className="au-divider" />
                <div className="au-cell">{u.phone}</div>
                <div className="au-divider" />
                <div className="au-cell">{u.lastName}</div>
                <div className="au-divider" />

                <div className="au-actions">
                  <button
                    type="button"
                    className="au-trashBtn"
                    onClick={() => console.log("Delete user:", u.id)}
                    aria-label={`Delete user ${u.id}`}
                    title="Delete user"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="au-empty">No users found.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function TrashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10 11v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M14 11v7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M6 7l1 14h10l1-14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M9 7V4h6v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
