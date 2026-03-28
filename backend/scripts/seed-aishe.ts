import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { db } from '../src/config/db';

// A smart helper function to check multiple possible column names (handles government typos!)
const mapRowToDB = (row: any) => {
  const getVal = (keys: string[]) => {
    for (const k of keys) {
      if (row[k] !== undefined && row[k] !== '') return row[k].trim();
    }
    return null;
  };

  return {
    aishe_code: getVal(['Aishe Code', 'AISHE Code']), 
    institution_name: getVal(['Name', 'Institution Name']),
    // Checks for whichever type column exists in that specific file
    institution_type: getVal(['College Type', 'Standalone Type', 'University Type']),
    state: getVal(['State', 'State Name']),
    district: getVal(['District', 'District Name']),
    // Notice we check for their typo "Manegement" first!
    management_type: getVal(['Manegement', 'Management']),
    location_type: getVal(['Location', 'Rural/Urban']),
    established_year: parseInt(getVal(['Year Of Establishment', 'Year of Establishment'])) || null,
    university_aishe_code: getVal(['University Code', 'Affiliating University Code']) || null,
  };
};

const seedCSV = async (filePath: string) => {
  console.log(`⏳ Starting import for ${path.basename(filePath)}...`);
  const results: any[] =[];
  let rowCount = 0;

  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ 
        skipLines: 2,
        mapHeaders: ({ header }) => header.trim() 
      }))
      .on('data', (data) => {
        rowCount++;
        const mappedData = mapRowToDB(data);
        
        // Only insert rows that have a valid AISHE Code
        if (mappedData.aishe_code && mappedData.institution_name) {
          results.push(mappedData);
        } else if (rowCount === 1) {
           console.log(`⚠️ Warning: Could not find AISHE Code on first row. Keys found:`, Object.keys(data));
        }
      })
      .on('end', async () => {
        console.log(`✅ Parsed ${results.length} valid records. Inserting into DB...`);
        
        if (results.length === 0) {
           console.log(`⏭️ Skipping ${path.basename(filePath)} - No valid data found.`);
           return resolve(true);
        }

        try {
          const chunkSize = 1000;
          for (let i = 0; i < results.length; i += chunkSize) {
            const chunk = results.slice(i, i + chunkSize);
            
            const values = chunk.map((_, index) => 
              `($${index * 9 + 1}, $${index * 9 + 2}, $${index * 9 + 3}, $${index * 9 + 4}, $${index * 9 + 5}, $${index * 9 + 6}, $${index * 9 + 7}, $${index * 9 + 8}, $${index * 9 + 9})`
            ).join(', ');

            const flatParams = chunk.flatMap(r =>[
              r.aishe_code, r.institution_name, r.institution_type, 
              r.state, r.district, r.management_type, 
              r.location_type, r.established_year, r.university_aishe_code
            ]);

            const query = `
              INSERT INTO aishe_directory 
              (aishe_code, institution_name, institution_type, state, district, management_type, location_type, established_year, university_aishe_code)
              VALUES ${values}
              ON CONFLICT (aishe_code) DO NOTHING;
            `;

            await db.$executeRawUnsafe(query, ...flatParams);
          }
          console.log(`🎉 Finished inserting ${path.basename(filePath)}!`);
          resolve(true);
        } catch (error) {
          console.error(`❌ DB Insert Error for ${path.basename(filePath)}:`, error);
          reject(error);
        }
      });
  });
};

const runSeeder = async () => {
  try {
    const uniPath = path.join(__dirname, '../data/universities.csv');
    const colPath = path.join(__dirname, '../data/colleges.csv');
    const stdPath = path.join(__dirname, '../data/standalone.csv');

    if (fs.existsSync(uniPath)) await seedCSV(uniPath);
    if (fs.existsSync(colPath)) await seedCSV(colPath);
    if (fs.existsSync(stdPath)) await seedCSV(stdPath);

    console.log('🚀 ALL AISHE DATA SEEDED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

runSeeder();