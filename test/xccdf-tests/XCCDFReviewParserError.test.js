import chai from 'chai';
import { reviewsFromXccdf } from '../../ReviewParser.js'; 
import fs from 'fs/promises';

const expect = chai.expect
const dataArray = [
  {
    scapBenchmarkId: 'CAN_Ubuntu_18-04_STIG',
    benchmarkId: 'U_CAN_Ubuntu_18-04_STIG'
  },
  { scapBenchmarkId: 'Mozilla_Firefox_RHEL', benchmarkId: 'Mozilla_Firefox' },
  {
    scapBenchmarkId: 'Mozilla_Firefox_Windows',
    benchmarkId: 'Mozilla_Firefox'
  },
  { scapBenchmarkId: 'MOZ_Firefox_Linux', benchmarkId: 'MOZ_Firefox_STIG' },
  { scapBenchmarkId: 'MOZ_Firefox_Windows', benchmarkId: 'MOZ_Firefox_STIG' },
  { scapBenchmarkId: 'Solaris_10_X86_STIG', benchmarkId: 'Solaris_10_X86' }
]

const scapBenchmarkMap = new Map(
  dataArray.map(item => [item.scapBenchmarkId, item])
)

describe('Testing handled errors in reviewsFromXccdf()', () => {
  it('should throw an error if there is no BenchMark xml element.', async () => {
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

    const filePath = './test-files/parsers/xccdf/NoBenchMarkElement.xml'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromXccdf({
        data,
        fieldSettings,
        allowAccept,
        importOptions,
        scapBenchmarkMap
      })
    ).to.throw('No Benchmark or TestResult element')
  })

  it('should throw an error if there is no TestResult xml element.', async () => {
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

    const filePath = './test-files/parsers/xccdf/NoTestResult-xccdf.xml'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromXccdf({
        data,
        fieldSettings,
        allowAccept,
        importOptions,
        scapBenchmarkMap
      })
    ).to.throw('No Benchmark.TestResult element')
  })
  it('should throw an error if there is no Target xml element.', async () => {
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

    const filePath = './test-files/parsers/xccdf/NoTargetElement-xccdf.xml'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromXccdf({
        data,
        fieldSettings,
        allowAccept,
        importOptions,
        scapBenchmarkMap
      })
    ).to.throw('No Benchmark.TestResult.target element')
  })
  it('should throw an error if there is no Rule Result xml element.', async () => {
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

    const filePath = './test-files/parsers/xccdf/NoRuleResultElement-xccdf..xml'

    const data = await fs.readFile(filePath, 'utf8')

    expect(() =>
      reviewsFromXccdf({
        data,
        fieldSettings,
        allowAccept,
        importOptions,
        scapBenchmarkMap
      })
    ).to.throw('No Benchmark.TestResult.rule-result element')
  })
})
