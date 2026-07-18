import os

def find_db_files():
    base_path = r"C:\Users\ambil\.gemini"
    for root, dirs, files in os.walk(base_path):
        for file in files:
            if file.endswith('.db') or file.endswith('.json'):
                print(os.path.join(root, file))

find_db_files()
