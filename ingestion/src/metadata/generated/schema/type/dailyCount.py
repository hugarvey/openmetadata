# generated by datamodel-codegen:
#   filename:  schema/type/dailyCount.json
#   timestamp: 2021-09-28T21:56:25+00:00

from __future__ import annotations

from pydantic import BaseModel, Extra, Field, conint

from . import basic


class DailyCountOfSomeMeasurement(BaseModel):
    class Config:
        extra = Extra.forbid

    count: conint(ge=0) = Field(
        ..., description='Daily count of a measurement on the given date.'
    )
    date: basic.Date
