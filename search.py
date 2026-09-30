import os

def search_dir(dir_path, query):
    for root, dirs, files in os.walk(dir_path):
        if 'node_modules' in dirs:
            dirs.remove('node_modules')
        if '.next' in dirs:
            dirs.remove('.next')
        for file in files:
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'rb') as f:
                    content = f.read()
                    if query.encode('utf-8') in content or query.encode('latin-1') in content:
                        print(f"FOUND IN: {file_path}")
            except Exception as e:
                pass

search_dir('.', 'Error al registrar')
search_dir('.', 'ya est')
