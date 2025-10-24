#!/usr/bin/env python3
"""
Reorganize yield grid data into standard format.

Standard format:
- Naming: {overview}_{adminLevel}_{dateType}_{varType}_{region}_{date}.tif
- Path: /data/ERA5/Yield/{overview}/{adminLevel}/{dateType}/
- Exclude 2025 data

Current format in yield_grid:
- {region}_yield_monthly_{YYYYMM}.tif
- {region}_yield_yearly_{YYYY}.tif
"""

import os
import shutil
from pathlib import Path
import re

# Configuration
BASE_DIR = Path("/mnt/e/Works/Github_repo/dashboard_dev_02")
SOURCE_DIR = BASE_DIR / "data/ERA5/Yield/Hist/Grid/yield_grid"
DEST_BASE = BASE_DIR / "data/ERA5/Yield/Hist/Grid"

# Standard naming components
OVERVIEW = "Hist"
ADMIN_LEVEL = "Grid"
VAR_TYPE = "Yield"

def parse_filename(filename):
    """Parse the current filename format to extract metadata."""
    # Remove .tif extension
    name = filename.replace('.tif', '')

    # Pattern: {region}_yield_{monthly|yearly}_{date}
    # Monthly: Cambodia_yield_monthly_196101
    # Yearly: Cambodia_yield_yearly_1961

    parts = name.split('_')

    if len(parts) < 4:
        return None

    region = parts[0]
    # parts[1] is 'yield'
    date_type = parts[2]  # 'monthly' or 'yearly'
    date_value = parts[3]  # YYYYMM or YYYY

    # Skip 2025 data
    if date_value.startswith('2025'):
        return None

    # Standardize date_type
    if date_type == 'monthly':
        standard_date_type = 'Monthly'
    elif date_type == 'yearly':
        standard_date_type = 'Yearly'
    else:
        return None

    return {
        'region': region,
        'date_type': standard_date_type,
        'date': date_value,
        'original': filename
    }

def create_standard_filename(metadata):
    """Create standardized filename."""
    # Format: {overview}_{adminLevel}_{dateType}_{varType}_{region}_{date}.tif
    return f"{OVERVIEW}_{ADMIN_LEVEL}_{metadata['date_type']}_{VAR_TYPE}_{metadata['region']}_{metadata['date']}.tif"

def reorganize_files(dry_run=True):
    """Reorganize files from yield_grid to standard structure."""

    if not SOURCE_DIR.exists():
        print(f"Error: Source directory not found: {SOURCE_DIR}")
        return

    # Get all .tif files
    tif_files = list(SOURCE_DIR.glob("*.tif"))
    print(f"Found {len(tif_files)} TIF files in {SOURCE_DIR}")

    stats = {
        'monthly': 0,
        'yearly': 0,
        'skipped_2025': 0,
        'skipped_invalid': 0,
        'total_processed': 0
    }

    for tif_file in tif_files:
        metadata = parse_filename(tif_file.name)

        if metadata is None:
            if '2025' in tif_file.name:
                stats['skipped_2025'] += 1
                print(f"Skipping 2025 data: {tif_file.name}")
            else:
                stats['skipped_invalid'] += 1
                print(f"Invalid filename format: {tif_file.name}")
            continue

        # Create destination directory
        dest_dir = DEST_BASE / metadata['date_type']

        # Create standard filename
        new_filename = create_standard_filename(metadata)
        dest_path = dest_dir / new_filename

        # Track stats
        if metadata['date_type'] == 'Monthly':
            stats['monthly'] += 1
        else:
            stats['yearly'] += 1
        stats['total_processed'] += 1

        if dry_run:
            print(f"Would move: {tif_file.name}")
            print(f"       to: {dest_path.relative_to(BASE_DIR)}")
        else:
            # Create destination directory if it doesn't exist
            dest_dir.mkdir(parents=True, exist_ok=True)

            # Move and rename file
            shutil.move(str(tif_file), str(dest_path))
            print(f"Moved: {tif_file.name} -> {new_filename}")

    # Print summary
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total files processed: {stats['total_processed']}")
    print(f"Monthly files: {stats['monthly']}")
    print(f"Yearly files: {stats['yearly']}")
    print(f"Skipped (2025 data): {stats['skipped_2025']}")
    print(f"Skipped (invalid format): {stats['skipped_invalid']}")
    print("="*60)

    if dry_run:
        print("\nThis was a DRY RUN. No files were moved.")
        print("Run with dry_run=False to actually move files.")

    return stats

if __name__ == "__main__":
    import sys

    # Check for --execute flag
    execute = '--execute' in sys.argv

    if execute:
        print("EXECUTING FILE REORGANIZATION")
        print("="*60)
        reorganize_files(dry_run=False)
    else:
        print("DRY RUN MODE")
        print("="*60)
        print("Add --execute flag to actually move files")
        print("="*60)
        reorganize_files(dry_run=True)
