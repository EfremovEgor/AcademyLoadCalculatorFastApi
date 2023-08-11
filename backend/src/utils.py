import schemas
import os
import json
from typing import Any, Type, TypeVar
from copy import deepcopy

CWD = os.getcwd()
DATA_FOLDER = os.path.join(CWD, "data")
B = TypeVar(
    "B", schemas.Person, schemas.Position, schemas.PersonResponse, schemas.Subject
)
class_to_file = {
    schemas.Person: "persons.json",
    schemas.Position: "positions.json",
    schemas.Subject: "subjects.json",
    schemas.User: "users.json",
}


def override_schemas_file(data: list[B], cls: type[B]) -> None:
    file_name = class_to_file.get(cls, None)
    if file_name is None:
        return
    file_path = os.path.join(DATA_FOLDER, file_name)
    with open(file_path, "w") as f:
        json.dump([item.model_dump() for item in data], f, default=str, indent=4)


def append_persons_to_file(data: list[schemas.Person]) -> None:
    if not data:
        return
    file_name = class_to_file.get(type(data[0]), None)
    if file_name is None:
        return
    file_path = os.path.join(DATA_FOLDER, file_name)
    if not os.path.exists(file_path):
        open(file_path, "w")
        return

    previous_data = get_data_by_class(type(data[0]))
    for new_item in data:
        for item in deepcopy(previous_data):
            if item.full_name == new_item.full_name:
                break
        else:
            previous_data.append(new_item)
    with open(file_path, "w") as f:
        json.dump(
            [item.model_dump() for item in previous_data], f, default=str, indent=4
        )


def response_from_model(data: list[B] | B) -> list[dict] | dict:
    if isinstance(data, schemas.BaseModel):
        return json.loads(data.model_dump_json())
    return [json.loads(item.model_dump_json()) for item in data]


def calculate_actual_load(person: schemas.Person) -> tuple[float, float, float, float]:
    actual_load_masters = list([0, 0])
    actual_load_bachelor = list([0, 0])
    if person.full_name == "новый2":
        print(person)
    to_calculate = list()
    for subject in person.subjects:
        for item in to_calculate:
            if (
                item.name.lower().strip() == subject.name.lower().strip()
                and item.semester % 2 == subject.semester % 2
                and item.holding_type == "Лекция"
                and subject.holding_type == "Лекция"
                and item.study_level == subject.study_level
                and item.total_time_for_group == subject.total_time_for_group
            ):
                break
        else:
            to_calculate.append(subject)

    for subject in to_calculate:
        if subject.study_level == "Бакалавриат":
            actual_load_bachelor[not (subject.semester % 2)] += (
                subject.total_time_for_group * subject.semester_duration
            )
        if subject.study_level == "Магистратура":
            actual_load_masters[not (subject.semester % 2)] += (
                subject.total_time_for_group * subject.semester_duration
            )
    actual_load_masters.extend(actual_load_bachelor)

    return tuple(actual_load_masters)


def get_person_responses() -> list[schemas.PersonResponse] | list:
    positions: list[schemas.Position] = get_data_by_class(schemas.Position)
    persons: list[schemas.Person] = get_data_by_class(schemas.Person)
    data = list()
    for person in persons:
        position = find_element_by_field(positions, "position_name", person.position)
        if position is None:
            continue
        data.append(
            schemas.PersonResponse(
                **dict(person),
                load_from_rate=int(person.rate * position.load),
                salary_from_rate=person.rate * position.salary,
                actual_load=calculate_actual_load(person)
            )
        )
    return data


def find_element_by_field(
    elements: list[B],
    field: str,
    field_value: Any,
) -> B | None:
    try:
        return [
            element
            for element in elements
            if dict(element).get(field, None) is not None
            and dict(element).get(field, None) == field_value
        ][0]
    except IndexError:
        return None


def get_data_by_class(cls: Type[B]) -> list[B] | list:
    file_name = class_to_file.get(cls, None)
    if file_name is None:
        return list()
    file_path = os.path.join(DATA_FOLDER, file_name)
    if not os.path.exists(file_path):
        open(file_path, "w")
        return list()
    with open(file_path, "r") as f:
        try:
            data: list[cls] = json.load(f)
        except json.decoder.JSONDecodeError as ex:
            return list()
        if not data:
            return list()

    return [cls(**item) for item in data]


def get_subjects_by_study_level() -> dict:
    data = get_data_by_class(schemas.Subject)
    response = dict()
    for item in data:
        if response.get(item.study_level) is not None:
            response[item.study_level].append(item)
        else:
            response[item.study_level] = [item]
    print(response.keys())


def check_user(user: schemas.User) -> bool:
    users = get_data_by_class(schemas.User)
    for user_ in users:
        if user_ == user:
            return True
    return False


def get_unique_subjects_by_type(study_level: str) -> dict:
    data = get_data_by_class(schemas.Subject)
    response = dict()
    for item in data:
        if item.study_level != study_level:
            continue
        if response.get(item.subject_type) is not None:
            if item.name not in response[item.subject_type]:
                response[item.subject_type].append(item.name)
        else:
            response[item.subject_type] = [item.name]
    for key, value in response.items():
        response[key] = sorted(value)
    return response


def get_subject_by_group_name(study_level: str, name: str = None) -> dict:
    data = get_data_by_class(schemas.Subject)
    response = dict()
    for item in data:
        if item.study_level == study_level and (
            item.name.lower().strip() == name.lower().strip()
            if name is not None
            else True
        ):
            if response.get(item.group_name) is not None:
                response[item.group_name].append(item)
            else:
                response[item.group_name] = [item]
    return response


def get_subject_teacher(subject: schemas.Subject) -> schemas.Person | None:
    teachers = get_data_by_class(schemas.Person)
    for teacher in teachers:
        if subject in teacher.subjects:
            return teacher


def get_subjects_response_by_groups(study_level: str, name: str) -> dict:
    data = get_subject_by_group_name(study_level, name)
    for key, value in data.items():
        data[key] = [
            schemas.SubjectWithTeacherResponse(
                **dict(item), teacher=get_subject_teacher(item)
            )
            for item in value
        ]
    return data
