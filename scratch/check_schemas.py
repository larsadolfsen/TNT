import os
import re
import json

blocks_dir = r"c:\Users\LAAD\.gemini\antigravity\scratch\TNT\blocks"
sections_dir = r"c:\Users\LAAD\.gemini\antigravity\scratch\TNT\sections"

def analyze_dir(directory):
    print(f"Analyzing directory: {directory}")
    for filename in os.listdir(directory):
        if not filename.endswith(".liquid"):
            continue
        filepath = os.path.join(directory, filename)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Find schema
        match = re.search(r"{%\s*schema\s*%}(.*?){%\s*endschema\s*%}", content, re.DOTALL)
        if not match:
            continue
        
        schema_str = match.group(1).strip()
        try:
            schema = json.loads(schema_str)
        except Exception as e:
            print(f"Error parsing schema in {filename}: {e}")
            continue
        
        settings = schema.get("settings", [])
        padding_settings = []
        for setting in settings:
            sid = setting.get("id", "")
            if "padding" in sid or "afstand" in sid or sid == "padding":
                padding_settings.append(setting)
            elif "label" in setting and isinstance(setting["label"], str) and ("afstand" in setting["label"].lower() or "padding" in setting["label"].lower()):
                padding_settings.append(setting)
                
        if padding_settings:
            print(f"\nFile: {filename}")
            for p in padding_settings:
                print(f"  ID: {p.get('id')}, Type: {p.get('type')}, Label: {p.get('label')}, Default: {p.get('default')}, Min: {p.get('min')}, Max: {p.get('max')}, Step: {p.get('step')}")
        else:
            # Let's see if there are any inline styles or classes referencing padding
            inline_padding = re.findall(r"padding[-:\s\w]+", content)
            if inline_padding:
                print(f"\nFile: {filename} (No schema padding settings, but references padding in template: {list(set(inline_padding))})")

print("--- BLOCKS ---")
analyze_dir(blocks_dir)
print("\n--- SECTIONS ---")
analyze_dir(sections_dir)
