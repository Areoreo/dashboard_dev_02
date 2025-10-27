#!/usr/bin/env python3
"""
Script to generate yearly forecast GeoJSON files from historical data.

This script:
1. Reads historical yearly GeoJSON files
2. Extracts 2019 and 2020 data
3. Creates forecast versions with 2025 and 2026 data
4. Combines both years into single forecast file

Usage:
    python scripts/generate_geojson_forecast_yearly.py
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List

# Configuration
BASE_DIR = Path(__file__).parent.parent / "data" / "ERA5"
VAR_TYPES = ["Yield", "Area", "Production", "yieldAnom"]
ADMIN_LEVELS = ["Country", "Prov"]

# Year mapping for yearly data
YEAR_MAPPING = {2019: 2025, 2020: 2026}


def extract_yearly_properties(properties: dict) -> dict:
    """
    Extract 2019 and 2020 yearly data and rename to 2025 and 2026.

    Args:
        properties: Original feature properties

    Returns:
        New properties dict with only 2025 and 2026 yearly data
    """
    new_properties = {}

    # Keep non-temporal properties
    for key, value in properties.items():
        if not re.match(r'y\d{4}', key):
            new_properties[key] = value

    # Extract and rename yearly temporal properties
    for key, value in properties.items():
        match = re.match(r'y(\d{4})$', key)  # Match only y{YYYY}, not y{YYYYMM}
        if match:
            year = int(match.group(1))

            # Check if this year should be mapped
            if year in YEAR_MAPPING:
                target_year = YEAR_MAPPING[year]
                new_key = f"y{target_year}"
                new_properties[new_key] = value

    return new_properties


def process_geojson_file_yearly(input_path: Path, output_path: Path):
    """
    Process a yearly GeoJSON file to extract 2019 & 2020 and create 2025 & 2026 data.

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
                    feature['properties'] = extract_yearly_properties(feature['properties'])

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
    Process all yearly GeoJSON files for a variable type.

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

    # Process each admin level - ONLY Yearly
    for admin_level in ADMIN_LEVELS:
        hist_path = hist_dir / admin_level / "Yearly"

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
            forecast_path = forecast_dir / admin_level / "Yearly" / forecast_filename

            print(f"    Extract 2019 & 2020 → 2025 & 2026: {hist_file.name}")

            if not dry_run:
                success = process_geojson_file_yearly(hist_file, forecast_path)
                if success:
                    files_processed += 1
            else:
                files_processed += 1

    if files_processed > 0:
        print(f"\n  Total files processed: {files_processed}")
    else:
        print(f"\n  No files processed")


def main():
    """Main execution function."""
    print("="*60)
    print("Yearly GeoJSON Forecast Generation Script")
    print("="*60)
    print(f"Base directory: {BASE_DIR}")
    print(f"Variables to process: {', '.join(VAR_TYPES)}")
    print(f"Source years: 2019, 2020")
    print(f"Target years: 2025, 2026")
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
