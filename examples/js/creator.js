import 'https://preview.babylonjs.com/babylon.js'

export const VehicleTypes = {
  default: 0,
  cone: 1,
  box: 2,
  // etc
}

/*
options: {
  type: VehicleTypes
  name: string
  size: number
  x: number
  y: number
  z: number
 ... etc
}

*/

export const createVehicle = (scene, options) => {
  const vehicleType = options?.type ?? VehicleTypes.default
  const size = options?.size ?? 1
  const height = 1 * size
  const diameterBottom = 0.5 * size
  const diameterTop = 0
  const name = options?.name ?? 'vehicle'

  if (vehicleType === VehicleTypes.default) {
    const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder('cone', { height, diameterTop, diameterBottom }, scene)
    vehicleMesh.rotation.x = Math.PI * 0.5

    const dodecahedron2 = BABYLON.MeshBuilder.CreatePolyhedron('dodecahedron', {
      type: 1,
      size: 0.22 * size,
    })
    dodecahedron2.position.z -= 0.1

    const newVehicleMesh = BABYLON.Mesh.MergeMeshes([vehicleMesh, dodecahedron2], true)
    newVehicleMesh.name = name
    newVehicleMesh.position.y = options?.y ?? 0
    newVehicleMesh.bakeCurrentTransformIntoVertices()

    return newVehicleMesh
  } else if (vehicleType === VehicleTypes.cone) {
    const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder(name, { height, diameterTop, diameterBottom }, scene)

    vehicleMesh.position.y = options?.y ?? 0
    vehicleMesh.rotation.x = Math.PI * 0.5
    vehicleMesh.bakeCurrentTransformIntoVertices()

    return vehicleMesh
  } else if (vehicleType === VehicleTypes.box) {
    //
  }
}
