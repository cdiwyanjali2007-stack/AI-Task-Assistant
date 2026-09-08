import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware


# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Get API key from environment
api_key = os.getenv("OPENROUTER_API_KEY")

# Initialize OpenRouter Client
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=api_key,
)

class TaskRequest(BaseModel):
    task: str

@app.post("/generate-steps")
async def generate_steps(request: TaskRequest):
    try:
        if not api_key:
            raise HTTPException(status_code=500, detail="OpenRouter API Key is missing in .env file.")

        prompt = f"""
        Break down the following task into a clear, actionable, step-by-step guide.
        Task: {request.task}
        Provide the response strictly as a JSON list of strings, where each string is a distinct step. Do not include markdown formatting like ```json or ```, just return the raw JSON array string.
        """
        
        # Using OpenRouter Free Model so no credits are required
        response = client.chat.completions.create(
            model="openrouter/free", 
            messages=[
                {"role": "user", "content": prompt}
            ],
            temperature=0.7
        )
        
        result_text = response.choices[0].message.content.strip()
        
        # Clean up markdown if the AI mistakenly added it
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        return {"steps": result_text.strip()}
        
    except Exception as e:
        print(f"Error occurred: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port)