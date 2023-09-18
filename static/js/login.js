import { serverURL, postJSON } from "./global.js";
window.onload = function () {
  // checkLogin();
};
async function checkLogin() {
  const answer = await postJSON(serverURL + "login_req", {
    username: localStorage.getItem("username"),
    password: localStorage.getItem("password"),
  });
  if (answer) {
    window.location.href = "/";
  }
}
async function login() {
  const data = new FormData($(".login-form")[0]);
  const value = Object.fromEntries(data.entries());

  const answer = await postJSON(serverURL + "login", value);
  if (!answer) {
    return;
  }
  localStorage.setItem("username", value.username);
  localStorage.setItem("password", value.password);
  window.location.href = "/";
}

$("#login").on("click", login);
