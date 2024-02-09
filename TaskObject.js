
const addItemToMapArrayValue = (map, key, item) => {
  const arr = map.get(key) ?? []
  arr.push(item)
  map.set(key, arr)
}

export default class TaskObject {
  /**
   * @param {Object} TaskObjectParam
   * @param {ApiAsset[]} TaskObjectParam.apiAssets
   * @param {ApiStig[]} TaskObjectParam.apiStigs
   * @param {ParseResult[]} TaskObjectParam.parsedResults
   * @param {TaskObjectOptions} TaskObjectParam.options
   */
  constructor({ apiAssets = [], apiStigs = [], parsedResults = [], options = {} }) {
    // An array of results from the parsers
    /** @type {ParseResult[]} */
    this.parsedResults = parsedResults

    // An array of assets from the API
    /** @type {ApiAsset[]} */
    this.apiAssets = apiAssets

    // Create Map for the assets, key:apiAsset.name, value: apiAsset
    /** @type {Map<string, ApiAsset>} */
    this.mappedAssetNames = new Map()

    // Create Map for the cklHostnames, key:apiAsset.metadata.cklHostName, value:apiAsset[]
    /** @type {Map<string, ApiAsset[]} */
    this.mappedCklHostnames = new Map()

    for (const apiAsset of apiAssets) {
      // Change apiAsset.stigs from an array of stig objects to an array of benchmarkId strings
      apiAsset.stigs = apiAsset.stigs.map(stig => stig.benchmarkId)
      this.mappedAssetNames.set(apiAsset.name.toLowerCase(), apiAsset)
      if (apiAsset.metadata?.cklHostName) {
        addItemToMapArrayValue(
          this.mappedCklHostnames, 
          apiAsset.metadata.cklHostName.toLowerCase(), 
          apiAsset
        )
      }
    }

    // A Map() of the installed benchmarkIds return by the API
    // key: benchmarkId, value: array of revisionStr
    this.mappedStigs = new Map(apiStigs.map(stig => [stig.benchmarkId, stig.revisionStrs]))

    // An array of accumulated errors
    this.errors = []

    // A Map() of assets to be processed by the writer
    this.taskAssets = this._createTaskAssets(options)
  }

  _findAssetFromParsedTarget(target) {
    // If there's no target.metadata.cklHostName, return the apiAsset (if any) matching the target.name
    if (!target.metadata.cklHostName) {
      return this.mappedAssetNames.get(target.name.toLowerCase())
    }

    // get the array of apiAssets (if any) having the given target.metadata.cklHostName
    const matchedByCklHostname = this.mappedCklHostnames.get(target.metadata.cklHostName.toLowerCase())
    // return null if no matches
    if (!matchedByCklHostname) return null
    
    // find the first apiAsset that matches all the CKL metadata , or null
    const matchedByAllCklMetadata = matchedByCklHostname.find(
      asset => asset.metadata.cklWebDbInstance?.toLowerCase() === target.metadata.cklWebDbInstance?.toLowerCase()
        && asset.metadata.cklWebDbSite?.toLowerCase() === target.metadata.cklWebDbSite?.toLowerCase())
    if (!matchedByAllCklMetadata) return null
    return matchedByAllCklMetadata
  }

  _createTaskAssets(options) {
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
      if (!tMeta.cklHostName) {
        mapKey = parsedResult.target.name.toLowerCase()
      }
      else {
        mapKey = `${tMeta.cklHostName}-${tMeta.cklWebDbSite ?? 'NA'}-${tMeta.cklWebDbInstance ?? 'NA'}`
      }

      // Try to find the asset in apiAssets
      const apiAsset = this._findAssetFromParsedTarget(parsedResult.target)
      if (!apiAsset && !options.createObjects) {
        // Bail if the asset doesn't exist and we shouldn't create it
        this.errors.push({
          file: parsedResult.file,
          message: `asset does not exist for target`,
          target: parsedResult.target
        })
        continue
      }
      // Try to find the target in our Map()
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
          reviews: [] // the vetted reviews
        }
        if (!apiAsset) {
          // The asset does not exist in the API. Set assetProps from this parseResult.
          if (!tMeta.cklHostName) {
            taskAsset.assetProps = { ...parsedResult.target, collectionId: options.collectionId, stigs: [] }
          }
          else {
            taskAsset.assetProps = { ...parsedResult.target, name: mapKey, collectionId: options.collectionId, stigs: [] }
          }
        }
        else {
          // The asset exists in the API. Set assetProps from the apiAsset.
          taskAsset.knownAsset = true
          taskAsset.assetProps = apiAsset
        }
        // Insert the asset into taskAssets
        taskAssets.set(mapKey, taskAsset)
      }

      // Helper functions
      const stigIsInstalled = ({ benchmarkId, revisionStr }) => {
        const revisionStrs = this.mappedStigs.get(benchmarkId)
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

      const addToTaskAssetChecklistMapArray = (taskAsset, checklist) => {
        let checklistArray = taskAsset.checklists.get(checklist.benchmarkId)
        if (checklistArray) {
          checklistArray.push(checklist)
        }
        else {
          taskAsset.checklists.set(checklist.benchmarkId, [checklist])
        }
      }


      // Vet the checklists in this parseResult 
      for (const checklist of parsedResult.checklists) {
        checklist.file = parsedResult.file
        if (stigIsInstalled(checklist)) {
          if (stigIsAssigned(checklist)) {
            checklist.newAssignment = stigIsNewlyAssigned(checklist.benchmarkId)
            addToTaskAssetChecklistMapArray(taskAsset, checklist)
          }
          else if (options.createObjects) {
            assignStig(checklist.benchmarkId)
            checklist.newAssignment = true
            addToTaskAssetChecklistMapArray(taskAsset, checklist)
          }
          else {
            checklist.ignored = `Not mapped to Asset and I can't change that`
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
