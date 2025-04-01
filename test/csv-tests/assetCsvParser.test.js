import chai from 'chai'
import AssetParser from '../../AssetCsvParser.js'
import fs from 'fs'
const expect = chai.expect
import { Readable } from 'stream'

function stringToStream(string) {
    return Readable.from([string])
}

describe(`Integration`, function () {

    let parser

    describe(`Success`, function () {
        this.beforeEach(() => {
            parser = new AssetParser()
        })

        it(`should parse a valid CSV file correctly`, async () => {
            const file = './test-files/parsers/csv/asset_sample.csv'

            const expectedOutput = [
                {
                    CSVRow: 2,
                    name: "Asset 1",
                    description: "Asset1 Description",
                    labelNames: ["Label1", "Label2", "Label3"],
                    noncomputing: true,
                    fqdn: "Asset-1.f.q.d.n",
                    ip: "1.1.1.1",
                    mac: "AB-12-AB-12-AB",
                    stigs: ["MS_Windows_10_STIG", "Google_Chrome_Current_Windows", "VPN_BAD"],
                    metadata: { key1: "value1", key2: "value2" }
                },
                {
                    CSVRow: 3,
                    name: "Asset 2",
                    description: "Asset2 Description",
                    labelNames: ["Label4"],
                    noncomputing: false,
                    ip: "2.2.2.2",
                    mac: null,
                    fqdn: null,
                    stigs: ["MS_Windows_10_STIG"],
                    metadata: { "key:3": "value:3"}
                },
                {
                    CSVRow: 4,
                    name: "Asset 3",
                    description: "!@#$%^&*()_+={}[]|:;'<>,.?/~`\"",
                    noncomputing: true,
                    ip: "3.3.3.3",
                    stigs: [],
                    mac: null,
                    fqdn: null,
                    labelNames: [],
                    metadata: { }
                },
            ]

            const csvString = fs.readFileSync(file, 'utf-8')
            const stream = stringToStream(csvString)
            const parsedData = await parser.parse(stream)
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
        })

        it(`should parse a valid CSV with empty row (skips rows with no data)`, async () => {
             const file = './test-files/parsers/csv/empty_rows.csv'
    
            const expectedOutput = [
                {
                    CSVRow: 3,
                    name: "Asset 1",
                    description: "Asset1 Description",
                    labelNames: ["Label1", "Label2", "Label3"],
                    noncomputing: true,
                    fqdn: "Asset-1.f.q.d.n",
                    ip: "1.1.1.1",
                    mac: "AB-12-AB-12-AB",
                    stigs: ["MS_Windows_10_STIG", "Google_Chrome_Current_Windows", "VPN_BAD"],
                    metadata: { key1: "value1", key2: "value2" }
                },
                {
                    CSVRow: 4,
                    name: "Asset 2",
                    description: "Asset2 Description",
                    labelNames: ["Label4"],
                    noncomputing: false,
                    fqdn: null,
                    mac: null,
                    ip: "2.2.2.2",
                    stigs: ["MS_Windows_10_STIG"],
                    metadata: { "key:3": "value:3"}
                },
                {
                    CSVRow: 7,
                    name: "Asset 3",
                    description: "!@#$%^&*()_+={}[]|:;'<>,.?/~`\"",
                    noncomputing: true,
                    ip: "3.3.3.3",
                    labelNames: [],
                    mac: null,
                    fqdn: null,
                    stigs: [],
                    metadata: { }
                },
            ]
    
            const csvString = fs.readFileSync(file, 'utf-8')
            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
        })

        it(`should parse a valid CSV file that contains empty cells for non required fields`, async () => {

            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
"Asset 1",,,,,,,,`

            const expectedOutput = [
                {
                    CSVRow: 2,
                    name: "Asset 1",
                    description: null,
                    labelNames: [],
                    noncomputing: false,
                    fqdn: null,
                    ip: null,
                    mac: null,
                    stigs: [],
                    metadata: {}
                }
            ]
            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
        })

        it("Should remove newlines returns and tabs from description", async () => {
            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
    "Asset 1","This description
    has a newline and	tabs",1.1.1.1,,AB-12-AB-12-AB,TRUE,,,`
    
            const expectedOutput = [{
                CSVRow: 2,
                name: "\"Asset 1\"",
                description: "This description has a newline and tabs",
                noncomputing: true,
                ip: "1.1.1.1",
                labelNames: [],
                fqdn: null,
                mac: "AB-12-AB-12-AB",
                stigs: [],
                metadata: {}
            }]
    
            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
        })  

        it("should reset parser state when re calling parse", async () => {

            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
            Asset 1,,,,,,,,`

            const expectedOutput = [
                {
                    CSVRow: 2,
                    name: "Asset 1",
                    description: null,
                    labelNames: [],
                    noncomputing: false,
                    fqdn: null,
                    ip: null,
                    mac: null,
                    stigs: [],
                    metadata: {}
                }
            ]

            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
            expect(parser.assets).to.deep.equal(expectedOutput)
            expect(parser.rowIndex).to.equal(3)

            const csvString2 = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
            Asset 2,,,,,,,,`

            const expectedOutput2 = [
                {
                    CSVRow: 2,
                    name: "Asset 2",
                    description: null,
                    labelNames: [],
                    noncomputing: false,
                    fqdn: null,
                    ip: null,
                    mac: null,
                    stigs: [],
                    metadata: {}
                }
            ]
            const parsedData2 = await parser.parse(stringToStream(csvString2))
            expect(parsedData2.assets).to.deep.equal(expectedOutput2)
            expect(parsedData2.errors).to.deep.equal({})
            expect(parser.assets).to.deep.equal(expectedOutput2)
            expect(parser.rowIndex).to.equal(3)
        })

        it("should skip rows where cells effectively have no data. (cells have space, or newline or tab)", async () => {

            const expectedOutput = [
            {
                name: 'Asset 1',
                description: null,
                noncomputing: false,
                ip: null,
                stigs: [],
                metadata: {},
                fqdn: null,
                mac: null,
                labelNames: [],
                CSVRow: 2
            },
            {
                name: 'Asset 2',
                description: null,
                noncomputing: false,
                ip: null,
                stigs: [],
                metadata: {},
                fqdn: null,
                mac: null,
                labelNames: [],
                CSVRow: 3
            },
            {
                name: 'Asset 4',
                description: null,
                noncomputing: false,
                ip: null,
                stigs: [],
                metadata: {},
                fqdn: null,
                mac: null,
                labelNames: [],
                CSVRow: 5
            },
            {
                name: 'Asset 5',
                description: null,
                noncomputing: false,
                ip: null,
                stigs: [],
                metadata: {},
                fqdn: null,
                mac: null,
                labelNames: [],
                CSVRow: 6
            }]

            const file = './test-files/parsers/csv/empty_cells.csv'
            const csvString = fs.readFileSync(file, 'utf-8')
            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
        })

        it("should not process duplicate stig or labels", async () => {
            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
            Asset,,,,,,"VPN_SRG_TEST
            VPN_SRG_TEST","Label1
            Label1
            Label1 ",{}`            

            const expectedOutput = [
                {
                    CSVRow: 2,
                    name: "Asset",
                    description: null,
                    labelNames: ["Label1"],
                    noncomputing: false,
                    fqdn: null,
                    ip: null,
                    mac: null,
                    stigs: ["VPN_SRG_TEST"],
                    metadata: {}
                }
            ]

            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
        })

        it("should ignore extra field in a row that are not apart of standard headers", async () => {

            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
            Asset 1,,,,,,,,,test` // test extends to the column right of Metadata 

            const expectedOutput = [
                {
                    CSVRow: 2,
                    name: "Asset 1",
                    description: null,
                    labelNames: [],
                    noncomputing: false,
                    fqdn: null,
                    ip: null,
                    mac: null,
                    stigs: [],
                    metadata: {}
                }
            ]

            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal(expectedOutput)
            expect(parsedData.errors).to.deep.equal({})
        })
    })

    describe(`Failure`, function () {
        this.beforeEach(() => {
            parser = new AssetParser()
    })

        it('should return fatal error for invalid headers but with some data', async () => {
            const csvWithBadHeader = `Wrong,Cols,Only\nBad,data,row
            Asset 1,,,,,,,,`
            const result = await parser.parse(stringToStream(csvWithBadHeader))
            expect(result.assets).to.deep.equal([])
            expect(result.errors[2][0]).to.match(/Invalid headers/)
            expect(parser.fatalError).to.equal(true)
        })

        it(`should return fatal error for no valid rows in csv`, async () => {
            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata`
            const result = await parser.parse(stringToStream(csvString))
            expect(result.assets).to.deep.equal([])
            expect(result.errors[2][0]).to.match(/No valid rows/)
        })

        it("should return every non fatal error from the parsing process", async () => {

            const file = './test-files/parsers/csv/parsing_errors.csv'

            const csvString = fs.readFileSync(file, 'utf-8')
            const stream = stringToStream(csvString)
            const parsedData = await parser.parse(stream)
            expect(parsedData.assets).to.be.an('array').of.length(1)
            expect(parsedData.errors[2]).to.be.an('array').of.length(1)
            expect(parsedData.errors[2][0]).to.match(/Required Field/)
            expect(parsedData.errors[3]).to.be.an('array').of.length(1)
            expect(parsedData.errors[3][0]).to.match(/Metadata/)
        })

        it("should return every non fatal error from the validation process", async () => {

            const file = './test-files/parsers/csv/validation_errors.csv'

            const csvString = fs.readFileSync(file, 'utf-8')
            const stream = stringToStream(csvString)
            const parsedData = await parser.parse(stream)
            expect(parsedData.assets).to.be.an('array').of.length(0)
            expect(parsedData.errors[2]).to.be.an('array').of.length(2)
            expect(parsedData.errors[2][0]).to.match(/Metadata field/)
            expect(parsedData.errors[2][1]).to.match(/Required Field/)
            expect(parsedData.errors[3]).to.be.an('array').of.length(2)
            expect(parsedData.errors[3][1]).to.match(/Required Field/)
            expect(parsedData.errors[2][0]).to.match(/Metadata field/)
        })
            
        it('should return fatal error missing a header', async () => {
            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels
            Asset 1,,,,,,,,
        `
            
            const result = await parser.parse(stringToStream(csvString))
            expect(result.assets).to.deep.equal([])
            expect(result.errors[2][0]).to.match(/Invalid headers/)
            expect(parser.fatalError).to.equal(true)

        })

        it('should return fatal error for extra header', async () => {
            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata,blah
            Asset 1,,,,,,,,
        `
            
            const result = await parser.parse(stringToStream(csvString))
            expect(result.assets).to.deep.equal([])
            expect(result.errors[2][0]).to.match(/Invalid headers/)
            expect(parser.fatalError).to.equal(true)

        })

        it("should not process duplicate asset name and return error for 2nd occurance of an asset", async () => {

            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
            Asset 1,,,,,,,,
            Asset 1,,,,,,,,
        `
            
            const result = await parser.parse(stringToStream(csvString))
            expect(result.assets).to.be.an('array').of.length(1)
            expect(result.errors[3]).to.be.an('array').of.length(1)
            expect(result.errors[3][0]).to.match(/Duplicate asset name/)

        })

        it("should ignore extra field in a row and return a fatal error", async () => {

            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
            ,,,,,,,,,test` // test extends to the column right of Metadata 

            const parsedData = await parser.parse(stringToStream(csvString))
            expect(parsedData.assets).to.deep.equal([])
            expect(parsedData.errors).to.not.be.empty

        })

        it("should return error, csv does not contain a name", async () => {
            const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
            ,,,,,,,,"{"key": "value"}"`
            const stream = stringToStream(csvString)
            const result = await parser.parse(stream)
            expect(result.assets).to.deep.equal([])
            expect(result.errors[2][0]).to.match(/Required Field/)


        })

    })
})

describe(`Unit`, function () {

    let parser

    before(() => {
        parser = new AssetParser()
    })
    describe(`parseMetadataField`, function () {

        it(`should return empty metadata and errors due to field being undefined `, function () {
            const field = undefined
            const result = parser.parseMetadataField(field)
            expect(result).to.deep.equal({ metadata: {}, errors: [] })
        })

        it(`unnquoted metadata should return empty metadata and errors due to field being undefined `, function () {

            const field = `{key1: "value1", key2: "value2"}`
            const result = parser.parseMetadataField(field)
            expect(result.errors).to.be.an('array')
            expect(result.errors.length).to.equal(1)

        })

        it(`should return empty metdata and an error due to metdata not beiong valid JSON`, function () {
            const field = `{"key1": "value1", "key2": "value2"`
            const result = parser.parseMetadataField(field)
            expect(result.errors).to.be.an('array')
            expect(result.errors.length).to.equal(1)
            expect(result.errors[0]).to.eql({
                row: 1,
                message: "Metadata field in CSV file: {\"key1\": \"value1\", \"key2\": \"value2\" is not valid JSON",
            })
            expect(result.metadata).to.eql({})
        })

        it(`should return empty metadata and error because metadata is an array after parsing `, function () {
            const field = `[{"key":"key1","value":"value1"},{"key":"key2","value":"value2"}]`
            const result = parser.parseMetadataField(field)
            expect(result.errors).to.be.an('array')
            expect(result.errors.length).to.equal(1)
            expect(result.errors[0]).to.eql({
                row: 1,
                message: "Metadata field in CSV file must be a flat object with string values only"
            })
            expect(result.metadata).to.eql({})
        })

        it(`should return empty metadata and error because metadta has nested properties `, function () {
            const field = `{"key1": {"key2": "value2"}}`
            const result = parser.parseMetadataField(field)
            expect(result.errors).to.be.an('array')
            expect(result.errors.length).to.equal(1)
            expect(result.errors[0]).to.eql({
                row: 1,
                message: "Metadata field in CSV file must be a flat object with string values only"
            })
            expect(result.metadata).to.eql({})
        })

        it(`should return valid metadata and no errors `, function () {
            const field = `{"key1": "value1", "key2": "value2"}`
            const result = parser.parseMetadataField(field)
            expect(result.errors).to.be.an('array')
            expect(result.errors.length).to.equal(0)
            expect(result.metadata).to.eql({ key1: "value1", key2: "value2" })
        })

        it('should return empty object when no metadata is provided', function () {
            const field = ""
            const result = parser.parseMetadataField(field)
            expect(result.metadata).to.deep.equal({})
            expect(result.errors).to.deep.equal([])
        })

        it('should return empty object when metadata is null', function () {
            const field = null
            const result = parser.parseMetadataField(field)
            expect(result.metadata).to.deep.equal({})
            expect(result.errors).to.deep.equal([])
        })

        it('should return empty object when metadata is undefined', function () {
            const field = undefined
            const result = parser.parseMetadataField(field)
            expect(result.metadata).to.deep.equal({})
            expect(result.errors).to.deep.equal([])
        })
    })
    describe(`isValidMetadata`, function () {

        it(`should return false for invalid metadata due to nested values `, function () {
            const metadata = { key1: "value1", key2: ["value2"] }
            const result = parser.isValidMetadata(metadata)
            expect(result).to.be.false
        })

        it(`should return false for invalid metadata due to array values `, function () {
            const metadata = { key1: "value1", key2: { key3: "value3" } }
            const result = parser.isValidMetadata(metadata)
            expect(result).to.be.false
        })

        it(`should return false for invalid metadata due to non-string values `, function () {
            const metadata = { key1: "value1", key2: 123 }
            const result = parser.isValidMetadata(metadata)
            expect(result).to.be.false
        })

        it(`should return false for invalid metadata due to non-object values `, function () {
            const metadata = "This is not an object"
            const result = parser.isValidMetadata(metadata)
            expect(result).to.be.false
        })

        it(`should return true for valid metadata`, function () {
            const metadata = { key1: "value1", key2: "value2" }
            const result = parser.isValidMetadata(metadata)
            expect(result).to.be.true
        })

    })
    describe(`parseString255NullableField`, function () {

        it(`it should return a valid description"`, function () {
            const field = "test description"
            const result = parser.parseString255NullableField(field)
            expect(result).to.deep.equal("test description")
        })

        it(`it should return a valid description and remove newline tab and return"`, function () {
            const field = `test description  \n \t \r with newline tab and return`
            const result = parser.parseString255NullableField(field)
            expect(result).to.deep.equal("test description with newline tab and return")
        })
        it(`it should trim description to 255 chars"`, function () {
            const field = `x`.repeat(256) // 256 characters
            const result = parser.parseString255NullableField(field)
            expect(result).to.deep.equal(`x`.repeat(255)) // 255 characters
        })

        it(`it should return an empty string if description is undefined"`, function () {
            const field = undefined
            const result = parser.parseString255NullableField(field)
            expect(result).to.deep.equal(null)
        })

        it(`it should return an empty string if description is null"`, function () {
            const field = null
            const result = parser.parseString255NullableField(field)
            expect(result).to.deep.equal(null)
        })

        it(`it should return an empty string if description is a string of spaces"`, function () {
            const field = "              "
            const result = parser.parseString255NullableField(field)
            expect(result).to.deep.equal(null)
        })

        it('it should trim and collapse whitespace', function () {
            const field = "   This is a    test description   "
            const result = parser.parseString255NullableField(field)
            expect(result).to.equal("This is a test description")
        })

      
    })
    describe(`truncateString`, function () {
            
        it('should return the string unchanged if under max length', () => {
            expect(parser.truncateString('hello', 10)).to.equal('hello')
        })

        it('should truncate the string if over max length', () => {
            expect(parser.truncateString('1234567890', 5)).to.equal('12345')
        })

        it('should return empty string if max is 0', () => {
            expect(parser.truncateString('hello', 0)).to.equal('')
        })

        it('should return entire string if equal to max', () => {
            expect(parser.truncateString('hello', 5)).to.equal('hello')
        })

        it('should return non-string input unchanged', () => {
            expect(parser.truncateString(12345, 5)).to.equal(12345)
            expect(parser.truncateString(null, 5)).to.equal(null)
            expect(parser.truncateString(undefined, 5)).to.equal(undefined)
            expect(parser.truncateString({ foo: 'bar' }, 5)).to.deep.equal({ foo: 'bar' })
        })

        it('should work on empty string', () => {
            expect(parser.truncateString('', 5)).to.equal('')
        })

    })
    describe(`parseStigsField`, function () {

        it('should return an empty array if input is undefined', () => {
            expect(parser.parseStigsField(undefined)).to.deep.equal([])
        })
        
        it('should return an empty array if input is null', () => {
        expect(parser.parseStigsField(null)).to.deep.equal([])
        })
    
        it('should return an empty array if input is not a string', () => {
        expect(parser.parseStigsField(123)).to.deep.equal([])
        expect(parser.parseStigsField({})).to.deep.equal([])
        expect(parser.parseStigsField([])).to.deep.equal([])
        })
    
        it('should return an empty array for an empty string', () => {
        expect(parser.parseStigsField("")).to.deep.equal([])
        })
    
        it('should return an empty array for a whitespace-only string', () => {
        expect(parser.parseStigsField("   \n\t ")).to.deep.equal([])
        })
    
        it('should split by newlines and trim entries', () => {
        const input = "STIG1\n  STIG2 \nSTIG3"
        expect(parser.parseStigsField(input)).to.deep.equal(["STIG1", "STIG2", "STIG3"])
        })
    
        it('should remove duplicate STIGs', () => {
        const input = "STIG1\nSTIG2\nSTIG1"
        expect(parser.parseStigsField(input)).to.deep.equal(["STIG1", "STIG2"])
        })
    
        it('should trim entries with extra whitespace', () => {
        const input = "  STIG1  \n\n STIG2\t\n STIG3 "
        expect(parser.parseStigsField(input)).to.deep.equal(["STIG1", "STIG2", "STIG3"])
        })
    
        it('should handle single line input with no newline', () => {
        const input = "STIG1"
        expect(parser.parseStigsField(input)).to.deep.equal(["STIG1"])
        })

        it('should normalize Windows line endings \\r\\n to \\n', () => {
        const input = "STIG1\r\nSTIG2\r\nSTIG3"
        expect(parser.parseStigsField(input)).to.deep.equal(["STIG1", "STIG2", "STIG3"])
        })

        it('should handle mixed line endings and tabs', () => {
        const input = "STIG1\r\n\tSTIG2\rSTIG3\nSTIG4"
        expect(parser.parseStigsField(input)).to.deep.equal(["STIG1", "STIG2", "STIG3", "STIG4"])
        })

    })
    describe(`parseLabelNamesField`, function () {

        it('should return an empty array if input is undefined', () => {
            expect(parser.parseLabelNamesField(undefined)).to.deep.equal([])
        })

        it('should return an empty array if input is null', () => {
            expect(parser.parseLabelNamesField(null)).to.deep.equal([])
        })

        it('should return an empty array if input is not a string', () => {
            expect(parser.parseLabelNamesField(123)).to.deep.equal([])
            expect(parser.parseLabelNamesField({})).to.deep.equal([])
        })

        it('should return an empty array for an empty string', () => {
            expect(parser.parseLabelNamesField("")).to.deep.equal([])
        })

        it('should return an empty array for a whitespace-only string', () => {
            expect(parser.parseLabelNamesField("   \n \t \r")).to.deep.equal([])
        })

        it('should normalize Windows and Mac line endings to \\n', () => {
            const input = "Label1\r\nLabel2\rLabel3"
            expect(parser.parseLabelNamesField(input)).to.deep.equal(["Label1", "Label2", "Label3"])
        })

        it('should remove empty and whitespace-only entries', () => {
            const input = "Label1\n\n   \nLabel2\n\n"
            expect(parser.parseLabelNamesField(input)).to.deep.equal(["Label1", "Label2"])
        })

        it('should trim labels and truncate to 16 characters', () => {
            const input = "  ShortLabel   \nThisIsAReallyReallyLongLabelName\nAnother"
            expect(parser.parseLabelNamesField(input)).to.deep.equal([
            "ShortLabel",
            "ThisIsAReallyRea", // truncated 
            "Another"
            ])
        })

        it('should remove duplicates', () => {
            const input = "LabelA\nLabelB\nLabelA\nLabelC\nLabelB"
            expect(parser.parseLabelNamesField(input)).to.deep.equal(["LabelA", "LabelB", "LabelC"])
        })

        it('should preserve case when deduplicating', () => {
            const input = "label\nLabel\nLABEL"
            expect(parser.parseLabelNamesField(input)).to.deep.equal(["label"])
        })

        it('should handle a single clean label without line breaks', () => {
            expect(parser.parseLabelNamesField("Label1")).to.deep.equal(["Label1"])
        })


    })
    describe(`addError`, function () {

        it(`should add an error to the errors array`, function () {
            const row = 999
            const message = "Test error message"
            parser.addError(row, message)
          
            expect(parser.errors).to.eql({
              999: ["Test error message"]
            })
        })
          
    })
    describe(`checkHeaders`, function () {

        it('should return false when all required headers are present and no extras', () => {
            parser.headers = [
              "Name", "Description", "IP", "FQDN", "MAC",
              "Non-Computing", "STIGs", "Labels", "Metadata"
            ]
            expect(parser.checkHeaders()).to.equal(false)
        })
    
        it('should return true when a required header is missing', () => {
        parser.headers = [
            "Name", "Description", "IP", "FQDN", "MAC",
            "STIGs", "Labels", "Metadata" // missing "Non-Computing"
        ]
        expect(parser.checkHeaders()).to.equal(true)
        })
    
        it('should return true when an extra header is present', () => {
        parser.headers = [
            "Name", "Description", "IP", "FQDN", "MAC",
            "Non-Computing", "STIGs", "Labels", "Metadata", "blah"
        ]
        expect(parser.checkHeaders()).to.equal(true)
        })
    
        it('should return true when multiple required headers are missing', () => {
        parser.headers = ["Name", "Description"]
        expect(parser.checkHeaders()).to.equal(true)
        })
    
        it('should return true when all headers are missing', () => {
        parser.headers = []
        expect(parser.checkHeaders()).to.equal(true)
        })
    
        it('should return false even if headers are in different order (order-insensitive)', () => {
        parser.headers = [
            "MAC", "Description", "Name", "IP", "Labels",
            "FQDN", "Metadata", "STIGs", "Non-Computing"
        ]
        expect(parser.checkHeaders()).to.equal(false)
        })

    })
    // describe(`validateParsedAsset`, function () {

    //     it('should return no errors for a fully valid asset', () => {
    //         const asset = {
    //           name: "TestAsset",
    //           description: "This is a valid description",
    //           fqdn: "test.example.com",
    //           ip: "1.1.1.1",
    //           mac: "00:1A:2B:3C:4D:5E",
    //           noncomputing: false,
    //           metadata: { test: "1", test1: "2" },
    //           stigs: ["STIG1", "STIG2"],
    //           labelNames: ["Label1", "Label2"]
    //         }
    //         const errors = parser.validateParsedAsset(asset)
    //         expect(errors).to.be.an('array').that.is.empty
    //     })

    //     it('should return an error for null asset name', () => {
    //         const asset = {
    //           name: null,
    //           description: "This is a valid description",
    //           fqdn: "test.example.com",
    //           ip: "1.1.1.1",
    //           mac: "00:1A:2B:3C:4D:5E",
    //           noncomputing: false,
    //           metadata: { test: "1", test1: "2" },
    //           stigs: ["STIG1", "STIG2"],
    //           labelNames: ["Label1", "Label2"]
    //         }
    //         const errors = parser.validateParsedAsset(asset)
    //         expect(errors).to.be.an('array').of.length(1)
            
    //         for(const error of errors) {
    //             expect(error).to.be.oneOf(
    //                 [
    //                     "Required Field \"Name\" must be a string between 1 and 255 characters",
    //                 ])
    //         }
    //     })

    //     it('should return no error for name too large.', () => {
    //         const asset = {
    //           name: "x".repeat(256), // 256 characters
    //           description: "x".repeat(256),
    //           fqdn: "x".repeat(256),
    //           ip: "x".repeat(256),
    //           mac: "x".repeat(256),
    //           noncomputing: false,
    //           metadata: { test: "1", test1: "2" },
    //           stigs: ["STIG1", "STIG2"],
    //           labelNames: ["x".repeat(17), "x".repeat(17)]
    //         }
    //         const errors = parser.validateParsedAsset(asset)
    //         expect(errors).to.be.an('array').of.length(1)
    //         expect(errors[0]).to.equal("Required Field \"Name\" must be a string between 1 and 255 characters")
    //     })

    //     it('should return an error for invalid asset name', () => {
    //         const asset = {
    //           name: "",
    //           description: "This is a valid description",
    //           fqdn: "test.example.com",
    //           ip: "ip",
    //           mac: "00:1A:2B:3C:4D:5E",
    //           noncomputing: false,
    //           metadata: { test: "1", test1: "2" },
    //           stigs: ["STIG1", "STIG2"],
    //           labelNames: ["Label1", "Label2"]
    //         }
    //         const errors = parser.validateParsedAsset(asset)
    //         expect(errors).to.be.an('array').of.length(1)
    //         for(const error of errors) {
    //             expect(error).to.be.oneOf(
    //                 [
    //                     "Required Field \"Name\" must be a string between 1 and 255 characters",
    //                 ])
    //         }
    //     })

    //     it('should return an error for invalid metadata', () => {

    //         const asset = {
    //             name: "test",
    //             description: null,
    //             fqdn: null,
    //             ip: null,
    //             mac: null,
    //             noncomputing: false,
    //             metadata: [],
    //             stigs: ["STIG1", "STIG2"],
    //             labelNames: ["Label1", "Label2"]
    //           }
    //         const errors = parser.validateParsedAsset(asset)
    //         expect(errors).to.be.an('array').of.length(1)
    //         expect(errors[0]).to.equal("Field: \"Metadata\" must be an object")
    //     })
 
    // })
    describe(`processRow`, function () {

        it('should process a valid row and return an asset object', () => {

            const freshParser = new AssetParser()

            const row =  {
                Name: "Asset 1",
                Description: "Asset1 Description",
                IP: "1.1.1.1",
                FQDN: "Asset-1.f.q.d.n",
                MAC: "AB-12-AB-12-AB",
                "Non-Computing": "TRUE",
                STIGs: "VPN_SRG_TEST",
                Labels: "Label1\nLabel2\nLabel3",
                Metadata: "{\"key1\":\"value1\",\"key2\":\"value2\"}",
            }

            freshParser.processRow(row)

            expect(freshParser.assets.length).to.equal(1)
            expect(freshParser.assets[0]).to.deep.equal({
                CSVRow: 1,
                name: "Asset 1",
                description: "Asset1 Description",
                fqdn: "Asset-1.f.q.d.n",
                ip: "1.1.1.1",
                mac: "AB-12-AB-12-AB",
                noncomputing: true,
                metadata: { key1: "value1", key2: "value2" },
                stigs: ["VPN_SRG_TEST"],
                labelNames: ["Label1", "Label2", "Label3"],
            })

            expect(freshParser.errors).to.deep.equal({})
        })

        it('should contain an error for missing required field "Name"', () => {

            const freshParser = new AssetParser()

            const row =  {
                Description: "Asset1 Description",
                IP: "1.1.1.1",
                FQDN: "Asset-1.f.q.d.n",
                MAC: "AB-12-AB-12-AB",
                "Non-Computing": "TRUE",
                STIGs: "VPN_SRG_TEST",
                Labels: "Label1\nLabel2\nLabel3",
                Metadata: "{\"key1\":\"value1\",\"key2\":\"value2\"}",
            }

            freshParser.processRow(row)

            expect(freshParser.assets.length).to.equal(0)
           
            expect(freshParser.errors).to.deep.equal({
                1: [
                    "Parsing error: Required Field \"Name\" must be a non-empty string between 1 and 255 characters"
                  ]
            })
        })

        it('should process a valid row but truncate all values', () => {

            const freshParser = new AssetParser()

            const row =  {
                Name: "x", 
                Description: "x".repeat(256),
                IP: "x".repeat(256),
                FQDN: "x".repeat(256),
                MAC: "x".repeat(256),
                "Non-Computing": "TRUE",
                STIGs: "VPN_SRG_TEST",
                Labels: "x".repeat(256),
                Metadata: "{}",
            }

            freshParser.processRow(row)

            expect(freshParser.assets.length).to.equal(1)
            expect(freshParser.assets[0]).to.deep.equal({
                CSVRow: 1,
                name: "x",
                description: "x".repeat(255),
                fqdn: "x".repeat(255),
                ip: "x".repeat(255),
                mac: "x".repeat(255),
                noncomputing: true,
                metadata: {},
                stigs: ["VPN_SRG_TEST"],
                labelNames: ["x".repeat(16)],
            })

            expect(freshParser.errors).to.deep.equal({})
        })

        it('should process cast empty non-computing, desc, ip, stigs, fqdn, max, labels, metadata correctly ', () => {

            const freshParser = new AssetParser()

            const row =  {
                Name: "Asset 1",
                Description: "",
                IP: "",
                FQDN: "",
                MAC: "",
                "Non-Computing": "",
                STIGs: "",
                Labels: "",
                Metadata: "{}",
            }

            freshParser.processRow(row)

            expect(freshParser.assets.length).to.equal(1)
            expect(freshParser.assets[0]).to.deep.equal({
                CSVRow: 1,
                name: "Asset 1",
                description: null,
                fqdn: null,
                mac: null,
                labelNames: [],
                ip: null,
                noncomputing: false,
                metadata: {},
                stigs: [],
            })

            expect(freshParser.errors).to.deep.equal({})
        })

        it('should report error on duplicate asset name', () => {
            
            const freshParser = new AssetParser()
          
            const row1 =  {
                Name: "Asset 1",
                Description: "Asset1 Description",
                IP: "1.1.1.1",
                FQDN: "Asset-1.f.q.d.n",
                MAC: "AB-12-AB-12-AB",
                "Non-Computing": "TRUE",
                STIGs: "VPN_SRG_TEST",
                Labels: "Label1\nLabel2\nLabel3",
                Metadata: "{\"key1\":\"value1\",\"key2\":\"value2\"}",
            }
          
            const row2 =  {
                Name: "Asset 1",
                Description: "Asset1 dup",
                IP: "1.1.1.1",
                FQDN: "Asset-1.f.q.d.n",
                MAC: "AB-12-AB-12-AB",
                "Non-Computing": "TRUE",
                STIGs: "VPN_SRG_TEST",
                Labels: "Label1\nLabel2\nLabel3",
                Metadata: "{\"key1\":\"value1\",\"key2\":\"value2\"}",
            }
          
            freshParser.processRow(row1)
            freshParser.processRow(row2)
          
            expect(freshParser.assets.length).to.equal(1)
        // WARNING THIS TEST WILL NOT CORRECTLY TEST THE INDEX OF THE ERROR
            expect(freshParser.errors).to.deep.equal({
            1: [
                'Parsing error: Duplicate asset name \"Asset 1\" at row 1 of CSV file'
              ]
            })
        })
    })
    describe(`parseAssetRow`, function () {

        let parser

        beforeEach(() => {
          parser = new AssetParser()

          // Stub helpers for simplicity (assume they are tested elsewhere)
          parser.parseMetadataField = (val) => ({
            metadata: { stub: true },
            errors: [],
          })
          parser.parseStigsField = (val) => (val ? val.split("\n") : [])
          parser.parseLabelNamesField = (val) => (val ? val.split("\n") : [])
          parser.truncateString = (val, max) =>
            typeof val === "string" ? val.slice(0, max) : val

          parser.rowIndex = 1
        })

        it("should parse a fully populated row correctly", () => {
          const row = {
            Name: "Asset1",
            Description: "Some description",
            "Non-Computing": "TRUE",
            IP: "192.168.1.1",
            STIGs: "STIG1\nSTIG2",
            Metadata: '{"env":"prod"}',
            FQDN: "host.example.com",
            MAC: "AA:BB:CC:DD:EE:FF",
            Labels: "Label1\nLabel2",
          }

          const { asset, parsingErrors } = parser.parseAssetRow(row)

          expect(asset).to.deep.equal({
            name: "Asset1",
            description: "Some description",
            noncomputing: true,
            ip: "192.168.1.1",
            stigs: ["STIG1", "STIG2"],
            metadata: { stub: true },
            fqdn: "host.example.com",
            mac: "AA:BB:CC:DD:EE:FF",
            labelNames: ["Label1", "Label2"],
          })

          expect(parsingErrors).to.deep.equal([])
        })

        it("should set nulls for optional missing fields", () => {
          const row = {
            Name: "Asset2",
            Metadata: "{}",
          }

          const { asset, parsingErrors } = parser.parseAssetRow(row)

          expect(asset.fqdn).to.equal(null)
          expect(asset.mac).to.equal(null)
          expect(asset.ip).to.equal(null)
          expect(asset.labelNames).to.deep.equal([])
          expect(asset.stigs).to.deep.equal([])
          expect(asset.noncomputing).to.equal(false)
          expect(asset.description).to.equal(null)
          expect(parsingErrors).to.deep.equal([])
        })

        it("should return an error when Name is missing", () => {
          const row = {}

          const { asset, parsingErrors } = parser.parseAssetRow(row)

          expect(asset.name).to.equal(null)
          expect(parsingErrors).to.deep.eql([
            {
              row: 1,
              message: "Required Field \"Name\" must be a non-empty string between 1 and 255 characters",
            },
          ])
        })

        it("should carry through metadata parsing errors", () => {
          parser.parseMetadataField = () => ({
            metadata: {},
            errors: [{ row: 1, message: "Metadata is broken" }],
          })

          const row = {
            Name: "Asset3",
            Metadata: "{invalid}",
          }

          const { asset, parsingErrors } = parser.parseAssetRow(row)

          expect(asset.name).to.equal("Asset3")
          expect(parsingErrors).to.deep.include({
            row: 1,
            message: "Metadata is broken",
          })
        })

    })
})
