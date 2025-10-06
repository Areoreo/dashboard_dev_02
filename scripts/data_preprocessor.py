#!/usr/bin/env python3
"""
Data Preprocessing Script for Agricultural Dashboard
Converts existing scattered data formats into unified schema
"""

import json
import os
import re
import numpy as np
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Union, Any
import argparse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataPreprocessor:
    """Main class for data preprocessing and format conversion"""
    
    def __init__(self, input_dir: str, output_dir: str):
        self.input_dir = Path(input_dir)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def convert_geojson_properties(self, properties: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Convert old GeoJSON properties format to unified timeSeries format
        
        Handles:
        - y2020, y2021 (yearly historical)
        - y202001, y202002 (monthly historical)  
        - y202504_0, y202504_1 (ensemble forecast)
        - y202504_mean, y202504_min, y202504_max (statistics)
        """
        time_series = []
        ensemble_data = {}
        
        # Extract all time-related properties
        for key, value in properties.items():
            if not key.startswith('y') or value is None:
                continue
                
            # Parse ensemble data (y202504_0, y202504_1, y202504_mean, etc.)
            ensemble_match = re.match(r'y(\d{6})_(\w+)', key)
            if ensemble_match:
                date_str, suffix = ensemble_match.groups()
                
                if date_str not in ensemble_data:
                    ensemble_data[date_str] = {'values': [], 'stats': {}}
                
                if suffix.isdigit():
                    # Ensemble member (y202504_0, y202504_1)
                    ensemble_data[date_str]['values'].append(float(value))
                elif suffix in ['mean', 'min', 'max', 'stdDev']:
                    # Statistical measures
                    ensemble_data[date_str]['stats'][suffix] = float(value)
                continue
            
            # Parse regular time series data (y2020, y202001)
            time_match = re.match(r'y(\d{4,6})$', key)
            if time_match:
                date_str = time_match.group(1)
                
                if len(date_str) == 4:
                    # Yearly data (y2020)
                    iso_date = f"{date_str}-01-01"
                elif len(date_str) == 6:
                    # Monthly data (y202001)
                    year = date_str[:4]
                    month = date_str[4:6]
                    iso_date = f"{year}-{month}-01"
                else:
                    continue
                    
                time_series.append({
                    "date": iso_date,
                    "value": float(value),
                    "quality": "high"
                })
        
        # Process ensemble data
        for date_str, data in ensemble_data.items():
            year = date_str[:4]
            month = date_str[4:6]
            iso_date = f"{year}-{month}-01"
            
            entry = {"date": iso_date}
            
            if data['values']:
                # Sort ensemble values for consistency
                ensemble_values = sorted(data['values'])
                entry['ensembleValues'] = ensemble_values
                
                # Calculate statistics if not provided
                if 'stats' not in data or not data['stats']:
                    data['stats'] = {}
                
                stats = {
                    'mean': data['stats'].get('mean', np.mean(ensemble_values)),
                    'min': data['stats'].get('min', np.min(ensemble_values)),
                    'max': data['stats'].get('max', np.max(ensemble_values)),
                    'stdDev': data['stats'].get('stdDev', np.std(ensemble_values))
                }
                
                # Calculate percentiles
                if len(ensemble_values) >= 3:
                    stats['percentiles'] = {
                        'p25': np.percentile(ensemble_values, 25),
                        'p50': np.percentile(ensemble_values, 50),
                        'p75': np.percentile(ensemble_values, 75)
                    }
                
                entry['statistics'] = stats
                entry['confidence'] = 0.85  # Default confidence
            
            time_series.append(entry)
        
        # Sort by date
        time_series.sort(key=lambda x: x['date'])
        return time_series
    
    def create_metadata(self, 
                       variable: str, 
                       region: str, 
                       overview: str,
                       admin_level: str, 
                       time_type: str,
                       time_series: List[Dict]) -> Dict[str, Any]:
        """Create metadata for the unified format"""
        
        if not time_series:
            start_date = "1990-01-01"
            end_date = "2025-12-31"
        else:
            dates = [entry['date'] for entry in time_series]
            start_date = min(dates)
            end_date = max(dates)
        
        # Map variable types to units
        units_map = {
            'Yield': 'tons/hectare',
            'Production': 'tons',
            'Area': 'hectares',
            'Prcp': 'mm',
            'Temp': '°C',
            'SPI1': 'index',
            'SPI3': 'index', 
            'SPI6': 'index',
            'SPI12': 'index',
            'smpct1': 'percentile',
            'yieldAnom': 'anomaly'
        }
        
        return {
            'variable': variable,
            'region': region,
            'overview': overview,
            'adminLevel': admin_level,
            'timeType': time_type,
            'dateRange': {
                'start': start_date,
                'end': end_date
            },
            'units': units_map.get(variable, 'unknown'),
            'description': f"{overview.title()} {variable} data for {region} at {admin_level} level"
        }
    
    def convert_geojson_file(self, 
                           input_file: Path, 
                           variable: str,
                           region: str, 
                           overview: str,
                           admin_level: str,
                           time_type: str) -> Dict[str, Any]:
        """Convert a single GeoJSON file to unified format"""
        
        logger.info(f"Converting {input_file}")
        
        try:
            with open(input_file, 'r', encoding='utf-8') as f:
                geojson_data = json.load(f)
        except Exception as e:
            logger.error(f"Error reading {input_file}: {e}")
            return None
        
        # Process features
        unified_features = []
        
        for feature in geojson_data.get('features', []):
            properties = feature.get('properties', {})
            
            # Convert time series data
            time_series = self.convert_geojson_properties(properties)
            
            # Create new properties with unified format
            new_properties = {
                'id': properties.get('id', properties.get('name', 'unknown')),
                'name': properties.get('name', properties.get('id', 'Unknown')),
                'timeSeries': time_series
            }
            
            # Keep other non-time properties
            for key, value in properties.items():
                if not key.startswith('y') and key not in ['id', 'name']:
                    new_properties[key] = value
            
            unified_features.append({
                'type': 'Feature',
                'geometry': feature.get('geometry'),
                'properties': new_properties
            })
        
        # Create metadata
        sample_time_series = unified_features[0]['properties']['timeSeries'] if unified_features else []
        metadata = self.create_metadata(variable, region, overview, admin_level, time_type, sample_time_series)
        
        return {
            'metadata': metadata,
            'dataType': 'geojson',
            'features': unified_features
        }
    
    def create_raster_metadata(self, 
                             tiff_file: Path,
                             variable: str,
                             region: str,
                             overview: str, 
                             admin_level: str,
                             time_type: str,
                             date: str) -> Dict[str, Any]:
        """Create metadata for GeoTIFF raster files"""
        
        # Default bounds for SEA region
        bounds = {
            'north': 25.0,
            'south': -10.0,
            'east': 140.0,
            'west': 90.0
        }
        
        # Variable-specific color scales
        color_scales = {
            'Yield': {
                'type': 'linear',
                'domain': [0, 1, 2, 3, 4, 5],
                'range': ['#d73027', '#f46d43', '#fdae61', '#fee08b', '#d9ef8b', '#66bd63']
            },
            'SPI1': {
                'type': 'linear', 
                'domain': [-3, -2, -1, 0, 1, 2, 3],
                'range': ['#8B0000', '#FF4500', '#FFA500', '#FFFF00', '#90EE90', '#0000FF', '#000080']
            },
            'Prcp': {
                'type': 'linear',
                'domain': [0, 50, 100, 200, 400, 800],
                'range': ['#FFFFFF', '#E0F7FA', '#81D4FA', '#29B6F6', '#1976D2', '#0D47A1']
            }
        }
        
        metadata = self.create_metadata(variable, region, overview, admin_level, time_type, [])
        
        return {
            'metadata': metadata,
            'dataType': 'geotiff',
            'rasterInfo': {
                'filePath': str(tiff_file.relative_to(self.input_dir)),
                'bounds': bounds,
                'resolution': {'x': 0.1, 'y': 0.1},
                'noDataValue': -9999,
                'colorScale': color_scales.get(variable, color_scales['Yield'])
            }
        }
    
    def parse_filename(self, filename: str) -> Optional[Dict[str, str]]:
        """Parse filename to extract metadata components"""
        
        # Common patterns in the existing data
        patterns = [
            # SEA_prov_2025_monthly.geojson
            r'(?P<region>\w+)_(?P<admin_level>\w+)_(?P<year>\d{4})_(?P<time_type>\w+)\.geojson',
            # Hist_Prov_Monthly_Yield_SEA.geojson  
            r'(?P<overview>\w+)_(?P<admin_level>\w+)_(?P<time_type>\w+)_(?P<variable>\w+)_(?P<region>\w+)\.geojson',
            # SEA_yield_yearly_2020.tif
            r'(?P<region>\w+)_(?P<variable>\w+)_(?P<time_type>\w+)_(?P<year>\d{4})\.tif',
            # Forecast_Grid_Monthly_Yield_SEA_202504.tif
            r'(?P<overview>\w+)_(?P<admin_level>\w+)_(?P<time_type>\w+)_(?P<variable>\w+)_(?P<region>\w+)_(?P<date>\d+)\.tif'
        ]
        
        for pattern in patterns:
            match = re.match(pattern, filename)
            if match:
                result = match.groupdict()
                
                # Set defaults
                result.setdefault('overview', 'hist')
                result.setdefault('variable', 'Yield')
                result.setdefault('admin_level', 'Prov')
                result.setdefault('time_type', 'Yearly')
                result.setdefault('region', 'SEA')
                
                return result
        
        logger.warning(f"Could not parse filename: {filename}")
        return None
    
    def process_directory(self):
        """Process all data files in the input directory"""
        
        logger.info(f"Processing directory: {self.input_dir}")
        
        # Find all GeoJSON and TIFF files
        geojson_files = list(self.input_dir.rglob("*.geojson"))
        tiff_files = list(self.input_dir.rglob("*.tif"))
        
        logger.info(f"Found {len(geojson_files)} GeoJSON files and {len(tiff_files)} TIFF files")
        
        # Process GeoJSON files
        for geojson_file in geojson_files:
            metadata = self.parse_filename(geojson_file.name)
            if not metadata:
                continue
                
            unified_data = self.convert_geojson_file(
                geojson_file,
                metadata['variable'],
                metadata['region'], 
                metadata['overview'],
                metadata['admin_level'],
                metadata['time_type']
            )
            
            if unified_data:
                # Create output path maintaining directory structure
                relative_path = geojson_file.relative_to(self.input_dir)
                output_file = self.output_dir / relative_path
                output_file.parent.mkdir(parents=True, exist_ok=True)
                
                with open(output_file, 'w', encoding='utf-8') as f:
                    json.dump(unified_data, f, indent=2, ensure_ascii=False)
                
                logger.info(f"Converted: {output_file}")
        
        # Process TIFF files (create metadata only)
        for tiff_file in tiff_files:
            metadata = self.parse_filename(tiff_file.name)
            if not metadata:
                continue
            
            raster_metadata = self.create_raster_metadata(
                tiff_file,
                metadata['variable'],
                metadata['region'],
                metadata['overview'], 
                metadata['admin_level'],
                metadata['time_type'],
                metadata.get('date', '2025')
            )
            
            # Create metadata file alongside the TIFF
            metadata_file = self.output_dir / f"{tiff_file.stem}_metadata.json"
            metadata_file.parent.mkdir(parents=True, exist_ok=True)
            
            with open(metadata_file, 'w', encoding='utf-8') as f:
                json.dump(raster_metadata, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Created metadata: {metadata_file}")

def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Convert agricultural data to unified format')
    parser.add_argument('input_dir', help='Input directory containing raw data files')
    parser.add_argument('output_dir', help='Output directory for converted files')
    parser.add_argument('--log-level', default='INFO', help='Logging level')
    
    args = parser.parse_args()
    
    # Configure logging level
    logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))
    
    # Create preprocessor and run conversion
    preprocessor = DataPreprocessor(args.input_dir, args.output_dir)
    preprocessor.process_directory()
    
    logger.info("Data preprocessing completed!")

if __name__ == "__main__":
    main()