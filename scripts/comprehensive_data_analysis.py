#!/usr/bin/env python3
"""
Comprehensive data analysis script to identify issues with:
1. Area/Yield data showing 0.00 values
2. Color rendering differences between India and Myanmar/Thailand
3. Data path standardization needs
"""

import json
import os
from pathlib import Path

def analyze_geojson_file(filepath):
    """Analyze a GeoJSON file and return statistics"""
    with open(filepath, 'r') as f:
        data = json.load(f)

    features = data.get('features', [])

    stats = {
        'file': os.path.basename(filepath),
        'total_features': len(features),
        'feature_names': [],
        'value_properties': [],
        'min_value': None,
        'max_value': None,
        'zero_count': 0,
        'non_zero_count': 0
    }

    if features:
        # Get property keys (excluding 'name' and geometry-related keys)
        sample_props = features[0]['properties']
        value_keys = [k for k in sample_props.keys() if k != 'name' and not k.startswith('_')]
        stats['value_properties'] = value_keys

        # Collect all values
        all_values = []
        for f in features:
            stats['feature_names'].append(f['properties'].get('name', 'Unknown'))
            for key in value_keys:
                val = f['properties'].get(key)
                if val is not None and isinstance(val, (int, float)):
                    all_values.append(val)

        if all_values:
            stats['min_value'] = min(all_values)
            stats['max_value'] = max(all_values)
            stats['zero_count'] = sum(1 for v in all_values if v == 0.0)
            stats['non_zero_count'] = sum(1 for v in all_values if v != 0.0)

    return stats

def main():
    base_path = Path('/mnt/e/Works/Github_repo/dashboard_dev_02/data')

    print("="*80)
    print("COMPREHENSIVE DATA ANALYSIS REPORT")
    print("="*80)

    # Analyze Area data
    print("\n### PART 1: AREA DATA ANALYSIS ###\n")
    area_file = base_path / 'Area/Forecast/Prov/Monthly/Forecast_Prov_Monthly_Area_SEA.geojson'
    if area_file.exists():
        stats = analyze_geojson_file(area_file)
        print(f"File: {stats['file']}")
        print(f"Total features: {stats['total_features']}")
        print(f"Value properties: {stats['value_properties']}")
        print(f"Min value: {stats['min_value']}")
        print(f"Max value: {stats['max_value']}")
        print(f"Zero values: {stats['zero_count']}")
        print(f"Non-zero values: {stats['non_zero_count']}")
        print(f"Zero percentage: {stats['zero_count'] / (stats['zero_count'] + stats['non_zero_count']) * 100:.1f}%")

        # Check for country distribution
        india_count = sum(1 for name in stats['feature_names'] if 'india' in name.lower() or
                         any(state in name.lower() for state in ['andaman', 'delhi', 'haryana', 'karnataka',
                                                                   'kerala', 'maharashtra', 'odisha', 'punjab',
                                                                   'tamil', 'bengal', 'gujarat', 'rajasthan']))
        myanmar_count = sum(1 for name in stats['feature_names'] if 'myanmar' in name.lower())
        thailand_count = sum(1 for name in stats['feature_names'] if 'thailand' in name.lower() or 'thai' in name.lower())
        vietnam_count = sum(1 for name in stats['feature_names'] if 'vietnam' in name.lower() or 'viet' in name.lower())

        print(f"\n  Country Distribution:")
        print(f"    India/Indian states: {india_count}")
        print(f"    Myanmar: {myanmar_count}")
        print(f"    Thailand: {thailand_count}")
        print(f"    Vietnam: {vietnam_count}")
        print(f"    Others: {stats['total_features'] - india_count - myanmar_count - thailand_count - vietnam_count}")

        # Sample values from different regions
        print(f"\n  Sample feature values (first 5):")
        with open(area_file, 'r') as f:
            data = json.load(f)
        for i, f in enumerate(data['features'][:5]):
            name = f['properties']['name']
            values = [f['properties'][k] for k in stats['value_properties']]
            print(f"    {i+1}. {name}: {values}")

    # Analyze ECMWF/ERA5 data structure
    print("\n\n### PART 2: ECMWF/ERA5 DATA STRUCTURE ANALYSIS ###\n")

    # Check ECMWF structure
    ecmwf_paths = list(base_path.glob('ECMWF/**/Prov/Monthly/*.geojson'))
    print(f"ECMWF GeoJSON files found: {len(ecmwf_paths)}")
    if ecmwf_paths:
        print("  Sample files:")
        for p in ecmwf_paths[:5]:
            rel_path = p.relative_to(base_path)
            print(f"    {rel_path}")

    # Check ERA5 structure
    era5_paths = list(base_path.glob('ERA5/**/Prov/Monthly/*.geojson'))
    print(f"\nERA5 GeoJSON files found: {len(era5_paths)}")
    if era5_paths:
        print("  Sample files:")
        for p in era5_paths[:5]:
            rel_path = p.relative_to(base_path)
            print(f"    {rel_path}")

    # Analyze path patterns
    print("\n\n### PART 3: PATH STANDARDIZATION ANALYSIS ###\n")

    all_geojson = list(base_path.glob('**/*.geojson'))
    print(f"Total GeoJSON files: {len(all_geojson)}")

    # Group by pattern
    patterns = {}
    for p in all_geojson:
        rel_path = p.relative_to(base_path)
        parts = rel_path.parts
        if len(parts) >= 3:
            # Pattern: DataSource/Variable/Forecast|Hist/AdminLevel/TimeType
            pattern = '/'.join(parts[:3]) if len(parts) >= 3 else str(rel_path)
            patterns[pattern] = patterns.get(pattern, 0) + 1

    print("  Path patterns (top 10):")
    for pattern, count in sorted(patterns.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"    {pattern}: {count} files")

    # Check for inconsistencies
    print("\n\n### PART 4: COLOR RENDERING ISSUE ANALYSIS ###\n")
    print("Checking colorUtils.js getAreaColor function...")

    color_utils_path = Path('/mnt/e/Works/Github_repo/dashboard_dev_02/utils/colorUtils.js')
    if color_utils_path.exists():
        with open(color_utils_path, 'r') as f:
            content = f.read()

        # Extract getAreaColor function
        if 'function getAreaColor' in content:
            start = content.index('function getAreaColor')
            end = content.index('\n}', start) + 2
            func_content = content[start:end]

            print("\n  Current getAreaColor function:")
            for line in func_content.split('\n')[:20]:
                print(f"    {line}")

            # Check for minVal
            if 'minVal = 100000' in func_content:
                print("\n  ⚠️ ISSUE FOUND: minVal for Prov is set to 100,000 hectares")
                print("     This causes values below 100k to be mapped to negative colors!")
                print("     India provinces have values around 100k-500k (normal)")
                print("     but if data range is 0-500k, values near 100k appear 'lighter'")

    print("\n" + "="*80)
    print("END OF ANALYSIS")
    print("="*80)

if __name__ == "__main__":
    main()
