#!/usr/bin/env python3
"""
Fix NaN values in GeoJSON files by replacing them with null.

NaN is not valid JSON. This script:
1. Reads JSON files as text
2. Replaces NaN literals with null
3. Validates the result can be parsed as JSON
4. Creates backups before modification
"""

import json
import re
from pathlib import Path
import shutil
from datetime import datetime

# Configuration
BASE_DIR = Path("/mnt/e/Works/Github_repo/dashboard_dev_02")
DATA_DIR = BASE_DIR / "data"

def has_nan_values(file_path):
    """Check if a file contains NaN values."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Check for NaN as a standalone value (not part of a word)
            # Match patterns like: : NaN, or : NaN}
            return bool(re.search(r':\s*NaN\s*[,}\]]', content))
    except Exception as e:
        print(f"Error checking {file_path}: {e}")
        return False

def fix_nan_in_file(file_path, create_backup=True):
    """Fix NaN values in a GeoJSON file by replacing with null."""
    try:
        # Read file content as text
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check if file has NaN values
        if not re.search(r':\s*NaN\s*[,}\]]', content):
            return False, "No NaN values found"

        # Replace NaN with null
        # Match NaN that appears as a value (after :, within arrays, etc.)
        fixed_content = re.sub(r':\s*NaN\s*([,}\]])', r': null\1', content)

        # Also handle NaN in arrays [NaN,
        fixed_content = re.sub(r'\[\s*NaN\s*,', r'[null,', fixed_content)
        fixed_content = re.sub(r',\s*NaN\s*\]', r', null]', fixed_content)
        fixed_content = re.sub(r',\s*NaN\s*,', r', null,', fixed_content)

        # Verify the result is valid JSON
        try:
            json.loads(fixed_content)
        except json.JSONDecodeError as e:
            return False, f"Fixed content is not valid JSON: {e}"

        # Create backup if requested
        if create_backup:
            backup_path = file_path.parent / f"{file_path.stem}_backup_nan_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_path.suffix}"
            shutil.copy2(file_path, backup_path)

        # Write fixed content
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(fixed_content)

        return True, "Fixed successfully"

    except Exception as e:
        return False, f"Error: {e}"

def find_files_with_nan(search_pattern="**/*.geojson"):
    """Find all files that contain NaN values."""
    files_with_nan = []

    for file_path in DATA_DIR.rglob(search_pattern):
        if 'backup' in file_path.name:
            continue
        if has_nan_values(file_path):
            files_with_nan.append(file_path)

    return files_with_nan

def main(dry_run=True, search_pattern="**/yieldAnom/**/*.geojson"):
    """Main function to fix NaN values."""
    print("=" * 70)
    print("NaN Value Fixer for GeoJSON Files")
    print("=" * 70)

    if dry_run:
        print("🔍 DRY RUN MODE - No files will be modified")
    else:
        print("⚠️  LIVE MODE - Files will be modified")

    print(f"Search pattern: {search_pattern}\n")

    # Find files with NaN values
    print("Searching for files with NaN values...")
    files_with_nan = find_files_with_nan(search_pattern)

    if not files_with_nan:
        print("✅ No files with NaN values found!")
        return

    print(f"Found {len(files_with_nan)} files with NaN values:\n")

    # Statistics
    stats = {
        'total': len(files_with_nan),
        'fixed': 0,
        'errors': 0
    }

    # Process each file
    for i, file_path in enumerate(files_with_nan, 1):
        relative_path = file_path.relative_to(DATA_DIR)
        print(f"[{i}/{len(files_with_nan)}] {relative_path}")

        if dry_run:
            print(f"   Would fix NaN values in this file")
        else:
            success, message = fix_nan_in_file(file_path, create_backup=True)
            if success:
                print(f"   ✅ {message}")
                stats['fixed'] += 1
            else:
                print(f"   ❌ {message}")
                stats['errors'] += 1

    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total files with NaN: {stats['total']}")
    if not dry_run:
        print(f"Successfully fixed: {stats['fixed']}")
        print(f"Errors: {stats['errors']}")
    print("=" * 70)

    if dry_run:
        print("\n⚠️  This was a DRY RUN. No files were modified.")
        print("Run with --execute to actually fix the files.")

if __name__ == "__main__":
    import sys

    # Check for command line arguments
    execute = '--execute' in sys.argv

    # Get search pattern if provided
    search_pattern = "**/yieldAnom/**/*.geojson"
    if '--all' in sys.argv:
        search_pattern = "**/*.geojson"

    if execute:
        print("\n⚠️  WARNING: This will modify files!")
        print("Press Ctrl+C within 3 seconds to cancel...")
        import time
        try:
            time.sleep(3)
        except KeyboardInterrupt:
            print("\n\nCancelled by user.")
            sys.exit(0)

        main(dry_run=False, search_pattern=search_pattern)
    else:
        main(dry_run=True, search_pattern=search_pattern)
