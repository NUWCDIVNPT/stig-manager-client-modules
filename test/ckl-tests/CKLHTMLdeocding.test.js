import chai from 'chai'
import { reviewsFromCkl, tagValueProcessor } from '../../ReviewParser.js'
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

describe('CKL html decoding tests', () => {
  it('Testing that the value processor functiion in ReviewParser.js can decode html elements correctly in a stig.', async () => {
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

    const filePath = './WATCHER-test-files/WATCHER/ckl/html-decode.ckl'

    const review = await generateReviewObject(
      filePath,
      importOptions,
      fieldSettings,
      allowAccept
    )

    console.log(JSON.stringify(review, null, 2))

    const hi =
      '&amp; &lt; &gt; &quot; &#039; &#x26; &#60; &amp; &lt; &gt; &quot; &#039;'

    // & < > " ' & < & < > " '

    // '& < > " \' & < & < > " \''

    //  '& < > " \' & < & < > " \' '

    const expectedDecodedString = '& < > " \' & < & < > " \''

    expect(tagValueProcessor(null, hi)).to.equal(expectedDecodedString)

    expect(review.checklists[0].reviews[0].detail).to.equal(
      expectedDecodedString
    )
  })
})

// Describe your test suite
describe('HTML Decoding', function () {
  // Test for basic HTML entities
  it('should decode ampersand entities', function () {
    expect(tagValueProcessor(null, '&amp;')).to.equal('&')
  })

  it('should decode less-than entities', function () {
    expect(tagValueProcessor(null, '&lt;')).to.equal('<')
  })

  it('should decode greater-than entities', function () {
    expect(tagValueProcessor(null, '&gt;')).to.equal('>')
  })

  it('should decode double-quote entities', function () {
    expect(tagValueProcessor(null, '&quot;')).to.equal('"')
  })

  it('should decode single-quote entities', function () {
    expect(tagValueProcessor(null, '&#039;')).to.equal("'")
  })

  // Test for hexadecimal character references
  it('should decode hexadecimal entities', function () {
    expect(tagValueProcessor(null, '&#x26;')).to.equal('&') // &#x26; is '&'
  })

  // Test for decimal character references
  it('should decode decimal entities', function () {
    expect(tagValueProcessor(null, '&#60;')).to.equal('<') // &#60; is '<'
  })

  // Test for handling non-entity strings (no changes expected)
  it('should not alter non-entity strings', function () {
    expect(tagValueProcessor(null, 'Hello, world!')).to.equal('Hello, world!')
  })

  // Test for mixed content
  it('should correctly decode string with mixed content', function () {
    expect(
      tagValueProcessor(
        null,
        'Hello &amp; welcome to the &lt;b&gt;Jungle&lt;/b&gt;!'
      )
    ).to.equal('Hello & welcome to the <b>Jungle</b>!')
  })

  // Add more tests as needed for other entities or edge cases
})
