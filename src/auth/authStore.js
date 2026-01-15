const TOKEN_KEY = "vichall_token";
const USER_KEY = "vichall_user";

// Decide where to store based on role
function pickStorage(user) {
  const role = (user?.role || user?.isAdmin && "admin" || "").toLowerCase();
  // Admin should NOT persist after browser close
  if (role === "admin") return window.sessionStorage;
  return window.localStorage;
}

export function setSession({ token, user }) {
  const store = pickStorage(user);

  // clear both first to avoid mixed sessions
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);

  store.setItem(TOKEN_KEY, token);
  store.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession() {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.sessionStorage.removeItem(USER_KEY);
}

export function getToken() {
  return (
    window.sessionStorage.getItem(TOKEN_KEY) ||
    window.localStorage.getItem(TOKEN_KEY)
  );
}

export function getStoredUser() {
  try {
    const raw =
      window.sessionStorage.getItem(USER_KEY) ||
      window.localStorage.getItem(USER_KEY);
    return JSON.parse(raw || "null");
  } catch {
    return null;
  }
}

export function isLoggedIn() {
  return Boolean(getToken());
}

export function isAdmin() {
  const u = getStoredUser();
  return String(u?.role || "").toLowerCase() === "admin" || Boolean(u?.isAdmin);
}

// const TOKEN_KEY = "vichall_token";
// const USER_KEY = "vichall_user";

// export function setSession({ token, user }) {
//   localStorage.setItem(TOKEN_KEY, token);
//   localStorage.setItem(USER_KEY, JSON.stringify(user));
// }

// export function clearSession() {
//   localStorage.removeItem(TOKEN_KEY);
//   localStorage.removeItem(USER_KEY);
// }

// export function getToken() {
//   return localStorage.getItem(TOKEN_KEY);
// }

// export function getStoredUser() {
//   try {
//     return JSON.parse(localStorage.getItem(USER_KEY) || "null");
//   } catch {
//     return null;
//   }
// }

// export function isLoggedIn() {
//   return Boolean(getToken());
// }
