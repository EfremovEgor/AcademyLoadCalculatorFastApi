import { currentPage, loadHeader } from "./global.js";
window.onload = function () {
  loadHeader(document);
  currentPage();
  refreshTable();
  addEventListenersToDynamicElements();
};
document
  .getElementsByClassName("info_button")
  .addEventListener("clicked", func);
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    saveTable();
  }
  addEventListenersToDynamicElements();
});
document.addEventListener("click", (e) => {
  addEventListenersToDynamicElements();
});
function log() {
  console.log("clicked");
}
async function addEventListenersToDynamicElements() {
  const selects = $("select");
  const inputs = $("input");
  if (!inputs || !selects) return;
  for (let select of selects) {
    select.addEventListener("change", saveTable);
  }

  for (let input of inputs) {
    input.addEventListener("input", saveTable);
  }
  const infos = $(".info_button-svg");

  for (let info of infos) {
    info.removeEventListener("click", log, true);
    info.addEventListener("click", log);
  }
}

async function saveTable(reload = true) {
  let data = [];
  const faculty_headers = await eel.get_faculty_headers()();
  let items = [];
  for (let header of faculty_headers.slice(0, -2)) {
    items.push($("." + header).slice(0));
  }
  for (let j = 0; j < items[0].length; j++) {
    let item = {};
    for (let i = 0; i < items.length; i++) {
      if (items[i][j].getAttribute("type") == "number")
        item[items[i][j].classList[0]] = parseFloat(items[i][j].value);
      else item[items[i][j].classList[0]] = items[i][j].value;
    }
    data.push(item);
  }
  await eel.save_faculty_data(data)();
  if (reload) await refreshTable();
}

async function refreshTable() {
  const data = await eel.load_faculty_data()();
  const faculty_load_and_salary = await eel.get_faculty_load_and_salary()();

  let rows = $("tr");
  if ($("table").children().length > 1) {
    rows = rows.slice(1, -1);
    for (let i = 0; i < rows.length; i++) {
      for (let cell of rows[i].children) {
        if (data[i][cell.children[0].classList[0]] !== cell.children[0].value) {
          cell.children[0].value = data[i][cell.children[0].classList[0]];
          cell.children[0].setAttribute(
            "value",
            data[i][cell.children[0].classList[0]]
          );
        }
      }
    }
    const load_cells = $(".load");
    const salary_cells = $(".salary");
    for (let i = 0; i < faculty_load_and_salary.length; i++) {
      load_cells[i].innerText = faculty_load_and_salary[i]["load"];
      salary_cells[i].innerText = faculty_load_and_salary[i]["salary"];
    }
  } else
    for (let i = 0; i < data.length; i++)
      generateRow(data[i], faculty_load_and_salary[i]);
  await addEventListenersToDynamicElements();
}
async function createPositionInput(defaultValue = null) {
  const data = await eel.get_positions()();
  const input = document.createElement("select");

  input.classList.add("position");
  for (let i = 0; i < data.length; i++) {
    if (defaultValue != null) {
      input.value = defaultValue;
      input.setAttribute("value", defaultValue);
    }
    const option = document.createElement("option");
    if (defaultValue === data[i]) {
      option.selected = true;
    }
    option.innerText = data[i];
    input.appendChild(option);
  }
  return input;
}

async function generateRow(
  data = null,
  faculty_load_and_salary = null,
  empty = false
) {
  const table = $(".table")[0];
  const faculty_headers = await eel.get_faculty_headers()();
  const row = document.createElement("tr");
  const infoCell = document.createElement("td");
  infoCell.innerHTML = `  <svg class="info_button-svg" viewBox="-3.6 -3.6 31.20 31.20" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
  <g id="SVGRepo_iconCarrier"> 
  <path d="M10 10C10 10.5523 10.4477 11 11 11V17C10.4477 17 10 17.4477 10 18C10 18.5523 10.4477 19 11 19H13C13.5523 19 14 18.5523 14 18C14 17.4477 13.5523 17 13 17V9H11C10.4477 9 10 9.44772 10 10Z" >
  </path> 
  <path d="M12 8C12.8284 8 13.5 7.32843 13.5 6.5C13.5 5.67157 12.8284 5 12 5C11.1716 5 10.5 5.67157 10.5 6.5C10.5 7.32843 11.1716 8 12 8Z">
  </path> 
  <path fill-rule="evenodd" clip-rule="evenodd" d="M23 4C23 2.34315 21.6569 1 20 1H4C2.34315 1 1 2.34315 1 4V20C1 21.6569 2.34315 23 4 23H20C21.6569 23 23 21.6569 23 20V4ZM21 4C21 3.44772 20.5523 3 20 3H4C3.44772 3 3 3.44772 3 4V20C3 20.5523 3.44772 21 4 21H20C20.5523 21 21 20.5523 21 20V4Z" >
  </path> 
  </g>
  </svg>
  `;
  infoCell.classList.add("info_button");
  row.appendChild(infoCell);
  console.log(faculty_load_and_salary);
  for (let header of faculty_headers.slice(0, -2)) {
    const cell = document.createElement("td");
    let cellinput = document.createElement("input");
    cellinput.classList.add(header.trim());
    if (header === "position") {
      cellinput = await createPositionInput(data["position"]);
    } else {
      if (header === "full_name") {
        cellinput.setAttribute("type", "text");
      } else {
        cellinput.setAttribute("type", "number");
      }
      cellinput.value = data[header];
      cellinput.setAttribute("value", data[header]);
    }
    cell.appendChild(cellinput);
    row.append(cell);
  }
  let cell = document.createElement("td");
  let celltext = document.createElement("span");
  celltext.innerText = faculty_load_and_salary["load"];
  celltext.classList.add("load");
  cell.appendChild(celltext);
  row.appendChild(cell);
  cell = document.createElement("td");
  celltext = document.createElement("span");
  celltext.innerText = faculty_load_and_salary["salary"];
  celltext.classList.add("salary");
  cell.appendChild(celltext);
  row.appendChild(cell);
  table.appendChild(row);
}
