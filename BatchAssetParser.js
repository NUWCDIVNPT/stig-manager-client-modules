import Papa from 'papaparse'

class AssetParser {
    parseCSV(csvString) {
        const { data, errors } = Papa.parse(csvString, {
            header: true, // returns the first row as headers
            skipEmptyLines: "greedy", // skips empty rows but in this case lines with only whitespace also 
            dynamicTyping: false, // keep all values as strings
            transform: (value) => {
                if (typeof value !== 'string') return value
                return value.trim().normalize("NFKC") // Nnrmalize encoding (fixes weird spaces)
            }
        })

        if (errors.length) {
            //console.error("CSV Parsing Errors:", errors)
            throw new Error("Error parsing CSV", errors)
        }

        return data.map(row => this.formatAsset(row))
    }

    formatAsset(row) {
        const asset = {
            name: row["Name"],
            description: this.sanitizeText(row["Description"]),
            noncomputing: row["Non-Computing"]?.toLowerCase() === 'true',
            ip: row["IP"] || null,
            stigs: row["STIGs"] ? row["STIGs"].split('\n') : [],
            metadata: this.parseMetadata(row["Metadata"]),
        }
        if (row["FQDN"]) asset.fqdn = row["FQDN"]
        if (row["MAC"]) asset.mac = row["MAC"]
        if (row["Labels"]) asset.labelIds = row["Labels"].split('\n')
        return asset
    }


    sanitizeText(text) {
        if (!text) return ""
        return text.replace(/[\r\n\t]+/g, " ") // replace newlines returns, and tabs
                   .replace(/\s+/g, " ") // Collapse multiple spaces into a single space
                   .trim()
    }
    

    parseMetadata(metadataString) {
        if (!metadataString) return {}
        try { 
            return JSON.parse(metadataString)
        } catch (error) {
            throw new Error(`Error parsing metadata: ${error.message}`)
        }
    }
}

export default AssetParser
