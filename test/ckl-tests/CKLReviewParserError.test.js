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

describe('testing CKL XML element errors', () => {
  it('XML with no "CHECKLIST, should throw "No CHECKLIST element"', async () => {
   

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

    const filePath = './test-files/parsers/ckl/no-checklist-xml-element.ckl'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromCkl({
        data,
        importOptions,
        fieldSettings,
        allowAccept
      })
    ).to.throw('No CHECKLIST element')
  })
  it('XML with no "ASSET", should throw "No ASSET element"', async () => {
  

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

    const filePath = './test-files/parsers/ckl/No-Asset-xml-element.ckl'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromCkl({
        data,
        importOptions,
        fieldSettings,
        allowAccept
      })
    ).to.throw('No ASSET element')
  })
  it('XML with no "STIGS", should throw "No STIGS element"', async () => {
   

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

    const filePath = './test-files/parsers/ckl/no-Stigs-xml-element.ckl'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromCkl({
        data,
        importOptions,
        fieldSettings,
        allowAccept
      })
    ).to.throw('No STIGS element')
  })
  it('XML with no "host_name in ASSET", should throw "No host_name in ASSET"', async () => {
    
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

    const filePath = './test-files/parsers/ckl/no-Host_Name-xml-element.ckl'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromCkl({
        data,
        importOptions,
        fieldSettings,
        allowAccept
      })
    ).to.throw('No host_name in ASSET')
  })
  it('XML with no "SI_DATA for SID_NAME = stigId", should throw "STIG_INFO element has no SI_DATA for SID_NAME == stigId"', async () => {
   

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

    const filePath = './test-files/parsers/ckl/no-SID_DATA-element.ckl'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromCkl({
        data,
        importOptions,
        fieldSettings,
        allowAccept
      })
    ).to.throw('STIG_INFO element has no SI_DATA for SID_NAME == stigId')
  })
  it('XML with no "SI_DATA for SID_NAME = releaseinfo", should succeed', async () => {
   

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

    const filePath = './test-files/parsers/ckl/no-releaseinfo-SID_DATA-element.ckl'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromCkl({
        data,
        importOptions,
        fieldSettings,
        allowAccept
      })
    ).to.not.throw()
  })
})
