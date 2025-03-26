// import AssetParser from './BatchAssetParser.js'


// /**
//  * Fetches labels from a specified collection.
//  *
//  * @param {string} apiBaseUrl - The base URL of the API.
//  * @param {string} collectionId - The ID of the collection to fetch labels from.
//  * @param {string} authToken - The authentication token for API access.
//  * @returns {Promise<Map<string, string>>} A promise that resolves to a Map where the keys are label names and the values are label IDs.
//  * @throws {Error} If the fetch operation fails or the response is not ok.
//  */
// async function fetchLabels(apiBaseUrl, collectionId, authToken) {
//     try {
//         const url = `${apiBaseUrl}/collections/${collectionId}/labels`
//         const response = await fetch(url, {
//             method: "GET",
//             headers: {
//                 Authorization: `Bearer ${authToken}`,
//                 "Content-Type": "application/json"
//             }
//         })

//         if (!response.ok) {
//             throw new Error(`Failed to fetch labels: ${response.statusText}`)
//         }
//         const data = await response.json()
//         return new Map(data.map(label => [label.name, label.labelId])) // Map<Name, UUID>
//     } catch (error) {
//         console.error("Error fetching labels:", error.message)
//         throw new Error("Failed to fetch existing labels.")
//     }
// }


// function generateRandomColor() {
//     return Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")
// }


// /**
//  * Creates a new label in the specified collection.
//  *
//  * @param {string} apiBaseUrl - The base URL of the API.
//  * @param {string} collectionId - The ID of the collection where the label will be created.
//  * @param {string} authToken - The authentication token for API access.
//  * @param {string} labelName - The name of the label to be created.
//  * @returns {Promise<string>} - A promise that resolves to the new label's UUID.
//  * @throws {Error} - Throws an error if the label creation fails.
//  */
// async function createLabel(apiBaseUrl, collectionId, authToken, labelName) {
//     try {
//         const labelData = {
//             name: labelName,
//             color: generateRandomColor(), 
//             description: ""
//         }

//         const response = await fetch(`${apiBaseUrl}/collections/${collectionId}/labels`, {
//             method: "POST",
//             headers: {
//                 Authorization: `Bearer ${authToken}`,
//                 "Content-Type": "application/json"
//             },
//             body: JSON.stringify(labelData)
//         })

//         if (!response.ok) {
//             throw new Error(`Failed to create label: ${response.statusText}`)
//         }

//         const data = await response.json()
//         return data.labelId //new label 
//     } catch (error) {
//         console.error(`Error creating label '${labelName}':`, error.message)
//         throw new Error(`Failed to create label '${labelName}'.`)
//     }
// }


// /**
//  * Processes assets from a CSV string, fetches existing labels, and creates new labels if necessary.
//  *
//  * @param {string} csvString - The CSV string containing asset data.
//  * @param {string} apiBaseUrl - The base URL of the API.
//  * @param {string} collectionId - The ID of the collection to which the assets belong.
//  * @param {string} authToken - The authentication token for API access.
//  * @returns {Promise<Array<Object>>} - A promise that resolves to an array of processed assets.
//  */
// async function processAssets(csvString, apiBaseUrl, collectionId, authToken) {
//     const parser = new AssetParser()
//     const assets = parser.parseCSV(csvString)

//     // Fetch existing 
//     const labelCache = await fetchLabels(apiBaseUrl, collectionId, authToken)

//     for (let asset of assets) {
//         if (asset.labelIds && asset.labelIds.length > 0) {
//             const labelUuids = await Promise.all(
//                 asset.labelIds.map(async (label) => {
//                     if (labelCache.has(label)) {
//                         return labelCache.get(label) // cache hit
//                     }
//                     const newLabelUuid = await createLabel(apiBaseUrl, collectionId, authToken, label) // cache miss
//                     labelCache.set(label, newLabelUuid) // cache new label
//                     return newLabelUuid
//                 })
//             )
//             asset.labelIds = labelUuids
//         }
//     }

//     return assets
// }

// export { processAssets }
