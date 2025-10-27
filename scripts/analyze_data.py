#!/usr/bin/env python3
"""Script to analyze GeoJSON data for debugging"""

import json
import sys

def analyze_area_data():
    filepath = '/mnt/e/Works/Github_repo/dashboard_dev_02/data/Area/Forecast/Prov/Monthly/Forecast_Prov_Monthly_Area_SEA.geojson'

    with open(filepath, 'r') as f:
        data = json.load(f)

    features = data['features']
    print(f"Total features: {len(features)}")
    print("\n=== First 30 Feature Names ===")
    for i, f in enumerate(features[:30]):
        name = f['properties']['name']
        # Get first 3 time properties
        props = {k: v for k, v in f['properties'].items() if k.startswith('y')}
        sample_values = list(props.values())[:3]
        print(f"{i+1}. {name:30s} - Sample values: {sample_values}")

    # Check for India features
    print("\n=== India/Andaman Features ===")
    india_features = [f for f in features if 'india' in f['properties']['name'].lower() or 'andaman' in f['properties']['name'].lower()]
    for f in india_features:
        print(f"  Name: {f['properties']['name']}")
        props = {k: v for k, v in f['properties'].items() if k != 'name'}
        print(f"  Values: {list(props.values())}")

    # Check for Myanmar features
    print("\n=== Myanmar Features (first 5) ===")
    myanmar_features = [f for f in features if 'myanmar' in f['properties']['name'].lower()]
    for f in myanmar_features[:5]:
        print(f"  Name: {f['properties']['name']}")
        props = {k: v for k, v in f['properties'].items() if k != 'name'}
        print(f"  Values: {list(props.values())[:5]}")

    # Check for Thailand features
    print("\n=== Thailand Features (first 5) ===")
    thailand_features = [f for f in features if 'thailand' in f['properties']['name'].lower() or 'thai' in f['properties']['name'].lower()]
    for f in thailand_features[:5]:
        print(f"  Name: {f['properties']['name']}")
        props = {k: v for k, v in f['properties'].items() if k != 'name'}
        print(f"  Values: {list(props.values())[:5]}")

    # Check value ranges
    print("\n=== Value Statistics ===")
    all_values = []
    for f in features:
        props = {k: v for k, v in f['properties'].items() if k.startswith('y')}
        all_values.extend(props.values())

    print(f"  Total value count: {len(all_values)}")
    print(f"  Min value: {min(all_values)}")
    print(f"  Max value: {max(all_values)}")
    print(f"  Zero values count: {sum(1 for v in all_values if v == 0.0)}")
    print(f"  Non-zero values count: {sum(1 for v in all_values if v != 0.0)}")

if __name__ == "__main__":
    analyze_area_data()
