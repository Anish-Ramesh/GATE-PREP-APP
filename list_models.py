import google.generativeai as genai
import os

API_KEY = "AIzaSyBIu8sPpNs4sYcye8dR7MiuDRZdmCLhdjg"
genai.configure(api_key=API_KEY)

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
