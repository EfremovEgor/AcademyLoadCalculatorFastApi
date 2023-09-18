import { currentPage, loadHeader, serverURL, postJSON } from "./global.js";
let currentEditPerson = "";

window.onload = function () {
  // checkLogin();
  loadHeader(document);
  currentPage();
  refreshTable();
  addStaticEventListeners();
  setSelectOptions();
  addEventListenersToDynamicElements();
};
async function checkLogin() {
  console.log(1);
  const username = localStorage.getItem("username");
  const password = localStorage.getItem("password");
  console.log(username, password);
  if (username === null || password === null) {
    window.location.href = "/login";
  }
  const answer = await postJSON(serverURL + "login_req", {
    username: localStorage.getItem("username"),
    password: localStorage.getItem("password"),
  });
  if (!answer) {
    window.location.href = "/login";
  }
}
async function setSelectOptions() {
  const position_selects = $(".position_select");
  const response = await fetch(serverURL + "positions");
  const positions = await response.json();
  for (let position_select of position_selects) {
    for (let position of positions) {
      const option = document.createElement("option");
      option.innerText = position["position_name"];
      position_select.appendChild(option);
    }
  }
}

function createRow(data) {
  const table = $(".table")[0];
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
  const row = document.createElement("tr");
  infoCell.classList.add("info_button");
  row.id = data["uuid"];
  row.appendChild(infoCell);
  data = Object.entries(data);
  data = data.slice(1);

  for (const [key, value] of data.slice(0, -1)) {
    if (key != "subjects") {
      const cell = document.createElement("td");
      const cellText = document.createElement("span");
      cellText.classList.add("cell_text");
      cellText.innerText = value;
      cell.appendChild(cellText);
      row.appendChild(cell);
    }
  }

  for (const value of data.at(-1)[1]) {
    const cell = document.createElement("td");
    const cellText = document.createElement("span");
    cellText.classList.add("cell_text");
    cellText.innerText = value;
    cell.appendChild(cellText);
    row.appendChild(cell);
  }
  table.appendChild(row);
}
async function refreshTable() {
  const table = $("table")[0];
  const table_rows = Array.from(table.getElementsByTagName("tr"));
  if (table_rows.length > 1)
    for (let row of table_rows.slice(1)) {
      row.remove();
    }
  const response = await fetch(serverURL + "persons");
  const persons = await response.json();
  if (!persons.length) return;
  for (let person of persons) {
    createRow(person);
  }

  await addEventListenersToDynamicElements();
}

function openCreateEmployeeDialog() {
  for (let form of $("form")) {
    form.reset();
  }
  $("#new_person_add_subject")[0].innerHTML = "";
  const modal = $("#modalCreateEmployeeDialog")[0];
  modal.style.display = "flex";
}

function closeModals() {
  $(".modal").css("display", "none");
  currentEditPerson = "";
}

async function submitCreateEmployeeForm() {
  const data = new FormData($("#createEmployeeForm")[0]);
  const value = Object.fromEntries(data.entries());
  for (let property in value) {
    if (value[property].trim() === "") {
      value[property] = null;
    }
  }
  if (!isNaN(value["rate"])) value["rate"] = parseFloat(value["rate"]);
  const forms = $(".new_person_add_subject_form");
  value["subjects"] = [];
  for (let data_form of forms) {
    const formData = new FormData(data_form);
    const formValue = Object.fromEntries(formData.entries());
    // const subject = Array.from(

    // )[0];
    // const subject = await postJSON(serverURL);
    const subject = Array.from(
      await postJSON(serverURL + "subjects/by_field", {
        fields: Object.keys(formValue),
        values: Object.values(formValue),
      })
    )[0];

    value["subjects"].push(subject);
  }
  console.log(value);
  await postJSON(serverURL + "persons/save", value);
  await refreshTable();
}
async function submitEditEmployeeForm(e) {
  const data = new FormData($("#editEmployeeForm")[0]);
  const value = Object.fromEntries(data.entries());
  for (let property in value) {
    if (value[property].trim() === "") {
      value[property] = null;
    }
  }
  value["uuid"] = currentEditPerson;
  if (!isNaN(value["rate"])) value["rate"] = parseFloat(value["rate"]);
  Object.keys(value).forEach(
    (k) =>
      (value[k] = typeof value[k] === "string" ? value[k].trim() : value[k])
  );
  const forms = $(".edit_person_add_subject_form");
  value["subjects"] = [];
  for (let data_form of forms) {
    const formData = new FormData(data_form);
    const formValue = Object.fromEntries(formData.entries());
    const subject = Array.from(
      await postJSON(serverURL + "subjects/by_field", {
        fields: Object.keys(formValue),
        values: Object.values(formValue),
      })
    )[0];

    value["subjects"].push(subject);
  }
  const subjects = $("#edit_person_add_subject")[0];
  subjects.innerHTML = "";
  console.log(value);
  await postJSON(serverURL + "persons/override", value);
  await refreshTable();
  await refreshEditForm();
}
async function openEditEmployeeDialog(event) {
  $("#edit_person_add_subject")[0].innerHTML = "";
  currentEditPerson = event.target.parentElement.parentElement.id;
  currentEditPerson = event.target.parentElement.parentElement.id;
  await refreshEditForm();
}
async function deletePerson() {
  await postJSON(
    serverURL + "persons/delete/by_uuid",
    {
      uuid: currentEditPerson,
    },
    "DELETE"
  );
  closeModals();
  await refreshTable();
}
async function refreshEditForm() {
  const form = $("#editEmployeeForm")[0];
  form.reset();
  const data = await postJSON(serverURL + "persons/by_uuid", {
    uuid: currentEditPerson,
  });

  const change_full_name = $("#change_full_name")[0];
  change_full_name.value = data.full_name;
  change_full_name.setAttribute("value", data.full_name);

  const change_birth_date = $("#change_birth_date")[0];
  change_birth_date.value = data.birth_date;
  change_birth_date.setAttribute("value", data.birth_date);

  const change_phone_number = $("#change_phone_number")[0];
  change_phone_number.value = data.phone_number;
  change_phone_number.setAttribute("value", data.phone_number);

  const change_degree = $("#change_degree")[0];
  change_degree.value = data.degree;
  change_degree.setAttribute("value", data.degree);

  const change_academic_title = $("#change_academic_title")[0];
  change_academic_title.value = data.academic_title;
  change_academic_title.setAttribute("value", data.academic_title);

  const change_position = $("#change_position")[0];
  for (let child of change_position.children) {
    if (child.innerText.trim() === data.position) {
      child.selected = true;
      break;
    }
  }
  const subjectsData = data.subjects;
  for (let subjectItem of subjectsData) {
    await createFilledSubjectForm(subjectItem);
  }
  const change_rate = $("#change_rate")[0];
  change_rate.value = data.rate;
  change_rate.setAttribute("value", data.rate);

  const modal = $("#modalEditEmployeeDialog")[0];
  modal.style.display = "flex";
}
async function addSubjectEditPerson() {
  const subjectTemplate = document.createElement("subjectTemplate");
  subjectTemplate.innerHTML = `<form action="post" class="edit_person_add_subject_form" id="edit_person_add_subject_form">
  <div class="subject_main" id="subjects_edit_person">
      <select class="subject_select" name="name" id="name">
      <option value="" disabled selected>Предмет</option>
      </select>
      <select class="subject_select" name="group_name" id="group_name">
      <option value="" disabled selected>Группа</option>

      </select>
      <select class="subject_select" name="course" id="course">
      <option value="" disabled selected>Курс</option>
      </select>
      <select class="subject_select" name="semester" id="semester">
      <option value="" disabled selected>Семестр</option>
      </select>
      <select class="subject_select" name="holding_type" id="holding_type">
      <option value="" disabled selected>Тип</option>
      </select>
      <div class="remove_subject">
        <svg viewBox="-3.2 -3.2 38.40 38.40" version="1.1"
            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <title>minus-square</title>
                <desc>Created with Sketch Beta.</desc>
                <defs> </defs>
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"
                    sketch:type="MSPage">
                    <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-152.000000, -1035.000000)"
                        fill="#000000">
                        <path
                            d="M174,1050 L162,1050 C161.448,1050 161,1050.45 161,1051 C161,1051.55 161.448,1052 162,1052 L174,1052 C174.552,1052 175,1051.55 175,1051 C175,1050.45 174.552,1050 174,1050 L174,1050 Z M182,1063 C182,1064.1 181.104,1065 180,1065 L156,1065 C154.896,1065 154,1064.1 154,1063 L154,1039 C154,1037.9 154.896,1037 156,1037 L180,1037 C181.104,1037 182,1037.9 182,1039 L182,1063 L182,1063 Z M180,1035 L156,1035 C153.791,1035 152,1036.79 152,1039 L152,1063 C152,1065.21 153.791,1067 156,1067 L180,1067 C182.209,1067 184,1065.21 184,1063 L184,1039 C184,1036.79 182.209,1035 180,1035 L180,1035 Z"
                            id="minus-square" sketch:type="MSShapeGroup"> </path>
                    </g>
                </g>
            </g>
        </svg>
      </div>
  </div>
</form>`;
  const subjects = $("#edit_person_add_subject")[0];
  const response = await fetch(serverURL + "subjects");
  const subjectObjects = await response.json();
  for (let subject of getUniqueArrayByOneField("name", subjectObjects)) {
    const option = document.createElement("option");
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[0].appendChild(option);
  }

  for (let child of Array.from(
    subjectTemplate.children[0].children[0].children
  ).slice(1)) {
    child.disabled = true;
  }
  subjects.appendChild(subjectTemplate.children[0]);
  await addEventListenersToDynamicElements();
}
async function createFilledSubjectForm(subjectItem) {
  const subjectTemplate = document.createElement("subjectTemplate");
  subjectTemplate.innerHTML = `<form action="post" class="edit_person_add_subject_form" id="edit_person_add_subject_form">
  <div class="subject_main" id="subjects_edit_person">
      <select class="subject_select" name="name" id="name">
      </select>
      <select class="subject_select" name="group_name" id="group_name">
      </select>
      <select class="subject_select" name="course" id="course">
      </select>
      <select class="subject_select" name="semester" id="semester">
      </select>
      <select class="subject_select" name="holding_type" id="holding_type">
      </select>
      <div class="remove_subject">
        <svg viewBox="-3.2 -3.2 38.40 38.40" version="1.1"
            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <title>minus-square</title>
                <desc>Created with Sketch Beta.</desc>
                <defs> </defs>
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"
                    sketch:type="MSPage">
                    <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-152.000000, -1035.000000)"
                        fill="#000000">
                        <path
                            d="M174,1050 L162,1050 C161.448,1050 161,1050.45 161,1051 C161,1051.55 161.448,1052 162,1052 L174,1052 C174.552,1052 175,1051.55 175,1051 C175,1050.45 174.552,1050 174,1050 L174,1050 Z M182,1063 C182,1064.1 181.104,1065 180,1065 L156,1065 C154.896,1065 154,1064.1 154,1063 L154,1039 C154,1037.9 154.896,1037 156,1037 L180,1037 C181.104,1037 182,1037.9 182,1039 L182,1063 L182,1063 Z M180,1035 L156,1035 C153.791,1035 152,1036.79 152,1039 L152,1063 C152,1065.21 153.791,1067 156,1067 L180,1067 C182.209,1067 184,1065.21 184,1063 L184,1039 C184,1036.79 182.209,1035 180,1035 L180,1035 Z"
                            id="minus-square" sketch:type="MSShapeGroup"> </path>
                    </g>
                </g>
            </g>
        </svg>
      </div>
  </div>
</form>`;
  const subjects = $("#edit_person_add_subject")[0];
  let response = await fetch(serverURL + "subjects");
  let subjectObjects = await response.json();

  for (let subject of getUniqueArrayByOneField("name", subjectObjects)) {
    const option = document.createElement("option");
    if (subject == subjectItem.name) {
      option.selected = true;
    }
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[0].appendChild(option);
  }
  subjectObjects = await postJSON(serverURL + "subjects/by_field", {
    fields: ["name"],
    values: [subjectItem.name],
  });

  for (let subject of getUniqueArrayByOneField("group_name", subjectObjects)) {
    const option = document.createElement("option");
    if (subject == subjectItem.group_name) {
      option.selected = true;
    }
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[1].appendChild(option);
  }
  subjectObjects = await postJSON(serverURL + "subjects/by_field", {
    fields: ["name", "group_name"],
    values: [subjectItem.name, subjectItem.group_name],
  });

  for (let subject of getUniqueArrayByOneField("course", subjectObjects)) {
    const option = document.createElement("option");
    if (subject == subjectItem.course) {
      option.selected = true;
    }
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[2].appendChild(option);
  }
  subjectObjects = await postJSON(serverURL + "subjects/by_field", {
    fields: ["name", "group_name", "course"],
    values: [subjectItem.name, subjectItem.group_name, subjectItem.course],
  });

  for (let subject of getUniqueArrayByOneField("semester", subjectObjects)) {
    const option = document.createElement("option");
    if (subject == subjectItem.semester) {
      option.selected = true;
    }
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[3].appendChild(option);
  }
  subjectObjects = await postJSON(serverURL + "subjects/by_field", {
    fields: ["name", "group_name", "course", "semester"],
    values: [
      subjectItem.name,
      subjectItem.group_name,
      subjectItem.course,
      subjectItem.semester,
    ],
  });

  for (let subject of getUniqueArrayByOneField(
    "holding_type",
    subjectObjects
  )) {
    const option = document.createElement("option");
    if (subject == subjectItem.holding_type) {
      option.selected = true;
    }
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[4].appendChild(option);
  }
  subjects.appendChild(subjectTemplate.children[0]);
  await addEventListenersToDynamicElements();
}
async function addSubjectNewPerson() {
  const subjectTemplate = document.createElement("subjectTemplate");
  subjectTemplate.innerHTML = `<form action="post" class="new_person_add_subject_form" id="new_person_add_subject_form">
  <div class="subject_main" id="subjects_new_person">
      <select class="subject_select" name="name" id="name">
      <option value="" disabled selected>Предмет</option>

      </select>
      <select class="subject_select" name="group_name" id="group_name">
      <option value="" disabled selected>Группа</option>
      </select>
      <select class="subject_select" name="course" id="course">
      <option value="" disabled selected>Курс</option>
      </select>
      <select class="subject_select" name="semester" id="semester">
      <option value="" disabled selected>Семестр</option>
      </select>
      <select class="subject_select" name="holding_type" id="holding_type">
      <option value="" disabled selected>Тип</option>
      </select>
      <div class="remove_subject">
        <svg viewBox="-3.2 -3.2 38.40 38.40" version="1.1"
            xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
            xmlns:sketch="http://www.bohemiancoding.com/sketch/ns" fill="#000000">
            <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
            <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
                <title>minus-square</title>
                <desc>Created with Sketch Beta.</desc>
                <defs> </defs>
                <g id="Page-1" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd"
                    sketch:type="MSPage">
                    <g id="Icon-Set" sketch:type="MSLayerGroup" transform="translate(-152.000000, -1035.000000)"
                        fill="#000000">
                        <path
                            d="M174,1050 L162,1050 C161.448,1050 161,1050.45 161,1051 C161,1051.55 161.448,1052 162,1052 L174,1052 C174.552,1052 175,1051.55 175,1051 C175,1050.45 174.552,1050 174,1050 L174,1050 Z M182,1063 C182,1064.1 181.104,1065 180,1065 L156,1065 C154.896,1065 154,1064.1 154,1063 L154,1039 C154,1037.9 154.896,1037 156,1037 L180,1037 C181.104,1037 182,1037.9 182,1039 L182,1063 L182,1063 Z M180,1035 L156,1035 C153.791,1035 152,1036.79 152,1039 L152,1063 C152,1065.21 153.791,1067 156,1067 L180,1067 C182.209,1067 184,1065.21 184,1063 L184,1039 C184,1036.79 182.209,1035 180,1035 L180,1035 Z"
                            id="minus-square" sketch:type="MSShapeGroup"> </path>
                    </g>
                </g>
            </g>
        </svg>
      </div>
  </div>
</form>`;
  const subjects = $("#new_person_add_subject")[0];
  const response = await fetch(serverURL + "subjects");
  const subjectObjects = await response.json();
  for (let subject of getUniqueArrayByOneField("name", subjectObjects)) {
    const option = document.createElement("option");
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[0].appendChild(option);
  }

  for (let child of Array.from(
    subjectTemplate.children[0].children[0].children
  ).slice(1)) {
    child.disabled = true;
  }
  subjects.appendChild(subjectTemplate.children[0]);
  await addEventListenersToDynamicElements();
}
function addOptionsToSelect(select, data) {
  const option = document.createElement("option");
  option.innerText = data;
  select.appendChild(option);
}
function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}
function getUniqueArrayByOneField(fieldName, objects) {
  let data = Array();
  for (let object of objects) {
    data.push(object[fieldName]);
  }
  return data.filter(onlyUnique);
}
async function updateSubjectSelect(event) {
  const element = event.currentTarget;
  const nameSelect = element.parentNode.children[0];
  const groupNameSelect = element.parentNode.children[1];
  const courseSelect = element.parentNode.children[2];
  const semesterSelect = element.parentNode.children[3];
  const holdingTypeSelect = element.parentNode.children[4];

  switch (element.id) {
    case "name": {
      groupNameSelect.disabled = false;
      await postJSON(serverURL + "subjects/by_field", {
        fields: ["name"],
        values: [element.value.trim()],
      });
      const subjects = await postJSON(serverURL + "subjects/by_field", {
        fields: ["name"],
        values: [element.value.trim()],
      });
      groupNameSelect.innerHTML = "";
      for (let subject of getUniqueArrayByOneField("group_name", subjects)) {
        addOptionsToSelect(groupNameSelect, subject);
      }
      groupNameSelect.value = "Название группы";
      break;
    }
    case "group_name": {
      courseSelect.disabled = false;

      const subjects = await postJSON(serverURL + "subjects/by_field", {
        fields: ["name", "group_name"],
        values: [nameSelect.value.trim(), element.value.trim()],
      });
      courseSelect.innerHTML = "";
      for (let subject of getUniqueArrayByOneField("course", subjects)) {
        addOptionsToSelect(courseSelect, subject);
      }
      courseSelect.value = "Курс";
      break;
    }
    case "course": {
      semesterSelect.disabled = false;

      const subjects = await postJSON(serverURL + "subjects/by_field", {
        fields: ["name", "group_name", "course"],
        values: [
          nameSelect.value.trim(),
          groupNameSelect.value.trim(),
          element.value.trim(),
        ],
      });
      semesterSelect.innerHTML = "";
      for (let subject of getUniqueArrayByOneField("semester", subjects)) {
        addOptionsToSelect(semesterSelect, subject);
      }
      semesterSelect.value = "Семестр";
      break;
    }
    case "semester": {
      holdingTypeSelect.disabled = false;

      const subjects = await postJSON(serverURL + "subjects/by_field", {
        fields: ["name", "group_name", "course", "semester"],
        values: [
          nameSelect.value.trim(),
          groupNameSelect.value.trim(),
          courseSelect.value.trim(),
          element.value.trim(),
        ],
      });
      holdingTypeSelect.innerHTML = "";
      for (let subject of getUniqueArrayByOneField("holding_type", subjects)) {
        addOptionsToSelect(holdingTypeSelect, subject);
      }
      holdingTypeSelect.value = "Семестр";
      break;
    }
    case "holding_type":
      break;

    default:
      break;
  }
}
async function addSubSubject(event) {
  const element = event.target;
  const parent = element.parentNode.parentNode;
  const subjectTemplate = document.createElement("subjectTemplate");
  subjectTemplate.innerHTML = `<form class="new_person_add_sub_subject_form">
    <div class="input_container sub_subject">
        
            <select class="subject_select" name="name" id="name">
            </select>
            <select class="subject_select" name="group_name" id="group_name">
            </select>
            <select class="subject_select" name="course" id="course">
            </select>
            <select class="subject_select" name="semester" id="semester">
            </select>
            <select class="subject_select" name="holding_type" id="holding_type">
            </select>
       
    </div>
  </form>`;
  const response = await fetch(serverURL + "subjects");
  const subjectObjects = await response.json();

  for (let subject of getUniqueArrayByOneField("name", subjectObjects)) {
    const option = document.createElement("option");
    option.innerText = subject;
    subjectTemplate.children[0].children[0].children[0].appendChild(option);
  }

  for (let child of Array.from(
    subjectTemplate.children[0].children[0].children
  ).slice(1)) {
    child.disabled = true;
  }

  parent.appendChild(subjectTemplate.children[0]);
  await addEventListenersToDynamicElements();
}
function addStaticEventListeners() {
  $(".add_button").on("click", openCreateEmployeeDialog);
  $(".close_modal").on("click", closeModals);
  $(".submit_button").on("click", submitCreateEmployeeForm);
  $(".submit_edit_person_button").on("click", submitEditEmployeeForm);
  $(".delete_person_button").on("click", deletePerson);
  $(".add_subject_new_person").on("click", addSubjectNewPerson);
  $(".add_subject_edit_person").on("click", addSubjectEditPerson);
}
function removeSubject(event) {
  const element = event.target;
  const parent = element.parentNode.parentNode.parentNode;
  parent.remove();
}
async function addEventListenersToDynamicElements() {
  const infos = $(".info_button");
  for (let info of infos) {
    info.removeEventListener("click", openEditEmployeeDialog, true);
    info.addEventListener("click", openEditEmployeeDialog);
  }
  const subjectSelects = $(".subject_select");

  for (let select of subjectSelects) {
    select.removeEventListener("change", updateSubjectSelect, true);
    select.addEventListener("change", updateSubjectSelect);
  }

  const removeSubjectButtons = $(".remove_subject");
  for (let removeSubjectButton of removeSubjectButtons) {
    removeSubjectButton.removeEventListener("click", removeSubject, true);
    removeSubjectButton.addEventListener("click", removeSubject);
  }
  // const addSubSubjectButtons = $(".add_sub_subject");
  // for (let addSubSubjectButton of addSubSubjectButtons) {
  //   addSubSubjectButton.removeEventListener("click", addSubSubject, true);
  //   addSubSubjectButton.addEventListener("click", addSubSubject);
  // }
}
window.onclick = function (event) {
  const modalWindows = $(".modal");
  for (let modal of modalWindows) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
};
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModals();
  addEventListenersToDynamicElements();
});
document.addEventListener("click", (e) => {
  addEventListenersToDynamicElements();
});
