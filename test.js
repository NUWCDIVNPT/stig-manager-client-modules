
import fs from 'fs';



function generateCSV(filePath, numberOfRows) {
    const header = 'Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata\n';

    const createRow = (index) => 
        `Asset-${index},Asset Description,192.168.1.${index % 255},Asset-${index}.example.com,AB:CD:EF:12:34:56,TRUE,"VPN_SRG_TEST","label1\nlabel6","{""key:3"":""value:3""}"`;

    const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
    stream.write(header);

    for (let i = 1; i <= numberOfRows; i++) {
        stream.write(createRow(i) + '\n');
    }

    stream.end();
    stream.on('finish', () => {
        console.log(`CSV file generated with ${numberOfRows} rows at ${filePath}`);
    });
}

// Example usage





generateCSV('./test-files/parsers/csv/api_asset_sample_large.csv', 3000);
