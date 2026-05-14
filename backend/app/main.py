from fastapi import FastAPI

app = FastAPI(title="Trady API")

@app.get("/")
def root():
    return {"message": "Trady API is running!"}