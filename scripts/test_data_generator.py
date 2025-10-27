#!/usr/bin/env python3
"""
Test Data Generator for Agricultural Dashboard
Creates synthetic geometric regions with realistic agricultural data patterns
"""

import json
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Tuple
import argparse
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TestDataGenerator:
    """Generate synthetic test data with realistic patterns"""
    
    def __init__(self, output_dir: str):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def create_rectangular_geometry(self, min_lon: float, min_lat: float, 
                                  width: float, height: float) -> Dict:
        """Create a rectangular polygon geometry"""
        return {
            "type": "Polygon",
            "coordinates": [[
                [min_lon, min_lat],
                [min_lon + width, min_lat], 
                [min_lon + width, min_lat + height],
                [min_lon, min_lat + height],
                [min_lon, min_lat]
            ]]
        }
    
    def create_triangular_geometry(self, center_lon: float, center_lat: float, 
                                 size: float) -> Dict:
        """Create a triangular polygon geometry"""
        # Create equilateral triangle
        height = size * np.sqrt(3) / 2
        return {
            "type": "Polygon", 
            "coordinates": [[
                [center_lon, center_lat + height/2],           # top
                [center_lon - size/2, center_lat - height/2],  # bottom left
                [center_lon + size/2, center_lat - height/2],  # bottom right
                [center_lon, center_lat + height/2]            # close
            ]]
        }
    
    def generate_yield_time_series(self, start_year: int, end_year: int, 
                                 base_yield: float, trend: float = 0.02,
                                 variability: float = 0.1) -> List[Dict]:
        """Generate realistic yield time series with trend and variability"""
        time_series = []
        
        for year in range(start_year, end_year + 1):
            # Base yield with linear trend
            yield_value = base_yield * (1 + trend) ** (year - start_year)
            
            # Add random variability
            noise = np.random.normal(0, variability * yield_value)
            yield_value += noise
            
            # Ensure positive values
            yield_value = max(0.1, yield_value)
            
            time_series.append({
                "date": f"{year}-01-01",
                "value": round(yield_value, 2),
                "quality": "high"
            })
        
        return time_series
    
    def generate_monthly_ensemble_data(self, year: int, base_yield: float,
                                     num_ensembles: int = 5) -> List[Dict]:
        """Generate monthly ensemble forecast data"""
        time_series = []
        
        for month in range(1, 13):
            # Seasonal pattern (higher yields in certain months)
            seasonal_factor = 1 + 0.3 * np.sin(2 * np.pi * month / 12)
            monthly_base = base_yield * seasonal_factor
            
            # Generate ensemble members
            ensemble_values = []
            for _ in range(num_ensembles):
                # Each ensemble member has some variability
                value = monthly_base * np.random.normal(1.0, 0.15)
                ensemble_values.append(max(0.1, round(value, 2)))
            
            # Calculate statistics
            ensemble_values.sort()
            stats = {
                "mean": round(np.mean(ensemble_values), 2),
                "min": round(np.min(ensemble_values), 2),
                "max": round(np.max(ensemble_values), 2),
                "stdDev": round(np.std(ensemble_values), 2),
                "percentiles": {
                    "p25": round(np.percentile(ensemble_values, 25), 2),
                    "p50": round(np.percentile(ensemble_values, 50), 2), 
                    "p75": round(np.percentile(ensemble_values, 75), 2)
                }
            }
            
            time_series.append({
                "date": f"{year}-{month:02d}-01",
                "ensembleValues": ensemble_values,
                "statistics": stats,
                "confidence": round(np.random.uniform(0.8, 0.95), 2)
            })
        
        return time_series
    
    def generate_spi_time_series(self, start_year: int, end_year: int) -> List[Dict]:
        """Generate SPI (drought index) time series with realistic patterns"""
        time_series = []
        
        # SPI follows roughly normal distribution around 0
        for year in range(start_year, end_year + 1):
            for month in range(1, 13):
                # Add some seasonal bias and persistence
                seasonal_bias = 0.2 * np.sin(2 * np.pi * month / 12)
                spi_value = np.random.normal(seasonal_bias, 1.0)
                
                # Clamp to reasonable SPI range
                spi_value = np.clip(spi_value, -3.5, 3.5)
                
                time_series.append({
                    "date": f"{year}-{month:02d}-01",
                    "value": round(spi_value, 2),
                    "quality": "high"
                })
        
        return time_series
    
    def create_test_regions(self) -> List[Dict]:
        """Create synthetic test regions with different geometries"""
        regions = [
            {
                "id": "rect_001", 
                "name": "Rectangle Region North",
                "geometry": self.create_rectangular_geometry(100.0, 15.0, 2.0, 1.5),
                "base_yield": 2.5
            },
            {
                "id": "rect_002",
                "name": "Rectangle Region South", 
                "geometry": self.create_rectangular_geometry(101.5, 12.0, 1.8, 2.0),
                "base_yield": 3.2
            },
            {
                "id": "tri_001",
                "name": "Triangle Region East",
                "geometry": self.create_triangular_geometry(105.0, 14.0, 2.5),
                "base_yield": 2.8
            },
            {
                "id": "tri_002", 
                "name": "Triangle Region West",
                "geometry": self.create_triangular_geometry(98.5, 13.5, 2.0),
                "base_yield": 2.1
            }
        ]
        
        return regions
    
    def generate_historical_dataset(self) -> Dict:
        """Generate historical yield dataset (1990-2020)"""
        regions = self.create_test_regions()
        features = []
        
        for region in regions:
            time_series = self.generate_yield_time_series(
                start_year=1990,
                end_year=2020, 
                base_yield=region["base_yield"],
                trend=0.015,  # 1.5% annual growth
                variability=0.12
            )
            
            features.append({
                "type": "Feature",
                "geometry": region["geometry"],
                "properties": {
                    "id": region["id"],
                    "name": region["name"],
                    "timeSeries": time_series
                }
            })
        
        return {
            "metadata": {
                "variable": "Yield",
                "region": "TEST", 
                "overview": "hist",
                "adminLevel": "Prov",
                "timeType": "Yearly",
                "dateRange": {
                    "start": "1990-01-01",
                    "end": "2020-12-31"
                },
                "units": "tons/hectare",
                "description": "Test historical yield data with synthetic regions"
            },
            "dataType": "geojson",
            "features": features
        }
    
    def generate_forecast_dataset(self) -> Dict:
        """Generate forecast ensemble dataset (2025)"""
        regions = self.create_test_regions()
        features = []
        
        for region in regions:
            time_series = self.generate_monthly_ensemble_data(
                year=2025,
                base_yield=region["base_yield"] * 1.1,  # Slight improvement over historical
                num_ensembles=5
            )
            
            features.append({
                "type": "Feature", 
                "geometry": region["geometry"],
                "properties": {
                    "id": region["id"],
                    "name": region["name"],
                    "timeSeries": time_series
                }
            })
        
        return {
            "metadata": {
                "variable": "Yield",
                "region": "TEST",
                "overview": "forecast", 
                "adminLevel": "Prov",
                "timeType": "Monthly",
                "dateRange": {
                    "start": "2025-01-01",
                    "end": "2025-12-31"
                },
                "units": "tons/hectare",
                "description": "Test forecast ensemble yield data with synthetic regions"
            },
            "dataType": "geojson",
            "features": features
        }
    
    def generate_spi_dataset(self) -> Dict:
        """Generate SPI drought index dataset"""
        regions = self.create_test_regions()
        features = []
        
        for region in regions:
            time_series = self.generate_spi_time_series(2020, 2024)
            
            features.append({
                "type": "Feature",
                "geometry": region["geometry"], 
                "properties": {
                    "id": region["id"],
                    "name": region["name"],
                    "timeSeries": time_series
                }
            })
        
        return {
            "metadata": {
                "variable": "SPI1",
                "region": "TEST",
                "overview": "hist",
                "adminLevel": "Prov", 
                "timeType": "Monthly",
                "dateRange": {
                    "start": "2020-01-01",
                    "end": "2024-12-31"
                },
                "units": "index",
                "description": "Test SPI drought index data with synthetic regions"
            },
            "dataType": "geojson",
            "features": features
        }
    
    def generate_legacy_format_data(self) -> Dict:
        """Generate data in the old format for testing conversion"""
        regions = self.create_test_regions()
        features = []
        
        for region in regions:
            # Create old-style properties
            properties = {
                "id": region["id"],
                "name": region["name"]
            }
            
            # Add historical data (y2020, y2021, etc.)
            for year in range(2020, 2023):
                yield_value = region["base_yield"] * np.random.normal(1.0, 0.1)
                properties[f"y{year}"] = round(max(0.1, yield_value), 2)
            
            # Add ensemble forecast data (y202504_0, y202504_1, etc.)
            base_forecast = region["base_yield"] * 1.05
            ensemble_values = []
            for i in range(3):
                value = base_forecast * np.random.normal(1.0, 0.1)
                ensemble_values.append(max(0.1, round(value, 2)))
                properties[f"y202504_{i}"] = ensemble_values[-1]
            
            # Add statistics
            properties["y202504_mean"] = round(np.mean(ensemble_values), 2)
            properties["y202504_min"] = round(np.min(ensemble_values), 2) 
            properties["y202504_max"] = round(np.max(ensemble_values), 2)
            
            features.append({
                "type": "Feature",
                "geometry": region["geometry"],
                "properties": properties
            })
        
        return {
            "type": "FeatureCollection",
            "features": features
        }
    
    def generate_all_test_data(self):
        """Generate all test datasets"""
        logger.info("Generating test datasets...")
        
        # Create unified format datasets
        datasets = {
            "historical_yield_unified.json": self.generate_historical_dataset(),
            "forecast_yield_unified.json": self.generate_forecast_dataset(),
            "spi_data_unified.json": self.generate_spi_dataset()
        }
        
        # Create legacy format for testing conversion
        legacy_data = self.generate_legacy_format_data()
        datasets["legacy_format_test.json"] = legacy_data
        
        # Save all datasets
        for filename, dataset in datasets.items():
            output_file = self.output_dir / filename
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(dataset, f, indent=2, ensure_ascii=False)
            logger.info(f"Created: {output_file}")
        
        # Create README for test data
        readme_content = """# Test Data Documentation

This directory contains synthetic test datasets for the agricultural dashboard.

## Files:

- `historical_yield_unified.json`: Historical yield data (1990-2020) in unified format
- `forecast_yield_unified.json`: Forecast ensemble yield data (2025) in unified format  
- `spi_data_unified.json`: SPI drought index data (2020-2024) in unified format
- `legacy_format_test.json`: Data in old format for testing conversion script

## Test Regions:

The data includes 4 synthetic regions:
- Rectangle Region North: 2.0° x 1.5° rectangle
- Rectangle Region South: 1.8° x 2.0° rectangle  
- Triangle Region East: Equilateral triangle (2.5° side)
- Triangle Region West: Equilateral triangle (2.0° side)

Each region has realistic agricultural data patterns with:
- Seasonal variations
- Year-to-year trends
- Random variability
- Ensemble uncertainty for forecasts

## Usage:

Use these datasets to test:
- Data loading and processing
- Chart visualization components
- Map rendering and interactions
- API endpoint functionality
- Format conversion scripts
"""
        
        readme_file = self.output_dir / "README.md"
        with open(readme_file, 'w', encoding='utf-8') as f:
            f.write(readme_content)
        
        logger.info(f"Test data generation completed! Files saved to: {self.output_dir}")

def main():
    """Main function for command line usage"""
    parser = argparse.ArgumentParser(description='Generate test data for agricultural dashboard')
    parser.add_argument('output_dir', help='Output directory for test data files')
    parser.add_argument('--log-level', default='INFO', help='Logging level')
    
    args = parser.parse_args()
    
    # Configure logging level
    logging.getLogger().setLevel(getattr(logging, args.log_level.upper()))
    
    # Create generator and generate data
    generator = TestDataGenerator(args.output_dir)
    generator.generate_all_test_data()

if __name__ == "__main__":
    main()