import chai from 'chai'
import { reviewsFromCklb } from '../../ReviewParser.js'
import fs from 'fs/promises'

const expect = chai.expect

// Create a helper function to read the file and generate the review object
async function generateReviewObject (
  filePath,
  importOptions,
  fieldSettings,
  allowAccept
) {
  const data = await fs.readFile(filePath, 'utf8')
  return reviewsFromCklb({
    data,
    fieldSettings,
    allowAccept,
    importOptions
  })
}

describe('CKLB Checklist tests', () => {
  it("testing that 'checklist' elements benchmarkId and revisionStr are parsed", async () => {
    // TEST: ensure that the checklist array is populated with the correct benchmarkId and revisionStr
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
      './WATCHER-test-files/WATCHER/cklb/Asset_a-VPN_TRUNCATED-V2R5.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    // console.log(JSON.stringify(review, null, 2))

    expect(review.checklists).to.be.an('array')
    expect(review.checklists.length).to.equal(1)
    expect(review.checklists[0].benchmarkId).to.equal('VPN_TRUNCATED')
    expect(review.checklists[0].revisionStr).to.equal('V0R5')
  })

  it('A multi-stig Checklist array testing for correct benchmarkId and revisionStr', async () => {
    // TEST: ensure that the checklist array is populated with the correct benchmarkId and revisionStr
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/Asset_b-multi-stig.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedChecklists = [
      {
        benchmarkId: 'RHEL_8_TRUNCATED',
        revisionStr: 'V0R12'
      },
      {
        benchmarkId: 'RHEL_9_TRUNCATED',
        revisionStr: 'V0R1'
      },
      {
        benchmarkId: 'VPN_TRUNCATED',
        revisionStr: 'V0R5'
      }
    ]

    expect(review.checklists).to.be.an('array')
    expect(review.checklists.length).to.equal(expectedChecklists.length)

    for (const [index, expected] of expectedChecklists.entries()) {
      expect(review.checklists[index].benchmarkId).to.equal(
        expected.benchmarkId
      )
      expect(review.checklists[index].revisionStr).to.equal(
        expected.revisionStr
      )
    }
  })
})
