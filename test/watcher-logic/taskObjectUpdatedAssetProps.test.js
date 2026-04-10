import chai from 'chai'
import TaskObject from '../../TaskObject.js'
const expect = chai.expect

// Minimal checklist template to reuse across tests
const makeChecklist = (benchmarkId = 'VPN_SRG_TEST') => ({
  benchmarkId,
  revisionStr: 'V1R1',
  reviews: [{
    ruleId: 'SV-106179r1_rule',
    result: 'pass',
    detail: 'test',
    comment: null,
    resultEngine: null,
    status: 'saved',
  }],
  stats: {
    pass: 1, fail: 0, notapplicable: 0, notchecked: 0,
    notselected: 0, informational: 0, error: 0, fixed: 0, unknown: 0,
  },
})

const apiStigs = [{
  benchmarkId: 'VPN_SRG_TEST',
  title: 'VPN SRG TEST',
  status: 'accepted',
  lastRevisionStr: 'V1R1',
  lastRevisionDate: '2019-07-19',
  ruleCount: 81,
  revisionStrs: ['V1R1'],
  collectionIds: ['1'],
}]

const options = {
  collectionId: '1',
  createObjects: true,
  strictRevisionCheck: false,
}

describe('TaskObject hasUpdatedAssetProps tests', () => {

  describe('known asset with differing populated string fields', () => {
    let taskAsset
    before(() => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: '10.0.0.1',
          fqdn: 'test.example.com',
          mac: '00:11:22:33:44:55',
          noncomputing: false,
          metadata: {},
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      taskAsset = to.taskAssets.get('testasset')
    })

    it('should set hasUpdatedAssetProps to true', () => {
      expect(taskAsset.hasUpdatedAssetProps).to.be.true
    })
    it('should merge ip into assetProps', () => {
      expect(taskAsset.assetProps.ip).to.equal('10.0.0.1')
    })
    it('should merge fqdn into assetProps', () => {
      expect(taskAsset.assetProps.fqdn).to.equal('test.example.com')
    })
    it('should merge mac into assetProps', () => {
      expect(taskAsset.assetProps.mac).to.equal('00:11:22:33:44:55')
    })
  })

  describe('known asset with null/empty parsed fields', () => {
    let taskAsset
    before(() => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: 'existing.example.com',
        description: '',
        ip: '192.168.1.1',
        mac: 'AA:BB:CC:DD:EE:FF',
        noncomputing: true,
        metadata: { cklRole: 'Domain Controller' },
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: {},
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      taskAsset = to.taskAssets.get('testasset')
    })

    it('should set hasUpdatedAssetProps to false', () => {
      expect(taskAsset.hasUpdatedAssetProps).to.be.false
    })
    it('should not change ip', () => {
      expect(taskAsset.assetProps.ip).to.equal('192.168.1.1')
    })
    it('should not change fqdn', () => {
      expect(taskAsset.assetProps.fqdn).to.equal('existing.example.com')
    })
    it('should not change mac', () => {
      expect(taskAsset.assetProps.mac).to.equal('AA:BB:CC:DD:EE:FF')
    })
    it('should not change noncomputing (false is not populated)', () => {
      expect(taskAsset.assetProps.noncomputing).to.be.true
    })
    it('should not change metadata.cklRole', () => {
      expect(taskAsset.assetProps.metadata.cklRole).to.equal('Domain Controller')
    })
  })

  describe('known asset with matching values', () => {
    let taskAsset
    before(() => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: 'test.example.com',
        description: '',
        ip: '10.0.0.1',
        mac: '00:11:22:33:44:55',
        noncomputing: true,
        metadata: { cklRole: 'Domain Controller' },
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: '10.0.0.1',
          fqdn: 'test.example.com',
          mac: '00:11:22:33:44:55',
          noncomputing: true,
          metadata: { cklRole: 'Domain Controller' },
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      taskAsset = to.taskAssets.get('testasset')
    })

    it('should set hasUpdatedAssetProps to false when values match', () => {
      expect(taskAsset.hasUpdatedAssetProps).to.be.false
    })
  })

  describe('new asset is unaffected by merge logic', () => {
    let taskAsset
    before(() => {
      const apiAssets = []
      const parsedResults = [{
        target: {
          name: 'BrandNewAsset',
          description: null,
          ip: '10.0.0.1',
          fqdn: 'new.example.com',
          mac: '00:11:22:33:44:55',
          noncomputing: true,
          metadata: { cklRole: 'Member Server' },
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      taskAsset = to.taskAssets.get('brandnewasset')
    })

    it('should have knownAsset false', () => {
      expect(taskAsset.knownAsset).to.be.false
    })
    it('should have hasUpdatedAssetProps false', () => {
      expect(taskAsset.hasUpdatedAssetProps).to.be.false
    })
  })

  describe('multiple parsedResults for same known asset - last populated value wins', () => {
    let taskAsset
    before(() => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [
        {
          target: {
            name: 'TestAsset',
            description: null,
            ip: '10.0.0.1',
            fqdn: null,
            mac: null,
            noncomputing: false,
            metadata: {},
          },
          checklists: [makeChecklist()],
          sourceRef: 'first.ckl',
        },
        {
          target: {
            name: 'TestAsset',
            description: null,
            ip: '10.0.0.2',
            fqdn: 'updated.example.com',
            mac: null,
            noncomputing: false,
            metadata: {},
          },
          checklists: [makeChecklist()],
          sourceRef: 'second.ckl',
        },
      ]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      taskAsset = to.taskAssets.get('testasset')
    })

    it('should set hasUpdatedAssetProps to true', () => {
      expect(taskAsset.hasUpdatedAssetProps).to.be.true
    })
    it('should have ip from the last parsedResult', () => {
      expect(taskAsset.assetProps.ip).to.equal('10.0.0.2')
    })
    it('should have fqdn from the second parsedResult', () => {
      expect(taskAsset.assetProps.fqdn).to.equal('updated.example.com')
    })
  })

  describe('noncomputing only merges when parsed value is true', () => {
    it('should update noncomputing from false to true', () => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: true,
          metadata: {},
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.hasUpdatedAssetProps).to.be.true
      expect(taskAsset.assetProps.noncomputing).to.be.true
    })

    it('should NOT update noncomputing from true to false (false is not populated)', () => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: true,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: {},
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.hasUpdatedAssetProps).to.be.false
      expect(taskAsset.assetProps.noncomputing).to.be.true
    })
  })

  describe('metadata merge', () => {
    it('should merge cklRole when parsed value is populated and differs', () => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: { cklRole: 'Domain Controller' },
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.hasUpdatedAssetProps).to.be.true
      expect(taskAsset.assetProps.metadata.cklRole).to.equal('Domain Controller')
    })

    it('should not overwrite cklRole when parsed value is empty', () => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: { cklRole: 'Member Server' },
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: {},
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.hasUpdatedAssetProps).to.be.false
      expect(taskAsset.assetProps.metadata.cklRole).to.equal('Member Server')
    })

    it('should merge cklTechArea when parsed value is populated and differs', () => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: { cklTechArea: 'Database' },
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.hasUpdatedAssetProps).to.be.true
      expect(taskAsset.assetProps.metadata.cklTechArea).to.equal('Database')
    })

    it('should not overwrite cklTechArea when parsed value is empty', () => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: { cklTechArea: 'Web Review' },
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: {},
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.hasUpdatedAssetProps).to.be.false
      expect(taskAsset.assetProps.metadata.cklTechArea).to.equal('Web Review')
    })

    it('should merge arbitrary XCCDF metadata keys', () => {
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: {
            customKey: 'customValue',
            'urn:scap:fact:asset:identifier:os_version': 'Windows Server 2019',
          },
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.xccdf',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.hasUpdatedAssetProps).to.be.true
      expect(taskAsset.assetProps.metadata.customKey).to.equal('customValue')
      expect(taskAsset.assetProps.metadata['urn:scap:fact:asset:identifier:os_version']).to.equal('Windows Server 2019')
    })

    it('should NOT merge identity metadata keys (cklHostName, cklWebDbSite, cklWebDbInstance, cklWebOrDatabase)', () => {
      // Asset matched by simple name (no cklHostName in parsed target).
      // Parsed target has identity metadata keys that should be excluded from merge.
      const apiAssets = [{
        assetId: '1',
        name: 'TestAsset',
        fqdn: '',
        description: '',
        ip: '',
        mac: '',
        noncomputing: false,
        metadata: {},
        collection: { name: 'testCollection', collectionId: '1' },
        labelIds: [],
        stigs: [{ benchmarkId: 'VPN_SRG_TEST', revisionStr: 'V1R1', benchmarkDate: '2019-07-19', revisionPinned: false, ruleCount: 81 }],
      }]
      const parsedResults = [{
        target: {
          name: 'TestAsset',
          description: null,
          ip: null,
          fqdn: null,
          mac: null,
          noncomputing: false,
          metadata: {
            cklWebDbSite: 'NewSite',
            cklWebDbInstance: 'NewInstance',
            cklWebOrDatabase: 'true',
            cklRole: 'Domain Controller',
          },
        },
        checklists: [makeChecklist()],
        sourceRef: 'test.ckl',
      }]
      const to = new TaskObject({ parsedResults, apiAssets, apiStigs, options })
      const taskAsset = to.taskAssets.get('testasset')
      expect(taskAsset.knownAsset).to.be.true
      // Identity fields should NOT be merged
      expect(taskAsset.assetProps.metadata.cklWebDbSite).to.be.undefined
      expect(taskAsset.assetProps.metadata.cklWebDbInstance).to.be.undefined
      expect(taskAsset.assetProps.metadata.cklWebOrDatabase).to.be.undefined
      // cklRole should still be merged
      expect(taskAsset.assetProps.metadata.cklRole).to.equal('Domain Controller')
      expect(taskAsset.hasUpdatedAssetProps).to.be.true
    })
  })
})
