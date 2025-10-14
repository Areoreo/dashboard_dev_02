/**
 * Extract province-country mapping from GeoJSON data
 * This script analyzes province names and maps them to countries
 */

const fs = require('fs');
const path = require('path');

// Province to country mapping based on Southeast Asian geography
const provinceToCountry = {
  // Thailand provinces
  'Amnat Charoen': 'Thailand',
  'Ang Thong': 'Thailand',
  'Bangkok': 'Thailand',
  'Bueng Kan': 'Thailand',
  'Buri Ram': 'Thailand',
  'Chachoengsao': 'Thailand',
  'Chai Nat': 'Thailand',
  'Chaiyaphum': 'Thailand',
  'Chanthaburi': 'Thailand',
  'Chiang Mai': 'Thailand',
  'Chiang Rai': 'Thailand',
  'Chon Buri': 'Thailand',
  'Chumphon': 'Thailand',
  'Kalasin': 'Thailand',
  'Kamphaeng Phet': 'Thailand',
  'Kanchanaburi': 'Thailand',
  'Khon Kaen': 'Thailand',
  'Krabi': 'Thailand',
  'Lampang': 'Thailand',
  'Lamphun': 'Thailand',
  'Loei': 'Thailand',
  'Lop Buri': 'Thailand',
  'Mae Hong Son': 'Thailand',
  'Maha Sarakham': 'Thailand',
  'Mukdahan': 'Thailand',
  'Nakhon Nayok': 'Thailand',
  'Nakhon Pathom': 'Thailand',
  'Nakhon Phanom': 'Thailand',
  'Nakhon Ratchasima': 'Thailand',
  'Nakhon Sawan': 'Thailand',
  'Nakhon Si Thammarat': 'Thailand',
  'Nan': 'Thailand',
  'Narathiwat': 'Thailand',
  'Nong Bua Lam Phu': 'Thailand',
  'Nong Khai': 'Thailand',
  'Nonthaburi': 'Thailand',
  'Pathum Thani': 'Thailand',
  'Pattani': 'Thailand',
  'Phangnga': 'Thailand',
  'Phatthalung': 'Thailand',
  'Phayao': 'Thailand',
  'Phetchabun': 'Thailand',
  'Phetchaburi': 'Thailand',
  'Phichit': 'Thailand',
  'Phitsanulok': 'Thailand',
  'Phra Nakhon Si Ayutthaya': 'Thailand',
  'Phrae': 'Thailand',
  'Phuket': 'Thailand',
  'Prachin Buri': 'Thailand',
  'Prachuap Khiri Khan': 'Thailand',
  'Ranong': 'Thailand',
  'Ratchaburi': 'Thailand',
  'Rayong': 'Thailand',
  'Roi Et': 'Thailand',
  'Sa Kaeo': 'Thailand',
  'Sakon Nakhon': 'Thailand',
  'Samut Prakan': 'Thailand',
  'Samut Sakhon': 'Thailand',
  'Samut Songkhram': 'Thailand',
  'Saraburi': 'Thailand',
  'Satun': 'Thailand',
  'Si Sa Ket': 'Thailand',
  'Sing Buri': 'Thailand',
  'Songkhla': 'Thailand',
  'Sukhothai': 'Thailand',
  'Suphan Buri': 'Thailand',
  'Surat Thani': 'Thailand',
  'Surin': 'Thailand',
  'Tak': 'Thailand',
  'Trang': 'Thailand',
  'Trat': 'Thailand',
  'Ubon Ratchathani': 'Thailand',
  'Udon Thani': 'Thailand',
  'Uthai Thani': 'Thailand',
  'Uttaradit': 'Thailand',
  'Yala': 'Thailand',
  'Yasothon': 'Thailand',

  // Myanmar states/regions
  'Ayeyarwady': 'Myanmar',
  'Bago': 'Myanmar',
  'Bago (East)': 'Myanmar',
  'Bago (West)': 'Myanmar',
  'Chin': 'Myanmar',
  'Kachin': 'Myanmar',
  'Kayah': 'Myanmar',
  'Kayin': 'Myanmar',
  'Magway': 'Myanmar',
  'Mandalay': 'Myanmar',
  'Mon': 'Myanmar',
  'Nay Pyi Taw': 'Myanmar',
  'Rakhine': 'Myanmar',
  'Sagaing': 'Myanmar',
  'Shan': 'Myanmar',
  'Shan (East)': 'Myanmar',
  'Shan (North)': 'Myanmar',
  'Shan (South)': 'Myanmar',
  'Tanintharyi': 'Myanmar',
  'Yangon': 'Myanmar',

  // Cambodia provinces
  'Banteay Meanchey': 'Cambodia',
  'Battambang': 'Cambodia',
  'Kampong Cham': 'Cambodia',
  'Kampong Chhnang': 'Cambodia',
  'Kampong Speu': 'Cambodia',
  'Kampong Thom': 'Cambodia',
  'Kampot': 'Cambodia',
  'Kandal': 'Cambodia',
  'Kep': 'Cambodia',
  'Koh Kong': 'Cambodia',
  'Kratie': 'Cambodia',
  'Mondulkiri': 'Cambodia',
  'Mondul Kiri': 'Cambodia',
  'Oddar Meanchey': 'Cambodia',
  'Pailin': 'Cambodia',
  'Phnom Penh': 'Cambodia',
  'Preah Sihanouk': 'Cambodia',
  'Preah Vihear': 'Cambodia',
  'Pursat': 'Cambodia',
  'Prey Veng': 'Cambodia',
  'Ratanakiri': 'Cambodia',
  'Ratanak Kiri': 'Cambodia',
  'Siem Reap': 'Cambodia',
  'Siemreap': 'Cambodia',
  'Stung Treng': 'Cambodia',
  'Svay Rieng': 'Cambodia',
  'Takeo': 'Cambodia',
  'Tboung Khmum': 'Cambodia',

  // Vietnam provinces
  'An Giang': 'Vietnam',
  'Ba Ria-Vung Tau': 'Vietnam',
  'Ba Ria - Vung Tau': 'Vietnam',
  'Bac Giang': 'Vietnam',
  'Bac Kan': 'Vietnam',
  'Bac Lieu': 'Vietnam',
  'Bac Ninh': 'Vietnam',
  'Ben Tre': 'Vietnam',
  'Binh Dinh': 'Vietnam',
  'Binh Duong': 'Vietnam',
  'Binh Phuoc': 'Vietnam',
  'Binh Thuan': 'Vietnam',
  'Ca Mau': 'Vietnam',
  'Can Tho': 'Vietnam',
  'Can Tho city': 'Vietnam',
  'Cao Bang': 'Vietnam',
  'Da Nang': 'Vietnam',
  'Da Nang city': 'Vietnam',
  'Dak Lak': 'Vietnam',
  'Dak Nong': 'Vietnam',
  'Dien Bien': 'Vietnam',
  'Dong Nai': 'Vietnam',
  'Dong Thap': 'Vietnam',
  'Gia Lai': 'Vietnam',
  'Ha Giang': 'Vietnam',
  'Ha Nam': 'Vietnam',
  'Ha Noi': 'Vietnam',
  'Ha Tinh': 'Vietnam',
  'Hai Duong': 'Vietnam',
  'Hai Phong': 'Vietnam',
  'Hai Phong city': 'Vietnam',
  'Hau Giang': 'Vietnam',
  'Ho Chi Minh': 'Vietnam',
  'Ho Chi Minh city': 'Vietnam',
  'Hoa Binh': 'Vietnam',
  'Hung Yen': 'Vietnam',
  'Khanh Hoa': 'Vietnam',
  'Kien Giang': 'Vietnam',
  'Kon Tum': 'Vietnam',
  'Lai Chau': 'Vietnam',
  'Lam Dong': 'Vietnam',
  'Lang Son': 'Vietnam',
  'Lao Cai': 'Vietnam',
  'Long An': 'Vietnam',
  'Nam Dinh': 'Vietnam',
  'Nghe An': 'Vietnam',
  'Ninh Binh': 'Vietnam',
  'Ninh Thuan': 'Vietnam',
  'Phu Tho': 'Vietnam',
  'Phu Yen': 'Vietnam',
  'Quang Binh': 'Vietnam',
  'Quang Nam': 'Vietnam',
  'Quang Ngai': 'Vietnam',
  'Quang Ninh': 'Vietnam',
  'Quang Tri': 'Vietnam',
  'Soc Trang': 'Vietnam',
  'Son La': 'Vietnam',
  'Tay Ninh': 'Vietnam',
  'Thai Binh': 'Vietnam',
  'Thai Nguyen': 'Vietnam',
  'Thanh Hoa': 'Vietnam',
  'Thua Thien-Hue': 'Vietnam',
  'Thua Thien Hue': 'Vietnam',
  'Tien Giang': 'Vietnam',
  'Tra Vinh': 'Vietnam',
  'Tuyen Quang': 'Vietnam',
  'Vinh Long': 'Vietnam',
  'Vinh Phuc': 'Vietnam',
  'Yen Bai': 'Vietnam',

  // Laos provinces
  'Attapeu': 'Laos',
  'Bokeo': 'Laos',
  'Bolikhamsai': 'Laos',
  'Bolikhamxai': 'Laos',
  'Champasak': 'Laos',
  'Champasack': 'Laos',
  'Houaphan': 'Laos',
  'Khammouane': 'Laos',
  'Khammouan': 'Laos',
  'Luang Namtha': 'Laos',
  'Louangnamtha': 'Laos',
  'Luang Prabang': 'Laos',
  'Louangphabang': 'Laos',
  'Oudomxay': 'Laos',
  'Oudomxai': 'Laos',
  'Phongsaly': 'Laos',
  'Sainyabuli': 'Laos',
  'Xaignabouly': 'Laos',
  'Salavan': 'Laos',
  'Savannakhet': 'Laos',
  'Sekong': 'Laos',
  'Vientiane': 'Laos',
  'Vientiane Province': 'Laos',
  'Vientiane Capital': 'Laos',
  'Xaignabouli': 'Laos',
  'Xaisomboun': 'Laos',
  'Xaisomboon': 'Laos',
  'Xiangkhouang': 'Laos',
  'Xiengkhouang': 'Laos',

  // India states/territories (relevant ones)
  'Andaman & Nicobar': 'India',
  'Andhra Pradesh': 'India',
  'Arunachal Pradesh': 'India',
  'Assam': 'India',
  'Bihar': 'India',
  'Chandigarh': 'India',
  'Chhattisgarh': 'India',
  'Chhattishgarh': 'India',
  'Dadra and Nagar Haveli': 'India',
  'Daman and Diu': 'India',
  'Daman and Diu and Dadra and Nagar Haveli': 'India',
  'Delhi': 'India',
  'Goa': 'India',
  'Gujarat': 'India',
  'Haryana': 'India',
  'Himachal Pradesh': 'India',
  'Jammu and Kashmir': 'India',
  'Jharkhand': 'India',
  'Karnataka': 'India',
  'Kerala': 'India',
  'Lakshadweep': 'India',
  'Madhya Pradesh': 'India',
  'Maharashtra': 'India',
  'Manipur': 'India',
  'Meghalaya': 'India',
  'Mizoram': 'India',
  'Nagaland': 'India',
  'Odisha': 'India',
  'Puducherry': 'India',
  'Punjab': 'India',
  'Rajasthan': 'India',
  'Sikkim': 'India',
  'Tamil Nadu': 'India',
  'Tamilnadu': 'India',
  'Telangana': 'India',
  'Telengana': 'India',
  'Tripura': 'India',
  'Uttar Pradesh': 'India',
  'Uttarakhand': 'India',
  'West Bengal': 'India'
};

function extractProvinceCountryMapping(geojsonPath) {
  console.log('Reading GeoJSON file...');
  const data = JSON.parse(fs.readFileSync(geojsonPath, 'utf8'));

  const mapping = {};
  const unmapped = [];

  data.features.forEach(feature => {
    const name = feature.properties.name;
    if (name) {
      const country = provinceToCountry[name] || 'Unknown';
      mapping[name] = country;

      if (country === 'Unknown') {
        unmapped.push(name);
      }
    }
  });

  console.log('\nProvince-Country Mapping:');
  console.log('========================');
  Object.keys(mapping).sort().forEach(prov => {
    console.log(`${prov}: ${mapping[prov]}`);
  });

  if (unmapped.length > 0) {
    console.log('\n⚠️  Unmapped provinces:');
    unmapped.forEach(name => console.log(`  - ${name}`));
  }

  // Save to JSON file
  const outputPath = path.join(__dirname, 'province_country_mapping.json');
  fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
  console.log(`\n✅ Mapping saved to: ${outputPath}`);

  return mapping;
}

// Run the extraction
const geojsonPath = '/mnt/e/Works/Github_repo/dashboard_dev_02/data/ERA5/SPI3/Forecast/Prov/Monthly/Forecast_Prov_Monthly_SPI3_SEA.geojson';
extractProvinceCountryMapping(geojsonPath);
