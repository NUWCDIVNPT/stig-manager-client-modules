import chai from 'chai';
import { reviewsFromArf } from '../../ReviewParser.js'; 
import fs from 'fs/promises';
const expect = chai.expect

const scapBenchmarkMap = new Map([
  ['test_arf', 'Test_ARF_STIG']
])

// Create a helper function to read the file and generate the review object
async function generateReviewObject (
  filePath,
  importOptions,
  fieldSettings,
  allowAccept
) {
  const data = await fs.readFile(filePath, 'utf8')
  return reviewsFromArf({
    data,
    fieldSettings,
    allowAccept,
    importOptions,
    scapBenchmarkMap
  })
}

describe('Testing ARF (Asset Reporting Format) Review Parser functionality', () => {
  it('DEFAULT SETTINGS: Testing basic ARF parsing', async () => {
    // Test: DEFAULT SETTINGS
    // This test validates the behavior of the ARF parser function under default settings.
    // Primary Focus:
    // - Ensuring that the ARF parser correctly extracts XCCDF content and parses reviews
    
    const importOptions = {
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
      emptyComment: 'import',
      autoStatus: {
        save: 'saved'
      }
    }

    const fieldSettings = {
      detail: {
        required: 'optional',
        visible: true
      },
      comment: {
        required: 'optional',
        visible: true
      }
    }

    const allowAccept = true

    const reviewObject = await generateReviewObject(
      'test-files/parsers/arf/basic-arf-test.xml',
      importOptions,
      fieldSettings,
      allowAccept
    )

    // Testing target object
    expect(reviewObject.target.name).to.equal('testhost.example.com')
    expect(reviewObject.target.ip).to.equal('192.168.1.100')
    
    // Testing checklists
    expect(reviewObject.checklists).to.be.an('array')
    expect(reviewObject.checklists).to.have.lengthOf(1)
    
    const checklist = reviewObject.checklists[0]
    expect(checklist.benchmarkId).to.equal('Test_ARF_STIG') // Mapped from test_arf
    expect(checklist.reviews).to.be.an('array')
    expect(checklist.reviews).to.have.lengthOf(2)
    
    // Testing first review (pass)
    const passReview = checklist.reviews[0]
    expect(passReview.ruleId).to.equal('SV-123456r789_rule')
    expect(passReview.result).to.equal('pass')
    expect(passReview.comment).to.equal('ARF test comment')
    expect(passReview.detail).to.equal('ARF test detail')
    expect(passReview.resultEngine).to.be.an('object')
    expect(passReview.resultEngine.product).to.equal('OpenSCAP')
    expect(passReview.resultEngine.version).to.equal('1.3.0')
    
    // Testing second review (fail)
    const failReview = checklist.reviews[1]
    expect(failReview.ruleId).to.equal('SV-234567r890_rule')
    expect(failReview.result).to.equal('fail')
    expect(failReview.comment).to.equal('ARF test fail comment')
    expect(failReview.detail).to.equal('ARF test fail detail')
    
    // Testing stats
    expect(checklist.stats.pass).to.equal(1)
    expect(checklist.stats.fail).to.equal(1)
    expect(checklist.stats.notapplicable).to.equal(0)
    expect(checklist.stats.notchecked).to.equal(0)
  })

  it('ERROR HANDLING: Invalid ARF format', async () => {
    const invalidArf = '<?xml version="1.0"?><invalid>not an arf</invalid>'
    
    const importOptions = {
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
      emptyComment: 'import',
      autoStatus: { save: 'saved' }
    }

    const fieldSettings = {
      detail: { required: 'optional', visible: true },
      comment: { required: 'optional', visible: true }
    }

    try {
      await reviewsFromArf({
        data: invalidArf,
        fieldSettings,
        allowAccept: true,
        importOptions,
        scapBenchmarkMap
      })
      expect.fail('Should have thrown an error for invalid ARF')
    } catch (error) {
      expect(error.message).to.include('No XCCDF content found in ARF file')
    }
  })

  it('ERROR HANDLING: ARF with no XCCDF content', async () => {
    const emptyArf = `<?xml version="1.0" encoding="UTF-8"?>
<asset-report-collection xmlns="http://scap.nist.gov/schema/asset-reporting-format/1.1">
  <reports>
    <report id="report1" type="other">
      <content>
        <SomeOtherFormat>
          <data>not xccdf</data>
        </SomeOtherFormat>
      </content>
    </report>
  </reports>
</asset-report-collection>`
    
    const importOptions = {
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
      emptyComment: 'import',
      autoStatus: { save: 'saved' }
    }

    const fieldSettings = {
      detail: { required: 'optional', visible: true },
      comment: { required: 'optional', visible: true }
    }

    try {
      await reviewsFromArf({
        data: emptyArf,
        fieldSettings,
        allowAccept: true,
        importOptions,
        scapBenchmarkMap
      })
      expect.fail('Should have thrown an error for ARF with no XCCDF content')
    } catch (error) {
      expect(error.message).to.include('No XCCDF content found in ARF file')
    }
  })
})