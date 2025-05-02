

import chai from 'chai';
import { reviewsFromCkl } from '../../ReviewParser.js'; 
import fs from 'fs/promises';

const expect = chai.expect

// Create a helper function to read the file and generate the review object
async function generateReviewObject (
  filePath,
  importOptions,
  fieldSettings,
  allowAccept
) {
  const data = await fs.readFile(filePath, 'utf8')
  return reviewsFromCkl({
    data,
    importOptions,
    fieldSettings,
    allowAccept
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
      './test-files/parsers/ckl/Single-Vuln-fail-Empty-CommentDetail.ckl'
      

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-207191r803418_rule',
      result: 'fail',
      comment: null,
      detail: 'There is no detail provided for the assessment'
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
      './test-files/parsers/ckl/Asset_a-VPN_TRUNCATED-V2R5.ckl'

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

  it('autoStatus = saved, testing that we will set status to saved if does not meet field settings requirements', async () => {

    const importOptions = {
      autoStatus: "saved",
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
      './test-files/parsers/ckl/Single-Vuln-notReviewed-Commented-Detailed.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedReview = {
      ruleId: 'SV-257777r925318_rule',
      status: 'saved',
      result: 'informational',
      comment: 'xyz',
      detail: 'xyz'
    }
    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
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
      './test-files/parsers/ckl/Asset_a-VPN_TRUNCATED-V2R5.ckl'

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

