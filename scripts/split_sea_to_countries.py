#!/usr/bin/env python3
"""
Script to split SEA (Southeast Asia) GeoJSON data into individual country files.

This script:
1. Reads the province-country mapping
2. Reads SEA GeoJSON files
3. Splits features by country based on province names
4. Creates separate country-specific GeoJSON files

Usage:
    python scripts/split_sea_to_countries.py
"""

import os
import json
from pathlib import Path
from typing import Dict, List

# Configuration
BASE_DIR = Path(__file__).parent.parent
DATA_DIR = BASE_DIR / "data" / "ERA5" / "Yield" / "Hist"
MAPPING_FILE = BASE_DIR / "scripts" / "province_country_mapping.json"

# Countries in SEA region
SEA_COUNTRIES = ["Cambodia", "Laos", "Myanmar", "Thailand", "Vietnam"]


def load_province_country_mapping() -> Dict[str, str]:
    """Load the province to country mapping."""
    with open(MAPPING_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)


def split_geojson_by_country(input_path: Path, output_dir: Path, mapping: Dict[str, str]):
    """
    Split a SEA GeoJSON file into country-specific files.

    Args:
        input_path: Path to input SEA GeoJSON file
        output_dir: Directory to save country-specific files
        mapping: Province to country mapping
    """
    print(f"\nProcessing: {input_path.name}")

    # Read input file
    with open(input_path, 'r', encoding='utf-8') as f:
        sea_data = json.load(f)

    if 'features' not in sea_data:
        print(f"  No features found in {input_path.name}")
        return

    # Group features by country
    country_features = {country: [] for country in SEA_COUNTRIES}

    for feature in sea_data['features']:
        if 'properties' not in feature or 'name' not in feature['properties']:
            continue

        province_name = feature['properties']['name']

        # Find country for this province
        country = mapping.get(province_name)

        if country in SEA_COUNTRIES:
            country_features[country].append(feature)

    # Create country-specific GeoJSON files
    output_dir.mkdir(parents=True, exist_ok=True)

    for country, features in country_features.items():
        if not features:
            print(f"  No features found for {country}")
            continue

        # Create new GeoJSON structure
        country_geojson = {
            "type": "FeatureCollection",
            "name": sea_data.get("name", "").replace("SEA", country),
            "crs": sea_data.get("crs", {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}}),
            "features": features
        }

        # Generate output filename
        # Input: Hist_Prov_Monthly_Yield_SEA.geojson
        # Output: Hist_Prov_Monthly_Yield_Cambodia.geojson
        output_filename = input_path.name.replace("_SEA.", f"_{country}.")

        output_path = output_dir / output_filename

        # Write country-specific file
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(country_geojson, f, ensure_ascii=False, indent=2)

        print(f"  Created: {output_filename} ({len(features)} provinces)")


def main():
    """Main execution function."""
    print("="*60)
    print("SEA to Country Split Script")
    print("="*60)

    # Load mapping
    print("\nLoading province-country mapping...")
    mapping = load_province_country_mapping()
    print(f"Loaded {len(mapping)} province mappings")

    # Process Prov level files (SEA data contains provinces)
    admin_level = "Prov"

    for date_type in ["Monthly", "Yearly"]:
        input_dir = DATA_DIR / admin_level / date_type
        output_dir = input_dir  # Save in same directory

        if not input_dir.exists():
            print(f"\nDirectory not found: {input_dir}")
            continue

        print(f"\n{'='*60}")
        print(f"Processing: {admin_level}/{date_type}")
        print('='*60)

        # Find SEA GeoJSON files
        sea_files = list(input_dir.glob("*_SEA.geojson"))

        if not sea_files:
            print(f"No SEA files found in {input_dir}")
            continue

        for sea_file in sea_files:
            split_geojson_by_country(sea_file, output_dir, mapping)

    print("\n" + "="*60)
    print("Processing complete!")
    print("="*60)


if __name__ == "__main__":
    main()
