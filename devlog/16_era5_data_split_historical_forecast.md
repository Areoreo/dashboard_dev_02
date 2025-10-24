# DevLog 16: ERA5 Data Split - Historical and Forecast

**Date**: 2025-10-24
**Status**: ✅ Complete

## Summary

Split full ensemble time series data (1981-2026) for SPI and climate variables into separate Historical and Forecast datasets following the project's naming conventions and directory structure.

## Variables Processed

- **SPI1, SPI3, SPI6, SPI12** (Drought indices)
- **Prcp** (Precipitation)
- **Temp** (Temperature)

## Data Split Criteria

- **Historical Data**: 1981-01 to 2025-10 (last date - 6 months)
- **Forecast Data**: 2025-11 to 2026-04 (last 6 months)
- **Admin Level**: Province (Prov) only
- **Date Types**: Monthly and Yearly

## Implementation

### Script Created

`scripts/split_forecast_historical.py`

**Key Features**:
- Parses legacy format time properties (`y198101_0`, `y202511_mean`, etc.)
- Splits data at 202511 cutoff (last 6 months for forecast)
- Maintains proper naming convention: `{overview}_{adminLevel}_{dateType}_{varType}_{region}.geojson`
- Preserves ensemble data structure (mean, min, max, individual members)

### File Structure

```
/data/ERA5/{varType}/
├── Hist/
│   └── Prov/
│       ├── Monthly/
│       │   ├── Hist_Prov_Monthly_{varType}_Cambodia.geojson
│       │   ├── Hist_Prov_Monthly_{varType}_Laos.geojson
│       │   ├── Hist_Prov_Monthly_{varType}_Myanmar.geojson
│       │   ├── Hist_Prov_Monthly_{varType}_SEA.geojson
│       │   ├── Hist_Prov_Monthly_{varType}_Thailand.geojson
│       │   └── Hist_Prov_Monthly_{varType}_Vietnam.geojson
│       └── Yearly/
│           └── [same 6 regions]
└── Forecast/
    └── Prov/
        ├── Monthly/
        │   └── Forecast_Prov_Monthly_{varType}_{region}.geojson (6 files)
        └── Yearly/
            └── Forecast_Prov_Yearly_{varType}_{region}.geojson (6 files)
```

## Results

### File Count Per Variable

Each variable now has:
- **12 Historical files** (6 regions × 2 date types)
- **12 Forecast files** (6 regions × 2 date types)
- **Total: 24 files per variable**

### Data Coverage

**Monthly Prov Files**:
- Historical: 6,981 time periods (1981-01 to 2025-10, including ensemble members)
- Forecast: 78 time periods (2025-11 to 2026-04, including ensemble members)

**Yearly Prov Files**:
- Historical: 572 time periods (ensemble years from ~1968 to 2024)
- Forecast: 26 time periods (ensemble years 2025-2026)

### Regions Covered

- Cambodia
- Laos
- Myanmar
- SEA (Southeast Asia aggregate)
- Thailand
- Vietnam

## Data Verification

✅ File naming follows convention
✅ Directory structure correct
✅ Historical data ends at 202510
✅ Forecast data starts at 202511
✅ Ensemble data preserved (mean, min, max, individual members)
✅ All 6 variables processed successfully

## Notes

- Country and Grid level data were not processed (not part of new dataset)
- Original source files remain in `Forecast/Prov/Monthly` directories
- Backup available at `data/ERA5_backup_20251024/`
- Script is reusable for future data updates

## Related Files

- Script: `scripts/split_forecast_historical.py`
- Data: `data/ERA5/{SPI1,SPI3,SPI6,SPI12,Prcp,Temp}/`
