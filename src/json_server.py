import uvicorn
from fastapi import FastAPI
from fastapi.responses import JSONResponse
import json
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

origins = [
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def read_json():
    with open("./../data/data.json", "r") as f:
        raw_json = json.loads(f.read())
        return JSONResponse(content=raw_json)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)