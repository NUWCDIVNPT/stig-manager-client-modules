import chai from 'chai'
import TaskObject from '../../TaskObject.js'
const expect = chai.expect

describe('TaskObject Metadata Edge Cases - Asset Matching with Missing/Partial Metadata', () => {

  describe('Case 1: CKL with full metadata, API asset exists with effective name but NO metadata', () => {
    it('should find existing asset by effective name when metadata was removed from API asset', () => {
      const parsedResults = [
        {
          sourceRef: "test1.ckl",
          target: {
            name: "WebServer01",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "WebServer01",
              cklWebDbSite: "Production",
              cklWebDbInstance: "Oracle12c"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "pass",
                  detail: "Test detail",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 1, fail: 0, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "100",
          name: "webserver01-production-oracle12c", // Effective name pattern but no metadata
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {}, // NO METADATA - user removed it
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should find the existing asset by effective name, not create a new one
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('webserver01-production-oracle12c')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.assetProps.assetId).to.equal('100')
      expect(taskObject.errors).to.be.empty
    })
  })

  describe('Case 2: CKL with full metadata, API asset has cklHostName but missing WebDb metadata', () => {
    it('should find existing asset by effective name when WebDb metadata is missing', () => {
      const parsedResults = [
        {
          sourceRef: "test2.ckl",
          target: {
            name: "AppServer02",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "AppServer02",
              cklWebDbSite: "Development",
              cklWebDbInstance: "MySQL8"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "fail",
                  detail: "Test detail",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 0, fail: 1, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "200",
          name: "appserver02-development-mysql8", // Effective name
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {
            cklHostName: "AppServer02" // Has hostname but missing WebDb fields
          },
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should find the existing asset by effective name
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('appserver02-development-mysql8')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.assetProps.assetId).to.equal('200')
      expect(taskObject.errors).to.be.empty
    })
  })

  describe('Case 3: Multiple API assets with same cklHostName, different WebDb instances', () => {
    it('should find the correct asset matching all metadata when multiple assets share cklHostName', () => {
      const parsedResults = [
        {
          sourceRef: "test3.ckl",
          target: {
            name: "DBServer",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "DBServer",
              cklWebDbSite: "Production",
              cklWebDbInstance: "Oracle"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "pass",
                  detail: "Test detail",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 1, fail: 0, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "301",
          name: "dbserver-staging-mysql",
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {
            cklHostName: "DBServer",
            cklWebDbSite: "Staging",
            cklWebDbInstance: "MySQL"
          },
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        },
        {
          assetId: "302",
          name: "dbserver-production-oracle",
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {
            cklHostName: "DBServer",
            cklWebDbSite: "Production",
            cklWebDbInstance: "Oracle"
          },
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should find the correct asset (302) matching all metadata
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('dbserver-production-oracle')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.assetProps.assetId).to.equal('302')
      expect(taskObject.errors).to.be.empty
    })
  })

  describe('Case 4: Prevent duplicate asset creation when effective name already exists', () => {
    it('should not create a new asset when one already exists with the effective name pattern', () => {
      const parsedResults = [
        {
          sourceRef: "test4.ckl",
          target: {
            name: "FileServer",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "FileServer",
              cklWebDbSite: "Backup",
              cklWebDbInstance: "Storage01"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "notapplicable",
                  detail: "Test detail",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 0, fail: 0, notapplicable: 1, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "400",
          name: "fileserver-backup-storage01", // Already exists with effective name
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {}, // No metadata, manually created with this name
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should use existing asset, not create a duplicate
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('fileserver-backup-storage01')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.assetProps.assetId).to.equal('400')
      expect(taskObject.errors).to.be.empty
    })
  })

  describe('Case 5: Case-insensitive matching for metadata fields', () => {
    it('should match assets case-insensitively for all metadata fields', () => {
      const parsedResults = [
        {
          sourceRef: "test5.ckl",
          target: {
            name: "WebApp",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "WEBAPP",
              cklWebDbSite: "PRODUCTION",
              cklWebDbInstance: "PostgreSQL"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "pass",
                  detail: "Test detail",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 1, fail: 0, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "500",
          name: "webapp-production-postgresql",
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {
            cklHostName: "webapp", // Different case
            cklWebDbSite: "production", // Different case
            cklWebDbInstance: "postgresql" // Different case
          },
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should match despite case differences
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('webapp-production-postgresql')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.assetProps.assetId).to.equal('500')
      expect(taskObject.errors).to.be.empty
    })
  })

  describe('Case 6: Handle null/undefined WebDb fields in metadata', () => {
    it('should properly handle null or undefined WebDb fields when building effective names', () => {
      const parsedResults = [
        {
          sourceRef: "test6.ckl",
          target: {
            name: "SimpleHost",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "SimpleHost",
              cklWebDbSite: null,
              cklWebDbInstance: undefined
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "pass",
                  detail: "Test detail",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 1, fail: 0, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "600",
          name: "simplehost-NA-NA", // Effective name with NA for null fields
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {},
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should match using NA for null fields
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('simplehost-na-na')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.assetProps.assetId).to.equal('600')
      expect(taskObject.errors).to.be.empty
    })
  })

  describe('Case 7: Multiple CKLs for same asset with metadata mismatches', () => {
    it('should correctly aggregate reviews from multiple CKLs targeting the same asset', () => {
      const parsedResults = [
        {
          sourceRef: "test7a.ckl",
          target: {
            name: "MultiSource",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "MultiSource",
              cklWebDbSite: "Test",
              cklWebDbInstance: "Instance1"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "pass",
                  detail: "From first CKL",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 1, fail: 0, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        },
        {
          sourceRef: "test7b.ckl",
          target: {
            name: "MultiSource",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "MultiSource",
              cklWebDbSite: "Test",
              cklWebDbInstance: "Instance1"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106180r1_rule",
                  result: "fail",
                  detail: "From second CKL",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 0, fail: 1, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "700",
          name: "multisource-test-instance1",
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {}, // No metadata
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should aggregate both CKLs to the same asset
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('multisource-test-instance1')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.sourceRefs).to.have.lengthOf(2)
      expect(taskAsset.sourceRefs).to.include('test7a.ckl')
      expect(taskAsset.sourceRefs).to.include('test7b.ckl')

      const checklists = taskAsset.checklists.get('VPN_SRG_TEST')
      expect(checklists).to.have.lengthOf(2)
    })
  })

  describe('Case 8: API asset name collision with effective name pattern', () => {
    it('should handle when API has both metadata-matched and name-matched assets', () => {
      const parsedResults = [
        {
          sourceRef: "test8.ckl",
          target: {
            name: "Collision",
            description: null,
            ip: null,
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {
              cklHostName: "Collision",
              cklWebDbSite: "Site1",
              cklWebDbInstance: "DB1"
            }
          },
          checklists: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              reviews: [
                {
                  ruleId: "SV-106179r1_rule",
                  result: "pass",
                  detail: "Test detail",
                  comment: null,
                  resultEngine: null,
                  status: "saved"
                }
              ],
              stats: { pass: 1, fail: 0, notapplicable: 0, notchecked: 0 }
            }
          ],
          errors: []
        }
      ]

      const apiAssets = [
        {
          assetId: "801",
          name: "collision-site1-db1", // Name matches effective name pattern
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {}, // But has no metadata
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        },
        {
          assetId: "802",
          name: "some-other-name",
          fqdn: "",
          collection: { name: "testCollection", collectionId: "1" },
          description: "",
          ip: "",
          labelIds: [],
          mac: "",
          noncomputing: false,
          metadata: {
            cklHostName: "Collision",
            cklWebDbSite: "Site1",
            cklWebDbInstance: "DB1"
          }, // Has exact metadata match
          stigs: [
            {
              benchmarkId: "VPN_SRG_TEST",
              revisionStr: "V1R1",
              benchmarkDate: "2019-07-19",
              revisionPinned: false
            }
          ]
        }
      ]

      const apiStigs = [
        {
          benchmarkId: "VPN_SRG_TEST",
          revisionStrs: ["V1R1"]
        }
      ]

      const options = {
        collectionId: "1",
        createObjects: true,
        strictRevisionCheck: false
      }

      const taskObject = new TaskObject({ parsedResults, apiAssets, apiStigs, options })

      // Should prefer exact metadata match (802) over effective name match
      expect(taskObject.taskAssets.size).to.equal(1)
      const taskAsset = taskObject.taskAssets.get('collision-site1-db1')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
      expect(taskAsset.assetProps.assetId).to.equal('802') // Should choose metadata match
      expect(taskObject.errors).to.be.empty
    })
  })
})