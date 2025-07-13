
const addItemToMapArrayValue = (map, key, item) => {
  const arr = map.get(key) ?? []
  arr.push(item)
  map.set(key, arr)
}

export default class TaskObject {
  /** @type {Map<string, ApiAsset>} */
  #assetNameMap

  /** @type {Map<string, ApiAsset[]} */
  #cklHostnameMap
  
  /** @type {Map<string, string[]} */
  #benchmarkIdMap

  /** @type {ParseResult[]} */
  parsedResults

  /** @type {ApiAsset[]} */
  apiAssets

  /** @type {ApiStig[]} */
  apiStigs

  /** @type {any[]} */
  sourceRefs

  /**
   * @param {Object} TaskObjectParam
   * @param {ApiAsset[]} TaskObjectParam.apiAssets
   * @param {ApiStig[]} TaskObjectParam.apiStigs
   * @param {ParseResult[]} TaskObjectParam.parsedResults
   * @param {TaskObjectOptions} TaskObjectParam.options
   */
  constructor({ apiAssets = [], apiStigs = [], parsedResults = [], options = {} }) {
    // An array of results from the parsers
    this.parsedResults = parsedResults
    // An array of assets from the API
    this.apiAssets = apiAssets
    // Create Map for the assets, key:apiAsset.name, value: apiAsset
    this.#assetNameMap = new Map()
    // Create Map for the cklHostnames, key:apiAsset.metadata.cklHostName, value:apiAsset[]
    this.#cklHostnameMap = new Map()
    // An array of any parseResult.sourceRef
    this.sourceRefs = parsedResults.filter( parseResult => parseResult.sourceRef !== undefined )

    for (const apiAsset of apiAssets) {
      // Change apiAsset.stigs from an array of stig objects to an array of benchmarkId strings
      apiAsset.stigs = apiAsset.stigs.map(stig => stig.benchmarkId)
      this.#assetNameMap.set(apiAsset.name.toLowerCase(), apiAsset)
      if (apiAsset.metadata?.cklHostName) {
        addItemToMapArrayValue(
          this.#cklHostnameMap, 
          apiAsset.metadata.cklHostName.toLowerCase(), 
          apiAsset
        )
      }
    }

    // A Map() of the installed benchmarkIds return by the API
    // key: benchmarkId, value: array of revisionStr
    this.#benchmarkIdMap = new Map(apiStigs.map(stig => [stig.benchmarkId, stig.revisionStrs]))

    // An array of accumulated errors
    this.errors = []

    // A Map() of assets to be processed by the writer
    this.taskAssets = this.#createTaskAssets(options)
  }

  #findAssetFromParsedTarget(target) {
    // If there's no target.metadata.cklHostName, return the apiAsset (if any) matching the target.name
    if (!target.metadata.cklHostName) {
      return this.#assetNameMap.get(target.name.toLowerCase())
    }

    // get the array of apiAssets (if any) having the given target.metadata.cklHostName
    const matchedByCklHostname = this.#cklHostnameMap.get(target.metadata.cklHostName.toLowerCase())
    // return null if no matches
    if (!matchedByCklHostname) return null
    
    // find the first apiAsset that matches all the CKL metadata , or null
    const matchedByAllCklMetadata = matchedByCklHostname.find(
      asset => asset.metadata.cklWebDbInstance?.toLowerCase() === target.metadata.cklWebDbInstance?.toLowerCase()
        && asset.metadata.cklWebDbSite?.toLowerCase() === target.metadata.cklWebDbSite?.toLowerCase())
    if (!matchedByAllCklMetadata) return null

     const effectiveName = this.#buildEffectiveName(target)
    if(this.#assetNameMap.has(effectiveName.toLowerCase())) {
      return this.#assetNameMap.get(effectiveName.toLowerCase())
    }
   
    return null
  }

  #buildEffectiveName(target) {
    const effectiveName = `${target.metadata.cklHostName.toLowerCase()}-${target.metadata.cklWebDbSite?.toLowerCase() ?? 'NA'}-${target.metadata.cklWebDbInstance?.toLowerCase() ?? 'NA'}`
    return effectiveName
  }
  #createTaskAssets(options) {
    // taskAssets is a Map() keyed by lowercase asset name (or CKL metadata), the value is an object:
    // {
    // knownAsset: false, // does the asset need to be created
    // assetProps: null, // an Asset object suitable for put/post to the API 
    // hasNewAssignment: false, //  are there new STIG assignments?
    // newAssignments: [], // any new assignments
    // checklists: new Map(), // the vetted result checklists, a Map() keyed by benchmarkId
    // checklistsIgnored: [], // the ignored checklists
    // reviews: [] // the vetted reviews
    // }


    /** @type {Map<string, TaskAssetValue} */
    const taskAssets = new Map()

    for (const parsedResult of this.parsedResults) {
      // Generate mapping key
      let mapKey, tMeta = parsedResult.target.metadata
      let assetName
      if (!tMeta.cklHostName) {
        mapKey = parsedResult.target.name.toLowerCase()
        assetName = parsedResult.target.name
      }
      else {
        assetName = `${tMeta.cklHostName}-${tMeta.cklWebDbSite ?? 'NA'}-${tMeta.cklWebDbInstance ?? 'NA'}`
        mapKey = assetName.toLowerCase()
      }

      // Try to find the asset in apiAssets
      const apiAsset = this.#findAssetFromParsedTarget(parsedResult.target)
      if (!apiAsset && !options.createObjects) {
        // Bail if the asset doesn't exist and we shouldn't create it

        /** @type {TaskObjectError} */
        const error = {
            message: `Asset does not exist for target and createObjects is false`,
            target: parsedResult.target,
            sourceRef: parsedResult.sourceRef
        }
        
        this.errors.push(error)
        continue
      }
      // Try to find the target in our Map()
      /** @type {TaskAssetValue} */
      let taskAsset = taskAssets.get(mapKey)

      if (!taskAsset) {
        // This is our first encounter with this assetName, initialize Map() value
        taskAsset = {
          knownAsset: false,
          assetProps: null, // an object suitable for put/post to the API 
          hasNewAssignment: false,
          newAssignments: [],
          checklists: new Map(), // the vetted result checklists
          checklistsIgnored: [], // the ignored checklists
          sourceRefs: [] // the sourceRefs from each parsedResult for this Asset
        }
        if (!apiAsset) {
          // The asset does not exist in the API. Set assetProps from this parseResult.
          if (!tMeta.cklHostName) {
            taskAsset.assetProps = { ...parsedResult.target, collectionId: options.collectionId, stigs: [] }
          }
          else {
            taskAsset.assetProps = { ...parsedResult.target, name: assetName, collectionId: options.collectionId, stigs: [] }
          }
          // insert the asset into the assetNameMap
          this.#assetNameMap.set(mapKey.toLowerCase(), taskAsset.assetProps)
          // insert the asset into the cklHostnameMap if it has a cklHostName
          if (tMeta.cklHostName) {
            addItemToMapArrayValue(this.#cklHostnameMap, tMeta.cklHostName.toLowerCase(), taskAsset.assetProps)
          }
      
        }
        else {
          // The asset exists in the API. Set assetProps from the apiAsset.
          taskAsset.knownAsset = true
          taskAsset.assetProps = apiAsset
        }
        // Insert the asset into taskAssets
        taskAssets.set(mapKey.toLowerCase(), taskAsset)
      }
      // add any parsedResult.sourceRef to this asset's sourceRefs
      parsedResult.sourceRef !== undefined && taskAsset.sourceRefs.push(parsedResult.sourceRef)

      // Helper functions
      const stigIsInstalled = ({ benchmarkId, revisionStr }) => {
        const revisionStrs = this.#benchmarkIdMap.get(benchmarkId)
        if (revisionStrs) {
          return revisionStr && options.strictRevisionCheck ? revisionStrs.includes(revisionStr) : true
        }
        else {
          return false
        }
      }
      const stigIsAssigned = ({ benchmarkId }) => {
        return taskAsset.assetProps.stigs.includes(benchmarkId)
      }
      const assignStig = (benchmarkId) => {
        if (!stigIsAssigned(benchmarkId)) {
          taskAsset.hasNewAssignment = true
          taskAsset.newAssignments.push(benchmarkId)
          taskAsset.assetProps.stigs.push(benchmarkId)
        }
      }
      const stigIsNewlyAssigned = (benchmarkId) => taskAsset.newAssignments.includes(benchmarkId)

      // Vet the checklists in this parseResult 
      for (const checklist of parsedResult.checklists) {
        if (stigIsInstalled(checklist)) {
          if (stigIsAssigned(checklist)) {
            checklist.newAssignment = stigIsNewlyAssigned(checklist.benchmarkId)
            addItemToMapArrayValue(taskAsset.checklists, checklist.benchmarkId, checklist)
          }
          else if (options.createObjects) {
            assignStig(checklist.benchmarkId)
            checklist.newAssignment = true
            addItemToMapArrayValue(taskAsset.checklists, checklist.benchmarkId, checklist)
          }
          else {
            checklist.ignored = `STIG not assigned to Asset and createObjects is false.`
            taskAsset.checklistsIgnored.push(checklist)
          }
        }
        else {
          checklist.ignored = `Not installed`
          taskAsset.checklistsIgnored.push(checklist)
        }
      }
    }
    return taskAssets
  }
}
