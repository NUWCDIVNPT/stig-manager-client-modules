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

describe('CKL StigViewer 3.2 ruleID ', () => {
  it('Should Append _rule to the files ruleId', async () => {
    const importOptions = {
      autoStatus: {
        fail: 'submitted',
        notapplicable: 'submitted',
        pass: 'submitted'
      },
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

    const filePath = './test-files/parsers/ckl/no-suffix_rule.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    
    expect(review.checklists[0].reviews[0].ruleId).to.equal('SV-219147r802349_rule')
  })
  it('Should not append _rule because file already contains stigDatum.ATTRIBUTE_DATA + _rule', async () => {
    const importOptions = {
      autoStatus: {
        fail: 'submitted',
        notapplicable: 'submitted',
        pass: 'submitted'
      },
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

    const filePath = './test-files/parsers/ckl/has-suffix_rule.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    
    expect(review.checklists[0].reviews[0].ruleId).to.equal('SV-219147r802349_rule')
  })
  it('Should return no review due to not containing a VULN_ATTRIBUTE = Rule_ID', async () => {
    const importOptions = {
      autoStatus: {
        fail: 'submitted',
        notapplicable: 'submitted',
        pass: 'submitted'
      },
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

    const filePath = './test-files/parsers/ckl/vuln_attribute-no-Rule_ID.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )    
    expect(review.checklists[0].reviews[0]).to.not.exist
  })
  it('Should return no review due to not containing a ATTRIBUTE_DATA for a RULE_ID', async () => {
    const importOptions = {
      autoStatus: {
        fail: 'submitted',
        notapplicable: 'submitted',
        pass: 'submitted'
      },
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

    const filePath = './test-files/parsers/ckl/vuln_attribute-no-Attribute_data.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )    
    expect(review.checklists[0].reviews[0]).to.not.exist
  })
})
