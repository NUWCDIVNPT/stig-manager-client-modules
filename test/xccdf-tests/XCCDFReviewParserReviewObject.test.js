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

describe('Testing permutations of Import Options for a review objects parsed by xccdf Review Parser.', () => {
  it('DEFAULT SETTINGS: Primarily testing review "status = saved"', async () => {
    // Test: DEFAULT SETTINGS
    // This test validates the behavior of the xccdf parser function under default settings.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly sets the reviews to be empty
  

    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'replace',
      emptyComment: 'replace',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Commented-Detailed-xccdf.xml'
    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })

  it('autoStatus = null (keep exisiting), testing that all review statuses do not exist', async () => {
    // Test: autoStatus = null
    // This test validates the behavior of the xccdf parser function under the 'autoStatus = null' setting.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly sets the review to be empty
  
    const importOptions = {
      autoStatus: 'null',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Commented-Detailed-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })

  it('autoStatus = submitted, testing if reviews are set to "submitted" if valid or "saved" if not valid. Determined by field settings and result', async () => {
    // Test: autoStatus = submitted
    // This test validates the behavior of the ckl parser function under the autoStatus = submitted setting coupled with out field settings.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly sets the review status to 'submitted' if valid or 'saved' if not valid.
    
    const importOptions = {
      autoStatus: 'submitted',
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
      './WATCHER-test-files/WATCHER/xccdf/Asset_a-VPN_TRUNCATED-V2R5-xccdf.xml'

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

  it('autoStatus = submitted, testing that status is set to saved if does not meet field settings requirements', async () => {
    // Test: autoStatus = submitted
    // This test validates the behavior of the xccdf parser function under the autoStatus = submitted setting coupled with our field settings.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly sets the review to be empty

    const importOptions = {
      autoStatus: 'submitted',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Commented-Detailed-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })

  it('(autoStatus = accepted, allowAccept = true) for permissions to use accepted status', async () => {
    // Test: autoStatus = accepted, allowAccept = true
    // This test validates the behavior of the xccdf parser function under the autoStatus = accepted, allowAccept = true settings.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly sets the review status to 'submitted' if the user does not have permissions
    // or 'accepted' if the user does have permissions (permissions are determined by the 'allowAccept' option).
    // note: if not accepted or submitted, it will be saved because review did not meet the field settings requirements
    // note: in this test we will have permissions to accept reviews


    const importOptions = {
      autoStatus: 'accepted',
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
      './WATCHER-test-files/WATCHER/xccdf/Asset_a-VPN_TRUNCATED-V2R5-xccdf.xml'

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

  it('(autoStatus = accepted allowAccept = false) for permissions to use submitted status', async () => {
    // Test: autoStatus = accepted, allowAccept = false
    // This test validates the behavior of the xccdf parser function under the autoStatus = accepted, allowAccept = false settings.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly sets the review status to 'submitted' if the user does not have permissions
    // or 'accepted' if the user does have permissions (permissions are determined by the 'allowAccept' option).
    // note: if not accepted or submitted, it will be saved because review did not meet the field settings requirements
    // note: in this test we will NOT have permissions to accept reviews (we should see submitted)
   
    const importOptions = {
      autoStatus: 'accepted',
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

    const allowAccept = false
    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Asset_a-VPN_TRUNCATED-V2R5-xccdf.xml'

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

  it("'unreviewed = commented' testing that we ignore unreviewed reviews even if they have commment/detail  ", async () => {
    // Test: unreviewed = commented
    // This test validates the behavior of the xccdf parser function under the unreviewed = commented settings.
    // Primary Focus:
    // - Ensuring that the 'unreviewed' option in 'importOptions' correctly ignores reviews that are unreviewed and have a comment or detail.
    // note this test will have a review with a comment and detail

    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Commented-Detailed-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })

  it("'unreviewed = commented' testing that we do not import unreviwred rules that contain a comment or detail but giving a review without either", async () => {
    // Test: unreviewed = commented
    // This test validates the behavior of the xccdf parser function under the unreviewed = commented settings.
    // Primary Focus:
    // - Ensuring that the 'unreviewed' option in 'importOptions' correctly imports only reviews with a non complience result that contain a comment and or detail.
    // note this test will not have any reviews because there will be no comment/detail
    
    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    // check that review has a comment or detail and exisits
    expect(review.checklists[0].reviews).to.be.empty
  })

  it("'unreviewed = always', testing that unreviewed always are import and result is 'notchecked'  ", async () => {
    // Test: unreviewed = always
    // This test validates the behavior of the xccdf parser function under the unreviewed = always settings.
    // Primary Focus:
    // - Ensuring that the 'unreviewed' option in 'importOptions' correctly imports all reviews without a compliance result and if they have a comment
    // or detail they will be labeled as notchecked.

    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'always',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Commented-Detailed-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'notchecked',
      comment: 'xyz',
      detail: 'xyz'
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'unreviewed = always', testing that unreviewed always are imported ", async () => {
    // Test: unreviewed = always
    // This test validates the behavior of the xccdf parser function under the unreviewed = always settings.
    // Primary Focus:
    // - Ensuring that the 'unreviewed' option in 'importOptions' correctly imports all reviews without a compliance result
    // and without comment or detail to be labled as notchecked.

    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'always',
      unreviewedCommented: 'informational',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'notchecked',
      comment: null,
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it(" 'unreviewed = never' testing to never import an unreviewed item ", async () => {
    // Test: unreviewed = never
    // This test validates the behavior of the xccdf parser function under the unreviewed = never settings.
    // Primary Focus:
    // - Ensuring that the 'unreviewed' option in 'importOptions' ignores reviews without a compliance result (Nf/na/o)
    
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'never',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })

  it("'unreviewedComment = informational' testing that an unreviewed item with a comment is an empty review ", async () => {
    // Test: unreviewedComment = informational
    // This test validates the behavior of the xccdf parser function under the unreviewedComment = informational settings.
    // Primary Focus:
    // - Ensuring that the 'unreviewed' option in 'importOptions' correctly does not import the review.
    
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Commented-Detailed-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })

  it(" 'unreviewedComment = notchecked'. testing that an unreviewed with a comment returns no reviews", async () => {
    // Test: unreviewedComment = notchecked
    // This test validates the behavior of the xccdf parser function under the unreviewedComment = notchecked settings.
    // Primary Focus:
    // - Ensuring that the 'unreviewed' option in 'importOptions' correctly ignores a review without a compliance result

    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Commented-Detailed-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })

  it("'emptyDetail = replace' testing that if an item has an empty detail we will replace it with a static message", async () => {
    // Test: emptyDetail = replace
    // This test validates the behavior of the xccdf parser function under the emptyDetail = replace settings.
    // Primary Focus:
    // - Ensuring that the 'emptyDetail' option in 'importOptions' correctly replaces an empty detail with a static message.

    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment: 'xyz',
      detail:
        'Result was reported by product "MyTestSystem" version 1 at 2023-11-13T16:41:49.000Z using check content "MyCheckContent"'
    }
    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'emptyDetail = ignore' testing that if there is no detail provided it will retain exisiting detail, if no exisitng then we will set to null", async () => {
    // Test: emptyDetail = ignore
    // This test validates the behavior of the xccdf parser function under the emptyDetail = ignore settings.
    // Primary Focus:
    // - Ensuring that the 'emptyDetail' option in 'importOptions' correctly replaces an empty detail a null value

    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment: 'xyz',
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })
  it("'emptyDetail = import', testing empty detail will clear existing text (setting it to empty string)", async () => {
    // Test: emptyDetail = import
    // This test validates the behavior of the xccdf parser function under the emptyDetail = import settings.
    // Primary Focus:
    // - Ensuring that the 'emptyDetail' option in 'importOptions' correctly replaces an empty detail an empty string if no detail is provided
   
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment: 'xyz',
      detail: ''
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it(" 'emptyDetail = import' testing that a review with a detail provided will be applied", async () => {
    // Test: emptyDetail = import
    // This test validates the behavior of the xccdf parser function under the emptyDetail = import settings.
    // Primary Focus:
    // - Ensuring that the 'emptyDetail' option in 'importOptions' correctly uses the exisisitng detail if one is provided
  
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Detail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment: null,
      detail: 'xyz'
    }
    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'emptyComment = replace' testing that if an item has an empty comment we will replace it with a dynamically created message", async () => {
    // Test: emptyComment = replace
    // This test validates the behavior of the xxcdf parser function under the emptyComment = replace settings.
    // Primary Focus:
    // - Ensuring that the 'emptyComment' option in 'importOptions' correctly replaces an empty comment with a dynamically created message based off the data.
   
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'replace',
      emptyComment: 'replace',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Detail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment:
        'Result was reported by product "MyTestSystem" version 1 at 2023-11-13T16:41:49.000Z using check content "MyCheckContent"',
      detail: 'xyz'
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'emptyComment = ignore' testing that we will use exisitng text, if none use null", async () => {
    // Test: emptyComment = ignore
    // This test validates the behavior of the xccdf parser function under the emptyComment = ignore settings.
    // Primary Focus:
    // - Ensuring that the 'emptyComment' option in 'importOptions' correctly replaces an empty comment a null value
  
    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Detail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment: null,
      detail: 'xyz'
    }
    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'emptyComment = import', will clear eixsitng with an empty string if no comment given ", async () => {
    // Test: emptyComment = import
    // This test validates the behavior of the xccdf parser function under the emptyComment = import settings.
    // Primary Focus:
    // - Ensuring that the 'emptyComment' option in 'importOptions' correctly replaces an empty comment an empty string: ""
    

    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'replace',
      emptyComment: 'import',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Detail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment: '',
      detail: 'xyz'
    }
    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'emptyComment = import', testing a review with a comment provided in the ckl to make sure we get it back in the review ", async () => {
    // Test: emptyComment = import
    // This test validates the behavior of the xccdf parser function under the emptyComment = import settings.
    // Primary Focus:
    // - Ensuring that the 'emptyComment' option in 'importOptions' correctly uses the exisisitng comment if one is provided
 
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'import',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'pass',
      comment: 'xyz',
      detail: null
    }
    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })
})

describe('fieldSettings testing for a review object in non multi-stig xccdf', () => {
  it("DEFAULT FIELD SETTINGS with allowAccept=true and a passing review, testing that it has a detail and is 'submitted'", async () => {
    // Test: autostatus = submitted, default field settings.
    // This test validates the behavior of the xccdf parser function under the default field settings.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly ensures that a detail is required for a review to be submitted.
   
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
      emptyComment: 'import',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'always'
      },
      comment: {
        enabled: 'findings', // not used
        required: 'optional'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Detail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'pass',
      comment: '',
      detail: 'xyz'
    }

    // expected status is submitted for the rule that has a detail
    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it('DEFAULT FIELD SETTINGS  with allowAccept=true and a failing review with no detail.', async () => {
    //autostatus = submitted, testing default field settings with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the default field setting with a fail and a no detail.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a detail is always required for submission for a review.
    // Test that with a failing review and no detail exisiting and it will be set to 'saved'
   
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'always', // not used
        required: 'always'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'fail',
      comment: null,
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it('fieldSettings.detail.required = findings with allowAccept=true with a failing review containing a detail', async () => {
    // Test: autostatus = submitted, default field settings.
    // This test validates the behavior of the xccdf parser function under the  fieldSettings.detail.required = findings field settings.
    // Primary Focus:
    // - Ensuring that the 'autoStatus' option in 'importOptions' correctly ensures that a detail is required for a review  that has findings to be submitted.
    // Test that a failing review with a detail will be submitted
   

    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
      emptyComment: 'import',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'findings'
      },
      comment: {
        enabled: 'findings', // not used
        required: 'optional'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-With-Detail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'fail',
      comment: '',
      detail: 'xyz'
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'fieldSettings.detail.required = findings' with allowAccept=true with a fail and no detail or comment", async () => {
    // Test: autostatus = submitted, testing 'fieldSettings.detail.required = findings' allowAccept=true
    // This test validates the behavior of the xccdf parser function under the  fieldSettings.detail.required = findings field setting with a fail and no detail or comment.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a detail is required for a review that has findings to be submitted if not we will save.
    // Test that no detail exisitng and it will be set to 'saved'
   
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'findings'
      },
      comment: {
        enabled: 'findings', // not used
        required: 'optional'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'fail',
      comment: null,
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'fieldSettings.detail.required = optional' with allowAccept=true with a fail and no detail or comment, testing that it does not have a detail and is submitted ", async () => {
    // TEST: autostatus = submitted, testing 'fieldSettings.detail.required = optional' with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the  fieldSettings.detail.required = optional field setting with a fail and no detail or comment.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a detail is optional for submission for a review that has findings.
    // Test that no detail exisitng and it will be set to 'submitted'
   
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'findings', // not used
        required: 'optional'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'fail',
      comment: null,
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("fieldSettings.detail.required = optional' with allowAccept=true with a fail and detail testing it has a detail and is submitted", async () => {
    // autostatus = submitted, 'fieldSettings.detail.required = optional' with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the  fieldSettings.detail.required = optional field setting with a fail and a detail.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a detail is optional for submission for a review that has findings.
    // Test that with detail exisitng and it will be set to 'submitted'
   
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'import',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'findings', // not used
        required: 'optional'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-With-Detail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'fail',
      comment: null,
      detail: 'xyz'
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it('DEFAULT FIELD SETTINGS with allowAccept=true and a passing review testing that it has a comment and is submitted', async () => {
    //autostatus = submitted, testing default field settings with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the default field setting with a pass and a comment.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a comment is always required for submission for a review.
    // Test that witha passing review and a comment exisiting and it will be set to 'submitted'
   
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'import',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'always', // not used
        required: 'always'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'pass',
      comment: 'xyz',
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it('DEFAULT FIELD SETTINGS  with allowAccept=true and a failing review with no comment.', async () => {
    //autostatus = submitted, testing default field settings with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the default field setting with a fail and a no comment.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a comment is always required for submission for a review.
    // Test that with a failing review and no comment exisiting and it will be set to 'saved'
    
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'always', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'always', // not used
        required: 'always'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'fail',
      comment: null,
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })
  it('fieldSettings.comment.required = findings with allowAccept=true with a fail and comment testing that it has a comment and is submitted', async () => {
    // TEST: autostatus = submitted, fieldSettings.comment.required = findings with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the fieldSettings.comment.required = findings field setting with a fail and a comment.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a comment is always required for submission for a review that contains a finding.
    // Test that with a failed review and a comment exisitng and it will be set to 'submitted'
    
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'import',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'findings', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'always', // not used
        required: 'findings'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-with-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'fail',
      comment: 'xyz',
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })
  it("'fieldSettings.comment.required = findings' with allowAccept=true with a fail and no detail or comment, testing that it does not have a comment and is 'saved' ", async () => {
    // TEST: autostatus = submitted, testing 'fieldSettings.comment.required = findings' with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the fieldSettings.comment.required = findings field setting with a fail and no comment.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a comment is always required for submission for a review that contains a finding.
    // Test that with a failed review and no comment will be set to 'saved'
    
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'findings', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'always', // not used
        required: 'findings'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'saved',
      result: 'fail',
      comment: null,
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })

  it("'fieldSettings.comment.required = optional' with allowAccept=true with a fail and no detail or comment. testing that it doesnt have a comment and is submmited", async () => {
    // TEST: autostatus = submitted, testing 'fieldSettings.comment.required = optional' with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the fieldSettings.comment.required = optional field setting with a fail and no comment or detail .
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a comment is optionally required for submission for a review that contains a finding.
    // Test that with a failed review and no comment will be set to 'submitted'
 
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'findings', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'always', // not used
        required: 'optional'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'fail',
      comment: null,
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })
  it("fieldSettings.comment.required = optional' with allowAccept=true with a fail and comment, testing thhat it has a comment and is submitted", async () => {
    // TEST: autostatus = submitted, 'fieldSettings.comment.required = optional' with allowAccept=true
    // This test validates the behavior of the xccdf parser function under the fieldSettings.comment.required = optional field setting with a fail and a comment.
    // Primary Focus:
    // - ensuring that fieldSettings correctly ensures that a comment is optionally required for submission for a review that contains a finding.
    // Test that with a failed review and a comment will be set to 'submitted'

    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'import',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'findings', // not used
        required: 'optional'
      },
      comment: {
        enabled: 'always', // not used
        required: 'optional'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-fail-with-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedReview = {
      ruleId: 'SV-2',
      status: 'submitted',
      result: 'fail',
      comment: 'xyz',
      detail: null
    }

    expect(review.checklists[0].reviews[0]).to.include(expectedReview)
  })
})

describe('Tests where fieldSettings and importOptions overlap xccdf. ', () => {
  it("Testing where emptyDetail: 'ignore', emptyComment: 'ignore', aswell as requiring a comment and detail  ", async () => {
    // TEST: emptyDetail: 'ignore', emptyComment: 'ignore', fieldSettings.detail.required = always, fieldSettings.comment.required = always
    // This test validates the behavior of the xccdf parser function under above settings with a non compliance resilt and no comment or detail.
    // Primary Focus:
    // - ensuring that we will have no reviews because a brand new review will be created with "null" comment or detail with are both required.
    // Test that with a failed review and a comment will be set to 'submitted'
   
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'commented',
      unreviewedCommented: 'informational',
      emptyDetail: 'ignore',
      emptyComment: 'ignore',
      allowCustom: true
    }

    const fieldSettings = {
      detail: {
        enabled: 'findings', // not used
        required: 'always'
      },
      comment: {
        enabled: 'always', // not used
        required: 'always'
      }
    }

    const allowAccept = true

    const filePath =
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-notReviewed-Empty-CommentDetail-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews).to.be.empty
  })
})

describe('MISC. xccdf ', () => {
  it('review with result engine data', async () => {
    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/Single-Vuln-Pass-With-Comment-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    //  console.log(JSON.stringify(review, null, 2))

    const expectedResultEngineReview = {
      ruleId: 'SV-2',
      result: 'pass',
      resultEngine: {
        time: '2023-11-13T16:41:49.000Z',
        type: 'scap',
        version: "1",
        product: 'MyTestSystem',
        checkContent: {
          location: 'MyCheckContent',
          component: 'fso_comp_MyStig:135'
        }
      },
      detail: null,
      comment: 'xyz',
      status: 'saved'
    }

    expect(review.checklists[0].reviews[0]).to.deep.equal(
      expectedResultEngineReview
    )
  })
  it('review with result override', async () => {
    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/ReviewOverrides-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )


    const expectedOveride = {
      authority: 'Authority1',
      oldResult: 'pass',
      newResult: 'fail',
      remark: 'Some remark'
    }

    expect(review.checklists[0].reviews[0].resultEngine.overrides[0]).to.deep.equal(
      expectedOveride
    )
  })
  it('Validating that parser truncates review values to their max oas spec', async () => {
    // values tested: ruleId
    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/Target-Object-Long-Properties-xccdf.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    
    expect(review.checklists[0].reviews[0].ruleId).to.have.lengthOf(45)
    expect(review.checklists[0].benchmarkId).to.have.lengthOf(255)
    expect(review.checklists[0].reviews[0].resultEngine.overrides[0].authority).to.have.lengthOf(255)
    expect(review.checklists[0].reviews[0].resultEngine.overrides[0].remark).to.have.lengthOf(255)
    expect(review.checklists[0].reviews[0].resultEngine.checkContent.component).to.have.lengthOf(255)
    
  })
})


describe('xccdf - generated by Eval-STIG ', () => {
  it('review with result engine data', async () => {
    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/eval-stig-w-sm-resultEngine.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    //  console.log(JSON.stringify(review, null, 2))

    const expectedResultEngineReview = {
      ruleId: 'SV-221558r879534_rule',
      result: 'pass',
      resultEngine: {
        time: '2023-12-11T12:56:14.3576272-05:00',
        type: 'script',
        version: "1.2310.1",
        product: 'Evaluate-STIG',
        overrides: [
          {
          authority: "Google_Chrome_Current_Windows_AnswerFile.xml",
          newResult: "pass",
          oldResult: "unknown",
          remark: "Evaluate-STIG Answer File"
         },
        ],
        checkContent: {
          location: 'Scan-GoogleChrome_Checks:1.2023.7.24'
        }
      },
      detail: "Evaluate-STIG 1.2407.1 (Scan-GoogleChrome_Checks) found this to be NOT A FINDING on 09/11/2024:\nThis Security Technical Implementation Guide is published as a tool to improve the security of Department of Defense (DOD) information systems. The requirements are derived from the National Institute of Standards and Technology (NIST) 800-53 and related documents. Comments or proposed revisions to this document should be sent via email to the following address:............",
      comment: "Evaluate-STIG Answer File        [ValidTrueComment]:\n        1 Google Chrome is fully managed by a configuration management tool to ensure the latest version is deployed to clients.\n        2 Google Chrome is fully managed by a configuration management tool to ensure the latest version is deployed to clients.\n        3 Google Chrome is fully managed by a configuration management tool to ensure the latest version is deployed to clients.\n        4 Google Chrome is fully managed by a configuration management tool to ensure the latest version is deployed to clients.\n        5 Google Chrome is fully managed by a configuration management tool to ensure the latest version is deployed to clients.\n        6 Google Chrome is fully managed by a configuration management tool to ensure the latest version is deployed to clients.",
      status: 'saved'
    }

    expect(review.checklists[0].reviews[0]).to.deep.equal(
      expectedResultEngineReview
    )
  })
  it('review with result override', async () => {
    const importOptions = {
      autoStatus: 'saved',
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
      './WATCHER-test-files/WATCHER/xccdf/eval-stig-w-sm-resultEngine.xml'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )


    const expectedOverride = {
      authority: 'Google_Chrome_Current_Windows_AnswerFile.xml',
      oldResult: 'unknown',
      newResult: 'pass',
      remark: 'Evaluate-STIG Answer File'
    }

    expect(review.checklists[0].reviews[0].resultEngine.overrides[0]).to.deep.equal(
      expectedOverride
    )
  })
})