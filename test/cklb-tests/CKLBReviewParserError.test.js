import chai from 'chai';
import { reviewsFromCklb } from '../../ReviewParser.js';  
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
  return reviewsFromCklb({
    data,
    importOptions,
    fieldSettings,
    allowAccept,
   
  })
}


describe('testing cklb errors', () => {
  it('Giving the parser "bad" json', async () => {
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

    const data = 'This is not JSON!';

    expect(() =>
      reviewsFromCklb({
        data,
        importOptions,
        fieldSettings,
        allowAccept,
        
      })
    ).to.throw('Cannot parse as JSON')
  })
  it('Giving the parser json with no host name ', async () => {
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

    const data = await fs.readFile('test-files/parsers/cklb/NoTargetHostName.cklb', 'utf8')

    expect(() =>
      reviewsFromCklb({
        data,
        importOptions,
        fieldSettings,
        allowAccept,
      })
    ).to.throw('Invalid CKLB object: No target_data.host_name found')
  })
  it('Giving the parser json with no stigs array ', async () => {
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

    const data = await fs.readFile('test-files/parsers/cklb/NoStigsArray.cklb', 'utf8')

    expect(() =>
      reviewsFromCklb({
        data,
        importOptions,
        fieldSettings,
        allowAccept,
      })
    ).to.throw('No stigs array found')
  })
 
 
})
