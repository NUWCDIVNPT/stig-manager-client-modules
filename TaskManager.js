// import { EventEmitter } from 'events';
// import Papa from 'papaparse'
// import Ajv from 'ajv'
// import addFormats from 'ajv-formats'
// import fs from 'fs'


// class AssetParser extends EventEmitter {
//     constructor() {
//         super()
//     }

//     parseCSV(file) {
//         let rowIndex = 1
//         const stream = fs.createReadStream(file, 'utf8')
//         Papa.parse(stream, {
//             header: true,
//             skipEmptyLines: "greedy",
//             dynamicTyping: false,
//             transform: (value) => {
//                 if (typeof value !== 'string') return value
//                 return value.trim().normalize("NFKC")
//             },
//             step: (row) => {
//                 try {
//                     const parsedRow = this.validateRowStructure(row.data, rowIndex)
//                     this.emit('row', { row: parsedRow, rowIndex })
//                 } catch (err) {
//                     this.emit('error', { message: err.message, rowIndex })
//                 }
//                 rowIndex++
//             },
//             complete: () => {
//                 this.emit('end')
//             }
//         })
//     }

//     validateRowStructure(row, rowIndex) {
//         const requiredFields = ["Non-Computing"]
//         let missingFields = requiredFields.filter(field => !row[field])

//         if (missingFields.length > 0) {
//             throw new Error(`Missing required fields: ${missingFields.join(", ")}`)
//         }

//         const asset = {
//             name: row["Name"] ? row["Name"] : "",
//             description: this.sanitizeText(row["Description"]) ? this.sanitizeText(row["Description"]) : "",
//             noncomputing: row["Non-Computing"]?.toLowerCase() === 'true',
//             ip: row["IP"] ? row["IP"] : "",
//             stigs: row["STIGs"] ? row["STIGs"].split('\n') : [],
//             metadata: this.checkMetadata(row["Metadata"]),
//         }
//         if (row["FQDN"]) asset.fqdn = row["FQDN"]
//         if (row["MAC"]) asset.mac = row["MAC"]
//         asset.labelNames = row["Labels"] ? row["Labels"].split('\n') : []
//         return asset
//     }

//     sanitizeText(text) {
//         if (!text) return ""
//         return text.replace(/[\r\n\t]+/g, " ") // replace newlines returns, and tabs
//                    .replace(/\s+/g, " ") // Collapse multiple spaces into a single space
//                    .trim()
//     }

//     checkMetadata(metadataString) {
//         if (!metadataString) return JSON.stringify({})
//        // check that metdata is a string 
//         if (typeof metadataString !== 'string') {
//             throw new Error(`Metadata must be a string, received: ${typeof metadataString}`)
//         }
//         return metadataString
//     }
// }

// class Validator extends EventEmitter {
    
//     constructor(apiSchema) {
//         super()
//         this.ajv = new Ajv({ allErrors: true, strict: false })
//         addFormats(this.ajv)
//         this.ajv.addSchema(apiSchema, 'openapi-spec')
//         const schemaPath = '#/components/schemas/AssetBatchItem'
//         this.validate = this.ajv.getSchema(`openapi-spec${schemaPath}`)
//         if (!this.validate) {
//             throw new Error(`Schema not found at ${schemaPath}`)
//         }
//     }

//     validateRow({ row, rowIndex }) {
//         const validRow = { ...row, metadata: this.parseMetadata(row) } // parse metadata to ensure its valid
//         if (this.validate(validRow)) {
//             this.emit('valid-row', { validRow, rowIndex })
//         } else {
//             this.emit('invalid-row', { validRow, rowIndex, errors: this.validate.errors })
//         }
//     }

//     parseMetadata(row) {
//         if (!row.metadata) return {}
//         try { 
//             return JSON.parse(row.metadata) // dont wanna parse actually just make sure its a good string? idk?
//         } catch (error) {
//             throw new Error(`Error parsing metadata: ${error.message}`)
//         }
//     }
        
// }

// class TaskManager extends EventEmitter {
    
//     constructor(existingLabels) {
//         super()
//         this.existingLabels = new Set(existingLabels)
//         this.pendingAssets = []
//         this.newLabels = new Set()
//     }

//     processRow({ validRow, rowIndex }) {
//         const labels = validRow.labelNames ? validRow.labelNames : []
//         labels.forEach(label => {
//             if (!this.existingLabels.has(label)) {
//                 this.newLabels.add(label)
//             }
//         })
//         this.pendingAssets.push({ validRow, rowIndex })
//     }

//     finalize() {
//         this.emit('all-data-ready', { 
//             assets: this.pendingAssets, 
//             labels: Array.from(this.newLabels) 
//         })
//     }
    
// }


// // Usage Example
// const fileStream = './test-files/parsers/csv/api_asset_sample_large.csv'
// const token = "eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJGSjg2R2NGM2pUYk5MT2NvNE52WmtVQ0lVbWZZQ3FvcXRPUWVNZmJoTmxFIn0.eyJleHAiOjE4NjQ2ODEwMzUsImlhdCI6MTY3MDU0MDIzNiwiYXV0aF90aW1lIjoxNjcwNTQwMjM1LCJqdGkiOiI0N2Y5YWE3ZC1iYWM0LTQwOTgtOWJlOC1hY2U3NTUxM2FhN2YiLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjgwODAvYXV0aC9yZWFsbXMvc3RpZ21hbiIsImF1ZCI6WyJyZWFsbS1tYW5hZ2VtZW50IiwiYWNjb3VudCJdLCJzdWIiOiJiN2M3OGE2Mi1iODRmLTQ1NzgtYTk4My0yZWJjNjZmZDllZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJzdGlnLW1hbmFnZXIiLCJub25jZSI6IjMzNzhkYWZmLTA0MDQtNDNiMy1iNGFiLWVlMzFmZjczNDBhYyIsInNlc3Npb25fc3RhdGUiOiI4NzM2NWIzMy0yYzc2LTRiM2MtODQ4NS1mYmE1ZGJmZjRiOWYiLCJhY3IiOiIwIiwicmVhbG1fYWNjZXNzIjp7InJvbGVzIjpbImNyZWF0ZV9jb2xsZWN0aW9uIiwiZGVmYXVsdC1yb2xlcy1zdGlnbWFuIiwiYWRtaW4iXX0sInJlc291cmNlX2FjY2VzcyI6eyJyZWFsbS1tYW5hZ2VtZW50Ijp7InJvbGVzIjpbInZpZXctdXNlcnMiLCJxdWVyeS1ncm91cHMiLCJxdWVyeS11c2VycyJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJvcGVuaWQgc3RpZy1tYW5hZ2VyOmNvbGxlY3Rpb24gc3RpZy1tYW5hZ2VyOnN0aWc6cmVhZCBzdGlnLW1hbmFnZXI6dXNlcjpyZWFkIHN0aWctbWFuYWdlcjpvcCBzdGlnLW1hbmFnZXI6Y29sbGVjdGlvbjpyZWFkIHN0aWctbWFuYWdlcjpvcDpyZWFkIHN0aWctbWFuYWdlcjp1c2VyIHN0aWctbWFuYWdlciBzdGlnLW1hbmFnZXI6c3RpZyIsInNpZCI6Ijg3MzY1YjMzLTJjNzYtNGIzYy04NDg1LWZiYTVkYmZmNGI5ZiIsIm5hbWUiOiJTVElHTUFOIEFkbWluIiwicHJlZmVycmVkX3VzZXJuYW1lIjoic3RpZ21hbmFkbWluIiwiZ2l2ZW5fbmFtZSI6IlNUSUdNQU4iLCJmYW1pbHlfbmFtZSI6IkFkbWluIn0.a1XwJZw_FIzwMXKo-Dr-n11me5ut-SF9ni7ylX-7t7AVrH1eAqyBxX9DXaxFK0xs6YOhoPsh9NyW8UFVaYgtF68Ps6yzoiqFEeiRXkpN5ygICN3H3z6r-YwanLlEeaYR3P2EtHRcrBtCnt0VEKKbGPWOfeiNCVe3etlp9-NQo44"

// const apiSchema = await fetch('http://localhost:64001/api/op/definition', {
//     method: 'GET',
//     headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//     }
// }).then(response => {
//     if (!response.ok) {
//         throw new Error(`HTTP error! status: ${response.status}`)
//     }
//     return response.json()
// })

// const existingLabels = ['label1', 'label2']

// const parser = new AssetParser()
// const validator = new Validator(apiSchema)
// const taskManager = new TaskManager(existingLabels)

// parser.on('row', (e) => validator.validateRow(e))
// parser.on('error', (e) => console.error(`Parsing error at row ${e.rowIndex}: ${e.message}`))

// validator.on('valid-row', (e) => taskManager.processRow(e))
// validator.on('invalid-row', (e) => console.warn(`Invalid row ${e.rowIndex}:`, e.errors))


// taskManager.on('all-data-ready', ({ assets, labels }) => {
//     const endTime = performance.now();
//     console.log(`Parsing completed in ${(endTime - startTime)} milliseconds.`);
//     console.log("All data ready for processing")
//    // console.log("All assets processed:", assets)
//    // console.log("New labels found:", labels)
// })

// parser.on('end', () => taskManager.finalize())

// const startTime = performance.now()
// parser.parseCSV(fileStream)
