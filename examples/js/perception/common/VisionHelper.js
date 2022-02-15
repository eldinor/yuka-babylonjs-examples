/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

function createVisionHelper(vision, division = 8, scene) {
  const fieldOfView = vision.fieldOfView
  const range = vision.range

  const customMesh = new BABYLON.Mesh('custom', scene)
  const customMeshMaterial = new BABYLON.StandardMaterial('custom-mesh', scene)
  customMeshMaterial.wireframe = true
  customMesh.material = customMeshMaterial
  customMeshMaterial.emissiveColor = new BABYLON.Color3(0.7, 0.7, 0.7)
  customMeshMaterial.disableLighting = true

  const positions = []

  const foV05 = fieldOfView / 2
  const step = fieldOfView / division

  // for now, let's create a simple helper that lies in the xz plane

  for (let i = -foV05; i < foV05; i += step) {
    positions.push(0, 0, 0)
    positions.push(Math.sin(i) * range, 0, Math.cos(i) * range)
    positions.push(Math.sin(i + step) * range, 0, Math.cos(i + step) * range)
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

  vertexData.applyToMesh(customMesh)

  return customMesh
}

export { createVisionHelper }
