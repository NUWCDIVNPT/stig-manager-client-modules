
import Papa from './papaparse-esm.js'
import fs from 'fs'

/**
 * AssetParser class
 * This class is responsible for parsing a CSV file containing asset information.
 * It validates the data, checks for errors, and stores the parsed assets in an array.
 * It also checks for duplicate asset names and validates the metadata field.
 */
class AssetParser {
    /**
     * Constructs an instance of the AssetCsvParser class.
     * Initializes properties for parsing CSV files, tracking unique asset names, 
     * storing parsed assets, handling errors, and managing the parsing state.
     *
     * @property {Object} Papa - Instance of the Papa parser for CSV parsing.
     * @property {Set<string>} uniqueAssetNames - A set to track unique asset names.
     * @property {Array<Object>} assets - An array to store parsed asset objects.
     * @property {Object} errors - An object to store errors encountered during parsing.
     * @property {number} rowIndex - The current row index of the CSV being processed.
     * @property {Array<string>} headers - An array to store the headers of the CSV file.
     * @property {boolean} fatalError - A flag indicating if a fatal error was encountered during parsing.
     */
    constructor() {
        this.Papa = Papa()
        this.uniqueAssetNames = new Set() // to track unique asset names
        this.assets = [] // parsed assets
        this.errors = {} // errors encountered during parsing
        this.rowIndex = 1 // row of csv being processed
        this.headers = [] //  headers of the csv file
        this.fatalError = false // fatal error encountered during parsing
    }

    /**
     * Parses a metadata field from a CSV file and validates its structure.
     *
     * @param {string|null|undefined} metadataField - The metadata field to parse, expected to be a JSON string.
     * @returns {{metadata: Object, errors: Array<{row: number, message: string}>}} 
     *          An object containing the parsed metadata and an array of error objects, if any.
     *          - `metadata`: The parsed metadata object if valid, otherwise an empty object.
     *          - `errors`: An array of error objects with details about parsing or validation issues.
     */
    parseMetadataField(metadataField) {
        let errors = []
        if (!metadataField) return { metadata: {}, errors } // if field is undefined or null, return empty object
        try {
            const metadata = JSON.parse(metadataField) // attempt to parse the metadata field as JSON
            if (!this.isValidMetadata(metadata)) {// if metadata is not a valid object, return empty object and error
                errors.push({row: this.rowIndex, message: `Metadata field in CSV file must be a flat object with string values only`})
                return { metadata: {}, errors }
            }
            return { metadata, errors }
        } catch (error) { // if JSON parsing fails, return empty object and error
            errors.push({row: this.rowIndex, message: `Metadata field in CSV file: ${metadataField} is not valid JSON`})            
            return { metadata: {}, errors }
        }
    }

    // metadata field must be a flat object with string values only
    isValidMetadata(obj) {
        return (
            typeof obj === 'object' &&
            obj !== null &&
            !Array.isArray(obj) &&
            Object.values(obj).every(value => typeof value === 'string')
        )
    }

    // parses `string255nullable` fields from the CSV file
    parseString255NullableField(field) {
        if (!field) return null
        const cleaned = field
            .replace(/[\r\n\t]+/g, " ")// remove line breaks and tabs
            .replace(/\s+/g, " ")      // collapse multiple spaces
            .trim()                    // remove leading/trailing spaces

        if(cleaned === '') return null // if empty string, return null
    
        return this.truncateString(cleaned, 255)// truncate to 255 chars
    }

    truncateString = function (str, max) {
        if (typeof str !== 'string') return str // if not a string, return value
        return str.length > max ? str.slice(0, max) : str
    }
      
    /**
     * Parses a string containing newline seperated STIGs and returns a unique array of benchmark IDs.
     * @param {string} stigsField - The input string containing STIGs, separated by newlines.
     * @returns {string[]} An array of unique benchmark IDs. Returns an empty array if the input is not a string or is empty.
     */
    parseStigsField(stigsField) {
        if (typeof stigsField !== 'string') return [] 

        const normalized = stigsField.replace(/\r\n|\r/g, '\n')  // normalize line endings
    
        const trimmed = normalized.trim() // remove leading and trailing whitespace
        if (trimmed === '') return [] // if empty string after trim, return empty array
    
        const benchmarkIds = trimmed.split('\n').map(s => s.trim()).filter(Boolean)  // split by new line and trim each entry, filter(boolean) removes empty strings
        return Array.from(new Set(benchmarkIds)) // remove duplicates
    }

    /**
     * Parses a string of label names, normalizes line endings, trims each label,
     * truncates them to a maximum of 16 characters, removes empty strings, and
     * filters out duplicates (case-insensitive).
     *
     * @param {string} labelString - The input string containing label names, separated by new lines.
     * @returns {string[]} An array of unique, cleaned-up label names.
     */
    parseLabelNamesField(labelString) {
        if (typeof labelString !== 'string') return [] 

        const normalized = labelString.replace(/\r\n|\r/g, '\n') // normalize line endings

        const labelNames = normalized
            .split('\n') // split by new line
            .map(label => label.trim())  // trim each entry
            .map(label => this.truncateString(label, 16)) // trim each entry and truncate to 16 chars
            .filter(Boolean) // filter out empty strings

        if (labelNames.length === 0) return [] // if empty string, return empty array

        // filtering out duplicates need this extra code for case insensitivity
        const seen = new Set()
        const uniqueLabels = []
    
        for (const label of labelNames) {
            const key = label.toLowerCase()
            if (!seen.has(key)) {
                seen.add(key)
                uniqueLabels.push(label)
            }
        }
    
        return uniqueLabels // finally cleaned up array of unique labels
    }

    addError(rowIndex, message) {
        if (!this.errors[rowIndex]) {
            this.errors[rowIndex] = []
        }
        this.errors[rowIndex].push(message)
    }

    /**
     * Parses and validates the "Name" field from a given input.
     *
     * @param {string} nameField - The input value for the "Name" field to be parsed and validated.
     * @returns {{ name: string|null, errors: Array<{ row: number, message: string }> }} 
     *          An object containing the parsed name (or null if invalid) and an array of error objects.
     *          Each error object includes the row index and an error message.
     */
    parseNameField(nameField) {
        let name = null
        const errors = []
    
        if (typeof nameField === 'string') {
            const trimmed = nameField.trim()
            if (trimmed.length >= 1 && trimmed.length <= 255) {
                name = trimmed
            } else {
                errors.push({
                    row: this.rowIndex,
                    message: `Required Field "Name" must be a non-empty string between 1 and 255 characters`
                })
            }
        } else {
            errors.push({
                row: this.rowIndex,
                message: `Required Field "Name" must be a non-empty string between 1 and 255 characters`
            })
        }
    
        return { name, errors }
    }
    
    
    /**
     * Parses a row of asset data and extracts relevant fields into an asset object.
     *
     * @param {Object} row - The row of asset data to parse.
     * @param {string} row.Metadata - The metadata field containing additional asset information.
     * @param {string} row.Name - The name of the asset.
     * @param {string} [row.Description] - A description of the asset (optional, max 255 characters).
     * @param {string} [row.Non-Computing] - Indicates if the asset is non-computing. Interpreted as true if
     * @param {string} [row.IP] - The IP address of the asset (optional, max 255 characters).
     * @param {string} [row.STIGs] - The STIGs (Security Technical Implementation Guides) associated with the asset.
     * @param {string} [row.FQDN] - The fully qualified domain name of the asset (optional, max 255 characters).
     * @param {string} [row.MAC] - The MAC address of the asset (optional, max 255 characters).
     * @param {string} [row.Labels] - The labels associated with the asset.
     * @returns {Object} An object containing the parsed asset and any parsing errors.
     * @returns {Object.asset} The parsed asset object.
     * @returns {Array} parsingErrors - An array of errors encountered during parsing.
     * 
     */
    parseAssetRow(row) {
        const {metadata, errors} = this.parseMetadataField(row["Metadata"]) // errors will be empty if no errors occur in parsing metadata. 
        const { name, errors: nameErrors } = this.parseNameField(row["Name"])
        if (nameErrors.length) {
            errors.push(...nameErrors)
        }
        return{
            asset: {
                name,  
                description: this.parseString255NullableField(row["Description"]),
                noncomputing: row["Non-Computing"]?.toLowerCase() === 'true' || false,
                ip: this.parseString255NullableField(row["IP"], 255),
                stigs: this.parseStigsField(row["STIGs"]),
                metadata,
                fqdn: this.parseString255NullableField(row["FQDN"], 255),
                mac: this.parseString255NullableField(row["MAC"], 255),
                labelNames: this.parseLabelNamesField(row["Labels"])
            },
            parsingErrors: errors
        }
    }

    /**
     * Processes a single row of the CSV file, parsing the asset data and handling any parsing errors.
     * 
     * @param {Object} row - The row object from the CSV file to be processed.
     * 
     * @description
     * - Parses the asset data from the given row.
     * - Checks for duplicate asset names and adds a parsing error if a duplicate is found.
     * - If no parsing errors are found, the asset is added to the list of assets.
     * - If parsing errors are found, they are added to the error list.
     */
    processRow(row) {
        const { asset, parsingErrors } = this.parseAssetRow(row)

        // check for duplicate asset names
        if(this.uniqueAssetNames.has(asset.name)) {
            parsingErrors.push({
                row: this.rowIndex,
                message: `Duplicate asset name "${asset.name}" at row ${this.rowIndex} of CSV file`
            })
        }

        if (parsingErrors.length === 0) {
              // if no errors, add asset to the list
              this.uniqueAssetNames.add(asset.name)
              asset.CSVRow = this.rowIndex
              this.assets.push(asset)
        }
        else 
        {
            // if there are errors, add them to the error list
            parsingErrors.forEach(err => this.addError(err.row, `Parsing error: ${err.message}`))
        }

    }

    /**
     * 
     * @returns {boolean} - Returns true if there are missing or extra headers, false otherwise.
     * @description
     * Checks the headers of the CSV file against the required headers.
     */
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

    /**
     * Parses a CSV file and processes its rows to extract asset data.
     *
     * @param {File|Blob|string|ReadableStream|NodeJS.ReadableStream} fileObj - 
     *   The CSV file or stream to parse. Can be a File, Blob, string of CSV data, 
     *   browser ReadableStream, or Node.js ReadableStream (e.g., fs.createReadStream).
     *
     * @returns {Promise<{ assets: Object[], errors: Record<number, string[]> }>} 
     *   A promise that resolves to an object containing:
     *
     *   - `assets` {Array<Object>}: An array of successfully parsed asset objects.
     *   - `errors` {Object<number, string[]>}: An object mapping row numbers (starting at 2 for the first data row) 
     *     to arrays of error messages encountered during parsing or validation.
     * 
     * If no valid rows are found and no other errors were recorded, a "No valid rows found" error 
     * is added to the errors object under the last row index.
     */
    parse(fileObj) {
        return new Promise((resolve, reject) => {
            // NOTE: Each call to parse will reset the state of the parser it does not perserve state between calls
            this.rowIndex = 2 
            this.errors = {}
            this.assets = []
            this.headers = []
            this.uniqueAssetNames = new Set()
            this.fatalError = false 
            let headersChecked = false
            
            this.Papa.parse(fileObj, {
                header: true,
                skipEmptyLines: true, // greedy is also an option but messes with rowIndex
                transform: (value) => typeof value === 'string' ? value.normalize('NFKC').trim() : value, // normalize and trim string values
                step: (results) => {
                    if (this.fatalError) return // if a fatal error has occurred, stop processing

                    // check for headers and see if there is a fatal error (only called once)
                    if (!headersChecked) {
                        headersChecked = true
                        this.headers = results.meta.fields
                        if (this.checkHeaders()) {
                            this.fatalError = true
                            this.addError(this.rowIndex, `File Error: Invalid headers found in CSV file. Required headers: "Name", "Description", "IP", "FQDN", "MAC", "Non-Computing", "STIGs", "Labels", "Metadata"`)
                            return 
                        }
                    }
                    
                    const row = results.data
                    delete row.__parsed_extra // holds any extra fields that are not in the header (this ignores them)
                 
                    // check for 'empty rows'
                    // effectively empty rows are those that have all values as null, undefined, or empty strings
                    const isEffectivelyEmpty = Object.values(row).every(val =>
                        val === null || val === undefined || (typeof val === 'string' && val.trim() === '')
                    )

                    // if the row is empty, skip it
                    if (isEffectivelyEmpty) {
                        this.rowIndex++
                        return
                    }
                    this.processRow(row)
                    this.rowIndex++
                   
                },
                error: (err) => reject(new Error(`CSV parsing error: ${err.message}`)),
                complete: () => {

                    const noAssets = this.assets.length === 0;
                    const noErrors = Object.keys(this.errors).length === 0;
                
                    // no fatal error occurred, but no assets or errors were found
                    if (noAssets && noErrors && !this.fatalError) {
                        this.addError(this.rowIndex, "File Error: No valid rows found in the CSV file.");
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
    // console.log('Assets:', assets)
    // console.log('Errors:', JSON.stringify(errors, null, 2))
    // console.log(`Parsing completed in ${duration} ms`)
}

//run()
