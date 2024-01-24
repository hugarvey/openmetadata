"""Median function for MariaDB"""

from sqlalchemy.ext.compiler import compiles
from sqlalchemy.sql.functions import FunctionElement

from metadata.profiler.metrics.core import CACHE


class MariaDBMedianFn(FunctionElement):
    inherit_cache = CACHE


@compiles(MariaDBMedianFn)
def _(elements, compiler, **kwargs):  # pylint: disable=unused-argument
    col = compiler.process(elements.clauses.clauses[0])
    percentile = elements.clauses.clauses[2].value
    return f"PERCENTILE_CONT({percentile:.2f}) WITHIN GROUP (ORDER BY {col}) OVER()"
