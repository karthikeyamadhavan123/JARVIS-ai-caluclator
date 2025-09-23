from pydantic import BaseModel
from typing import Optional, Dict
class ImageData(BaseModel):
    image: str
    dict_of_vars: Optional[Dict]=None