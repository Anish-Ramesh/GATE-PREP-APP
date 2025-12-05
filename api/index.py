import os
try:
    from flask import Flask, render_template, request, jsonify
    from flask_cors import CORS
    from dotenv import load_dotenv
    
    load_dotenv()
    
    app = Flask(__name__)
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Try importing genai
    try:
        from google import genai
        from google.genai import types
        genai_imported = True
        genai_error = None
    except ImportError as e:
        genai_imported = False
        genai_error = str(e)

except ImportError as e:
    # Fallback for basic Flask failure (unlikely if requirements installed)
    print(f"Critical Import Error: {e}")
    raise e

# Set your Gemini API key
API_KEY = os.getenv("GEMINI_API_KEY")

# Store chat history
history = []

SYSTEM_INSTRUCTION = """You are an expert GATE (Graduate Aptitude Test in Engineering) exam tutor...""" # Truncated for brevity, but kept in logic

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/debug', methods=['GET'])
def debug():
    return jsonify({
        "message": "Debug route working", 
        "path": request.path,
        "genai_imported": genai_imported,
        "genai_error": genai_error,
        "api_key_set": bool(API_KEY)
    })

# Catch-all route to debug path issues
@app.route('/<path:path>', methods=['GET', 'POST', 'OPTIONS'])
def catch_all(path):
    return jsonify({
        "message": "Catch-all route hit",
        "path": path,
        "full_path": request.path,
        "method": request.method
    }), 404

# Handle both /api/chat and /chat to be safe
@app.route('/chat', methods=['POST', 'GET', 'OPTIONS'])
@app.route('/api/chat', methods=['POST', 'GET', 'OPTIONS'])
def chat():
    if request.method == 'OPTIONS':
        return jsonify({}), 200
    
    if request.method == 'GET':
        return jsonify({"message": "Chat API is running"}), 200

    user_input = request.form.get('user_input')
    if not user_input:
        return jsonify({"error": "No user_input provided"}), 400
    
    try:
        if not genai_imported:
             return jsonify({"error": f"Google GenAI library failed to import: {genai_error}"}), 500

        # Initialize client here to avoid startup crash if env var is missing
        if not API_KEY:
            return jsonify({"error": "GEMINI_API_KEY not set on server"}), 500
        client = genai.Client(api_key=API_KEY)

        response = client.models.generate_content(
            model="gemini-2.5-flash", 
            contents=user_input,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
                temperature=0.7,
            )
        )
        ai_response = response.text

        # Update history
        history.append({"role": "user", "parts": [user_input]})
        history.append({"role": "model", "parts": [ai_response]})

        return jsonify({"response": ai_response})

    except Exception as e:
        print(f"Error generating response: {e}")
        return jsonify({"response": f"Error: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
