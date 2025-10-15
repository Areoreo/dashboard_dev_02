#!/usr/bin/env python3
"""
Script to standardize data file names and generate forecast placeholders.

This script:
1. Standardizes file names for historical data (2019-2020)
2. Copies 2019-2020 historical data to generate 2025-2026 forecast placeholders
3. Updates dates in TIF filenames
4. Updates timestamps in GeoJSON data

Usage:
    python scripts/generate_forecast_placeholders.py

Variables to process:
- Yield
- Area
- Production
- yieldAnom (Yield Anomaly)
"""

import os
import json
import shutil
import re
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Tuple

# Configuration
BASE_DIR = Path(__file__).parent.parent / "data"
VAR_TYPES = ["Yield", "Area", "Production", "yieldAnom"]
OVERVIEW_TYPES = ["Hist", "Forecast"]
ADMIN_LEVELS = ["Country", "Prov", "Grid"]
DATE_TYPES = ["Monthly", "Yearly"]

# Source and target years for placeholder generation
SOURCE_YEARS = [2019, 2020]
TARGET_YEARS = [2025, 2026]

# Year mapping: source -> target
YEAR_MAPPING = {2019: 2025, 2020: 2026}


def parse_filename(filename: str) -> Dict[str, str]:
    """
    Parse filename to extract components.

    Handles various formats:
    - Hist_Country_Monthly_Area_SEA.geojson
    - SEA_monthly_yield_country.geojson
    - SEA_yield_monthly_201901.tif
    - Hist_Grid_Monthly_Area_Cambodia_201901.tif
    """
    parts = {}
    name_without_ext = filename.rsplit('.', 1)[0]
    extension = filename.rsplit('.', 1)[1] if '.' in filename else ''

    parts['extension'] = extension
    parts['original'] = filename

    # Try standard format first: {overview}_{adminLevel}_{dateType}_{varType}_{region}[_{date}]
    standard_pattern = r'(Hist|Forecast)_(Country|Prov|Grid)_(Monthly|Yearly)_(\w+)_(\w+)(?:_(\d{4,6}))?'
    match = re.match(standard_pattern, name_without_ext)

    if match:
        parts['overview'] = match.group(1)
        parts['adminLevel'] = match.group(2)
        parts['dateType'] = match.group(3)
        parts['varType'] = match.group(4)
        parts['region'] = match.group(5)
        parts['date'] = match.group(6) if match.group(6) else None
        parts['format'] = 'standard'
        return parts

    # Try alternative formats for Yield data
    # Format: SEA_yield_monthly_201901.tif (region_varType_dateType_date)
    alt_pattern2 = r'(\w+)_(\w+)_(monthly|yearly)_(\d{4,6})'
    match = re.match(alt_pattern2, name_without_ext, re.IGNORECASE)

    if match:
        parts['region'] = match.group(1)
        parts['varType'] = match.group(2).capitalize()
        parts['dateType'] = match.group(3).capitalize()
        parts['date'] = match.group(4)
        parts['adminLevel'] = 'Grid'  # Default for dated TIF files
        parts['overview'] = 'Hist'
        parts['format'] = 'alternative2'
        return parts

    # Format: SEA_monthly_yield_country.geojson (region_dateType_varType_adminLevel)
    alt_pattern = r'(\w+)_(monthly|yearly)_(\w+)_(\w+)'
    match = re.match(alt_pattern, name_without_ext, re.IGNORECASE)

    if match:
        parts['region'] = match.group(1)
        date_type_raw = match.group(2)
        parts['dateType'] = date_type_raw.capitalize()  # monthly -> Monthly
        var_or_admin = match.group(3)
        admin_level_raw = match.group(4)

        # Determine if this is yield or other variable
        if var_or_admin.lower() in ['yield', 'area', 'production', 'yieldanom']:
            parts['varType'] = var_or_admin.capitalize()
            # admin_level_raw should be admin level
            if admin_level_raw.lower() in ['country', 'province', 'prov', 'grid']:
                parts['adminLevel'] = 'Country' if admin_level_raw.lower() == 'country' else \
                                     'Prov' if admin_level_raw.lower() in ['province', 'prov'] else 'Grid'
            else:
                parts['adminLevel'] = 'Country'  # Default
        else:
            # Default fallback
            parts['adminLevel'] = 'Country'
            parts['varType'] = 'Yield'  # Default

        parts['overview'] = 'Hist'  # Default to Hist for non-standard format
        parts['format'] = 'alternative'
        return parts

    # Format: SEA_yield.geojson
    simple_pattern = r'(\w+)_(\w+)'
    match = re.match(simple_pattern, name_without_ext)

    if match:
        parts['region'] = match.group(1)
        parts['varType'] = match.group(2).capitalize()
        parts['overview'] = 'Hist'
        parts['dateType'] = 'Yearly'  # Assume yearly for simple format
        parts['adminLevel'] = 'Country'  # Assume country level
        parts['format'] = 'simple'
        return parts

    parts['format'] = 'unknown'
    return parts


def generate_standard_filename(overview: str, admin_level: str, date_type: str,
                               var_type: str, region: str, date: str = None,
                               extension: str = 'geojson') -> str:
    """
    Generate standardized filename.

    Format: {overview}_{adminLevel}_{dateType}_{varType}_{region}[_{date}].{extension}
    """
    base = f"{overview}_{admin_level}_{date_type}_{var_type}_{region}"
    if date:
        base += f"_{date}"
    return f"{base}.{extension}"


def standardize_filename(old_path: Path, var_type: str) -> Tuple[Path, str]:
    """
    Standardize a filename to the correct format.

    Returns: (new_path, standard_filename)
    """
    filename = old_path.name
    parts = parse_filename(filename)

    if parts['format'] == 'unknown':
        print(f"  WARNING: Cannot parse {filename}, skipping")
        return None, None

    # Ensure we have all required parts
    if 'varType' not in parts:
        parts['varType'] = var_type
    if 'overview' not in parts:
        parts['overview'] = 'Hist'
    if 'dateType' not in parts:
        # Infer from path
        if 'Monthly' in str(old_path):
            parts['dateType'] = 'Monthly'
        elif 'Yearly' in str(old_path):
            parts['dateType'] = 'Yearly'
        else:
            parts['dateType'] = 'Monthly'  # Default
    if 'adminLevel' not in parts:
        # Infer from path
        if 'Country' in str(old_path):
            parts['adminLevel'] = 'Country'
        elif 'Prov' in str(old_path):
            parts['adminLevel'] = 'Prov'
        elif 'Grid' in str(old_path):
            parts['adminLevel'] = 'Grid'
        else:
            parts['adminLevel'] = 'Country'  # Default
    if 'region' not in parts:
        parts['region'] = 'SEA'  # Default

    standard_name = generate_standard_filename(
        parts['overview'],
        parts['adminLevel'],
        parts['dateType'],
        parts['varType'],
        parts['region'],
        parts.get('date'),
        parts['extension']
    )

    new_path = old_path.parent / standard_name

    return new_path, standard_name


def update_geojson_timestamps(geojson_data: dict, year_offset: int) -> dict:
    """
    Update timestamps in GeoJSON data.

    Args:
        geojson_data: GeoJSON data dictionary
        year_offset: Number of years to add (e.g., 6 for 2019->2025)

    Returns:
        Updated GeoJSON data
    """
    if 'features' not in geojson_data:
        return geojson_data

    for feature in geojson_data['features']:
        if 'properties' not in feature:
            continue

        properties = feature['properties']
        updated_props = {}

        for key, value in properties.items():
            # Check if key matches timestamp format: y201901, y2019, etc.
            match = re.match(r'y(\d{4})(\d{2})?', key)
            if match:
                year = int(match.group(1))
                month = match.group(2) if match.group(2) else None

                # Update year
                new_year = year + year_offset

                if month:
                    new_key = f"y{new_year}{month}"
                else:
                    new_key = f"y{new_year}"

                updated_props[new_key] = value
            else:
                # Keep non-timestamp properties as-is
                updated_props[key] = value

        feature['properties'] = updated_props

    # Update name field if present
    if 'name' in geojson_data:
        name = geojson_data['name']
        for old_year, new_year in YEAR_MAPPING.items():
            name = name.replace(str(old_year), str(new_year))
        geojson_data['name'] = name

    return geojson_data


def update_tif_filename_date(filename: str, year_offset: int) -> str:
    """
    Update date in TIF filename.

    Args:
        filename: Original filename
        year_offset: Number of years to add

    Returns:
        Updated filename
    """
    # Match date patterns: YYYYMM or YYYY
    match = re.search(r'_(\d{4})(\d{2})?\.tif$', filename)
    if not match:
        return filename

    year = int(match.group(1))
    month = match.group(2) if match.group(2) else None

    new_year = year + year_offset

    if month:
        new_date = f"{new_year}{month}"
    else:
        new_date = str(new_year)

    # Replace the date in filename
    new_filename = re.sub(r'_\d{4}(\d{2})?\.tif$', f'_{new_date}.tif', filename)

    return new_filename


def process_variable(var_type: str, dry_run: bool = False):
    """
    Process a single variable type.

    Args:
        var_type: Variable type (Yield, Area, Production, yieldAnom)
        dry_run: If True, only print actions without executing
    """
    print(f"\n{'='*60}")
    print(f"Processing variable: {var_type}")
    print(f"{'='*60}")

    # Determine source directory
    # Area uses /data/Area and /data/ERA5/Area structure
    # Yield uses /data/ERA5/Yield structure
    # yieldAnom uses /data/ERA5/yieldAnom and /data/yieldAnom structure

    source_dirs = []

    if var_type == "Area":
        source_dirs = [
            BASE_DIR / "ERA5" / "Area",
            BASE_DIR / "Area"
        ]
    elif var_type == "Yield":
        source_dirs = [
            BASE_DIR / "ERA5" / "Yield",
            BASE_DIR / "yield_grid",
            BASE_DIR / "yield_json_forecast"
        ]
    elif var_type == "Production":
        source_dirs = [
            BASE_DIR / "ERA5" / "Production",
            BASE_DIR / "Production"
        ]
    elif var_type == "yieldAnom":
        source_dirs = [
            BASE_DIR / "ERA5" / "yieldAnom",
            BASE_DIR / "yieldAnom"
        ]

    # Process each source directory
    for source_dir in source_dirs:
        if not source_dir.exists():
            print(f"  Source directory does not exist: {source_dir}")
            continue

        print(f"\n  Processing directory: {source_dir}")

        # Step 1: Standardize existing filenames in Hist directories
        hist_dir = source_dir / "Hist"
        if hist_dir.exists():
            print(f"    Standardizing filenames in: {hist_dir}")
            standardize_directory(hist_dir, var_type, dry_run)

        # Step 2: Generate forecast placeholders
        print(f"    Generating forecast placeholders...")
        generate_forecast_data(source_dir, var_type, dry_run)


def standardize_directory(directory: Path, var_type: str, dry_run: bool = False):
    """Recursively standardize filenames in a directory."""
    for root, dirs, files in os.walk(directory):
        root_path = Path(root)

        for filename in files:
            if not (filename.endswith('.geojson') or filename.endswith('.tif')):
                continue

            old_path = root_path / filename
            new_path, standard_name = standardize_filename(old_path, var_type)

            if new_path is None:
                continue

            if old_path != new_path:
                print(f"      Rename: {filename} -> {standard_name}")
                if not dry_run:
                    if not new_path.exists():
                        shutil.move(str(old_path), str(new_path))
                    else:
                        print(f"        WARNING: Target file already exists, skipping")


def generate_forecast_data(source_dir: Path, var_type: str, dry_run: bool = False):
    """
    Generate forecast placeholders from historical data.

    Args:
        source_dir: Source directory containing Hist data
        var_type: Variable type
        dry_run: If True, only print actions without executing
    """
    hist_dir = source_dir / "Hist"
    if not hist_dir.exists():
        print(f"      No Hist directory found at {hist_dir}")
        return

    # Create Forecast directory structure
    forecast_dir = source_dir / "Forecast"

    # Iterate through admin levels and date types
    for admin_level in ADMIN_LEVELS:
        for date_type in DATE_TYPES:
            hist_path = hist_dir / admin_level / date_type

            if not hist_path.exists():
                continue

            forecast_path = forecast_dir / admin_level / date_type

            print(f"      Processing: {hist_path.relative_to(BASE_DIR)}")

            # Process each file in the historical directory
            for hist_file in hist_path.iterdir():
                if not (hist_file.suffix == '.geojson' or hist_file.suffix == '.tif'):
                    continue

                filename = hist_file.name

                # Check if file is from 2019 or 2020
                year_match = re.search(r'(2019|2020)', filename)
                if not year_match:
                    continue

                source_year = int(year_match.group(1))
                target_year = YEAR_MAPPING.get(source_year)

                if target_year is None:
                    continue

                year_offset = target_year - source_year

                if hist_file.suffix == '.tif':
                    # Handle TIF files
                    new_filename = update_tif_filename_date(filename, year_offset)
                    new_filename = new_filename.replace('Hist_', 'Forecast_')

                    target_file = forecast_path / new_filename

                    print(f"        Copy TIF: {filename} -> {new_filename}")

                    if not dry_run:
                        forecast_path.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(str(hist_file), str(target_file))

                elif hist_file.suffix == '.geojson':
                    # Handle GeoJSON files
                    # Read, update timestamps, write to forecast directory

                    try:
                        with open(hist_file, 'r', encoding='utf-8') as f:
                            geojson_data = json.load(f)

                        # Update timestamps
                        updated_data = update_geojson_timestamps(geojson_data, year_offset)

                        # Update filename
                        new_filename = filename.replace('Hist_', 'Forecast_')
                        # Remove year-specific region suffixes if any
                        new_filename = re.sub(r'_(2019|2020)', f'_{target_year}', new_filename)

                        target_file = forecast_path / new_filename

                        print(f"        Copy GeoJSON: {filename} -> {new_filename}")

                        if not dry_run:
                            forecast_path.mkdir(parents=True, exist_ok=True)
                            with open(target_file, 'w', encoding='utf-8') as f:
                                json.dump(updated_data, f, ensure_ascii=False, indent=2)

                    except Exception as e:
                        print(f"        ERROR processing {filename}: {e}")


def main():
    """Main execution function."""
    print("="*60)
    print("Data Standardization and Forecast Generation Script")
    print("="*60)
    print(f"Base directory: {BASE_DIR}")
    print(f"Variables to process: {', '.join(VAR_TYPES)}")
    print(f"Source years: {SOURCE_YEARS}")
    print(f"Target years: {TARGET_YEARS}")
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
