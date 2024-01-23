import chai from 'chai';
import { reviewsFromCklb } from '../../ReviewParser.js';  
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


describe('Testing that the CKLb Review Parser will return the correct figures in the Statistics object', () => {
  it('unreviewed: commented, unreviewedCommented: informational, has comments/detail', async () => {
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/GoodStatistics.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedStats = {
      pass: 2,
      fail: 2,
      notapplicable: 2,
      notchecked: 0,
      notselected: 0,
      informational: 1,
      error: 0,
      fixed: 0,
      unknown: 0
    }

    expect(review.checklists[0].stats).to.deep.equal(expectedStats)
  })

  it('unreviewed: commented, unreviewedCommented: notchecked, has comments/detail', async () => {
     // will import commented unreviewed findings as notchecked
    const importOptions = {
      autoStatus: 'saved',
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/GoodStatistics.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedStats = {
      pass: 2,
      fail: 2,
      notapplicable: 2,
      notchecked: 1,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }

    expect(review.checklists[0].stats).to.deep.equal(expectedStats)
  })

  it('unreviewed: always, unreviewedCommented: informational, has comments/detail', async () => {
    // will always import unreviewed findings and unreviewed with a commment/detail is informational
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/GoodStatistics.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedStats = {
      pass: 2,
      fail: 2,
      notapplicable: 2,
      notchecked: 1,
      notselected: 0,
      informational: 1,
      error: 0,
      fixed: 0,
      unknown: 0
    }

    expect(review.checklists[0].stats).to.deep.equal(expectedStats)
  })

  it('unreviewed: always, unreviewedCommented: notchecked, has comments/detail', async () => {
      // will always import unreviewed findings and unreviewed with a commment/detail is notchecked
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'always',
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/GoodStatistics.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedStats = {
      pass: 2,
      fail: 2,
      notapplicable: 2,
      notchecked: 2,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }

    expect(review.checklists[0].stats).to.deep.equal(expectedStats)
  })

  it(' unreviewed: never, unreviewedCommented: informational, has comments/detail', async () => {
    // will never import unreviewed findings
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/GoodStatistics.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedStats = {
      pass: 2,
      fail: 2,
      notapplicable: 2,
      notchecked: 0,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }

    expect(review.checklists[0].stats).to.deep.equal(expectedStats)
  })

  it(' unreviewed: never, unreviewedCommented: notchecked', async () => {
    // will never import unreviewed findings
    const importOptions = {
      autoStatus: 'saved',
      unreviewed: 'never',
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/GoodStatistics.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedStats = {
      pass: 2,
      fail: 2,
      notapplicable: 2,
      notchecked: 0,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }

    expect(review.checklists[0].stats).to.deep.equal(expectedStats)
  })
})
