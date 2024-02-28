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

describe('CKLB StigViewer 3.2 ruleID ', () => {
  it('Should Append _rule to the files ruleId', async () => {

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

    const filePath = './WATCHER-test-files/WATCHER/cklb/no-suffix_rule.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    expect(review.checklists[0].reviews[0].ruleId).to.equal('SV-219147r802349_rule')
  })
  it('Should not Append _rule to the files ruleId because it already has it.', async () => {

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

    const filePath = './WATCHER-test-files/WATCHER/cklb/has_suffix_rule.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    expect(review.checklists[0].reviews[0].ruleId).to.equal('SV-219147r802349_rule')
  })
  it('Should return no review due to not containing a Rule_ID', async () => {
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/no-Rule_ID.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )    
    expect(review.checklists[0].reviews[0]).to.not.exist
  })
  it('Should use the rule_id property. rule_id_src does not exit', async () => {
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'always',
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/no-rule_id_src.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )    
    expect(review.checklists[0].reviews[0].ruleId).to.equal('SV-219147r802349_rule')
  })
  it('Should use the rule_id_src property. rule_id does not exit', async () => {
    const importOptions = {
      autoStatus: 'submitted',
      unreviewed: 'always',
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/no-rule_id_src.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )    
    expect(review.checklists[0].reviews[0].ruleId).to.equal('SV-219147r802349_rule')
  })
})
