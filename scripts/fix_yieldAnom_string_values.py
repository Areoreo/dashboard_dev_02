#!/usr/bin/env python3
"""
Fix yieldAnom GeoJSON files that have string numbers instead of float numbers.

This script:
1. Finds all yieldAnom GeoJSON files
2. Converts string numeric values to actual float/int numbers
3. Preserves null values and non-numeric properties
4. Creates backups before modification
"""

import json
import os
from pathlib import Path
import shutil
from datetime import datetime

# Configuration
BASE_DIR = Path("/mnt/e/Works/Github_repo/dashboard_dev_02")
DATA_DIR = BASE_DIR / "data"

def is_numeric_string(value):
    """Check if a value is a numeric string."""
    if not isinstance(value, str):
        return False
    try:
        float(value)
        return True
    except (ValueError, TypeError):
        return False

def convert_string_to_number(value):
    """Convert a string to int or float, preserving the appropriate type."""
    if not isinstance(value, str):
        return value

    try:
        # Try to convert to float first
        num = float(value)
        # If it's a whole number, convert to int
        if num.is_integer():
            return int(num)
        return num
    except (ValueError, TypeError):
        return value

def fix_feature_properties(properties):
    """Convert string numbers to actual numbers in feature properties."""
    fixed_properties = {}

    for key, value in properties.items():
        if value is None:
            # Preserve null values
            fixed_properties[key] = value
        elif is_numeric_string(value):
            # Convert numeric strings to numbers
            fixed_properties[key] = convert_string_to_number(value)
        else:
            # Keep non-numeric values as-is
            fixed_properties[key] = value

    return fixed_properties

def fix_geojson_file(file_path, create_backup=True):
    """Fix a single GeoJSON file by converting string numbers to floats."""
    try:
        # Read the file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        # Check if it's a FeatureCollection
        if data.get('type') != 'FeatureCollection':
            print(f"⚠️  Skipping {file_path.name}: Not a FeatureCollection")
            return False

        # Count conversions
        conversions = 0

        # Process each feature
        for feature in data.get('features', []):
            if 'properties' in feature:
                original_props = feature['properties']
                fixed_props = fix_feature_properties(original_props)

                # Count how many values were converted
                for key in original_props:
                    if isinstance(original_props[key], str) and not isinstance(fixed_props[key], str):
                        conversions += 1

                feature['properties'] = fixed_props

        if conversions == 0:
            print(f"✓ {file_path.name}: No string numbers found (already clean)")
            return False

        # Create backup if requested
        if create_backup:
            backup_path = file_path.parent / f"{file_path.stem}_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}{file_path.suffix}"
            shutil.copy2(file_path, backup_path)
            print(f"📦 Created backup: {backup_path.name}")

        # Write the fixed data back
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, separators=(',', ': '))

        print(f"✅ Fixed {file_path.name}: Converted {conversions} string values to numbers")
        return True

    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def find_yieldanom_files():
    """Find all yieldAnom GeoJSON files in the data directory."""
    yieldanom_files = []

    # Search for yieldAnom directories and files
    for root, dirs, files in os.walk(DATA_DIR):
        # Check if we're in a yieldAnom directory
        if 'yieldAnom' in root:
            for file in files:
                if file.endswith('.geojson') and 'yieldAnom' in file:
                    yieldanom_files.append(Path(root) / file)

    return sorted(yieldanom_files)

def main(dry_run=True, create_backups=True):
    """Main function to fix all yieldAnom files."""
    print("=" * 70)
    print("yieldAnom GeoJSON String-to-Number Converter")
    print("=" * 70)

    if dry_run:
        print("🔍 DRY RUN MODE - No files will be modified")
    else:
        print("⚠️  LIVE MODE - Files will be modified")
        if create_backups:
            print("📦 Backups will be created")

    print()

    # Find all yieldAnom files
    print("Searching for yieldAnom GeoJSON files...")
    yieldanom_files = find_yieldanom_files()

    print(f"Found {len(yieldanom_files)} yieldAnom GeoJSON files\n")

    if len(yieldanom_files) == 0:
        print("No files to process. Exiting.")
        return

    # Statistics
    stats = {
        'total': len(yieldanom_files),
        'fixed': 0,
        'clean': 0,
        'errors': 0
    }

    # Process each file
    for i, file_path in enumerate(yieldanom_files, 1):
        print(f"\n[{i}/{len(yieldanom_files)}] Processing: {file_path.relative_to(DATA_DIR)}")

        if dry_run:
            # In dry run, just check if file has issues
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)

                string_count = 0
                for feature in data.get('features', []):
                    for key, value in feature.get('properties', {}).items():
                        if is_numeric_string(value):
                            string_count += 1

                if string_count > 0:
                    print(f"   Would convert {string_count} string values")
                    stats['fixed'] += 1
                else:
                    print(f"   No string numbers found (already clean)")
                    stats['clean'] += 1
            except Exception as e:
                print(f"   Error: {e}")
                stats['errors'] += 1
        else:
            # Actually fix the file
            result = fix_geojson_file(file_path, create_backup=create_backups)
            if result:
                stats['fixed'] += 1
            else:
                stats['clean'] += 1

    # Print summary
    print("\n" + "=" * 70)
    print("SUMMARY")
    print("=" * 70)
    print(f"Total files processed: {stats['total']}")
    print(f"Files fixed: {stats['fixed']}")
    print(f"Files already clean: {stats['clean']}")
    print(f"Errors: {stats['errors']}")
    print("=" * 70)

    if dry_run:
        print("\n⚠️  This was a DRY RUN. No files were modified.")
        print("Run with --execute to actually fix the files.")

if __name__ == "__main__":
    import sys

    # Check for command line arguments
    execute = '--execute' in sys.argv
    no_backup = '--no-backup' in sys.argv

    if execute:
        print("\n⚠️  WARNING: This will modify files!")
        print("Press Ctrl+C within 3 seconds to cancel...")
        import time
        try:
            time.sleep(3)
        except KeyboardInterrupt:
            print("\n\nCancelled by user.")
            sys.exit(0)

        main(dry_run=False, create_backups=not no_backup)
    else:
        main(dry_run=True, create_backups=True)
