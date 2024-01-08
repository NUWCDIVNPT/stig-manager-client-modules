import chai from 'chai'
import { reviewsFromCkl } from '../ReviewParser.js'
import { XMLParser } from 'fast-xml-parser'
import fs from 'fs/promises'
import he from 'he'

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

 describe(' CKL result engine ', () => {
//   it('Testing result engine ckl with an expression of the Eval STIG "module" that did the evaluation  ', async () => {
//     const importOptions = {
//       autoStatus: 'submitted',
//       unreviewed: 'commented',
//       unreviewedCommented: 'informational',
//       emptyDetail: 'ignore',
//       emptyComment: 'ignore',
//       allowCustom: true
//     }

//     const fieldSettings = {
//       detail: {
//         enabled: 'findings', // not used
//         required: 'always'
//       },
//       comment: {
//         enabled: 'always', // not used
//         required: 'always'
//       }
//     }

//     const allowAccept = true

//     const filePath =
//       './WATCHER-test-files/WATCHER/ckl/ResultEngineWithEvalStigModuleAndOverride.ckl'

//     const review = await generateReviewObject(
//       filePath,
//       importOptions,
//       fieldSettings,
//       allowAccept
//     )

//     const expectedResultEngine = {
//       type: 'script',
//       product: 'Evaluate-STIG',
//       version: '1.2204.1',
//       time: '2022-06-03T12:19:27.9454169-04:00',
//       checkContent: {
//         location: 'Scan-Windows10_Checks'
//       },
//       overrides: [
//         {
//           authority: 'MS_Windows_10_STIG_Answer_file.xml',
//           oldResult: 'unknown',
//           newResult: 'notapplicable',
//           remark: 'Evaluate-STIG Answer File'
//         }
//       ]
//     }

//     expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
//       expectedResultEngine
//     )
//   })
//   it('Testing result engine ckl with an  Eval STIG individual answer file override', async () => {
//     const importOptions = {
//       autoStatus: 'submitted',
//       unreviewed: 'commented',
//       unreviewedCommented: 'informational',
//       emptyDetail: 'ignore',
//       emptyComment: 'ignore',
//       allowCustom: true
//     }

//     const fieldSettings = {
//       detail: {
//         enabled: 'findings', // not used
//         required: 'always'
//       },
//       comment: {
//         enabled: 'always', // not used
//         required: 'always'
//       }
//     }

//     const allowAccept = true

//     const filePath =
//       './WATCHER-test-files/WATCHER/ckl/ResultEngineWithEvalStigModule.ckl'

//     const review = await generateReviewObject(
//       filePath,
//       importOptions,
//       fieldSettings,
//       allowAccept
//     )

//     const expectedResultEngine = {
//       type: 'script',
//       product: 'Evaluate-STIG',
//       version: '1.2204.1',
//       time: '2022-06-03T12:19:27.9454169-04:00',
//       checkContent: {
//         location: 'Scan-Windows10_Checks'
//       }
//     }
//     expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
//       expectedResultEngine
//     )
//   })
//   it('Testing result engine ckl with an Eval STIG individual answer file override that is incorrect', async () => {
//     const importOptions = {
//       autoStatus: 'submitted',
//       unreviewed: 'commented',
//       unreviewedCommented: 'informational',
//       emptyDetail: 'ignore',
//       emptyComment: 'ignore',
//       allowCustom: true
//     }

//     const fieldSettings = {
//       detail: {
//         enabled: 'findings', // not used
//         required: 'always'
//       },
//       comment: {
//         enabled: 'always', // not used
//         required: 'always'
//       }
//     }

//     const allowAccept = true

//     const filePath =
//       './WATCHER-test-files/WATCHER/ckl/ResultEngineInvalidComment.ckl'

//     const review = await generateReviewObject(
//       filePath,
//       importOptions,
//       fieldSettings,
//       allowAccept
//     )

//     expect(review.checklists[0].reviews[0].resultEngine).to.be.null
//   })
//   it('Giving a ckl file with no ROOT "evaluate-stig" object', async () => {
//     // expected result is a null result engine
//     const importOptions = {
//       autoStatus: 'saved',
//       unreviewed: 'commented',
//       unreviewedCommented: 'informational',
//       emptyDetail: 'replace',
//       emptyComment: 'ignore',
//       allowCustom: true
//     }

//     const fieldSettings = {
//       detail: {
//         enabled: 'always',
//         required: 'always'
//       },
//       comment: {
//         enabled: 'findings',
//         required: 'findings'
//       }
//     }

//     const allowAccept = true

//     const filePath = './WATCHER-test-files/WATCHER/ckl/NoRootEvalStigModule.ckl'

//     const review = await generateReviewObject(
//       filePath,
//       importOptions,
//       fieldSettings,
//       allowAccept
//     )

//     expect(review.checklists[0].reviews[0].resultEngine).to.be.null
//   })
//   it('Valid CKL with two evaluate-stig objects in the stigs checklist and a root evaluate-stig object', async () => {
//     // expected result is two different result engines for each evaluate-stig object
//     const importOptions = {
//       autoStatus: 'saved',
//       unreviewed: 'commented',
//       unreviewedCommented: 'informational',
//       emptyDetail: 'replace',
//       emptyComment: 'ignore',
//       allowCustom: true
//     }

//     const fieldSettings = {
//       detail: {
//         enabled: 'always',
//         required: 'always'
//       },
//       comment: {
//         enabled: 'findings',
//         required: 'findings'
//       }
//     }

//     const allowAccept = true

//     const filePath =
//       './WATCHER-test-files/WATCHER/ckl/ResultEngineInIStigMultiple.ckl'

//     const review = await generateReviewObject(
//       filePath,
//       importOptions,
//       fieldSettings,
//       allowAccept
//     )

//     const expectedResultEngines = [
//       {
//         type: 'script',
//         product: 'Evaluate-STIG',
//         version: '1.2310.1',
//         time: '2026-12-11T12:56:14.3576272-05:00',
//         checkContent: {
//           location: 'Test1'
//         }
//       },
//       {
//         type: 'script',
//         product: 'Evaluate-STIG',
//         version: '1.2310.1',
//         time: '2023-12-11T12:56:14.3576272-05:00',
//         checkContent: {
//           location: 'Test2'
//         }
//       }
//     ]

//     expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
//       expectedResultEngines[0]
//     )
//     expect(review.checklists[1].reviews[0].resultEngine).to.deep.equal(
//       expectedResultEngines[1]
//     )
//   })
  it('Valid CKL with two checklists but only one evaluate-stig object in the stigs checklist and a root evaluate-stig object', async () => {
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
      './WATCHER-test-files/WATCHER/ckl/SingleResultEngineModule.ckl'

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
        time: '2026-12-11T12:56:14.3576272-05:00',
        checkContent: {
          location: 'Test1'
        }
      },
      {
        type: 'script',
        product: 'Evaluate-STIG',
        version: '1.2310.1',
        time: undefined,
        checkContent: {
          location: ''
        }
      }
    ]

    console.log(JSON.stringify(review.checklists[1].reviews[0].resultEngine, null, 2))
    // expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
    //   expectedResultEngines[0]
    // )
    expect(review.checklists[1].reviews[0].resultEngine).to.deep.equal(
      expectedResultEngines[1]
    )
  })
//   it('Valid CKL with only the root evaluate-stig object', async () => {
//     // expected result is two different result engines for each evaluate-stig object
//     const importOptions = {
//       autoStatus: 'saved',
//       unreviewed: 'commented',
//       unreviewedCommented: 'informational',
//       emptyDetail: 'replace',
//       emptyComment: 'ignore',
//       allowCustom: true
//     }

//     const fieldSettings = {
//       detail: {
//         enabled: 'always',
//         required: 'always'
//       },
//       comment: {
//         enabled: 'findings',
//         required: 'findings'
//       }
//     }

//     const allowAccept = true

//     const filePath = './WATCHER-test-files/WATCHER/ckl/OnlyRootResultEngine.ckl'

//     const review = await generateReviewObject(
//       filePath,
//       importOptions,
//       fieldSettings,
//       allowAccept
//     )

//     // const expectedResultEngine = {
//     //   type: 'script',
//     //   product: 'Evaluate-STIG',
//     //   version: '1.2310.1'
//     // }

//     // expect(review.checklists[0].reviews[0].resultEngine).to.deep.equal(
//     //   expectedResultEngine
//     // )
//   })
})
