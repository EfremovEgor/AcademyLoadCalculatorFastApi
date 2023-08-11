import { serverURL, postJSON } from "./global.js";
async function login() {
  const data = new FormData($(".login-form")[0]);
  const value = Object.fromEntries(data.entries());

  const answer = await postJSON(serverURL + "login", value);
  if (!answer) {
    return;
  }
  localStorage.setItem("username", value.username);
  localStorage.setItem("password", value.password);
  window.location.href = "/index.html";
}

$("#login").on("click", login);
