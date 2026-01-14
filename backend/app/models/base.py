# solo para evitar importaciones circulares
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()
