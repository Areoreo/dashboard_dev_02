#!/usr/bin/env python3
"""
Script to split full ensemble time series data (1980-2026) into:
- Historical data: from start to (last_date - 6 months)
- Forecast data: (last_date - 6 months) to last_date

For datasets ending at 202604, this means:
- Historical: 1980/1981 to 202510
- Forecast: 202511 to 202604
"""

import json
import os
import shutil
from pathlib import Path
from datetime import datetime, timedelta
import re
from typing import Dict, List, Tuple

# Configuration
BASE_DIR = Path("/mnt/e/Works/Github_repo/dashboard_dev_02/data/ERA5")
VARIABLES = ["SPI1", "SPI3", "SPI6", "SPI12", "Prcp", "Temp"]
ADMIN_LEVELS = ["Country", "Prov"]
DATE_TYPES = ["Monthly", "Yearly"]

# Cutoff point: 202511 (last_date - 6 months where last_date is 202604)
FORECAST_START_MONTHLY = "202511"  # November 2025
FORECAST_START_YEARLY = "2025"     # Year 2025


def parse_year_month(key: str) -> Tuple[int, int, bool]:
    """
    Parse year-month from property key (e.g., 'y202511_0', 'y202511_mean', 'y2025')
    Returns (year, month, is_ensemble_suffix) where month=0 for yearly data
    """
    # Remove 'y' prefix
    key = key.lstrip('y')

    # Check if it's ensemble data (has _0, _1, _mean, _min, _max, etc.)
    is_ensemble = '_' in key

    if is_ensemble:
        date_part = key.split('_')[0]
    else:
        date_part = key

    if len(date_part) == 4:  # Yearly: y2025
        return int(date_part), 0, is_ensemble
    elif len(date_part) == 6:  # Monthly: y202511
        year = int(date_part[:4])
        month = int(date_part[4:6])
        return year, month, is_ensemble
    else:
        raise ValueError(f"Unknown date format: {key}")


def should_be_forecast(key: str, date_type: str) -> bool:
    """
    Determine if a property key should be in forecast data
    """
    try:
        year, month, _ = parse_year_month(key)

        if date_type == "Monthly":
            date_str = f"{year:04d}{month:02d}"
            return date_str >= FORECAST_START_MONTHLY
        elif date_type == "Yearly":
            return year >= int(FORECAST_START_YEARLY)
        else:
            return False
    except:
        # If we can't parse it, include it in historical (safer default)
        return False


def split_geojson(input_path: Path, hist_path: Path, forecast_path: Path, date_type: str):
    """
    Split a GeoJSON file into historical and forecast files
    """
    print(f"  Processing: {input_path.name}")

    with open(input_path, 'r') as f:
        data = json.load(f)

    # Create copies for historical and forecast
    hist_data = {
        "type": data["type"],
        "features": []
    }
    forecast_data = {
        "type": data["type"],
        "features": []
    }

    # Process each feature
    for feature in data["features"]:
        hist_feature = {
            "type": feature["type"],
            "properties": {},
            "geometry": feature["geometry"]
        }
        forecast_feature = {
            "type": feature["type"],
            "properties": {},
            "geometry": feature["geometry"]
        }

        # Split properties based on date
        for key, value in feature["properties"].items():
            if key.startswith('y'):
                if should_be_forecast(key, date_type):
                    forecast_feature["properties"][key] = value
                else:
                    hist_feature["properties"][key] = value
            else:
                # Non-temporal properties go to both
                hist_feature["properties"][key] = value
                forecast_feature["properties"][key] = value

        hist_data["features"].append(hist_feature)
        forecast_data["features"].append(forecast_feature)

    # Count properties for reporting
    if hist_data["features"]:
        hist_count = len([k for k in hist_data["features"][0]["properties"].keys() if k.startswith('y')])
        forecast_count = len([k for k in forecast_data["features"][0]["properties"].keys() if k.startswith('y')])
        print(f"    Historical: {hist_count} time periods")
        print(f"    Forecast: {forecast_count} time periods")

    # Write output files
    hist_path.parent.mkdir(parents=True, exist_ok=True)
    forecast_path.parent.mkdir(parents=True, exist_ok=True)

    with open(hist_path, 'w') as f:
        json.dump(hist_data, f, separators=(',', ':'))

    with open(forecast_path, 'w') as f:
        json.dump(forecast_data, f, separators=(',', ':'))


def process_variable(var_type: str):
    """
    Process all files for a given variable type
    """
    print(f"\nProcessing {var_type}...")

    var_dir = BASE_DIR / var_type

    # Process each combination of admin level and date type
    for admin_level in ADMIN_LEVELS:
        for date_type in DATE_TYPES:
            source_dir = var_dir / "Forecast" / admin_level / date_type

            if not source_dir.exists():
                print(f"  Skipping {admin_level}/{date_type} (not found)")
                continue

            print(f"\n  {admin_level} / {date_type}")

            # Find all geojson files in source directory
            geojson_files = list(source_dir.glob("*.geojson"))

            for source_file in geojson_files:
                # Parse filename to extract components
                # Expected format: Forecast_Prov_Monthly_SPI1_Thailand.geojson
                parts = source_file.stem.split('_')

                if len(parts) < 5:
                    print(f"    Skipping {source_file.name} (unexpected format)")
                    continue

                # Extract region (last part)
                region = parts[-1]

                # Generate new filenames following naming convention
                # Historical: Hist_{adminLevel}_{dateType}_{varType}_{region}.geojson
                # Forecast: Forecast_{adminLevel}_{dateType}_{varType}_{region}.geojson

                hist_filename = f"Hist_{admin_level}_{date_type}_{var_type}_{region}.geojson"
                forecast_filename = f"Forecast_{admin_level}_{date_type}_{var_type}_{region}.geojson"

                hist_path = var_dir / "Hist" / admin_level / date_type / hist_filename
                forecast_path = var_dir / "Forecast" / admin_level / date_type / forecast_filename

                # Split the file
                try:
                    split_geojson(source_file, hist_path, forecast_path, date_type)
                except Exception as e:
                    print(f"    ERROR processing {source_file.name}: {e}")


def main():
    """
    Main execution function
    """
    print("=" * 80)
    print("ERA5 Data Splitting Script")
    print("Splitting full time series (1980-2026) into Historical and Forecast")
    print("Cutoff: 202511 (last 6 months for forecast)")
    print("=" * 80)

    # Check if base directory exists
    if not BASE_DIR.exists():
        print(f"ERROR: Base directory not found: {BASE_DIR}")
        return

    # Process each variable
    for var_type in VARIABLES:
        try:
            process_variable(var_type)
        except Exception as e:
            print(f"ERROR processing {var_type}: {e}")

    print("\n" + "=" * 80)
    print("Processing complete!")
    print("=" * 80)


if __name__ == "__main__":
    main()
