from fastapi import FastAPI
from utils import (
    get_data_by_class,
    response_from_model,
)
import utils
import json
import schemas
import pydantic_core
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Body
from typing import Any

SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
origins = ["*"]


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/subjects/unique/by_type")
def get_unique_subjects_by_type(study_level: str = Body(embed=True)) -> dict:
    data = utils.get_unique_subjects_by_type(study_level)
    return data


@app.post("/subjects/by_groups")
def get_subjects_response_by_groups(
    study_level: str = Body(), name: str = Body()
) -> dict:
    data = utils.get_subjects_response_by_groups(study_level, name)
    for key, value in data.items():
        data[key] = sorted(
            [response_from_model(item) for item in value],
            key=lambda a: a["holding_type"],
        )
    return data


@app.post("/persons/save")
def save_person(data: schemas.Person) -> str | None:
    utils.append_persons_to_file([data])
    return {"status": "success"}


@app.get("/persons")
def get_persons() -> list[schemas.PersonResponse]:
    return utils.get_person_responses()


@app.post("/persons/override")
def override_person_with_uuid(person: schemas.Person):
    data = utils.get_person_responses()
    for i in range(len(data)):
        if str(data[i].uuid) == str(person.uuid):
            data[i] = person

    utils.override_schemas_file(data, schemas.Person)
    return {"status": "success"}


@app.delete("/persons/delete/by_uuid")
def delete_person_by_uuid(uuid: str = Body(embed=True)) -> dict:
    data = utils.get_person_responses()
    utils.override_schemas_file(
        [person for person in data if str(person.uuid) != uuid], schemas.Person
    )
    return {"status": "success"}


@app.post("/login")
def login(user: schemas.User) -> bool:
    return utils.check_user(user)


@app.post("/persons/by_uuid")
def get_person_by_uuid(uuid: str = Body(embed=True)) -> schemas.PersonResponse:
    for person in utils.get_person_responses():
        if str(person.uuid) == uuid:
            return person


@app.post("/subjects/by_field")
def get_subjects_by_field(
    fields: list[str], values: list[Any]
) -> list[schemas.Subject]:
    # values = payload.values
    # fields = payload.fields
    return sorted(
        [
            item
            for item in get_data_by_class(schemas.Subject)
            if all(
                [
                    str(getattr(item, field)) == str(values[i])
                    for i, field in enumerate(fields)
                ]
            )
        ],
        key=lambda a: a.name,
    )


@app.get("/subjects")
def get_subjects() -> list[schemas.Subject]:
    return sorted(get_data_by_class(schemas.Subject), key=lambda a: a.name)


@app.get("/positions")
def get_positions() -> list[schemas.Position]:
    return get_data_by_class(schemas.Position)
