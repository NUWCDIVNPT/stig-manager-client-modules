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

describe('Testing that the Target object returned by the cklb review parser is accurate', () => {
  it('Testing a target asset with with a cklbRole and normal data', async () => {
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

    const filePath = './WATCHER-test-files/WATCHER/cklb/TargetObjectBasic.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedTarget = {
      name: 'Asset',
      description: 'xyz',
      ip: '1.1.1.1',
      fqdn: 'asset.com',
      mac: '00:00:00:00:00:00',
      noncomputing: true,
      metadata: {}
    }

    expect(review.target).to.deep.equal(expectedTarget)
  })

  it('testing a target asset with the minimum amount of fields', async () => {
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

    const filePath =
      './WATCHER-test-files/WATCHER/cklb/TargetObjectMinimal.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    const expectedTarget = {
      name: 'Asset',
      description: null,
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: false,
      metadata: {}
    }

    expect(review.target).to.deep.equal(expectedTarget)
  })

  it('testing a target asset with a complete set of metadata.', async () => {
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

    const filePath =
      './WATCHER-test-files/WATCHER/cklb/TargetObjectMetaData.cklb'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )
    const expectedTarget = {
      name: 'Asset',
      description: 'xyz',
      ip: null,
      fqdn: null,
      mac: null,
      noncomputing: false,
      metadata: {
        cklHostName: 'Asset',
        cklRole: 'TestRole',
        cklTechArea: 'TestTechArea',
        cklWebDbInstance: 'TestWebDBInstance',
        cklWebDbSite: 'TestWebDBSite',
        cklWebOrDatabase: 'true'
      }
    }
    expect(review.target).to.deep.equal(expectedTarget)
  })
})
