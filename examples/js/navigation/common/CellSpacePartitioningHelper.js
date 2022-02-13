/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

function createCellSpaceHelper(spatialIndex, scene) {
  const cells = spatialIndex.cells

  const positions = []

  for (let i = 0, l = cells.length; i < l; i++) {
    const cell = cells[i]
    const min = cell.aabb.min
    const max = cell.aabb.max

    // generate data for twelve lines segments

    // bottom lines

    positions.push([new BABYLON.Vector3(min.x, min.y, min.z), new BABYLON.Vector3(max.x, min.y, min.z)])
    positions.push([new BABYLON.Vector3(min.x, min.y, min.z), new BABYLON.Vector3(min.x, min.y, max.z)])
    positions.push([new BABYLON.Vector3(max.x, min.y, max.z), new BABYLON.Vector3(max.x, min.y, min.z)])
    positions.push([new BABYLON.Vector3(max.x, min.y, max.z), new BABYLON.Vector3(min.x, min.y, max.z)])

    // top lines

    positions.push([new BABYLON.Vector3(min.x, max.y, min.z), new BABYLON.Vector3(max.x, max.y, min.z)])
    positions.push([new BABYLON.Vector3(min.x, max.y, min.z), new BABYLON.Vector3(min.x, max.y, max.z)])
    positions.push([new BABYLON.Vector3(max.x, max.y, max.z), new BABYLON.Vector3(max.x, max.y, min.z)])
    positions.push([new BABYLON.Vector3(max.x, max.y, max.z), new BABYLON.Vector3(min.x, max.y, max.z)])

    // torso lines

    positions.push([new BABYLON.Vector3(min.x, min.y, min.z), new BABYLON.Vector3(min.x, max.y, min.z)])
    positions.push([new BABYLON.Vector3(max.x, min.y, min.z), new BABYLON.Vector3(max.x, max.y, min.z)])
    positions.push([new BABYLON.Vector3(max.x, min.y, max.z), new BABYLON.Vector3(max.x, max.y, max.z)])
    positions.push([new BABYLON.Vector3(min.x, min.y, max.z), new BABYLON.Vector3(min.x, max.y, max.z)])
  }

  const linesMesh = BABYLON.MeshBuilder.CreateLineSystem('lines', { lines: positions }, scene)

  return linesMesh
}

export { createCellSpaceHelper }
