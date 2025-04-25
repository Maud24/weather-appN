// auth.js

export function registerUser(userData) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    if (users.find(u => u.email === userData.email)) {
      return { success: false, message: "Email déjà utilisé" };
    }
    users.push(userData);
    localStorage.setItem("users", JSON.stringify(users));
    return { success: true };
  }
  
  export function loginUser(email, password) {
    const users = JSON.parse(localStorage.getItem("users")) || [];
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      return { success: true };
    }
    return { success: false, message: "Identifiants incorrects" };
  }
  
  export function logoutUser() {
    localStorage.removeItem("currentUser");
  }
  
  export function getCurrentUser() {
    return JSON.parse(localStorage.getItem("currentUser"));
  }
  