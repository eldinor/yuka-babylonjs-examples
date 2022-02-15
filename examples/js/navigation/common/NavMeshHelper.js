/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

function createConvexRegionHelper(navMesh, scene) {
  const regions = navMesh.regions

  const customMesh = new BABYLON.Mesh('custom', scene)
  const customMeshMaterial = new BABYLON.StandardMaterial('custom-mesh', scene)
  customMeshMaterial.emmissiveColor = BABYLON.Color3.Random()

  customMesh.material = customMeshMaterial

  const positions = []
  const colors = []

  for (let region of regions) {
    // one color for each convex region
    const color = BABYLON.Color3.Random()

    // count edges

    let edge = region.edge
    const edges = []

    do {
      edges.push(edge)
      edge = edge.next
    } while (edge !== region.edge)

    // triangulate

    const triangleCount = edges.length - 2

    for (let i = 1, l = triangleCount; i <= l; i++) {
      const v1 = edges[0].vertex
      const v2 = edges[i + 0].vertex
      const v3 = edges[i + 1].vertex

      positions.push(v1.x, v1.y, v1.z)
      positions.push(v2.x, v2.y, v2.z)
      positions.push(v3.x, v3.y, v3.z)

      colors.push(color.r, color.g, color.b, 1)
      colors.push(color.r, color.g, color.b, 1)
      colors.push(color.r, color.g, color.b, 1)
    }
  }

  const indices = []
  for (let i = 0; i < positions.length / 3; i++) {
    indices.push(i)
  }

  const normals = []

  const vertexData = new BABYLON.VertexData()
  BABYLON.VertexData.ComputeNormals(positions, indices, normals)

  vertexData.positions = positions
  vertexData.indices = indices
  vertexData.normals = normals
  vertexData.colors = colors

  vertexData.applyToMesh(customMesh)

  var mat = new BABYLON.StandardMaterial('mat', scene)
  mat.backFaceCulling = false
  customMesh.material = mat

  return customMesh
}

export { createConvexRegionHelper }
