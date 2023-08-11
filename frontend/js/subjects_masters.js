import { currentPage, loadHeader, serverURL, postJSON } from "./global.js";

const studyLevel = "Магистратура";
window.onload = function () {
  loadHeader(document);
  currentPage();
  addStaticEventListeners();
  addEventListenersToDynamicElements();
  createTables();
};
function createSubjectRow(value) {
  const row = document.createElement("tr");
  row.innerHTML = `     <tr>
  <td class="table_clickable">${value}</td>
</tr>`;
  return row;
}
function createTable(heading_text, components) {
  const table = document.createElement("table");
  table.innerHTML = `  
      <tr>
        <th class="table__heading-text">${heading_text}</th>
      </tr>
      `;
  const container = $(".container")[1];
  container.appendChild(table);
  for (let item of components) {
    table.appendChild(createSubjectRow(item));
  }
}
async function createTables() {
  let data = await postJSON(serverURL + "subjects/unique/by_type", {
    study_level: studyLevel,
  });
  data = Object.entries(data);
  for (let [key, value] of data) {
    createTable(key, value);
  }
  addEventListenersToDynamicElements();
}
function closeModals() {
  if ($("#modalInvestigateEmployeeDialog")[0].style.display == "flex") {
    $("#modalInvestigateEmployeeDialog")[0].style.display = "none";
  } else {
    $(".modal").css("display", "none");
  }
}
function createInvestigateSubjectTable(groupName, data) {
  const table = document.createElement("table");
  let credit = 0;
  if (data[0]["credit"] !== null) {
    credit = data[0]["credit"];
  }
  table.innerHTML = `  
  <tr>
    <th colspan="2" class="table__heading-text">${groupName}</th>
    <th class="table__heading-text">Кредит: ${credit}</th>
  </tr>
  <tr>
    <th class="table__heading-text">Тип</th>
    <th class="table__heading-text">Кол-во часов</th>
    <th class="table__heading-text">Преподаватель</th>
  </tr>
  `;
  const items = $(".modalInvestigateSubjectDialog-items")[0];
  items.appendChild(table);
  for (let item of data) {
    let id = "";
    let name = "";

    let className = "teacher_unclickable";
    const row = document.createElement("tr");
    if (item["teacher"] !== null) {
      id = item["teacher"]["uuid"];
      name = item["teacher"]["full_name"];
      className = "teacher_clickable";
    }
    row.innerHTML = `
    <tr>
      <td>${item["holding_type"]}</td>
      <td>${item["semester_duration"] * item["total_time_for_group"]}</td>
      <td class=${className} id=${id}>${name}</td>
    </tr>
    `;
    table.appendChild(row);
  }
}
async function refreshInvestigateForm(id) {
  const form = $("#investigateEmployeeForm")[0];
  form.reset();

  const data = await postJSON(serverURL + "persons/by_uuid", {
    uuid: id,
  });

  const change_full_name = $("#change_full_name")[0];
  console.log(change_full_name);
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
  change_position.value = data.position;
  change_position.setAttribute("value", data.position);

  const subjectsData = data.subjects;
  for (let subjectItem of subjectsData) {
    await createFilledSubjectForm(subjectItem);
  }
  const change_rate = $("#change_rate")[0];
  change_rate.value = data.rate;
  change_rate.setAttribute("value", data.rate);

  const modal = $("#modalInvestigateEmployeeDialog")[0];
  modal.style.display = "flex";
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
async function createFilledSubjectForm(subjectItem) {
  const subjectTemplate = document.createElement("subjectTemplate");
  subjectTemplate.innerHTML = `<form action="post" class="edit_person_add_subject_form" id="edit_person_add_subject_form">
  <div class="subject_main" id="subjects_edit_person">
      <select disabled class="subject_select" name="name" id="name">
      </select>
      <select disabled class="subject_select" name="group_name" id="group_name">
      </select>
      <select disabled class="subject_select" name="course" id="course">
      </select>
      <select disabled class="subject_select" name="semester" id="semester">
      </select>
      <select disabled class="subject_select" name="holding_type" id="holding_type">
      </select>
  </div>
</form>`;
  const subjects = $("#edit_person_add_subject")[0];
  const response = await fetch(serverURL + "subjects");
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
async function openInvestigateSubjectDialog(event) {
  const modal = $("#modalInvestigateSubjectDialog")[0];
  const modalItemList = $(".modalInvestigateSubjectDialog-items")[0];
  const heading = $(".modalInvestigateSubjectDialog-heading")[0];
  let subjectName = event.target.textContent.trim();
  heading.textContent = subjectName;
  modalItemList.innerHTML = ``;
  modal.style.display = "flex";
  let data = await postJSON(serverURL + "subjects/by_groups", {
    study_level: studyLevel,
    name: subjectName,
  });
  data = Object.entries(data);
  for (let [key, value] of data) {
    createInvestigateSubjectTable(key, value);
  }

  await addEventListenersToDynamicElements();
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModals();
  addEventListenersToDynamicElements();
});
document.addEventListener("click", (e) => {
  addEventListenersToDynamicElements();
});
window.onclick = function (event) {
  const modalWindows = $(".modal");
  for (let modal of modalWindows) {
    if (event.target == modal) {
      modal.style.display = "none";
    }
  }
};
function addStaticEventListeners() {
  $(".close_modal").on("click", closeModals);
}
async function openInvestigateTeacherDialog(event) {
  const modal = $("#modalInvestigateEmployeeDialog")[0];
  modal.style.display = "flex";
  $("#edit_person_add_subject")[0].innerHTML = "";

  // $("#investigateEmployeeForm")[0].innerHTML = "";
  await refreshInvestigateForm(event.target.id);

  console.log();
}
async function addEventListenersToDynamicElements() {
  const rows = $(".table_clickable");
  for (let row of rows) {
    row.removeEventListener("click", openInvestigateSubjectDialog, true);
    row.addEventListener("click", openInvestigateSubjectDialog);
  }
  const cells = $(".teacher_clickable ");
  for (let cell of cells) {
    cell.removeEventListener("click", openInvestigateTeacherDialog, true);
    cell.addEventListener("click", openInvestigateTeacherDialog);
  }
}
