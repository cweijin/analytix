from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import io

app = FastAPI()

# Allow Frontend Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Ensure both origins are allowed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store Data in Memory
dataframes = {}

# Upload Files
@app.post("/upload")
async def upload_files(files: List[UploadFile] = File(...)): 
    results = []

    for file in files:
        filename = file.filename

        if filename.endswith('.csv'):
            content = await file.read()
            df = pd.read_csv(io.BytesIO(content))
            dataframes[filename] = df
            results.append({"filename": filename, "rows": len(df)}) 

        elif filename.endswith(('.xls', '.xlsx')):
            content = await file.read()
            df = pd.read_excel(io.BytesIO(content))
            dataframes[filename] = df
            results.append({"filename": filename, "rows": len(df)})

        else:
            results.append({"filename": filename, "error": "Unsupported file type."})

    for key in dataframes.keys():
        print(f"{key}, ")
    return {"files": results}

# Delete File
@app.delete("/upload/{filename}")
async def delete_file(filename: str):
    if filename in dataframes:
        del dataframes[filename]  # Remove file from memory
        print(f"Deleted file: {filename}")
        return {"message": f"{filename} has been deleted."}
    else:
        raise HTTPException(status_code=404, detail="File not found.")