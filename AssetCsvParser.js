
import Papa from './papaparse-esm.js'
import fs from 'fs'

class AssetParser {
    constructor() {
        this.Papa = Papa()
        this.uniqueAssetNames = new Set()
        this.assets = []
        this.errors = {}
        this.rowIndex = 1
        this.headers = []
        this.fatalError = false 
    }

    parseMetadataField(metadataField) {
        let errors = []
        if (!metadataField) return { metadata: {}, errors } // if field is undefined or null, return empty object
        try {
            const metadata = JSON.parse(metadataField)
            if (!this.isValidMetadata(metadata)) {
                // this.errors.push(`Invalid metadata: Only string values are allowed at row ${this.rowIndex + 1} of CSV file`)
                errors.push({row: this.rowIndex, message: `Metadata must be a flat object with string values only`})
                return { metadata: {}, errors }
            }
            return { metadata, errors }
        } catch (error) {
            //this.errors.push(`Metadata parsing error at row ${this.rowIndex + 1}: ${error.message} of CSV file`)
            errors.push({row: this.rowIndex, message: `Metadata parsing error: ${metadataField} is not valid JSON`})            
            return { metadata: {}, errors }
        }
    }

    isValidMetadata(obj) {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            !Array.isArray(obj) &&
            Object.values(obj).every(value => typeof value === 'string')
        )
    }

    parseDescriptionField(descriptionField) {
        if (!descriptionField) return null
        const cleaned = descriptionField
            .replace(/[\r\n\t]+/g, " ") // remove line breaks and tabs
            .replace(/\s+/g, " ")       // collapse multiple spaces
            .trim()                   // remove leading/trailing spaces

        if(cleaned === '') return null // if empty string, return null
    
        return this.truncateString(cleaned, 255)// truncate to 255 chars
    }
    
    validateAsset(asset) {
        const errors = []
    
        // Required fields
        if (asset.name === undefined || asset.name === null) {
            errors.push(`Missing required field: Name`)
        }
    
        // String255: max length 255, non-null string min 1
        const validateName = (val, field) => {
            if (typeof val !== 'string') {
                errors.push(`Field: "Name", Value: ${val} must be a string`)
            } else if (val.length > 255 || val.length < 1) {
                errors.push(`Field:"Name", Value: ${val} must between 1 and 255 characters`)
            }
        }
    
        // String255Nullable: null or string up to 255 chars
        const validateString255Nullable = (val, field) => {
            if (val !== undefined && val !== null) {
                if (typeof val !== 'string') {
                    errors.push(`Field:"${field}", Value: ${val} must be a string or null`)
                } else if (val.length > 255) {
                    errors.push(`Field:"${field}", Value: ${val} exceeds max length of 255`)
                }
            }
        }
    
        // Validate required String255 fields
        if (asset.name !== undefined) validateName(asset.name, "name")
    
        // Validate other fields
        validateString255Nullable(asset.description, "Description")
        validateString255Nullable(asset.fqdn, "FQDN")
        validateString255Nullable(asset.ip, "IP")
        validateString255Nullable(asset.mac, "MAC")
    
        // Validate noncomputing
        if (asset.noncomputing !== undefined && typeof asset.noncomputing !== 'boolean') {
            errors.push(`Field: "Non-Computing" must be a boolean ex. true or false`)
        }
    
        // Validate metadata: object with string values only
        if (asset.metadata !== undefined) {
            if (typeof asset.metadata !== 'object') {
                errors.push(`Field: "Metadata" must be an object`)
            } else {
                for (const [key, val] of Object.entries(asset.metadata)) {
                    if (typeof val !== 'string') {
                        errors.push(`Field: "Metadata" property "${key}" must be a string`)
                    }
                }
            }
        }
    
        // Validate stigs: array of strings
        if (asset.stigs !== undefined) {
            if (!Array.isArray(asset.stigs)) {
                errors.push(`Field "STIGs" must be an array`)
            } else {
                asset.stigs.forEach((s, i) => {
                    if (typeof s !== 'string') {
                        errors.push(`Item ${i} in field "STIGs" must be a string`)
                    }
                })
            }
        }
    
        // Validate labelNames: array of strings (1-16 chars)
        if (asset.labelNames !== undefined) {
            if (!Array.isArray(asset.labelNames)) {
                errors.push(`Field "Labels" must be an array`)
            } else {
                asset.labelNames.forEach((label, i) => {
                    if (typeof label !== 'string') {
                        errors.push(`Label at index ${i}, and name ${label} must be a string`)
                    } else if (label.length < 1 || label.length > 16) {
                        errors.push(`Label at index ${i}, name ${label} must be between 1 and 16 characters`)
                    }
                })
            }
        }
    
        return errors
    }

    truncateString = function (str, max) {
        if (typeof str !== 'string') return str // if not a string, return value
        return str.length > max ? str.slice(0, max) : str
    }
      
    parseStigsField(stigsField) {
        if (typeof stigsField !== 'string') return [] // if field is undefined or null, return empty array

        const normalized = stigsField.replace(/\r\n|\r/g, '\n')  // normalize line endings
    
        const trimmed = normalized.trim() // remove leading and trailing whitespace
        if (trimmed === '') return [] // if empty string, return empty array
    
        const benchmarkIds = trimmed.split('\n').map(s => s.trim()).filter(Boolean)  // split by new line and trim each entry, filter(boolean) removes empty strings
        return Array.from(new Set(benchmarkIds)) // remove duplicates
    }

    parseLabelNamesField(labelString) {
        if (typeof labelString !== 'string') return [] // if field is undefined or null, return empty array

        const normalized = labelString.replace(/\r\n|\r/g, '\n') // normalize line endings

        const labelNames = normalized
            .split('\n') // split by new line
            .map(label => label.trim())  // trim each entry
            .map(label => this.truncateString(label, 16)) // trim each entry and truncate to 16 chars
            .filter(Boolean) // filter out empty strings

        if (labelNames.length === 0) return [] // if empty string, return empty array

        // filtering out duplicates need this extra code for case insensitivity
        const seen = new Set()
        const unique = []
    
        for (const label of labelNames) {
            const key = label.toLowerCase()
            if (!seen.has(key)) {
                seen.add(key)
                unique.push(label)
            }
        }
    
        return unique
    }

    addError(rowIndex, message) {
        if (!this.errors[rowIndex]) {
            this.errors[rowIndex] = []
        }
        this.errors[rowIndex].push(message)
    }
    
    // processRow(row) {

    //     let parsingErrors = []

    //     if (!row["Name"]) {
    //        parsingErrors.push({row: this.rowIndex, message: `Parsing Error: Required field "Name" missing`})
    //     }
       
    //     const asset = {
    //         name: row["Name"], // required field
    //         description: this.parseDescriptionField(row["Description"]), // implies empty string if undefined
    //         noncomputing: row["Non-Computing"]?.toLowerCase() === 'true' || false, // implies false if undefined
    //         ip: row["IP"]? this.truncateString(row["IP"], 255) : null, // null if undefined
    //         stigs: this.parseStigsField(row["STIGs"]), // implies empty array if undefined
    //     }
    //     let {metadata, errors} = this.parseMetadataField(row["Metadata"]) // will return empty object if undefined
    //     if (errors.length > 0) {
    //         parsingErrors.push(...errors) // add parsing errors to the list
    //     }
    //     asset.metadata = metadata // assign parsed metadata to asset


    //     if (row["FQDN"]) asset.fqdn = this.truncateString(row["FQDN"], 255)
    //     if (row["MAC"]) asset.mac = this.truncateString(row["MAC"], 255)
    //     if (row["Labels"]) asset.labelNames = this.parseLabelNamesField(row["Labels"]) 
    
    //     if (parsingErrors.length > 0) {
    //         parsingErrors.forEach(err => this.addError(err.row, `Parsing error: ${err.message}`))
    //     }

    //     const validationErrors = this.validateAsset(asset) // double check for API schema compliance

    //     if (this.uniqueAssetNames.has(asset.name)) {
    //         validationErrors.push(`Validation Error: Duplicate asset name "${asset.name}" at row ${this.rowIndex} of CSV file`)
    //     }
      
    //     if (validationErrors.length === 0 && parsingErrors.length === 0) {
    //         this.uniqueAssetNames.add(asset.name)
    //         asset.CSVRow = this.rowIndex // add row index to asset for reference
    //         this.assets.push(asset)
    //     } else {
    //        validationErrors.forEach(err => {this.rowIndex, 
    //         this.addError(this.rowIndex, `Validation error (Name: ${asset.name}): ${err}`)
    //         })
    //     }
       
    // }

    processRow(row) {
        const { asset, parsingErrors } = this.parseAssetRow(row)

        if (parsingErrors.length) {
            this.addError("Parsing", this.rowIndex, asset.name, parsingErrors)
            return
        }

        const validationErrors = this.validateParsedAsset(asset)

        if (this.uniqueAssetNames.has(asset.name)) {
            validationErrors.push(`Duplicate asset name "${asset.name}" at row ${this.rowIndex}`)
        }

        if (validationErrors.length === 0) {
            this.uniqueAssetNames.add(asset.name)
            asset.CSVRow = this.rowIndex
            this.assets.push(asset)
        } else {
            this.addErrors("Validation", this.rowIndex, asset.name, validationErrors)
        }
    }

    checkHeaders() {
        const requiredHeaders = [
            "Name", "Description", "IP", "FQDN", "MAC",
            "Non-Computing", "STIGs", "Labels", "Metadata"
        ]
    
        const missing = requiredHeaders.filter(h => !this.headers.includes(h))
        const extra = this.headers.filter(h => !requiredHeaders.includes(h))
    
        const error = missing.length > 0 || extra.length > 0
        return error
    }

    parse(fileObj) {
        return new Promise((resolve, reject) => {
            this.rowIndex = 1
            this.errors = {}
            this.assets = []
            this.headers = []
            this.uniqueAssetNames = new Set()
            this.fatalError = false 

            let headersChecked = false // headers validated 
            
            this.Papa.parse(fileObj, {
                header: true,
                skipEmptyLines: true,
                transform: (value) => typeof value === 'string' ? value.normalize('NFKC').trim() : value,
                step: (results) => {
                    if (this.fatalError) return
                    if (!headersChecked) {
                        headersChecked = true
                        this.headers = results.meta.fields
                        if (this.checkHeaders()) {
                            this.fatalError = true
                            this.addError(this.rowIndex, `File Error: Invalid headers found in CSV file. Required headers: "Name", "Description", "IP", "FQDN", "MAC", "Non-Computing", "STIGs", "Labels", "Metadata"`)
                            return 
                        }
                    }
                    this.processRow(results.data)
                    this.rowIndex++
                },
                error: (err) => reject(new Error(`CSV parsing error: ${err.message}`)),
                complete: (results) => {

                    if(this.rowIndex === 1 && !this.fatalError){
                        this.addError(this.rowIndex, "File Error: No valid rows found in the CSV file.")
                    }
                    resolve({
                        assets: this.assets,
                        errors: this.errors
                    })
                }
            })
        })
    }
}

export default AssetParser

async function run() {

    const startTime = Date.now()
    const filePath = './test-files/parsers/csv/api_asset_sample.csv'
    const fileStream = fs.createReadStream(filePath, 'utf8')
    const parser = new AssetParser()
    const {assets, errors} = await parser.parse(fileStream)
    const endTime = Date.now()
    const duration = endTime - startTime
    console.log('Assets:', assets)
    console.log('Errors:', JSON.stringify(errors, null, 2))
    console.log(`Parsing completed in ${duration} ms`)
}

run()
