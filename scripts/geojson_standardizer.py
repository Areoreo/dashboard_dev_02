#!/usr/bin/env python3
"""
GeoJSON Time Series Standardizer

This script converts flat GeoJSON properties (y2020, y202504_0, y202504_mean, etc.)
into a standardized time series format that is more chart-friendly.

Input Format (flat properties):
    {
        "y2020": 2.5,
        "y2021": 2.7,
        "y202504_0": 2.1,
        "y202504_1": 2.3,
        "y202504_mean": 2.2,
        "y202504_min": 2.1,
        "y202504_max": 2.3
    }

Output Format (nested timeSeries array):
    {
        "timeSeries": [
            {"date": "2020-01-01", "value": 2.5, "type": "single"},
            {"date": "2021-01-01", "value": 2.7, "type": "single"},
            {
                "date": "2025-04-01",
                "type": "ensemble",
                "ensembleValues": [2.1, 2.3, ...],
                "statistics": {"mean": 2.2, "min": 2.1, "max": 2.3}
            }
        ]
    }

Usage:
    python geojson_standardizer.py --input <input_geojson> --output <output_geojson>

    Or process entire directory:
    python geojson_standardizer.py --input-dir data/ --output-dir data/Standardized/
"""

import json
import argparse
import os
import re
from pathlib import Path
from typing import Dict, List, Any, Tuple
import numpy as np


def parse_date_key(key: str) -> Tuple[str, int, int, str]:
    """
    Parse property keys to extract date and type information.

    Returns:
        tuple: (date_str, year, month, suffix)

    Examples:
        y2020 -> ("2020-01-01", 2020, 1, "")
        y202504 -> ("2025-04-01", 2025, 4, "")
        y202504_0 -> ("2025-04-01", 2025, 4, "0")
        y202504_mean -> ("2025-04-01", 2025, 4, "mean")
    """
    # Pattern: y + YYYY or YYYYMM + optional suffix (_0, _mean, etc.)
    match = re.match(r'^y(\d{4})(\d{2})?(?:_(.+))?$', key)

    if not match:
        return None

    year_str, month_str, suffix = match.groups()
    year = int(year_str)
    month = int(month_str) if month_str else 1
    suffix = suffix if suffix else ""

    # Format date as YYYY-MM-DD
    date_str = f"{year:04d}-{month:02d}-01"

    return date_str, year, month, suffix


def extract_time_series(properties: Dict[str, Any]) -> List[Dict[str, Any]]:
    """
    Extract time series data from flat GeoJSON properties.

    Args:
        properties: Dictionary of GeoJSON feature properties

    Returns:
        List of time series entries with standardized format
    """
    time_series = []
    date_groups = {}

    # Group properties by date
    for key, value in properties.items():
        if not key.startswith('y'):
            continue

        parsed = parse_date_key(key)
        if not parsed:
            continue

        date_str, year, month, suffix = parsed

        if date_str not in date_groups:
            date_groups[date_str] = {
                'year': year,
                'month': month,
                'ensembles': {},
                'statistics': {}
            }

        # Categorize the value
        if suffix == "":
            # Simple value: y2020 or y202504
            date_groups[date_str]['value'] = value
        elif suffix in ['mean', 'min', 'max']:
            # Statistics
            date_groups[date_str]['statistics'][suffix] = value
        elif suffix.isdigit():
            # Ensemble member
            date_groups[date_str]['ensembles'][int(suffix)] = value

    # Convert grouped data into time series format
    for date_str in sorted(date_groups.keys()):
        group = date_groups[date_str]
        entry = {
            'date': date_str,
            'year': group['year'],
            'month': group['month']
        }

        # Determine data type
        if group['ensembles']:
            # Ensemble data
            ensemble_values = [group['ensembles'][i] for i in sorted(group['ensembles'].keys())]

            # Calculate statistics if not provided
            if not group['statistics']:
                group['statistics'] = {
                    'mean': float(np.mean(ensemble_values)),
                    'min': float(np.min(ensemble_values)),
                    'max': float(np.max(ensemble_values))
                }

            entry['type'] = 'ensemble'
            entry['ensembleValues'] = ensemble_values
            entry['statistics'] = group['statistics']
            entry['value'] = group['statistics']['mean']  # For backward compatibility

        elif 'value' in group:
            # Single value data
            entry['type'] = 'single'
            entry['value'] = group['value']
        else:
            # Skip entries without values
            continue

        time_series.append(entry)

    return time_series


def standardize_feature(feature: Dict[str, Any], keep_original: bool = False) -> Dict[str, Any]:
    """
    Standardize a single GeoJSON feature.

    Args:
        feature: GeoJSON feature dictionary
        keep_original: Whether to keep original flat properties

    Returns:
        Standardized feature with timeSeries array
    """
    properties = feature.get('properties', {})

    # Extract time series
    time_series = extract_time_series(properties)

    # Create new properties
    new_properties = {}

    # Keep non-temporal properties (name, geometry properties, etc.)
    for key, value in properties.items():
        if not key.startswith('y'):
            new_properties[key] = value

    # Add time series
    new_properties['timeSeries'] = time_series

    # Optionally keep original properties for debugging
    if keep_original:
        new_properties['_original'] = {k: v for k, v in properties.items() if k.startswith('y')}

    # Return updated feature
    return {
        **feature,
        'properties': new_properties
    }


def standardize_geojson(input_path: str, output_path: str, keep_original: bool = False):
    """
    Standardize a GeoJSON file by converting flat properties to timeSeries format.

    Args:
        input_path: Path to input GeoJSON file
        output_path: Path to output GeoJSON file
        keep_original: Whether to keep original flat properties
    """
    print(f"Processing: {input_path}")

    # Read input GeoJSON
    with open(input_path, 'r', encoding='utf-8') as f:
        geojson = json.load(f)

    # Ensure it's a FeatureCollection
    if geojson.get('type') != 'FeatureCollection':
        raise ValueError(f"Input file must be a FeatureCollection, got {geojson.get('type')}")

    # Process each feature
    features = geojson.get('features', [])
    standardized_features = []

    for i, feature in enumerate(features):
        try:
            standardized_feature = standardize_feature(feature, keep_original)
            standardized_features.append(standardized_feature)
        except Exception as e:
            print(f"Warning: Error processing feature {i}: {e}")
            continue

    # Create output GeoJSON
    output_geojson = {
        **geojson,
        'features': standardized_features
    }

    # Ensure output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    # Write output
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output_geojson, f, indent=2, ensure_ascii=False)

    print(f"✓ Standardized {len(standardized_features)} features")
    print(f"  Output: {output_path}")


def process_directory(input_dir: str, output_dir: str, keep_original: bool = False):
    """
    Process all GeoJSON files in a directory recursively.

    Args:
        input_dir: Input directory path
        output_dir: Output directory path
        keep_original: Whether to keep original flat properties
    """
    input_path = Path(input_dir)
    output_path = Path(output_dir)

    # Find all GeoJSON files
    geojson_files = list(input_path.rglob('*.geojson'))

    print(f"Found {len(geojson_files)} GeoJSON files")
    print()

    for geojson_file in geojson_files:
        # Compute relative path
        relative_path = geojson_file.relative_to(input_path)
        output_file = output_path / relative_path

        try:
            standardize_geojson(str(geojson_file), str(output_file), keep_original)
        except Exception as e:
            print(f"✗ Error processing {geojson_file}: {e}")

        print()


def main():
    parser = argparse.ArgumentParser(
        description='Standardize GeoJSON files with time series data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )

    parser.add_argument(
        '--input',
        help='Input GeoJSON file path'
    )

    parser.add_argument(
        '--output',
        help='Output GeoJSON file path'
    )

    parser.add_argument(
        '--input-dir',
        help='Input directory path (processes all .geojson files recursively)'
    )

    parser.add_argument(
        '--output-dir',
        help='Output directory path'
    )

    parser.add_argument(
        '--keep-original',
        action='store_true',
        help='Keep original flat properties in _original field'
    )

    args = parser.parse_args()

    # Validate arguments
    if args.input and args.output:
        standardize_geojson(args.input, args.output, args.keep_original)
    elif args.input_dir and args.output_dir:
        process_directory(args.input_dir, args.output_dir, args.keep_original)
    else:
        parser.error('Either --input/--output or --input-dir/--output-dir must be specified')


if __name__ == '__main__':
    main()
