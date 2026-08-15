"""
StockSense AI - Final Production Packaging Script
Creates StockSense_AI_FINAL_REAL_MARKET_PLATFORM.zip with verified exclusions.
"""

import os
import zipfile
import shutil

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_NAME = "StockSense_AI_FINAL_REAL_MARKET_PLATFORM.zip"
ARCHIVE_PATH = os.path.join(PROJECT_ROOT, ARCHIVE_NAME)

EXCLUDED_DIRS = {
    "__pycache__",
    "node_modules",
    ".git",
    ".vscode",
    ".idea",
    ".vite"
}

EXCLUDED_EXTENSIONS = {
    ".pyc",
    ".pyo",
    ".pyd",
    ".log",
    ".DS_Store",
    ".tmp"
}

EXCLUDED_FILES = {
    ".env",
    "StockSense_AI_FINAL_REAL_MARKET_PLATFORM.zip",
    "package_release.py"
}

def should_exclude(rel_path: str) -> bool:
    parts = rel_path.replace("\\", "/").split("/")
    for part in parts:
        if part in EXCLUDED_DIRS:
            return True
    
    filename = os.path.basename(rel_path)
    if filename in EXCLUDED_FILES:
        return True
    
    _, ext = os.path.splitext(filename)
    if ext.lower() in EXCLUDED_EXTENSIONS:
        return True
    
    return False

def create_archive():
    print(f"Creating production archive: {ARCHIVE_PATH}")
    file_count = 0
    total_uncompressed_bytes = 0

    if os.path.exists(ARCHIVE_PATH):
        os.remove(ARCHIVE_PATH)

    with zipfile.ZipFile(ARCHIVE_PATH, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in EXCLUDED_DIRS]

            for file in sorted(files):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, PROJECT_ROOT)

                if should_exclude(rel_path):
                    continue

                zf.write(full_path, arcname=rel_path)
                file_count += 1
                total_uncompressed_bytes += os.path.getsize(full_path)

    zip_size_bytes = os.path.getsize(ARCHIVE_PATH)
    zip_size_mb = zip_size_bytes / (1024 * 1024)
    uncompressed_mb = total_uncompressed_bytes / (1024 * 1024)

    print("=" * 80)
    print("STOCKSENSE AI — FINAL PRODUCTION ARCHIVE SUMMARY")
    print("=" * 80)
    print(f"Archive Filename:          {ARCHIVE_NAME}")
    print(f"Full Archive Path:         {ARCHIVE_PATH}")
    print(f"Total Packaged Files:      {file_count}")
    print(f"Uncompressed Payload Size: {uncompressed_mb:.2f} MB")
    print(f"Compressed Archive Size:   {zip_size_mb:.2f} MB ({zip_size_bytes:,} bytes)")
    print("=" * 80)

if __name__ == "__main__":
    create_archive()
