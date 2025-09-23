import google.generativeai as genai
import ast
import json
from PIL import Image
from constants import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)


def analyze_image(img: Image, dict_of_vars: dict):
    model = genai.GenerativeModel(model_name="gemini-1.5-flash")
    dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)

    prompt = (
        "You are analyzing an image with mathematical expressions, equations, or graphical problems. "
        "Follow the PEMDAS rule (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction). "
        "Handle exactly one of these 5 cases:\n\n"

        "1. **Simple expressions** (e.g., 2+2, 3*4): "
        "Return a JSON array of one object like "
        '[{\"expr\": \"2 + 2\", \"result\": 4}].\n\n'

        "2. **Set of equations** (e.g., x^2+2x+1=0, 3y+4x=0): "
        "Return a JSON array of objects, one per variable, e.g. "
        '[{\"expr\": \"x\", \"result\": 2, \"assign\": true}, {\"expr\": \"y\", \"result\": 5, \"assign\": true}].\n\n'

        "3. **Assignments** (e.g., x=4, y=5): "
        "Return a JSON array of objects with 'assign': true, e.g. "
        '[{\"expr\": \"x\", \"result\": 4, \"assign\": true}].\n\n'

        "4. **Graphical math problems** (like drawings of cars colliding, trigonometry, Pythagorean theorem): "
        "Return one JSON object with the interpretation and answer.\n\n"

        "5. **Abstract concepts** (like drawings of love, hate, patriotism, historic references): "
        "Return one JSON object with the explanation as 'expr' and the abstract concept as 'result'.\n\n"

        f"IMPORTANT RULES:\n"
        f"- Use ONLY valid JSON with double quotes.\n"
        f"- Do NOT use single quotes.\n"
        f"- Do NOT wrap the JSON in markdown (no ```json ... ```).\n"
        f"- Return ONLY a JSON array of objects.\n"
        f"- Here are the already assigned variables: {dict_of_vars_str}\n"
    )

    response = model.generate_content([prompt, img])
    raw_text = response.text.strip()
    print("RAW RESPONSE FROM GEMINI:\n", raw_text)

    # Clean accidental markdown wrappers like ```json ... ```
    if raw_text.startswith("```"):
        parts = raw_text.split("```")
        if len(parts) >= 2:
            raw_text = parts[1].strip()

    answers = []
    # Try JSON parsing first
    try:
        answers = json.loads(raw_text)
    except Exception as e_json:
        print("JSON parse failed, trying literal_eval:", e_json)
        try:
            answers = ast.literal_eval(raw_text)
        except Exception as e_ast:
            print("Both parsing attempts failed:", e_ast)
            answers = []

    # Normalize assign key
    for answer in answers:
        if "assign" in answer:
            answer["assign"] = bool(answer["assign"])
        else:
            answer["assign"] = False

    print("RETURNED ANSWER:", answers)
    return answers
import google.generativeai as genai
import ast
import json
from PIL import Image
from constants import GEMINI_API_KEY

genai.configure(api_key=GEMINI_API_KEY)


def analyze_image(img: Image, dict_of_vars: dict):
    model = genai.GenerativeModel(model_name="gemini-2.5-flash")
    dict_of_vars_str = json.dumps(dict_of_vars, ensure_ascii=False)

    prompt = (
        "You are analyzing an image with mathematical expressions, equations, or graphical problems. "
        "Follow the PEMDAS rule (Parentheses, Exponents, Multiplication/Division, Addition/Subtraction). "
        "Handle exactly one of these 5 cases:\n\n"

        "1. **Simple expressions** (e.g., 2+2, 3*4): "
        "Return a JSON array of one object like "
        '[{\"expr\": \"2 + 2\", \"result\": 4}].\n\n'

        "2. **Set of equations** (e.g., x^2+2x+1=0, 3y+4x=0): "
        "Return a JSON array of objects, one per variable, e.g. "
        '[{\"expr\": \"x\", \"result\": 2, \"assign\": true}, {\"expr\": \"y\", \"result\": 5, \"assign\": true}].\n\n'

        "3. **Assignments** (e.g., x=4, y=5): "
        "Return a JSON array of objects with 'assign': true, e.g. "
        '[{\"expr\": \"x\", \"result\": 4, \"assign\": true}].\n\n'

        "4. **Graphical math problems** (like drawings of cars colliding, trigonometry, Pythagorean theorem): "
        "Return one JSON object with the interpretation and answer.\n\n"

        "5. **Abstract concepts** (like drawings of love, hate, patriotism, historic references): "
        "Return one JSON object with the explanation as 'expr' and the abstract concept as 'result'.\n\n"

        f"IMPORTANT RULES:\n"
        f"- Use ONLY valid JSON with double quotes.\n"
        f"- Do NOT use single quotes.\n"
        f"- Do NOT wrap the JSON in markdown (no ```json ... ```).\n"
        f"- Return ONLY a JSON array of objects.\n"
        f"- Here are the already assigned variables: {dict_of_vars_str}\n"
    )

    response = model.generate_content([prompt, img])
    raw_text = response.text.strip()
    print("RAW RESPONSE FROM GEMINI:\n", raw_text)

    # Clean accidental markdown wrappers like ```json ... ```
    if raw_text.startswith("```"):
        parts = raw_text.split("```")
        if len(parts) >= 2:
            raw_text = parts[1].strip()

    answers = []
    # Try JSON parsing first
    try:
        answers = json.loads(raw_text)
    except Exception as e_json:
        print("JSON parse failed, trying literal_eval:", e_json)
        try:
            answers = ast.literal_eval(raw_text)
        except Exception as e_ast:
            print("Both parsing attempts failed:", e_ast)
            answers = []

    # Normalize assign key
    for answer in answers:
        if "assign" in answer:
            answer["assign"] = bool(answer["assign"])
        else:
            answer["assign"] = False

    print("RETURNED ANSWER:", answers)
    return answers
