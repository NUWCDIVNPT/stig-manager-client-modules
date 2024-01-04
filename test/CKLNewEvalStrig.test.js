
import chai from 'chai';
import { reviewsFromCkl } from '../ReviewParser.js';  
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';
import he from 'he';
const expect = chai.expect
const valueProcessor = function (
  tagName,
  tagValue,
  jPath,
  hasAttributes,
  isLeafNode
) {
  he.decode(tagValue)
}

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
    allowAccept,
    valueProcessor,
    XMLParser
  })
}


describe('Testing new code for eval stig result engine in ckl', () => {
  it('ensuring we read result engine from within each "istig"', async () => {
    // will import commented unreviewed findings as informational
    // expecting to see 1 informational finding
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

    const filePath = './WATCHER-test-files/WATCHER/ckl/ResultEngineInIStigMultiple.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    console.log(JSON.stringify(review, null, 2))
    
    // expect(review.checklists[0].stats).to.deep.equal(expectedStats)
  })

 
})
