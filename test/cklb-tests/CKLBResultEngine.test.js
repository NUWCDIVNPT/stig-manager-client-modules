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

describe('Testing that the CKLb Review Parser will handle parsing on result engine for each item in the stigs array ', () => {
  it('Giving a cklb file with no ROOT "evaluate-stig" object', async () => {
    // expected result is a null result engine
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/no-root-result-engine-object.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    expect(review.checklists[0].reviews[0].resultEngine).to.be.null
  })
  it('Valid CKLB with two evaluate-stig objects in the stigs checklist and a root evaluate-stig object', async () => {
    // expected result is two different result engines for each evaluate-stig object
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
      './WATCHER-test-files/WATCHER/cklb/TwoResultEngineModules.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )



    const expectedResultEngines = [
      {
        type: 'script',
        product: 'Evaluate-STIG',
        version: '1.2310.1',
        time: '2023-12-11T12:56:14.3576272-05:00',
        checkContent: {
          location: 'Scan-GoogleChrome_Checks:1.2023.7.24'
        }
      },
      {
        type: 'script',
        product: 'Evaluate-STIG',
        version: '1.2310.1',
        time: '2023-12-11T12:56:34.9155152-05:00',
        checkContent: {
          location: 'Scan-MicrosoftEdge_Checks:1.2023.7.24'
        }
      }
    ]

    expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
      expectedResultEngines[0]
    )
    expect(review.checklists[1].reviews[0].resultEngine).to.deep.equal(
      expectedResultEngines[1]
    )
  })
  it('Valid CKLB with two checklists but only one evaluate-stig object in the stigs checklist and a root evaluate-stig object', async () => {
    // expected result is two different result engines for each evaluate-stig object
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
      './WATCHER-test-files/WATCHER/cklb/SingleResultEngineModule.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedResultEngines = [
      {
        type: 'script',
        product: 'Evaluate-STIG',
        version: '1.2310.1',
        time: '2023-12-11T12:56:14.3576272-05:00',
        checkContent: {
          location: 'Scan-GoogleChrome_Checks:1.2023.7.24'
        }
      },
      {
        type: 'script',
        product: 'Evaluate-STIG',
        version: '1.2310.1'
      }
    ]
    
    expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
      expectedResultEngines[0]
    )
    expect(review.checklists[1].reviews[0].resultEngine).to.deep.equal(
      expectedResultEngines[1]
    )
  })
  it('Valid CKLB with only the root evaluate-stig object', async () => {
    // expected result is two different result engines for each evaluate-stig object
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
      './WATCHER-test-files/WATCHER/cklb/OnlyRootResultEngine.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedResultEngine = {
      type: 'script',
      product: 'Evaluate-STIG',
      version: '1.2310.1'
    }

    expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
      expectedResultEngine
    )

  })
  it('Validating that parser truncates resultEngine values to their max oas spec', async () => {
  
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
      './WATCHER-test-files/WATCHER/cklb/Truncate-Tests.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
  
  expect(review.checklists[0].reviews[0].resultEngine.version).to.have.lengthOf(255)
    
  })
})
