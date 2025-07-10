import chai from 'chai'
import { reviewsFromCklb } from '../../ReviewParser.js';
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
    importOptions,
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


describe('Ensure that review parser reviewsFromCKLB correct returns classification data.', () => {
 
    it("Should return a review with no classification data when no classification is present", async () => {
        const filePath = './test-files/parsers/cklb/NoClassifications.cklb'
        const review = await generateReviewObject(
          filePath,
          importOptions,
          fieldSettings,
          allowAccept
        )
        expect(review.target).to.have.property('classification').that.is.equal("")
        expect(review.checklists[0].reviews[0].commentClassification).to.be.equal("")
        expect(review.checklists[0].reviews[0].detailClassification).to.be.equal("")
    })

    it("should return a review with classification data when classification is present in target (CUI) but no result classifications.", async () => {
        const filePath = './test-files/parsers/cklb/TargetClassification.cklb'
        const review = await generateReviewObject(
          filePath,
          importOptions,
          fieldSettings,
          allowAccept
        )
        expect(review.target).to.have.property('classification').that.is.equal("CUI")
        expect(review.checklists[0].reviews[0].commentClassification).to.be.equal("")
        expect(review.checklists[0].reviews[0].detailClassification).to.be.equal("")
    })

    it("should return a review with classification data only in comment and detail (comment CUI, detail FOUO, target empty)", async () => {

        const filePath = './test-files/parsers/cklb/CommentAndDetailClassifications.cklb'
        const review = await generateReviewObject(
          filePath,
          importOptions,
          fieldSettings,
          allowAccept
        )
        expect(review.target).to.have.property('classification').that.is.equal("")
        expect(review.checklists[0].reviews[0].commentClassification).to.be.equal("CUI")
        expect(review.checklists[0].reviews[0].detailClassification).to.be.equal("FOUO")
    })

    it("should return a classification in both target and result (comment CUI, detail FOUO, target TEST)", async () => {
        const filePath = './test-files/parsers/cklb/AllClassifications.cklb'
        const review = await generateReviewObject(
          filePath,
          importOptions,
          fieldSettings,
          allowAccept
        )
        expect(review.target).to.have.property('classification').that.is.equal("TEST")
        expect(review.checklists[0].reviews[0].commentClassification).to.be.equal("CUI")
        expect(review.checklists[0].reviews[0].detailClassification).to.be.equal("FOUO")
    })

})

describe('Ensure that review parser reviewsFromCKLB correct returns classification data with different values of importOptions.emptycomment/emptyDetail.', () => {

    it("should return a review with null comment and detail when importOptions.emptyComment/emptyDetail is set to ignore and there is no comments or details", async () => {

       const importOptionsEmptyCommentDetail = {
        autoStatus: {
            fail: 'saved',
            notapplicable: 'saved',
            pass: 'saved'
        },
        unreviewed: 'always',
        unreviewedCommented: 'always',
        emptyDetail: 'ignore',
        emptyComment: 'ignore',
        allowCustom: true
    }


      const filePath = './test-files/parsers/cklb/NoCommentNoDetailWithClassification.cklb'
      const review = await generateReviewObject(
        filePath,
        importOptionsEmptyCommentDetail,
        fieldSettings,
        allowAccept
      )
      expect(review.target).to.have.property('classification').that.is.equal("TEST")
      expect(review.checklists[0].reviews[0].commentClassification).to.be.equal(null)
      expect(review.checklists[0].reviews[0].detailClassification).to.be.equal(null)

    })

    it("should return empty strings for comment and detail when importOptions.emptyComment/emptyDetail is set to 'replace' and there is no comments or details", async () => {
      const importOptionsEmptyCommentDetail = {
        autoStatus: {
            fail: 'saved',
            notapplicable: 'saved',
            pass: 'saved'
        },
        unreviewed: 'always',
        unreviewedCommented: 'always',
        emptyDetail: 'replace',
        emptyComment: 'replace',
        allowCustom: true
      }

      const filePath = './test-files/parsers/cklb/NoCommentNoDetailWithClassification.cklb'
      const review = await generateReviewObject(
        filePath,
        importOptionsEmptyCommentDetail,
        fieldSettings,
        allowAccept
      )
      expect(review.target).to.have.property('classification').that.is.equal("TEST")
      expect(review.checklists[0].reviews[0].commentClassification).to.be.equal("")
      expect(review.checklists[0].reviews[0].detailClassification).to.be.equal("")
    })

})

