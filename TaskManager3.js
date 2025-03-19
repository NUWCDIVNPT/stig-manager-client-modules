import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import Papa from 'papaparse';
import fs from 'fs';

class AssetParser {
    constructor(apiSchema, existingLabels = []) {
        this.existingLabelsSet = new Set(existingLabels);
        this.labelsSet = new Set();
        this.assets = [];
        this.rowIndex = 0;
        
        // Setup schema validation
        this.ajv = new Ajv({ allErrors: true, strict: false });
        addFormats(this.ajv);
        this.ajv.addSchema(apiSchema, 'openapi-spec');

        this.validate = this.ajv.getSchema('openapi-spec#/components/schemas/AssetBatchItem');
        if (!this.validate) {
            throw new Error('Schema not found at openapi-spec#/components/schemas/AssetBatchItem');
        }
    }

    verifyMetadata(metadataString) {
        if (!metadataString) return {};
        try {
            if (typeof metadataString !== 'string') {
                throw new Error(`Metadata must be a string, received: ${typeof metadataString}`);
            }
            const metadata = JSON.parse(metadataString);
            if (!this.isValidMetadata(metadata)) {
                throw new Error('Invalid metadata: Only string values are allowed.');
            }
            return metadata;
        } catch (error) {
            throw new Error(`Metadata parsing error at row ${this.rowIndex + 1}: ${error.message}`);
        }
    }

    isValidMetadata(obj) {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            !Array.isArray(obj) &&
            Object.values(obj).every(value => typeof value === 'string')
        );
    }

    sanitizeText(text) {
        if (!text) return "";
        return text.replace(/[\r\n\t]+/g, " ") // replace newlines, returns, and tabs
                   .replace(/\s+/g, " ") // collapse multiple spaces into a single space
                   .trim();
    }

    processRow(row) {
        if (!row["Non-Computing"]) {
            throw new Error(`Required field "Non-Computing" missing at row ${this.rowIndex + 1}`);
        }

        const asset = {
            name: row["Name"] || "",
            description: this.sanitizeText(row["Description"]) ? this.sanitizeText(row["Description"]) : "",
            noncomputing: row["Non-Computing"]?.toLowerCase() === 'true',
            ip: row["IP"] || "",
            stigs: row["STIGs"] && row["STIGs"].trim() !== "" ? row["STIGs"].split('\n').map(s => s.trim()) : [],
            metadata: this.verifyMetadata(row["Metadata"]),
        }
        if (row["FQDN"]) asset.fqdn = row["FQDN"]
        if (row["MAC"]) asset.mac = row["MAC"]
        asset.labelNames = row["Labels"] ? row["Labels"].split('\n') : []

        if (this.validate(asset)) {
            asset.labelNames.forEach(label => {
                if (!this.existingLabelsSet.has(label)) {
                    this.labelsSet.add(label);
                }
            });
            this.assets.push(asset);
        } else {
            console.error(`Validation failed for asset at row ${this.rowIndex + 1} (Name: ${asset.name}):`, this.validate.errors);
        }
        this.rowIndex++;
    }

    parse(fileStream) {
        return new Promise((resolve, reject) => {
            this.rowIndex = 0

            Papa.parse(fileStream, {
                header: true,
                skipEmptyLines: true,
                transform: (value) => typeof value === 'string' ? value.normalize('NFKC').trim() : value,
                step: ({ data: row }) => {
                    try {
                        this.processRow(row);
                    } catch (err) {
                        console.error(`Error parsing row ${this.rowIndex + 1}: ${err.message}`);
                    }
                },
                error: (err) => reject(new Error(`CSV parsing error: ${err.message}`)),
                complete: () => resolve({ labels: Array.from(this.labelsSet), assets: this.assets }),
            });
        });
    }
}


export default AssetParser;

async function run() {
    try {
        const token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44"

        const apiSchema = await fetch('http://localhost:64001/api/op/definition', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        const existingLabels = ['Label1', 'Label2']
        const startTime = Date.now()
        const filePath = './test-files/parsers/csv/api_asset_sample.csv'
        const fileStream = fs.createReadStream(filePath, 'utf8')
        const parser = new AssetParser(apiSchema, existingLabels);
        const {labels, assets } = await parser.parse(fileStream);
        const endTime = Date.now()
        console.log(`Parsing completed in ${endTime - startTime} ms`)
        console.log('Labels:', labels)
        console.log('Assets:', assets)
    } catch (error) {
        console.error('Parsing failed:', error);
    }
}

// function generateCSV(filePath, numberOfRows) {
//     const header = 'Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata\n';

//     const createRow = (index) => 
//         `Asset-${index},Asset Description,192.168.1.${index % 255},Asset-${index}.example.com,AB:CD:EF:12:34:56,TRUE,"VPN_SRG_TEST","label1\nlabel6","{""key:3"":""value:3""}"`;

//     const stream = fs.createWriteStream(filePath, { encoding: 'utf8' });
//     stream.write(header);

//     for (let i = 1; i <= numberOfRows; i++) {
//         stream.write(createRow(i) + '\n');
//     }

//     stream.end();
//     stream.on('finish', () => {
//         console.log(`CSV file generated with ${numberOfRows} rows at ${filePath}`);
//     });
// }

// // Example usage


// await run()


// //generateCSV('./test-files/parsers/csv/api_asset_sample_large.csv', 10000);
