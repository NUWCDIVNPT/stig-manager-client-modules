import chai from 'chai';
import { reviewsFromCkl } from '../../ReviewParser.js'; 
import fs from 'fs/promises';

const expect = chai.expect;


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


describe('CKL Checklist array testing for correct benchmarkId and revisionStr', () => {
  it("testing that 'checklist' xml elements benchmarkId and revisionStr are parsed", async () => {
    // TEST: ensure that the checklist array is populated with the correct benchmarkId and revisionStr
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

    const filePath =
      './test-files/parsers/ckl/Asset_a-VPN_TRUNCATED-V2R5.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    // console.log(JSON.stringify(review, null, 2))

    expect(review.checklists).to.be.an('array')
    expect(review.checklists.length).to.equal(1)
    expect(review.checklists[0].benchmarkId).to.equal('VPN_TRUNCATED')
    expect(review.checklists[0].revisionStr).to.equal('V2R5')
  })

  it('A multi-stig Checklist array testing for correct benchmarkId and revisionStr', async () => {
    // TEST: ensure that the checklist array is populated with the correct benchmarkId and revisionStr
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

    const filePath = './test-files/parsers/ckl/Asset_b-multi-stig.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedChecklists = [
      {
        benchmarkId: 'RHEL_8_TRUNCATED',
        revisionStr: 'V1R12'
      },
      {
        benchmarkId: 'RHEL_9_TRUNCATED',
        revisionStr: 'V1R1'
      },
      {
        benchmarkId: 'VPN_TRUNCATED',
        revisionStr: 'V2R5'
      }
    ]

    expect(review.checklists).to.be.an('array')
    expect(review.checklists.length).to.equal(expectedChecklists.length)

    for (const [index, expected] of expectedChecklists.entries()) {
      expect(review.checklists[index].benchmarkId).to.equal(
        expected.benchmarkId
      )
      expect(review.checklists[index].revisionStr).to.equal(
        expected.revisionStr
      )
    }
  })
  it('Validating that parser truncates checklist values to their max oas spec', async () => {
    // values tested: checklist[i].benchmarkId
    const importOptions = {
      autoStatus: {
        fail: 'saved',
        notapplicable: 'saved',
        pass: 'saved'
      },
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
      './test-files/parsers/ckl/Target-Object-Long-Properties'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    
    expect(review.checklists[0].benchmarkId).to.have.lengthOf(255)

    
  })
})
