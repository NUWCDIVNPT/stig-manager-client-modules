import {XMLParser} from './fxp.esm.js'
import decode from './decode.js'

const decodeHTML = function () {
  return decode(arguments[1])
}

const truncateString = function (str, max) {
  if (typeof str !== 'string') {
    return str
  }
  return str.length > max ? str.slice(0, max) : str
}

const maxCommentLength = 32767
/**
 * Parses data from a CKL format into a format suitable for further processing.
 * 
 * @param {ParserParams} ReviewsFromCklParams - The parameters object containing:
 * @param {string} ReviewsFromCklParams.data - The CKL data to be processed.
 * @param {FieldSettings} ReviewsFromCklParams.fieldSettings - Settings related to detail and comment fields.
 * @param {boolean} ReviewsFromCklParams.allowAccept - Flag indicating whether accepting a review is allowed.
 * @param {ImportOptions} ReviewsFromCklParams.importOptions - Options for handling import behavior.
 * @param {*} ReviewsFromCklParams.sourceRef - A reference to the source of the CKL data.
 * 
 * @returns {ParseResult} An object containing parsed ckl data
 * 
 * @throws {Error} 
 */
export function reviewsFromCkl(
  {
    data,
    fieldSettings,
    allowAccept,
    importOptions,
    sourceRef
  }) {

  const errorMessages = []

  const normalizeKeys = function (input) {
    // lowercase and remove hyphens
    if (typeof input !== 'object') return input;
    if (Array.isArray(input)) return input.map(normalizeKeys);
    return Object.keys(input).reduce(function (newObj, key) {
      let val = input[key];
      let newVal = (typeof val === 'object') && val !== null ? normalizeKeys(val) : val;
      newObj[key.toLowerCase().replace('-', '')] = newVal;
      return newObj;
    }, {});
  }

  const resultMap = {
    NotAFinding: 'pass',
    Open: 'fail',
    Not_Applicable: 'notapplicable',
    Not_Reviewed: 'notchecked'
  }
  const parseOptions = {
    allowBooleanAttributes: false,
    attributeNamePrefix: "",
    cdataPropName: "__cdata", //default is 'false'
    ignoreAttributes: false,
    parseTagValue: false,
    parseAttributeValue: false,
    removeNSPrefix: true,
    trimValues: true,
    tagValueProcessor: decodeHTML,
    commentPropName: "__comment",
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      return name === '__comment' || !isLeafNode
    }
  }
  const parser = new XMLParser(parseOptions)
  const parsed = parser.parse(data)

  if (!parsed.CHECKLIST) throw (new Error("No CHECKLIST element"))
  if (!parsed.CHECKLIST[0].ASSET) throw (new Error("No ASSET element"))
  if (!parsed.CHECKLIST[0].STIGS) throw (new Error("No STIGS element"))

  const comments = parsed['__comment']
  // extract the root ES comment 
  const resultEngineCommon = comments?.length ? processRootXmlComments(comments) : null

  let returnObj = {
    sourceRef
  }
  returnObj.target = processAsset(parsed.CHECKLIST[0].ASSET[0])
  if (!returnObj.target.name) {
    throw (new Error("No host_name in ASSET"))
  }
  if (returnObj.target.name.length > 255) {
    throw (new Error("Asset hostname cannot be more than 255 characters", returnObj.target.name))
  }
  returnObj.checklists = processIStig(parsed.CHECKLIST[0].STIGS[0].iSTIG)
  if (returnObj.checklists.length === 0) {
    throw (new Error("STIG_INFO element has no SI_DATA for SID_NAME == stigId"))
  }
  returnObj.errors = errorMessages
  
  return (returnObj)

  function processAsset(assetElement) {
    let obj = {
      name: assetElement.HOST_NAME,
      description: null,
      ip: assetElement?.HOST_IP ? truncateString(assetElement.HOST_IP, 255) : null,
      fqdn: assetElement.HOST_FQDN ? truncateString(assetElement.HOST_FQDN, 255) : null,
      mac: assetElement.HOST_MAC ? truncateString(assetElement.HOST_MAC, 255) : null,
      noncomputing: assetElement.ASSET_TYPE === 'Non-Computing'
    }
    const metadata = {}
    if (assetElement.ROLE) {
      metadata.cklRole = assetElement.ROLE
    }
    if (assetElement.TECH_AREA) {
      metadata.cklTechArea = assetElement.TECH_AREA
    }
    if (assetElement.WEB_OR_DATABASE === 'true') {
      metadata.cklWebOrDatabase = 'true'
      metadata.cklHostName = assetElement.HOST_NAME
      if (assetElement.WEB_DB_SITE) {
        metadata.cklWebDbSite = assetElement.WEB_DB_SITE
      }
      if (assetElement.WEB_DB_INSTANCE) {
        metadata.cklWebDbInstance = assetElement.WEB_DB_INSTANCE
      }
    }
    obj.metadata = metadata
    return obj
  }

  function processIStig(iStigElement) {
    let checklistArray = []
    iStigElement.forEach(iStig => {
      let checklist = { sourceRef }
      // get benchmarkId
      let stigIdElement = iStig.STIG_INFO[0].SI_DATA.filter(d => d.SID_NAME === 'stigid')?.[0]
      checklist.benchmarkId = stigIdElement.SID_DATA.replace('xccdf_mil.disa.stig_benchmark_', '')
      checklist.benchmarkId = truncateString(checklist.benchmarkId, 255)
      // get revision data. Extract digits from version and release fields to create revisionStr, if possible.
      const stigVersionData = iStig.STIG_INFO[0].SI_DATA.filter(d => d.SID_NAME === 'version')?.[0].SID_DATA
      let stigVersion = stigVersionData?.match(/(\d+)/)?.[1]
      let stigReleaseInfo = iStig.STIG_INFO[0].SI_DATA.filter(d => d.SID_NAME === 'releaseinfo')?.[0].SID_DATA
      const stigRelease = stigReleaseInfo?.match(/Release:\s*(.+?)\s/)?.[1]
      const stigRevisionStr = stigVersion && stigRelease ? `V${stigVersion}R${stigRelease}` : null
      checklist.revisionStr = stigRevisionStr
      
      if (checklist.benchmarkId) {
        let x = processVuln(iStig.VULN, iStig.__comment)
        checklist.reviews = x.reviews
        checklist.stats = x.stats
        checklistArray.push(checklist)
      }
    })
    return checklistArray
  }

  function processVuln(vulnElements,iStigComment) {
    // vulnElements is an array of this object:
    // {
    //     COMMENTS
    //     FINDING_DETAILS
    //     SEVERITY_JUSTIFICATION
    //     SEVERITY_OVERRIDE
    //     STATUS
    //     STIG_DATA [26]
    // }

    let vulnArray = []
    let resultStats = {
      pass: 0,
      fail: 0,
      notapplicable: 0,
      notchecked: 0,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }
    vulnElements?.forEach(vuln => {
      const review = generateReview(vuln, iStigComment)
      if (review) {
        vulnArray.push(review)
        resultStats[review.result]++
      }
    })

    return {
      reviews: vulnArray,
      stats: resultStats
    }
  }

  function generateReview(vuln, iStigComment) {
    let result = resultMap[vuln.STATUS]
    if (!result) return
    let ruleId = getRuleIdFromVuln(vuln)
    ruleId = truncateString(ruleId, 45)
    if (!ruleId) return

    const hasComments = !!vuln.FINDING_DETAILS || !!vuln.COMMENTS

    if (result === 'notchecked') { // unreviewed business rules
      switch (importOptions.unreviewed) {
        case 'never':
          return undefined
        case 'commented':
          result = hasComments ? importOptions.unreviewedCommented : undefined
          if (!result) return
          break
        case 'always':
          result = hasComments ? importOptions.unreviewedCommented : 'notchecked'
          break
      }
    }

    let detail = vuln.FINDING_DETAILS.length > maxCommentLength ? truncateString(vuln.FINDING_DETAILS, maxCommentLength) : vuln.FINDING_DETAILS
    if (!vuln.FINDING_DETAILS) {
      switch (importOptions.emptyDetail) {
        case 'ignore':
          detail = null
          break
        case 'import':
          detail = vuln.FINDING_DETAILS
          break
        case 'replace':
          detail = 'There is no detail provided for the assessment'
          break
      }
    }

    let comment = vuln.COMMENTS.length > maxCommentLength ? truncateString(vuln.COMMENTS, maxCommentLength) : vuln.COMMENTS
    if (!vuln.COMMENTS) {
      switch (importOptions.emptyComment) {
        case 'ignore':
          comment = null
          break
        case 'import':
          comment = vuln.COMMENTS
          break
        case 'replace':
          comment = 'There is no comment provided for the assessment'
          break
      }
    }

    const review = {
      ruleId,
      result,
      detail,
      comment
    }

    // if the current checklist contrains a comment from ES, process it and add it to the review
    const iStigCommentProcessed = processIstigXmlComments(iStigComment)

    if (resultEngineCommon) {
      // combining the root ES comment and the checklist ES comment
      review.resultEngine = { ...resultEngineCommon, ...iStigCommentProcessed }
      if (vuln['__comment']) {
        const overrides = []
        for (const comment of vuln['__comment']) {
          if (comment.toString().startsWith('<Evaluate-STIG>')) {
            let override
            try {
              override = parser.parse(comment)['Evaluate-STIG'][0]
            }
            catch (e) {
              errorMessages.push(`Failed to parse Evaluate-STIG VULN XML comment for ${ruleId}, comment: ${comment}`)
            }
            override = normalizeKeys(override)
            if (override.afmod?.toLowerCase() === 'true') {
              overrides.push({
                authority: truncateString(override?.answerfile, 255),  
                oldResult: resultMap[override.oldstatus] ?? 'unknown',
                newResult: result,
                remark: 'Evaluate-STIG Answer File'
              })
            }
          }
        }
        if (overrides.length) {
          review.resultEngine.overrides = overrides
        }
      }
    }
    else {
      review.resultEngine = null
    }

    const status = bestStatusForReview(review, importOptions, fieldSettings, allowAccept)
    if (status) {
      review.status = status
    }

    return review
  }

  function getRuleIdFromVuln(vuln) {
    let ruleId
    vuln.STIG_DATA.some(stigDatum => {
      if (stigDatum.VULN_ATTRIBUTE == "Rule_ID") {
        ruleId = stigDatum.ATTRIBUTE_DATA
        return true
      }
    })
    return ruleId
  }

// process the Evaluate-STIG XML coments for each "Checklist" (iSTIG)
  function processIstigXmlComments(iStigComment) {

    if(!iStigComment) return null

    let resultEngineIStig
    for (const comment of iStigComment) {

      if (comment.toString().startsWith('<Evaluate-STIG>')) {
        let esIStigComment
        try {
          esIStigComment = parser.parse(comment)['Evaluate-STIG'][0]
        }
        catch (e) {
          errorMessages.push(`Failed to parse Evaluate-STIG ISTIG XML comment  ${comment}`)         
        }
        esIStigComment = normalizeKeys(esIStigComment)
        resultEngineIStig = {
          time: esIStigComment?.time,
          checkContent: {
            location: (esIStigComment?.module?.[0]?.name ?? '') + 
                      ((esIStigComment?.module?.[0]?.name && esIStigComment?.module?.[0]?.version) ? ':' : '') + 
                      (esIStigComment?.module?.[0]?.version ?? '')  
          }
        }
      }
    }
    return resultEngineIStig || null
  }

  // process the Evaluate-STIG ROOT XML comments
  function processRootXmlComments(comments) {
    let resultEngineRoot
    for (const comment of comments) {
      if (comment.toString().startsWith('<Evaluate-STIG>')) {
        let esRootComment
        try {
          esRootComment = parser.parse(comment)['Evaluate-STIG'][0]
        }
        catch (e) {
          errorMessages.push(`Failed to parse Evaluate-STIG root XML comment for ${comment}`)
        }
        esRootComment = normalizeKeys(esRootComment)
        const version = esRootComment?.global?.[0]?.version || esRootComment?.version
        resultEngineRoot = {
          type: 'script',
          product: 'Evaluate-STIG',
          version: truncateString(version, 255),
          time: esRootComment?.global?.[0]?.time,
          checkContent: {
            location: (esRootComment?.module?.[0]?.name ?? '') + 
                      ((esRootComment?.module?.[0]?.name && esRootComment?.module?.[0]?.version) ? ':' : '') + 
                      (esRootComment?.module?.[0]?.version ?? '') 

          }
        }
      }  
    }
    return resultEngineRoot || null
  }
}

/**
 * Parses data from a XCCDF format into a format suitable for further processing.
 * 
 * @param {ParserXccdfParams} ReviewsFromXccdfParams - The parameters object containing:
 * @param {string} ReviewsFromXccdfParams.data - The xccdf data to be processed.
 * @param {FieldSettings} ReviewsFromXccdfParams.fieldSettings - Settings related to detail and comment fields.
 * @param {boolean} ReviewsFromXccdfParams.allowAccept - Flag indicating whether accepting a review is allowed.
 * @param {ImportOptions} ReviewsFromXccdfParams.importOptions - Options for handling import behavior.
 * @param {ScapBenchmarkMap} ReviewsFromXccdfParams.scapBenchmarkMap - A map of SCAP benchmark IDs to their corresponding STIG IDs.
 * @param {*} ReviewsFromXccdfParams.sourceRef - A reference to the source of the xccdf data.
 * 
 * @returns {ParseResult} An object containing parsed xccdf data
 * 
 * @throws {Error} 
 */
export function reviewsFromXccdf(
  {
    data,
    fieldSettings,
    allowAccept,
    importOptions,
    scapBenchmarkMap,
    sourceRef
  }) {

    
  // Parse the XML
  const parseOptions = {
    allowBooleanAttributes: false,
    attributeNamePrefix: "",
    cdataPropName: "__cdata", //default is 'false'
    ignoreAttributes: false,
    parseTagValue: false,
    removeNSPrefix: true,
    trimValues: true,
    tagValueProcessor: decodeHTML,
    commentPropName: "__comment",
    isArray: (name, jpath, isLeafNode, isAttribute) => {
      const arrayElements = [
        'override',
        'overrides',
        'target',
        'target-address',
        'fact',
        'rule-result'
      ]
      return arrayElements.includes(name)
    }
  }
  const parser = new XMLParser(parseOptions)
  let parsed = parser.parse(data)

  // Basic sanity checks, handle <TestResult> root element with <benchmark> child
  let benchmarkId, testResult
  if (!parsed.Benchmark && !parsed.TestResult) throw (new Error("No Benchmark or TestResult element"))
  if (parsed.Benchmark) {
    if (!parsed.Benchmark.TestResult) throw (new Error("No Benchmark.TestResult element"))
    if (!parsed.Benchmark.TestResult['target']) throw (new Error("No Benchmark.TestResult.target element"))
    if (!parsed.Benchmark.TestResult['rule-result']) throw (new Error("No Benchmark.TestResult.rule-result element"))
    testResult = parsed.Benchmark.TestResult
    benchmarkId = parsed.Benchmark.id.replace('xccdf_mil.disa.stig_benchmark_', '')
  }
  else {
    if (!parsed.TestResult['benchmark']) throw (new Error("No TestResult.benchmark element"))
    if (!parsed.TestResult['target']) throw (new Error("No TestResult.target element"))
    if (!parsed.TestResult['rule-result']) throw (new Error("No TestResult.rule-result element"))
    testResult = parsed.TestResult
    let benchmarkAttr
    if (testResult.benchmark.id?.startsWith('xccdf_mil.disa.stig_benchmark_')) {
      benchmarkAttr = testResult.benchmark.id
    }
    else if (testResult.benchmark.href?.startsWith('xccdf_mil.disa.stig_benchmark_')) {
      benchmarkAttr = testResult.benchmark.href
    }
    else {
      throw (new Error("TestResult.benchmark has no attribute starting with xccdf_mil.disa.stig_benchmark_"))
    }
    benchmarkId = benchmarkAttr.replace('xccdf_mil.disa.stig_benchmark_', '')
  }
  let DEFAULT_RESULT_TIME = testResult['end-time'] //required by XCCDF 1.2 rev 4 spec

  // Process parsed data
  if (scapBenchmarkMap?.has(benchmarkId)) {
    benchmarkId = scapBenchmarkMap.get(benchmarkId)
  }
  benchmarkId = truncateString(benchmarkId, 255)
  const target = processTarget(testResult)
  if (!target.name) {
    throw (new Error('No value for <target>'))
  }
  if(target.name.length > 255){
    throw (new Error('Asset hostname cannot be more than 255 characters', target.name))
  }
  if(target.fqdn){
    target.fqdn = truncateString(target.fqdn, 255) 
  }
  if(target.mac){
    target.mac = truncateString(target.mac, 255)
  }
  if(target.ip){
    target.ip = truncateString(target.ip, 255)
  }
  if(target.description){
    target.description = truncateString(target.description, 255)
  }
  
  // resultEngine info
  const testSystem = testResult['test-system']
  // SCC injects a CPE WFN bound to a URN
  const m = testSystem.match(/^cpe:(?:\/|2\.3:)[aho]:(.*)/i)
  let product, version
  if (m?.[1]) {
    ;[, product, version] = m[1].split(':')
  }
  else {
    ;[product, version] = testSystem.split(':') // e.g. PAAuditEngine:6.5.3
  }
  const resultEngineTpl = {
    type: 'scap',
    product,
    version
  }
  
  resultEngineTpl.version = truncateString(resultEngineTpl.version, 255)
  resultEngineTpl.product = truncateString(resultEngineTpl.product, 255)

  const r = processRuleResults(testResult['rule-result'], resultEngineTpl)

  // Return object
  return ({
    target,
    checklists: [{
      benchmarkId: benchmarkId,
      revisionStr: null,
      reviews: r.reviews,
      stats: r.stats,
      sourceRef
    }],
    sourceRef
  })

  function processRuleResults(ruleResults, resultEngineTpl) {
    const stats = {
      pass: 0,
      fail: 0,
      notapplicable: 0,
      notchecked: 0,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }
    const reviews = []
    for (const ruleResult of ruleResults) {
      const review = generateReview(ruleResult, resultEngineTpl)
      if (review) {
        reviews.push(review)
        stats[review.result]++
      }
    }
    return { reviews, stats }
  }

  function generateReview(ruleResult, resultEngineCommon) {
    let result = ruleResult.result
    if (!result) return
    let ruleId = ruleResult.idref.replace('xccdf_mil.disa.stig_rule_', '')
    ruleId = truncateString(ruleId, 45)
    if (!ruleId) return

    const hasComments = false // or look for <remark>

    if (result !== 'pass' && result !== 'fail' && result !== 'notapplicable') { // unreviewed business rules
      switch (importOptions.unreviewed) {
        case 'never':
          return undefined
        case 'commented':
          result = hasComments ? importOptions.unreviewedCommented : undefined
          if (!result) return
          break
        case 'always':
          result = hasComments ? importOptions.unreviewedCommented : 'notchecked'
          break
      }
    }

    let resultEngine
    if (resultEngineCommon) {
      if (resultEngineCommon.product === 'stig-manager' || resultEngineCommon.product === 'evaluate-stig') {
        resultEngine = ruleResult.check?.['check-content']?.resultEngine
      }
      else {
        // build the resultEngine value
        const timeStr = ruleResult.time ?? DEFAULT_RESULT_TIME
        resultEngine = {
          time: (timeStr ? new Date(timeStr) : new Date()).toISOString(),
          ...resultEngineCommon
        }
        // handle check-content-ref, if it exists
        const checkContentHref = ruleResult?.check?.['check-content-ref']?.href?.replace('#scap_mil.disa.stig_comp_', '')
        const checkContentName = ruleResult?.check?.['check-content-ref']?.name?.replace('oval:mil.disa.stig.', '')
        if (checkContentHref || checkContentName) {
          resultEngine.checkContent = {
            location: checkContentHref,
            component: truncateString(checkContentName, 255)
          }
        }

        if (ruleResult.override?.length) { //overrides
          const overrides = []
          for (const override of ruleResult.override) {
            overrides.push({
              authority: truncateString(override?.authority,255),
              oldResult: override['old-result'],
              newResult: override['new-result'],
              remark: truncateString(override['remark'],255)
            })
          }
          if (overrides.length) {
            resultEngine.overrides = overrides
          }
        }
      }
    }

    const replacementText = `Result was reported by product "${resultEngine?.product}" version ${resultEngine?.version} at ${resultEngine?.time} using check content "${resultEngine?.checkContent?.location}"`

    let detail = ruleResult.check?.['check-content']?.detail
    if (!detail && ruleResult?.message?.['#text']) {
      detail = ruleResult.message['#text']
    }
    if (!detail) {
      switch (importOptions.emptyDetail) {
        case 'ignore':
          detail = null
          break
        case 'import':
          detail = ''
          break
        case 'replace':
          detail = replacementText
          break
      }
    }

    let comment = ruleResult.check?.['check-content']?.comment
    // if no explicit ruleResult comment provided (ie. not stigman-generated xccdf), use override remark as comment (Eval-STIG style xccdf)
    if (!comment) {
      comment = ruleResult.check?.['check-content']?.resultEngine?.overrides?.[0]?.remark 
      //for STIG Viewer compatibility, Eval-STIG concatenates the override remark into detail. Remove it from detail, if override remark is present
      if (detail && comment && detail.endsWith(comment)) {
        detail = detail.slice(0, -comment.length).trim()
      }
    }

    // if detail is still too long after removing the override remark, truncate it
    detail = truncateString(detail, maxCommentLength)

    if (!comment) {
      switch (importOptions.emptyComment) {
        case 'ignore':
          comment = null
          break
        case 'import':
          comment = ''
          break
        case 'replace':
          comment = replacementText
          break
      }
    }
    comment = truncateString(comment, maxCommentLength)

    // Override Remark in Eval-STIG XCCDF preserved in Review Comment, replace Remark with "Evaluate-STIG Answer File", otherwise truncate to 255 characters
    if (resultEngine?.overrides) {
      if (resultEngineCommon.product === 'evaluate-stig') {
        for (const o of resultEngine.overrides) {
          o.remark = "Evaluate-STIG Answer File"
        }
      }
    }

    const review = {
      ruleId,
      result,
      resultEngine,
      detail,
      comment
    }

    const status = bestStatusForReview(review, importOptions, fieldSettings, allowAccept)
    if (status) {
      review.status = status
    }

    return review
  }

  function processTargetFacts(targetFacts) {
    if (!targetFacts) return {}

    const asset = { metadata: {} }
    const reTagAsset = /^tag:stig-manager@users.noreply.github.com,2020:asset:(.*)/
    const reMetadata = /^metadata:(.*)/

    for (const targetFact of targetFacts) {
      const matchesTagAsset = targetFact['name'].match(reTagAsset)
      if (!matchesTagAsset) {
        asset.metadata[targetFact['name']] = targetFact['#text']
        continue
      }
      const property = matchesTagAsset[1]
      const matchesMetadata = property.match(reMetadata)
      if (matchesMetadata) {
        asset.metadata[decodeURI(matchesMetadata[1])] = targetFact['#text']
      }
      else {
        let value = targetFact['#text']
        if (property === 'noncomputing') {
          value = value === 'true'
        }
        if (['name', 'description', 'fqdn', 'ip', 'mac', 'noncomputing'].includes(property)) {
          asset[property] = value
        }
      }
    }
    return asset
  }

  function processTarget(testResult) {
    const assetFromFacts = processTargetFacts(testResult['target-facts']?.fact)
    return {
      name: testResult.target[0],
      description: '',
      ip: testResult['target-address']?.[0] || '',
      noncomputing: false,
      metadata: {},
      ...assetFromFacts
    }
  }
}

/**
 * Parses data from a cklb format into a format suitable for further processing.
 * 
 * @param {ParserParams} ReviewsFromCklbParams - The parameters object containing:
 * @param {string} ReviewsFromCklbParams.data - The cklb data to be processed.
 * @param {FieldSettings} ReviewsFromCklbParams.fieldSettings - Settings related to detail and comment fields.
 * @param {boolean} ReviewsFromCklbParams.allowAccept - Flag indicating whether accepting a review is allowed.
 * @param {ImportOptions} ReviewsFromCklbParams.importOptions - Options for handling import behavior.
 * @param {*} ReviewsFromCklbParams.sourceRef - A reference to the source of the cklb data.
 * 
 * @returns {ParseResult} An object containing parsed cklb data
 * 
 * @throws {Error} 
 */
export function reviewsFromCklb(
  {
    data,
    fieldSettings,
    allowAccept,
    importOptions,
    sourceRef
  }) {

  const resultMap = {
    not_a_finding: 'pass',
    open: 'fail',
    not_applicable: 'notapplicable',
    not_reviewed: 'notchecked'
  }
  let cklb
  try {
    cklb = JSON.parse(data)
  }
  catch (e) {
    throw (new Error('Cannot parse as JSON'))
  }
  const validateCklb = (obj) => {
    try {
      if (!obj.target_data?.host_name) {
        throw new Error('No target_data.host_name found')
      }
      if (!Array.isArray(obj.stigs)) {
        throw new Error('No stigs array found')
      }
      return { valid: true }
    }
    catch (e) {
      let error = e
      if (e instanceof Error) {
        error = e.message
      }
      return { valid: false, error }
    }
  }

  const validationResult = validateCklb(cklb)
  if (!validationResult.valid) {
    throw (new Error(`Invalid CKLB object: ${validationResult.error}`))
  }
  // extract root evaluate-stig object
  const resultEngineCommon = processRootEvalStigModule(cklb['evaluate-stig'])

  let returnObj = { sourceRef }
  returnObj.target = processTargetData(cklb.target_data)
  if (!returnObj.target.name) {
    throw (new Error("No host_name in target_data"))
  }
  if(returnObj.target.name.length > 255){
    throw (new Error("Asset hostname cannot be more than 255 characters", returnObj.target.name))
  }
  returnObj.checklists = processStigs(cklb.stigs)
  if (returnObj.checklists.length === 0) {
    throw (new Error("stigs array is empty"))
  }
  return (returnObj)

  function processTargetData(td) {
    const obj = {
      name: td.host_name,
      description: td.comments ? truncateString(td.comments, 255): null,
      ip: td.ip_address ? truncateString(td.ip_address, 255) : null,
      fqdn: td.fqdn ? truncateString(td.fqdn, 255) : null,
      mac: td.mac_address ? truncateString(td.mac_address, 255) : null,
      noncomputing: td.target_type === 'Non-Computing',
      metadata: {}
    }
    if (td.role) {
      obj.metadata.cklRole = td.role
    }
    if (td.technology_area) {
      obj.metadata.cklTechArea = td.technology_area
    }
    if (td.is_web_database) {
      obj.metadata.cklWebOrDatabase = 'true'
      obj.metadata.cklHostName = td.host_name
      if (td.web_db_site) {
        obj.metadata.cklWebDbSite = td.web_db_site
      }
      if (td.web_db_instance) {
        obj.metadata.cklWebDbInstance = td.web_db_instance
      }
    }
    return obj
  }
  function processStigs(stigs) {
    const checklistArray = []
    for (const stig of stigs) {
      // checklist = {
      //   benchmarkId: 'string',
      //   revisionStr: 'string',
      //   reviews: [],
      //   stats: {}
      // }
      const checklist = { sourceRef }
      checklist.benchmarkId = typeof stig?.stig_id === 'string' ? stig.stig_id.replace('xccdf_mil.disa.stig_benchmark_', '') : ''
      checklist.benchmarkId = truncateString(checklist.benchmarkId, 255)
      const stigVersion = stig.version ?? '0'
      const stigRelease = typeof stig?.release_info === 'string' ? stig.release_info.match(/Release:\s*(.+?)\s/)?.[1] : ''
      checklist.revisionStr = checklist.benchmarkId && stigRelease ? `V${stigVersion}R${stigRelease}` : null

      if (checklist.benchmarkId) {
        const result = processRules(stig.rules, stig['evaluate-stig'])
        checklist.reviews = result.reviews
        checklist.stats = result.stats
        checklistArray.push(checklist)
      }

    }
    return checklistArray
  }
  function processRules(rules, evalStigResultEngine) {
    const stats = {
      pass: 0,
      fail: 0,
      notapplicable: 0,
      notchecked: 0,
      notselected: 0,
      informational: 0,
      error: 0,
      fixed: 0,
      unknown: 0
    }
    const reviews = []
    for (const rule of rules) {
      const review = generateReview(rule, evalStigResultEngine)
      if (review) {
        reviews.push(review)
        stats[review.result]++
      }
    }
    return { reviews, stats }
  }
  function generateReview(rule, evalStigResultEngine) {
    let result = resultMap[rule.status]
    if (!result) return
    const ruleId = truncateString(rule.rule_id_src, 45)
    if (!ruleId) return

    const hasComments = !!rule.finding_details || !!rule.comments

    if (result === 'notchecked') { // unreviewed business rules
      switch (importOptions.unreviewed) {
        case 'never':
          return undefined
        case 'commented':
          result = hasComments ? importOptions.unreviewedCommented : undefined
          if (!result) return
          break
        case 'always':
          result = hasComments ? importOptions.unreviewedCommented : 'notchecked'
          break
      }
    }

    let detail = rule.finding_details?.length > maxCommentLength ? truncateString(rule.finding_details, maxCommentLength) : rule.finding_details
    if (!rule.finding_details) {
      switch (importOptions.emptyDetail) {
        case 'ignore':
          detail = null
          break
        case 'import':
          detail = rule.finding_details ?? ''
          break
        case 'replace':
          detail = 'There is no detail provided for the assessment'
          break
      }
    }

    let comment = rule.comments?.length > maxCommentLength ? truncateString(rule.comments, maxCommentLength) : rule.comments
    if (!rule.comments) {
      switch (importOptions.emptyComment) {
        case 'ignore':
          comment = null
          break
        case 'import':
          comment = rule.comments ?? ''
          break
        case 'replace':
          comment = 'There is no comment provided for the assessment'
          break
      }
    }

    const review = {
      ruleId,
      result,
      detail,
      comment
    }

    const iStigCommentProcessed = processStigEvalStigModule(evalStigResultEngine)

    if(resultEngineCommon){
      review.resultEngine = {...resultEngineCommon,...iStigCommentProcessed}
    } 
    else 
    {
      review.resultEngine = null
    }

    const status = bestStatusForReview(review, importOptions, fieldSettings, allowAccept)
    if (status) {
      review.status = status
    }

    return review
  }
 
 // process evaluate-stig module for each "Checklist" (STIGs array)
 function processStigEvalStigModule(stigModule){
    let resultEngineIStig
    if(!stigModule) return null
    resultEngineIStig = {
      time: stigModule.time,
      checkContent: {
        location: (stigModule.module?.name ?? '') + 
                  ((stigModule.module?.name && stigModule.module?.version) ? ':' : '') + 
                  (stigModule.module?.version ?? '')
      }
    }
    return resultEngineIStig
  }
 
  // process root evaluate-stig object
  function processRootEvalStigModule(module){
    let resultEngineCommon
    if(!module) return null
    resultEngineCommon = {
      type: 'script',
      product: 'Evaluate-STIG',
      version: truncateString(module.version, 255),
    }
    return resultEngineCommon
  }
}

export function bestStatusForReview(review, importOptions, fieldSettings, allowAccept) {

  let autoStatusSetting
  
  // Determine if the autoStatus setting is using the legacy string-based format.
  // In the legacy format, autoStatus is a single string value (e.g., "submitted").
  const isLegacyAutoStatus = typeof importOptions.autoStatus === 'string'
  if (isLegacyAutoStatus) {
    // Use the legacy string value directly as the autoStatus setting.
    autoStatusSetting = importOptions.autoStatus
  } else if (review.result in importOptions.autoStatus) {
    // In the new object-based format, autoStatus is a mapping of review results
    // (e.g., "pass", "fail") to specific status values. Use the status corresponding
    // to the current review result.
    autoStatusSetting = importOptions.autoStatus[review.result]
  } else {
    // Fallback: If the review result is not explicitly mapped in the new format,
    // default to "saved" for unrecognized or unsupported results.
    autoStatusSetting = 'saved'
  }
  
  if (autoStatusSetting === 'null') return null
  if (autoStatusSetting === 'saved') return 'saved'

  let detailSubmittable = false
  switch (fieldSettings.detail.required) {
    case 'optional':
      detailSubmittable = true
      break
    case 'findings':
      if ((review.result !== 'fail') || (review.result === 'fail' && review.detail)) {
        detailSubmittable = true
      }
      break
    case 'always':
      if (review.detail) {
        detailSubmittable = true
      }
      break
  }

  let commentSubmittable = false
  switch (fieldSettings.comment.required) {
    case 'optional':
      commentSubmittable = true
      break
    case 'findings':
      if ((review.result !== 'fail') || (review.result === 'fail' && review.comment)) {
        commentSubmittable = true
      }
      break
    case 'always':
      if (review.comment) {
        commentSubmittable = true
      }
      break
  }

  const resultSubmittable = review.result === 'pass' || review.result === 'fail' || review.result === 'notapplicable'

  let status
  if (detailSubmittable && commentSubmittable && resultSubmittable) {
    switch (autoStatusSetting) {
      case 'submitted':
        status = 'submitted'
        break
      case 'accepted':
        status = allowAccept ? 'accepted' : 'submitted'
        break
    }
  } else {
    status = 'saved'
  }

  return status
}


export const reviewsFromScc = reviewsFromXccdf
