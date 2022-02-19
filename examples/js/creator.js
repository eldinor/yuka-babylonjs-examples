import 'https://preview.babylonjs.com/babylon.js'

export const VehicleTypes = {
  cone: 0,
  basicCone: 1,
  box: 2,
  // etc
}

/*
options: {
  type: VehicleTypes
  name: string
  size: number
 ... etc
}

*/

export const createVehicle = (scene, options) => {
  const vehicleType = options?.vehicleType ?? VehicleTypes.cone
  if (vehicleType === VehicleTypes.cone) {
    const height = 1 * options?.size ?? 1
    const diameterBottom = 0.5 * options?.size ?? 1
    const diameterTop = 0
    const name = options?.name ?? 'vehicle'

    // add the bullet here

    // const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder(name, { height, diameterTop, diameterBottom }, scene)

    vehicleMesh.rotation.x = Math.PI * 0.5
    vehicleMesh.bakeCurrentTransformIntoVertices()

    return vehicleMesh
  } else if (vehicleType === VehicleTypes.basicCone) {
    const height = 1 * options?.size ?? 1
    const diameterBottom = 0.5 * options?.size ?? 1
    const diameterTop = 0
    const name = options?.name ?? 'vehicle'

    const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder(name, { height, diameterTop, diameterBottom }, scene)

    vehicleMesh.rotation.x = Math.PI * 0.5
    vehicleMesh.bakeCurrentTransformIntoVertices()

    return vehicleMesh
  } else if (vehicleType === VehicleTypes.box) {
    //
  }
}
