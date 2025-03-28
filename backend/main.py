from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import pandas as pd
import numpy as np
import io
from pandasai import SmartDataframe
from pandasai.llm import OpenAI
import matplotlib.pyplot as plt
import base64


app = FastAPI()

# Allow Frontend Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

dataframes = {} # Store Data in Memory
prompt_history = [] # Store prompt history

# Initialize OpenAI LLM
llm = OpenAI(api_token="replace with key") # Insert key before use

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
    
# Retrieve the top N rows
@app.post("/get_rows")
async def get_rows(filename: str = Form(...), rows: int = Form(...)):
    if filename in dataframes:
        df = dataframes[filename].head(rows)
        # Replace NaN values with None
        df = df.replace({np.nan: None})
        return df.to_dict(orient="records")
    else:
        raise HTTPException(status_code=404, detail="File not found.")
    
# Prompt Question
@app.post("/ask")
async def ask_question(prompt: str = Form(...), filename: str = Form(...)):
    if filename in dataframes:
        df = dataframes[filename]
        # Set up SmartDataFrame
        smart_df = SmartDataframe(
            df,
            config={
                "llm": llm,
                "enable_cache": False, 
                "save_charts": True,  
                "save_charts_path": "exports/charts", 
            },
        )

        # Ask the question
        response = smart_df.chat(prompt)

        history = {"prompt": prompt, "filename": filename}

        if history not in prompt_history:
            prompt_history.append(history)

        # If the response is a file path, then it is a plot
        if isinstance(response, str) and response.endswith(".png"):
            # Read the saved image file
            with open(response, "rb") as image_file:
                # Convert the image to a base64-encoded string
                plot_base64 = base64.b64encode(image_file.read()).decode("utf-8")
                return {"answer": plot_base64, "type": "plot"}
        else:
            # Return the response as a string
            return {"answer": str(response), "type": "text"}
    raise HTTPException(status_code=404, detail="File not found.")
