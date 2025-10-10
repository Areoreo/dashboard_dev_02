#!/usr/bin/env python3
"""
Test script for GeoJSON Standardizer

This script tests the geojson_standardizer.py with sample data
to verify correct functionality before running on production data.
"""

import json
import tempfile
import os
from pathlib import Path

# Import the standardizer
import sys
sys.path.insert(0, str(Path(__file__).parent))
from geojson_standardizer import standardize_feature, extract_time_series, parse_date_key


def create_test_geojson():
    """Create a test GeoJSON with various data patterns"""
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {
                    "name": "Test Province 1",
                    "id": "TEST01",
                    # Historical single values
                    "y2020": 2.5,
                    "y2021": 2.7,
                    # Forecast with ensembles and statistics
                    "y202504_0": 2.1,
                    "y202504_1": 2.3,
                    "y202504_2": 2.2,
                    "y202504_mean": 2.2,
                    "y202504_min": 2.1,
                    "y202504_max": 2.3,
                    "y202505_0": 2.4,
                    "y202505_1": 2.6,
                    "y202505_2": 2.5,
                    "y202505_mean": 2.5,
                    "y202505_min": 2.4,
                    "y202505_max": 2.6
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [100.5, 13.7]
                }
            },
            {
                "type": "Feature",
                "properties": {
                    "name": "Test Province 2",
                    "id": "TEST02",
                    # Monthly historical data
                    "y202001": 3.1,
                    "y202002": 3.2,
                    "y202003": 3.0,
                    # Forecast without explicit statistics
                    "y202506_0": 3.3,
                    "y202506_1": 3.5,
                    "y202506_2": 3.4,
                    "y202506_3": 3.6
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [101.5, 14.7]
                }
            }
        ]
    }


def test_parse_date_key():
    """Test date key parsing"""
    print("Testing parse_date_key()...")

    tests = [
        ("y2020", ("2020-01-01", 2020, 1, "")),
        ("y202504", ("2025-04-01", 2025, 4, "")),
        ("y202504_0", ("2025-04-01", 2025, 4, "0")),
        ("y202504_mean", ("2025-04-01", 2025, 4, "mean")),
        ("invalid", None)
    ]

    for key, expected in tests:
        result = parse_date_key(key)
        if result == expected:
            print(f"  ✓ {key} -> {result}")
        else:
            print(f"  ✗ {key} -> Expected {expected}, got {result}")


def test_extract_time_series():
    """Test time series extraction"""
    print("\nTesting extract_time_series()...")

    properties = {
        "name": "Test",
        "y2020": 2.5,
        "y2021": 2.7,
        "y202504_0": 2.1,
        "y202504_1": 2.3,
        "y202504_mean": 2.2,
        "y202504_min": 2.1,
        "y202504_max": 2.3
    }

    time_series = extract_time_series(properties)

    print(f"  Extracted {len(time_series)} time series entries")

    # Check single value entries
    single_entries = [e for e in time_series if e['type'] == 'single']
    print(f"  Single value entries: {len(single_entries)}")
    for entry in single_entries:
        print(f"    - {entry['date']}: {entry['value']}")

    # Check ensemble entries
    ensemble_entries = [e for e in time_series if e['type'] == 'ensemble']
    print(f"  Ensemble entries: {len(ensemble_entries)}")
    for entry in ensemble_entries:
        print(f"    - {entry['date']}: {len(entry['ensembleValues'])} members, "
              f"mean={entry['statistics']['mean']:.2f}")


def test_standardize_feature():
    """Test feature standardization"""
    print("\nTesting standardize_feature()...")

    test_geojson = create_test_geojson()

    for i, feature in enumerate(test_geojson['features']):
        print(f"\n  Feature {i + 1}: {feature['properties']['name']}")

        standardized = standardize_feature(feature)

        # Check that timeSeries was created
        if 'timeSeries' in standardized['properties']:
            ts = standardized['properties']['timeSeries']
            print(f"    ✓ Created timeSeries with {len(ts)} entries")

            # Check types
            types = {}
            for entry in ts:
                entry_type = entry['type']
                types[entry_type] = types.get(entry_type, 0) + 1

            for entry_type, count in types.items():
                print(f"      - {entry_type}: {count} entries")

            # Verify structure of first entry
            if ts:
                first = ts[0]
                required_keys = ['date', 'year', 'month', 'type', 'value']
                missing = [k for k in required_keys if k not in first]
                if missing:
                    print(f"    ✗ Missing keys in first entry: {missing}")
                else:
                    print(f"    ✓ First entry has all required keys")
        else:
            print(f"    ✗ No timeSeries created")

        # Check that non-temporal properties are preserved
        non_temporal = ['name', 'id']
        for key in non_temporal:
            if key in feature['properties']:
                if key in standardized['properties']:
                    print(f"    ✓ Preserved property: {key}")
                else:
                    print(f"    ✗ Lost property: {key}")


def test_full_standardization():
    """Test full standardization process"""
    print("\n" + "=" * 60)
    print("Testing full standardization process...")
    print("=" * 60)

    # Create test GeoJSON
    test_geojson = create_test_geojson()

    # Write to temp file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
        input_path = f.name
        json.dump(test_geojson, f, indent=2)

    # Create output path
    with tempfile.NamedTemporaryFile(mode='w', suffix='.geojson', delete=False) as f:
        output_path = f.name

    try:
        # Import and run standardization
        from geojson_standardizer import standardize_geojson

        print(f"\nInput file: {input_path}")
        print(f"Output file: {output_path}")

        standardize_geojson(input_path, output_path, keep_original=True)

        # Read and verify output
        with open(output_path, 'r') as f:
            output_geojson = json.load(f)

        print("\n" + "=" * 60)
        print("Verification:")
        print("=" * 60)

        print(f"✓ Output is valid JSON")
        print(f"✓ Type: {output_geojson['type']}")
        print(f"✓ Features: {len(output_geojson['features'])}")

        # Check each feature
        for i, feature in enumerate(output_geojson['features']):
            props = feature['properties']
            print(f"\nFeature {i + 1}: {props['name']}")

            if 'timeSeries' in props:
                ts = props['timeSeries']
                print(f"  ✓ timeSeries: {len(ts)} entries")

                # Show first and last entries
                if ts:
                    first = ts[0]
                    last = ts[-1]
                    print(f"    First: {first['date']} ({first['type']})")
                    print(f"    Last: {last['date']} ({last['type']})")
            else:
                print(f"  ✗ No timeSeries found")

            if '_original' in props:
                print(f"  ✓ Original properties preserved for debugging")

        print("\n" + "=" * 60)
        print("All tests completed successfully!")
        print("=" * 60)

    finally:
        # Cleanup
        try:
            os.unlink(input_path)
            os.unlink(output_path)
        except:
            pass


def main():
    """Run all tests"""
    print("=" * 60)
    print("GeoJSON Standardizer Test Suite")
    print("=" * 60)

    test_parse_date_key()
    test_extract_time_series()
    test_standardize_feature()
    test_full_standardization()


if __name__ == '__main__':
    main()
