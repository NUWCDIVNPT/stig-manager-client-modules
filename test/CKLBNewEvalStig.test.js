import chai from 'chai';
import { reviewsFromCklb } from '../ReviewParser.js';  
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
  return reviewsFromCklb({
    data,
    importOptions,
    fieldSettings,
    allowAccept,
    valueProcessor,
    XMLParser
  })
}


describe('Testing that the CKLb Review Parser will handle parsing on result engine for each item in the stigs array ', () => {
  it('ensuring that we get different result engines for each of the stigs here. ', async () => {
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/CA1294WK16078_COMBINED_20231211-125654.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    console.log(JSON.stringify(review, null, 2))
  })

 
})
