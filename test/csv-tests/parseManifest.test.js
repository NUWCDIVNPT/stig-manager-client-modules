import chai from 'chai'
import AssetParser from '../../BatchAssetParser.js'
import fs from 'fs'
import { console } from 'inspector'
const expect = chai.expect

describe('AssetParser Tests', () => {
    let parser

    before(() => {
        parser = new AssetParser()
    })

    it("should parse a valid CSV file correctly", () => {

        const file = './test-files/parsers/csv/asset_sample.csv'

        const expectedOutput = [
            {
                name: "Asset 1",
                description: "Asset1 Description",
                labelIds: ["Label1", "Label2", "Label3"],
                noncomputing: true,
                fqdn: "Asset-1.f.q.d.n",
                ip: "1.1.1.1",
                mac: "AB-12-AB-12-AB",
                stigs: ["MS_Windows_10_STIG", "Google_Chrome_Current_Windows", "VPN_BAD"],
                metadata: { key1: "value1", key2: "value2" }
            },
            {
                name: "Asset 2",
                description: "Asset2 Description",
                labelIds: ["Label4"],
                noncomputing: false,
                ip: "2.2.2.2",
                stigs: ["MS_Windows_10_STIG"],
                metadata: { "key:3": "value:3"}
            },
            {
                name: "Asset 3",
                description: "!@#$%^&*()_+={}[]|:;'<>,.?/~`\"",
                noncomputing: true,
                ip: "3.3.3.3",
                stigs: [],
                metadata: { }
            },
        ]

        const csvString = fs.readFileSync(file, 'utf-8')
        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)
    })

    it('should parse a valid CSV string with ipv6 ip', () => {

        const file = './test-files/parsers/csv/ipv6.csv'
        const csvString = fs.readFileSync(file, 'utf-8')

        const expectedOutput = [ {
            name: "Asset 1",
            description: "Asset1 Description",
            noncomputing: true,
            fqdn: "Asset-1.f.q.d.n",
            ip: "2001:db8:3333:4444:5555:6666:7777:8888",
            mac: "AB-12-AB-12-AB",
            stigs: ["MS_Windows_10_STIG", "Google_Chrome_Current_Windows", "VPN_BAD"],
            metadata: { }
        }]

        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)
    })

    it('should trim extra whitespace on left and right of a field ex. " assetName "', () => {

        const file = './test-files/parsers/csv/trim_whitespace.csv'
        const csvString = fs.readFileSync(file, 'utf-8')

        const expectedOutput = [ {
            name: "Asset 1",
            description: "Asset1 Description",
            noncomputing: true,
            fqdn: "Asset-1.f.q.d.n",
            ip: "1.1.1.1",
            mac: "AB-12-AB-12-AB",
            stigs: ["MS_Windows_10_STIG", "Google_Chrome_Current_Windows", "VPN_BAD"],
            metadata: { }
        }]

        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)

    })

    it('should return empty arrays for stigs field with no stigs data passed', () => {
        const file = './test-files/parsers/csv/empty_stigs_labels.csv'
        const csvString = fs.readFileSync(file, 'utf-8')

        const expectedOutput = [ {
            name: "Asset 1",
            description: "Asset1 Description",
            noncomputing: true,
            fqdn: "Asset-1.f.q.d.n",
            ip: "1.1.1.1",
            mac: "AB-12-AB-12-AB",
            stigs: [],
            metadata: { }
        }]

        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)
    })

    it('should successfully parse special chars in metadata', () => {

        const file = './test-files/parsers/csv/special_characters.csv'
        const csvString = fs.readFileSync(file, 'utf-8')
        const expectedOutput = [{
            name: "Asset 1",
            description: "Asset1, Description ! Asset1 Line \"2\"",
            noncomputing: true,
            ip: "1.1.1.1",
            mac: "AB-12-AB-12-AB",
            stigs: [],
            metadata: {"!@#$%^&*:()": "value",key2: "valu:e2"}
        }]

        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)
    })

    it("Should remove newlines returns and tabs from description", () => {
        const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
"Asset 1","This description
has a newline and	tabs",1.1.1.1,,AB-12-AB-12-AB,TRUE,,,`

        const expectedOutput = [{
            name: "Asset 1",
            description: "This description has a newline and tabs",
            noncomputing: true,
            ip: "1.1.1.1",
            mac: "AB-12-AB-12-AB",
            stigs: [],
            metadata: {}
        }]

        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)
    })  

    it("should correctly parse fields containing commas inside quotes", () => {
        const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
    Asset 1,"Asset, with, commas",1.1.1.1,,AB-12-AB-12-AB,TRUE,,,`
    
        const expectedOutput = [{
            name: "Asset 1",
            description: "Asset, with, commas",
            noncomputing: true,
            ip: "1.1.1.1",
            mac: "AB-12-AB-12-AB",
            stigs: [],
            metadata: {}
        }]
    
        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)
    })

    it("should replace newlines in quoted fields with spaces", () => {
        const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
    Asset 1,"This is a long
    multi-line description",1.1.1.1,,AB-12-AB-12-AB,TRUE,,,`
    
        const expectedOutput = [{
            name: "Asset 1",
            description: "This is a long multi-line description",
            noncomputing: true,
            ip: "1.1.1.1",
            mac: "AB-12-AB-12-AB",
            stigs: [],
            metadata: {}
        }]
    
        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)
    })
    
    it("should throw an error on malformed JSON metadata", () => {
        const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
    "Asset 1","Valid Description",1.1.1.1,,AB-12-AB-12-AB,TRUE,,,"{bad json}"`

        expect(() => parser.parseCSV(csvString)).to.throw("Error parsing metadata")
    })

    it("should ignore empty rows", () => {

        const file = './test-files/parsers/csv/empty_rows.csv'

        const expectedOutput = [
            {
                name: "Asset 1",
                description: "Asset1 Description",
                labelIds: ["Label1", "Label2", "Label3"],
                noncomputing: true,
                fqdn: "Asset-1.f.q.d.n",
                ip: "1.1.1.1",
                mac: "AB-12-AB-12-AB",
                stigs: ["MS_Windows_10_STIG", "Google_Chrome_Current_Windows", "VPN_BAD"],
                metadata: { key1: "value1", key2: "value2" }
            },
            {
                name: "Asset 2",
                description: "Asset2 Description",
                labelIds: ["Label4"],
                noncomputing: false,
                ip: "2.2.2.2",
                stigs: ["MS_Windows_10_STIG"],
                metadata: { "key:3": "value:3"}
            },
            {
                name: "Asset 3",
                description: "!@#$%^&*()_+={}[]|:;'<>,.?/~`\"",
                noncomputing: true,
                ip: "3.3.3.3",
                stigs: [],
                metadata: { }
            },
        ]

        const csvString = fs.readFileSync(file, 'utf-8')
        const parsedData = parser.parseCSV(csvString)
        expect(parsedData).to.deep.equal(expectedOutput)

    })

    it("should ignore extra columns not defined in the schema", () => {
        const csvString = `Name,Description,IP,ExtraColumn,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
        Asset 1,Asset1 Description,1.1.1.1,UnexpectedData,,AB-12-AB-12-AB,TRUE,,,`
    
        const parsedData = parser.parseCSV(csvString)
        expect(parsedData[0]).to.not.have.property("ExtraColumn")
    })

    it("should throw for invalid CSV", () => {
        const csvString = `Name,Description,IP,FQDN,MAC,Non-Computing,STIGs,Labels,Metadata
        "Asset 1,"This is an invalid CSV row, because of missing closing quotes,1.1.1.1,,AB-12-AB-12-AB,TRUE,,,`
    
        expect(() => parser.parseCSV(csvString)).to.throw("Error parsing CSV")
    })

})