import chai from 'chai'
import { reviewsFromCkl } from '../../ReviewParser.js'
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
  return reviewsFromCkl({
    data,
    importOptions,
    fieldSettings,
    allowAccept
  })
}

describe('CKL html decoding tests', () => {
  it('Testing that the value processor functiion in ReviewParser.js can decode html elements correctly in a stig.', async () => {
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

    const filePath = './WATCHER-test-files/WATCHER/ckl/html-decode.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedDecodedString = '& < > " \' & < & < > " \' A . % , ~'

    expect(review.checklists[0].reviews[0].detail).to.equal(
      expectedDecodedString
    )
  })
})
