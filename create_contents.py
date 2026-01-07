import os

# ------------ AUTO PROJECT ROOT ------------
ROOT_FOLDER = os.getcwd()   # detects the folder where the script is executed
OUTPUT_FILE = os.path.join(ROOT_FOLDER, "project_files_output.txt")

# Valid file types to include
VALID_EXTENSIONS = {
    ".js", ".jsx", ".ts", ".tsx",
    ".json",
    ".css", ".scss",
    ".html",
    ".md"
}

# Folders to ignore
EXCLUDE_DIRS = {
    "node_modules",
    "dist",
    "log",
    "logs",
    "icon",
    "icons",
    ".git",
    "build",
    "coverage",
    ".next"
}

# Individual files to ignore
EXCLUDE_FILES = {
    "package.json",       # <-- newly added
    "package-lock.json",
    "yarn.lock",
    "pnpm-lock.yaml"
}

# File extensions to ignore
EXCLUDE_EXTENSIONS = {
    ".log"
}

def is_valid_file(filename):
    file_lower = filename.lower()

    # Skip specific filenames
    if file_lower in EXCLUDE_FILES:
        return False

    # Skip excluded extensions
    ext = os.path.splitext(filename)[1].lower()
    if ext in EXCLUDE_EXTENSIONS:
        return False

    return ext in VALID_EXTENSIONS

def should_skip_dir(dirname):
    return dirname.lower() in EXCLUDE_DIRS

def export_files():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        for root, dirs, files in os.walk(ROOT_FOLDER):

            # Remove excluded folders
            dirs[:] = [d for d in dirs if not should_skip_dir(d)]

            for file in files:
                if is_valid_file(file):
                    file_path = os.path.join(root, file)

                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                    except Exception as e:
                        content = f"<<ERROR READING FILE: {e}>>"

                    out.write(f"\n\n=== FILE: {file_path} ===\n")
                    out.write(content)
                    out.write("\n")


if __name__ == "__main__":
    print(f"Scanning project root: {ROOT_FOLDER}")
    export_files()
    print(f"Done! File saved at:\n{OUTPUT_FILE}")
