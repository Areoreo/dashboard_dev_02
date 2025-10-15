#!/usr/bin/env python3
"""
Script to generate forecast GeoJSON files from historical data.

This script:
1. Reads historical GeoJSON files (containing all years of data)
2. Extracts only 2019 and 2020 data
3. Creates forecast versions with 2025 and 2026 data
4. Removes all other years from the forecast files

Usage:
    python scripts/generate_geojson_forecast.py
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
DATE_TYPES = ["Monthly", "Yearly"]

# Year mapping
YEAR_MAPPING = {2019: 2025, 2020: 2026}


def extract_and_rename_properties(properties: dict, year_offset: int) -> dict:
    """
    Extract 2019 or 2020 data and rename to 2025 or 2026.

    Args:
        properties: Original feature properties
        year_offset: 6 for 2019->2025, 6 for 2020->2026

    Returns:
        New properties dict with only renamed year data
    """
    new_properties = {}
    source_year = 2019 if year_offset == 6 else 2020
    target_year = 2025 if year_offset == 6 else 2026

    # Keep non-temporal properties (like 'name')
    for key, value in properties.items():
        if not re.match(r'y\d{4}', key):
            new_properties[key] = value

    # Extract and rename temporal properties
    # Pattern: y{YYYY}{MM} for monthly, y{YYYY} for yearly
    for key, value in properties.items():
        match = re.match(r'y(\d{4})(\d{2})?', key)
        if match:
            year = int(match.group(1))
            month = match.group(2) if match.group(2) else None

            # Only process source year (2019 or 2020)
            if year == source_year:
                if month:
                    new_key = f"y{target_year}{month}"
                else:
                    new_key = f"y{target_year}"
                new_properties[new_key] = value

    return new_properties


def process_geojson_file_combined(input_path: Path, output_path: Path):
    """
    Process a single GeoJSON file to extract 2019 & 2020 data and create 2025 & 2026 data.

    Args:
        input_path: Path to input historical GeoJSON file
        output_path: Path to output forecast GeoJSON file
    """
    try:
        # Read input file
        with open(input_path, 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)

        # Process each feature - combine both years
        if 'features' in geojson_data:
            for feature in geojson_data['features']:
                if 'properties' in feature:
                    original_props = feature['properties'].copy()
                    new_properties = {}

                    # Keep non-temporal properties
                    for key, value in original_props.items():
                        if not re.match(r'y\d{4}', key):
                            new_properties[key] = value

                    # Process both 2019->2025 and 2020->2026
                    for source_year, target_year in YEAR_MAPPING.items():
                        for key, value in original_props.items():
                            match = re.match(r'y(\d{4})(\d{2})?', key)
                            if match:
                                year = int(match.group(1))
                                month = match.group(2) if match.group(2) else None

                                if year == source_year:
                                    if month:
                                        new_key = f"y{target_year}{month}"
                                    else:
                                        new_key = f"y{target_year}"
                                    new_properties[new_key] = value

                    feature['properties'] = new_properties

        # Update name field if present
        if 'name' in geojson_data:
            name = geojson_data['name']
            # Replace Hist with Forecast
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

                print(f"    Extract 2019 & 2020 → 2025 & 2026: {hist_file.name}")

                if not dry_run:
                    success = process_geojson_file_combined(hist_file, forecast_path)
                    if success:
                        files_processed += 1
                else:
                    files_processed += 1

    if files_processed > 0:
        print(f"\n  Total files processed: {files_processed}")
    else:
        print(f"\n  No GeoJSON files found to process")


def main():
    """Main execution function."""
    print("="*60)
    print("GeoJSON Forecast Generation Script")
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
