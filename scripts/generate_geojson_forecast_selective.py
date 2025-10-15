#!/usr/bin/env python3
"""
Script to generate selective forecast GeoJSON files from historical data.

This script:
1. Reads historical GeoJSON files
2. Extracts ONLY specified months from 2019 and 2020
3. Creates forecast versions with specified target months
4. Example: 2019-11 to 2020-04 → 2025-11 to 2026-04

Usage:
    python scripts/generate_geojson_forecast_selective.py
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Tuple

# Configuration
BASE_DIR = Path(__file__).parent.parent / "data" / "ERA5"
VAR_TYPES = ["Yield", "Area", "Production", "yieldAnom"]
ADMIN_LEVELS = ["Country", "Prov"]
DATE_TYPES = ["Monthly", "Yearly"]

# Selective month mapping
# Format: (source_year, source_month) -> (target_year, target_month)
# For 2025-11 to 2026-04, we need:
# 2019-11, 2019-12, 2020-01, 2020-02, 2020-03, 2020-04
MONTH_MAPPING = {
    (2019, 11): (2025, 11),
    (2019, 12): (2025, 12),
    (2020, 1): (2026, 1),
    (2020, 2): (2026, 2),
    (2020, 3): (2026, 3),
    (2020, 4): (2026, 4),
}


def extract_selective_properties(properties: dict) -> dict:
    """
    Extract only specified months from properties and rename them.

    Args:
        properties: Original feature properties

    Returns:
        New properties dict with only selected months renamed
    """
    new_properties = {}

    # Keep non-temporal properties
    for key, value in properties.items():
        if not re.match(r'y\d{4}', key):
            new_properties[key] = value

    # Extract and rename only specified temporal properties
    for key, value in properties.items():
        match = re.match(r'y(\d{4})(\d{2})?', key)
        if match:
            year = int(match.group(1))
            month_str = match.group(2)

            if month_str:  # Monthly data
                month = int(month_str)

                # Check if this year-month combination is in our mapping
                if (year, month) in MONTH_MAPPING:
                    target_year, target_month = MONTH_MAPPING[(year, month)]
                    new_key = f"y{target_year}{target_month:02d}"
                    new_properties[new_key] = value

    return new_properties


def process_geojson_file_selective(input_path: Path, output_path: Path):
    """
    Process a GeoJSON file to extract only selected months.

    Args:
        input_path: Path to input historical GeoJSON file
        output_path: Path to output forecast GeoJSON file
    """
    try:
        # Read input file
        with open(input_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)

        # Process each feature
        if 'features' in geojson_data:
            for feature in geojson_data['features']:
                if 'properties' in feature:
                    feature['properties'] = extract_selective_properties(feature['properties'])

        # Update name field if present
        if 'name' in geojson_data:
            name = geojson_data['name']
            name = name.replace('Hist_', 'Forecast_')
            geojson_data['name'] = name

        # Create output directory if it doesn't exist
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # Write output file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(geojson_data, f, ensure_ascii=False, indent=2)

        return True

    except Exception as e:
        print(f"      ERROR processing {input_path.name}: {e}")
        return False


def process_variable(var_type: str, dry_run: bool = False):
    """
    Process all GeoJSON files for a variable type.

    Args:
        var_type: Variable type (Yield, Area, Production, yieldAnom)
        dry_run: If True, only print actions without executing
    """
    print(f"\n{'='*60}")
    print(f"Processing variable: {var_type}")
    print(f"{'='*60}")

    var_dir = BASE_DIR / var_type
    if not var_dir.exists():
        print(f"  Variable directory does not exist: {var_dir}")
        return

    hist_dir = var_dir / "Hist"
    if not hist_dir.exists():
        print(f"  No Hist directory found at {hist_dir}")
        return

    forecast_dir = var_dir / "Forecast"

    files_processed = 0

    # Process each admin level and date type
    for admin_level in ADMIN_LEVELS:
        for date_type in DATE_TYPES:
            hist_path = hist_dir / admin_level / date_type

            if not hist_path.exists():
                continue

            # Find all GeoJSON files
            geojson_files = list(hist_path.glob("*.geojson"))

            if not geojson_files:
                continue

            print(f"\n  Processing: {hist_path.relative_to(BASE_DIR)}")

            for hist_file in geojson_files:
                # Generate output filename (replace Hist with Forecast)
                forecast_filename = hist_file.name.replace('Hist_', 'Forecast_')

                # Create output path
                forecast_path = forecast_dir / admin_level / date_type / forecast_filename

                # Only process Monthly files (yearly doesn't have monthly granularity)
                if date_type == "Monthly":
                    print(f"    Extract months 2019-11 to 2020-04 → 2025-11 to 2026-04: {hist_file.name}")

                    if not dry_run:
                        success = process_geojson_file_selective(hist_file, forecast_path)
                        if success:
                            files_processed += 1
                    else:
                        files_processed += 1
                else:
                    print(f"    Skipping (Yearly): {hist_file.name}")

    if files_processed > 0:
        print(f"\n  Total files processed: {files_processed}")
    else:
        print(f"\n  No files processed")


def main():
    """Main execution function."""
    print("="*60)
    print("Selective GeoJSON Forecast Generation Script")
    print("="*60)
    print(f"Base directory: {BASE_DIR}")
    print(f"Variables to process: {', '.join(VAR_TYPES)}")
    print(f"Forecast months: 2025-11, 2025-12, 2026-01 to 2026-04")
    print("="*60)

    # Ask for confirmation
    response = input("\nDo you want to proceed? (yes/no/dry-run): ").strip().lower()

    if response not in ['yes', 'y', 'dry-run', 'dry']:
        print("Aborted.")
        return

    dry_run = response in ['dry-run', 'dry']

    if dry_run:
        print("\n*** DRY RUN MODE - No files will be modified ***\n")

    # Process each variable
    for var_type in VAR_TYPES:
        try:
            process_variable(var_type, dry_run)
        except Exception as e:
            print(f"\nERROR processing {var_type}: {e}")
            import traceback
            traceback.print_exc()

    print("\n" + "="*60)
    print("Processing complete!")
    print("="*60)


if __name__ == "__main__":
    main()
