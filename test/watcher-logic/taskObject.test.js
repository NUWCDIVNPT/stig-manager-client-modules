import chai from 'chai'
import TaskObject from '../../TaskObject.js'
import fs from 'fs/promises'
const expect = chai.expect

const parsedResults = [
  {
    // enducing failure here 
    sourceRef: "my/test/path/test1.ckl",
    target: {
      name: "HostName",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {
        cklWebOrDatabase: "true",
        cklHostName: "HostName",
        cklWebDbInstance: "web_db_instance",
      },
    },
    checklists: [
      {
        sourceRef: "my/test/path/test1.ckl",
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "pass",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
  {
    sourceRef: "my/test/path/test2.ckl",
    target: {
      name: "NewAssetNoMetadata",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {},
    },
    checklists: [
      {
        sourceRef: "my/test/path/test2.ckl",
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "pass",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
  {
    // new asset with metadata
    sourceRef: "my/test/path/test3.ckl",
    target: {
      name: "NewAssetWithMetadataCklHostname",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {
        cklWebOrDatabase: "true",
        cklHostName: "NewAssetWithMetadataCklHostname",
        cklWebDbInstance: "web_DB_instance",
      },
    },
    checklists: [
      {
        sourceRef: "my/test/path/test3.ckl",
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "pass",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
  {
    // doesnt have stig installed 
    sourceRef: "my/test/path/test4.ckl",
    target: {
      name: "TestAsset4NoStigs",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {},
    },
    checklists: [
      {
        sourceRef: "my/test/path/test4.ckl",
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "pass",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
  {
    // post new review to asset
    sourceRef: "my/test/path/test5.ckl",
    target: {
      name: "TestAsset4NoStigs",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {},
    },
    checklists: [
      {
        sourceRef: "my/test/path/test5.ckl",
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "fail",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
  {
    // inducing failure here
    sourceRef: "my/test/path/test6.ckl",
    target: {
      name: "abc",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {
        cklWebOrDatabase: "true",
        cklHostName: "abc",
        cklWebDbInstance: "abc",
      },
    },
    checklists: [
      {
        sourceRef: "my/test/path/test6.ckl",
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "pass",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
  {
    // inducing failure here
    sourceRef: "my/test/path/test7.ckl",
    target: {
      name: "ABC",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {
        cklWebOrDatabase: "true",
        cklHostName: "ABC",
        cklWebDbInstance: "ABC",
      },
    },
    checklists: [
      {
        sourceRef: "my/test/path/test7.ckl",
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "pass",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
  {
    sourceRef: "my/test/path/test8.ckl",
    target: {
      name: "StigNotInstalled",
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: true,
      metadata: {},
    },
    checklists: [
      {
        sourceRef: "my/test/path/test7.ckl",
        benchmarkId: "ABCD_SRG_TEST",
        revisionStr: "V2R1",
        reviews: [
          {
            ruleId: "SV-106179r1_rule",
            result: "pass",
            detail: `test
visible to lvl1`,
            comment: null,
            resultEngine: null,
            status: "saved",
          },
        ],
        stats: {
          pass: 1,
          fail: 0,
          notapplicable: 0,
          notchecked: 0,
          notselected: 0,
          informational: 0,
          error: 0,
          fixed: 0,
          unknown: 0,
        },
      },
    ],
    errors: [
    ],
  },
]

const apiStigs = [
  {
    benchmarkId: "VPN_SRG_TEST",
    title: "Virtual Private Network (VPN) Security Requirements Guide",
    status: "accepted",
    lastRevisionStr: "V1R1",
    lastRevisionDate: "2019-07-19",
    ruleCount: 81,
    revisionStrs: [
      "V1R1",
    ],
    collectionIds: [
      "1",
    ],
  }
]

const apiAssets = [
  {
    assetId: "1",
    name: "HostName-NA-web_db_instance",
    fqdn: "",
    collection: {
      name: "testCollection",
      collectionId: "1",
    },
    description: "",
    ip: "",
    labelIds: [
    ],
    mac: "",
    noncomputing: true,
    metadata: {
      cklHostName: "HostName2",
      cklWebDbInstance: "web_db_instance",
      cklWebOrDatabase: "true",
    },
    stigs: [
      {
        ruleCount: 81,
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        benchmarkDate: "2019-07-19",
        revisionPinned: false,
      },
    ],
  },
  {
    assetId: "2",
    name: "HostName2-NA-web_db_instance",
    fqdn: "",
    collection: {
      name: "testCollection",
      collectionId: "1",
    },
    description: "",
    ip: "",
    labelIds: [
    ],
    mac: "",
    noncomputing: true,
    metadata: {
      cklHostName: "HostName2",
      cklWebDbInstance: "web_db_instance",
      cklWebOrDatabase: "true",
    },
    stigs: [
      {
        ruleCount: 81,
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        benchmarkDate: "2019-07-19",
        revisionPinned: false,
      },
    ],
  },
  {
    assetId: "3",
    name: "TestAsset3",
    fqdn: "",
    collection: {
      name: "testCollection",
      collectionId: "1",
    },
    description: "",
    ip: "",
    labelIds: [
    ],
    mac: "",
    noncomputing: true,
    metadata: {},
    stigs: [
      {
        ruleCount: 81,
        benchmarkId: "VPN_SRG_TEST",
        revisionStr: "V1R1",
        benchmarkDate: "2019-07-19",
        revisionPinned: false,
      },
    ],
  },
  {
    assetId: "4",
    name: "TestAsset4NoStigs",
    fqdn: "",
    collection: {
      name: "testCollection",
      collectionId: "1",
    },
    description: "",
    ip: "",
    labelIds: [
    ],
    mac: "",
    noncomputing: true,
    metadata: {},
    stigs: []
  },
]

const options = {
  collectionId: "94",
  createObjects: true,
  strictRevisionCheck: false,
}

// generate the task assets
function generateTaskAssets ({
  parsedResults,
  apiStigs,
  apiAssets,
  options
}) {
  return new TaskObject ({ parsedResults, apiAssets, apiStigs, options })
}

describe('Tests General Task Object Correctness.', () => {

  let taskAssets
  before(async () => {
    // Generate the task assets before running the tests
    taskAssets = generateTaskAssets({ parsedResults, apiStigs, apiAssets, options })
  })

  describe('Test all TaskObject class variables for correct initalization ', () => {

    it('should create a TaskObject with the correct properties', async () => {
      expect(taskAssets).to.have.property('parsedResults').that.is.an('array')
      expect(taskAssets).to.have.property('sourceRefs').that.is.an('array')
      expect(taskAssets).to.have.property('taskAssets').that.is.instanceOf(Map)
      expect(taskAssets).to.have.property('errors').that.is.an('array')
    })

    it('it should not have any errors', async () => {
      expect(taskAssets.errors).to.be.empty
    })

    it('should have the correct number of sourceRefs', async () => {
      expect(taskAssets.sourceRefs).to.have.lengthOf(8)
    })

    // should fail rn TDD because we have two assets with the same name but different case
    it('should have the correct number of taskAssets', async () => {
      expect(taskAssets.taskAssets.size).to.equal(6)
    })

    it('should have the correct number of parsedResults', async () => {
      expect(taskAssets.parsedResults).to.have.lengthOf(8)
    })
  })

  describe('Test TaskObject taskAssets Map() for correct values', () => {
    
    it('should not return task for asset "TestAsset3', async () => {
      const taskAsset = taskAssets.taskAssets.get('testasset3')
      expect(taskAsset).to.not.exist
    })

    it('all map keys should be lower case', async () => {
      for (const key of taskAssets.taskAssets.keys()) {
        expect(key).to.equal(key.toLowerCase())
      }
    })

    it('should not assign stig to asset "StigNotInstalled, should have checklistIgnored', async () => {
      const taskAsset = taskAssets.taskAssets.get('stignotinstalled')
      expect(taskAsset).to.exist
      expect(taskAsset.checklistsIgnored).to.have.lengthOf(1)
      expect(taskAsset.checklistsIgnored[0].benchmarkId).to.equal('ABCD_SRG_TEST')
      expect(taskAsset.checklistsIgnored[0].ignored).to.equal('Not installed')
    })

    it('should recognize that "TestAsset4NoStigs" already exists in the API', async () => {
      const taskAsset = taskAssets.taskAssets.get('testasset4nostigs')
      expect(taskAsset).to.exist
      expect(taskAsset.knownAsset).to.be.true
    })

    it('should have assigned stig to assetId "TestAsset4NoStigs"', async () => {
      const taskAsset = taskAssets.taskAssets.get('testasset4nostigs')
      expect(taskAsset).to.exist
      expect(taskAsset.checklists.size).to.equal(1)
      expect(taskAsset.checklists.has('VPN_SRG_TEST')).to.be.true
      expect(taskAsset.assetProps).to.exist
      expect(taskAsset.assetProps.stigs).to.have.lengthOf(1)
      expect(taskAsset.assetProps.stigs[0]).to.equal('VPN_SRG_TEST')
      expect(taskAsset.hasNewAssignment).to.be.true
    })

    it('should return two source refs and 2 reviews for assetId "TestAsset4NoStigs"', async () => {
      const taskAsset = taskAssets.taskAssets.get('testasset4nostigs')
      expect(taskAsset).to.exist
      expect(taskAsset.sourceRefs).to.have.lengthOf(2)
      expect(taskAsset.sourceRefs).to.include('my/test/path/test4.ckl')
      expect(taskAsset.sourceRefs).to.include('my/test/path/test5.ckl')
      const checklist = taskAsset.checklists.get('VPN_SRG_TEST')
      expect(checklist).to.exist
      for(const checklistItem of checklist) {
        expect(checklistItem.sourceRef).to.be.oneOf(['my/test/path/test4.ckl', 'my/test/path/test5.ckl'])
        expect(checklistItem.benchmarkId).to.equal('VPN_SRG_TEST')
        expect(checklistItem.revisionStr).to.equal('V1R1')
        expect(checklistItem.reviews).to.have.lengthOf(1)
        expect(checklistItem.reviews[0].ruleId).to.equal('SV-106179r1_rule')
      }
    })

    it('should have the correct number of checklists for each task asset', async () => {
      const taskAsset = taskAssets.taskAssets.get('testasset4nostigs')
      expect(taskAsset.checklists.size).to.equal(1)
      expect(taskAsset.checklists.has('VPN_SRG_TEST')).to.be.true
    })
  })

  describe('Random nit-picky tests', () => {

    it('should lowercase all metadata cklHostName and cklWebDbInstance when making the name', async () => {
      const taskAsset = taskAssets.taskAssets.get('newassetwithmetadatacklhostname-na-web_db_instance')
      expect(taskAsset).to.exist
      expect(taskAsset.assetProps.metadata.cklHostName).to.equal('NewAssetWithMetadataCklHostname')
      expect(taskAsset.assetProps.metadata.cklWebDbInstance).to.equal('web_DB_instance')
    })
  })

  describe('createObjects false tests', () => {
    it('should not assign stig to asset "TestAsset4NoStigs" when createObjects is false', async () => {
      const taskAssetsNoCreate = generateTaskAssets({ parsedResults, apiStigs, apiAssets, options: { ...options, createObjects: false } })
      const taskAsset = taskAssetsNoCreate.taskAssets.get('testasset4nostigs')
      expect(taskAsset).to.exist
      expect(taskAsset.checklists.size).to.equal(0)
      expect(taskAsset.hasNewAssignment).to.be.false
      expect(taskAsset.knownAsset).to.be.true
    })
  })
})