import chai from 'chai';
import { reviewsFromCklb, reviewsFromScc, reviewsFromXccdf } from '../../ReviewParser.js'; 
import fs from 'fs/promises';


const expect = chai.expect;

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

describe('Tests Old style (autoStatus = "string") for backward compatability. These are just copied test examples from existing tests. ', () => {


    it('autoStatus = null (keep exisiting), this should result in no status for the review. ', async () => {
  
      const importOptions = {
        autoStatus: "null",
        unreviewed: 'commented',
        unreviewedCommented: 'notchecked',
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
        './test-files/parsers/xccdf/Single-Vuln-fail-Empty-CommentDetail-xccdf.xml'
        
  
      const review = await generateReviewObject(
        filePath,
        importOptions,
        fieldSettings,
        allowAccept
      )
  
      const expectedReview = {
        ruleId: 'SV-2',
        result: 'fail',
        comment: null,
        detail: 'Result was reported by product "MyTestSystem" version undefined at 2023-11-13T16:41:49.000Z using check content "MyCheckContent"'
      }
  
      expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  
    })
  
    it('autoStatus = submitted, testing if reviews are set to "submitted" if valid or "saved" if not valid. Determined by field settings and result', async () => {
     
      const importOptions = {
        autoStatus: "submitted",
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
        './test-files/parsers/xccdf/Asset_a-VPN_TRUNCATED-V2R5-xccdf.xml'
  
      const review = await generateReviewObject(
        filePath,
        importOptions,
        fieldSettings,
        allowAccept
      )
      // expected statuses for each rule
      const expectedStatuses = {
        'SV-207184r695317_rule': 'submitted',
        'SV-207185r608988_rule': 'saved',
        'SV-207186r608988_rule': 'submitted',
        'SV-207187r608988_rule': 'saved',
        'SV-207188r608988_rule': 'submitted',
        'SV-207189r608988_rule': 'saved',
        'SV-207190r803417_rule': 'submitted',
        'SV-207191r803418_rule': 'submitted'
      }
  
      const expectedComments = {
        'SV-207184r695317_rule': null,
        'SV-207185r608988_rule': null,
        'SV-207186r608988_rule': null,
        'SV-207187r608988_rule': null,
        'SV-207188r608988_rule': null,
        'SV-207189r608988_rule': null,
        'SV-207190r803417_rule': null,
        'SV-207191r803418_rule': 'xyz'
      }
  
      const expectedDetails = {
        'SV-207184r695317_rule': 'xyz',
        'SV-207185r608988_rule': 'xyz',
        'SV-207186r608988_rule': 'xyz',
        'SV-207187r608988_rule': 'xyz',
        'SV-207188r608988_rule': 'xyz',
        'SV-207189r608988_rule': 'xyz',
        'SV-207190r803417_rule': 'xyz',
        'SV-207191r803418_rule': 'xyz'
      }
  
      // ensuring that each review has a status that matches the expected status
      for (const checklist of review.checklists) {
        for (const reviewItem of checklist.reviews) {
          const expectedStatus = expectedStatuses[reviewItem.ruleId]
          const expectedComment = expectedComments[reviewItem.ruleId]
          const expectedDetail = expectedDetails[reviewItem.ruleId]
          expect(reviewItem.status).to.equal(expectedStatus)
          expect(reviewItem.comment).to.equal(expectedComment)
          expect(reviewItem.detail).to.equal(expectedDetail)
        }
      }
    })
  
    it('(autoStatus = accepted, allowAccept = true) for permissions to use accepted status', async () => {
     
      const importOptions = {
        autoStatus: "accepted",
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
        './test-files/parsers/xccdf/Asset_a-VPN_TRUNCATED-V2R5-xccdf.xml'
  
      const review = await generateReviewObject(
        filePath,
        importOptions,
        fieldSettings,
        allowAccept
      )
  
      // expected statuses for each rule
      const expectedStatuses = {
        'SV-207184r695317_rule': 'accepted',
        'SV-207185r608988_rule': 'saved',
        'SV-207186r608988_rule': 'accepted',
        'SV-207187r608988_rule': 'saved',
        'SV-207188r608988_rule': 'accepted',
        'SV-207189r608988_rule': 'saved',
        'SV-207190r803417_rule': 'accepted',
        'SV-207191r803418_rule': 'accepted'
      }
      const expectedComments = {
        'SV-207184r695317_rule': null,
        'SV-207185r608988_rule': null,
        'SV-207186r608988_rule': null,
        'SV-207187r608988_rule': null,
        'SV-207188r608988_rule': null,
        'SV-207189r608988_rule': null,
        'SV-207190r803417_rule': null,
        'SV-207191r803418_rule': 'xyz'
      }
  
      const expectedDetails = {
        'SV-207184r695317_rule': 'xyz',
        'SV-207185r608988_rule': 'xyz',
        'SV-207186r608988_rule': 'xyz',
        'SV-207187r608988_rule': 'xyz',
        'SV-207188r608988_rule': 'xyz',
        'SV-207189r608988_rule': 'xyz',
        'SV-207190r803417_rule': 'xyz',
        'SV-207191r803418_rule': 'xyz'
      }
  
      // ensuring that each review has a status that matches the expected status
      for (const reviewItem of review.checklists[0].reviews) {
        const expectedStatus = expectedStatuses[reviewItem.ruleId]
        const expectedComment = expectedComments[reviewItem.ruleId]
        const expectedDetail = expectedDetails[reviewItem.ruleId]
  
        expect(reviewItem).to.have.property('ruleId')
        expect(expectedStatuses).to.have.property(reviewItem.ruleId)
        expect(expectedComments).to.have.property(reviewItem.ruleId)
        expect(expectedDetails).to.have.property(reviewItem.ruleId)
        expect(reviewItem.status).to.equal(expectedStatus)
        expect(reviewItem.comment).to.equal(expectedComment)
        expect(reviewItem.detail).to.equal(expectedDetail)
      }
    })
   
})
  
  