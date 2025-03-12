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


describe('Testing that the xccdf Review Parser will return the correct figures in the Statistics object', () => {
  it('unreviewed: commented, unreviewedCommented: informational, has comments/detail', async () => {
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

    const filePath = './test-files/parsers/xccdf/GoodStatistics-xccdf.xml'

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

  it('unreviewed: commented, unreviewedCommented: notchecked, has comments/detail', async () => {
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

    const filePath = './test-files/parsers/xccdf/GoodStatistics-xccdf.xml'

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

  it('unreviewed: always, unreviewedCommented: informational, has comments/detail', async () => {
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

    const filePath = './test-files/parsers/xccdf/GoodStatistics-xccdf.xml'

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

  it('unreviewed: always, unreviewedCommented: notchecked, has comments/detail', async () => {
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

    const filePath = './test-files/parsers/xccdf/GoodStatistics-xccdf.xml'

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

    const filePath = './test-files/parsers/xccdf/GoodStatistics-xccdf.xml'

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

    const filePath = './test-files/parsers/xccdf/GoodStatistics-xccdf.xml'

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
