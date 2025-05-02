import chai from 'chai';
import { reviewsFromXccdf } from '../../ReviewParser.js'; 
import fs from 'fs/promises';
const expect = chai.expect

const dataArray = [
  {
    scapBenchmarkId: 'CAN_Ubuntu_18-04_STIG',
    benchmarkId: 'U_CAN_Ubuntu_18-04_STIG'
  },
  { scapBenchmarkId: 'Mozilla_Firefox_RHEL', benchmarkId: 'Mozilla_Firefox' },
  {
    scapBenchmarkId: 'Mozilla_Firefox_Windows',
    benchmarkId: 'Mozilla_Firefox'
  },
  { scapBenchmarkId: 'MOZ_Firefox_Linux', benchmarkId: 'MOZ_Firefox_STIG' },
  { scapBenchmarkId: 'MOZ_Firefox_Windows', benchmarkId: 'MOZ_Firefox_STIG' },
  { scapBenchmarkId: 'Solaris_10_X86_STIG', benchmarkId: 'Solaris_10_X86' }
]

const scapBenchmarkMap = new Map(
  dataArray.map(item => [item.scapBenchmarkId, item])
)

// Create a helper function to read the file and generate the review object
async function generateReviewObject (
  filePath,
  importOptions,
  fieldSettings,
  allowAccept
) {
  const data = await fs.readFile(filePath, 'utf8')
  return reviewsFromXccdf({
    data,
    fieldSettings,
    allowAccept,
    importOptions,
    scapBenchmarkMap
  })
}

describe('Target Object Tests xccdf', () => {
  it('minimal target object', async () => {
    const importOptions = {
      autoStatus: {
        fail: 'saved',
        notapplicable: 'saved',
        pass: 'saved'
      },
      unreviewed: 'never',
      unreviewedCommented: 'notchecked',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always',
        required: 'always'
      },
      comment: {
        enabled: 'findings',
        required: 'findings'
      }
    }

    const allowAccept = true

    const filePath =
      './test-files/parsers/xccdf/TargetObjectMinimal-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedTarget = {
      name: 'MyAsset',
      description: '',
      ip: '',
      noncomputing: false,
      metadata: {}
    }
    expect(review.target).to.deep.equal(expectedTarget)
  })



  it('TargetObject with full metadata', async () => {
    const importOptions = {
      autoStatus: {
        fail: 'saved',
        notapplicable: 'saved',
        pass: 'saved'
      },
      unreviewed: 'never',
      unreviewedCommented: 'notchecked',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always',
        required: 'always'
      },
      comment: {
        enabled: 'findings',
        required: 'findings'
      }
    }

    const allowAccept = true

    const filePath =
      './test-files/parsers/xccdf/TargetObjectMetaData-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedTarget = {
      name: 'MyAsset',
      description: '',
      ip: '',
      noncomputing: false,
      metadata: {
        'tag:testTag:asset:name': 'MyAsset',
        'tag:testTag:asset:description': 'Description',
        'tag:testTag:asset:fqdn': 'MyAsset.domain.com',
        'tag:testTag:asset:ip': '1.1.1.1',
        'tag:testTag:asset:mac': 'fe80::8c33:57ff:fe94:2b33',
        'tag:testTag:asset:noncomputing': 'false'
      }
    }
    expect(review.target).to.deep.equal(expectedTarget)
  })
  it('General Target Object', async () => {
    const importOptions = {
      autoStatus: {
        fail: 'saved',
        notapplicable: 'saved',
        pass: 'saved'
      },
      unreviewed: 'never',
      unreviewedCommented: 'notchecked',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always',
        required: 'always'
      },
      comment: {
        enabled: 'findings',
        required: 'findings'
      }
    }

    const allowAccept = true

    const filePath =
      './test-files/parsers/xccdf/TargetObjectBasic-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedTarget = {
      name: 'MyAsset',
      description: 'Description',
      ip: '1.1.1.1',
      noncomputing: false,
      metadata: {},
      fqdn: 'MyAsset.domain.com',
      mac: 'fe80::8c33:57ff:fe94:2b33'
    }
    expect(review.target).to.deep.equal(expectedTarget)
  })
  it('Validating that parser truncates asset target values to their max oas spec', async () => {
    // values tested: target.description, target.ip, target.fqdn, target.mac
    const importOptions = {
      autoStatus: {
        fail: 'saved',
        notapplicable: 'saved',
        pass: 'saved'
      },
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'replace',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always',
        required: 'always'
      },
      comment: {
        enabled: 'findings',
        required: 'findings'
      }
    }

    const allowAccept = true

    const filePath =
      './test-files/parsers/xccdf/Target-Object-Long-Properties-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    
    expect(review.target.ip).to.have.lengthOf(255)
    expect(review.target.fqdn).to.have.lengthOf(255)
    expect(review.target.mac).to.have.lengthOf(255)
    expect(review.target.description).to.have.lengthOf(255)

    
  })
})
