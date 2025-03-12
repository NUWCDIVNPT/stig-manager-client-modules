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

describe('testing that revision strings are correctly parsed', () => {

  it('Testing a v2r5 revison str is currently being returned as v2r5', async () => {

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

    const filePath = './test-files/parsers/cklb/Asset_a-VPN_TRUNCATED-V2R5.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    expect(review.checklists[0].revisionStr).to.eql("V2R5")
  })
  
  it('Testing a v2r5 revison str is not being returned as V0R5', async () => {

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

    const filePath = './test-files/parsers/cklb/Asset_a-VPN_TRUNCATED-V2R5.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    expect(review.checklists[0].revisionStr).to.not.eql("V0R5")
  })
})
