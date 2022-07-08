/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import * as YUKA from '../../../../lib/yuka.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'

let engine, scene, plane, ray
let entityManager, time, vehicle, target

const entityMatrix = new BABYLON.Matrix()
const pointer = new BABYLON.Vector2(1, 1)

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  scene.useRightHandedSystem = true

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(90),
    BABYLON.Tools.ToRadians(0),
    30,
    BABYLON.Vector3.Zero(),
    scene
  )
  camera.upperBetaLimit = Math.PI / 4
  camera.lowerBetaLimit = Math.PI / 4

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 40, height: 40 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)

  const vehicleMesh = createVehicle(scene, { size: 2 })

  const pointerMesh = BABYLON.MeshBuilder.CreateSphere('pointer', scene)

  scene.onPointerMove = () => {
    var pickResult = scene.pick(scene.pointerX, scene.pointerY)
    if (pickResult?.pickedPoint) {
      target.x = pickResult.pickedPoint.x
      // target.y = pickResult.pickedPoint.y;
      target.z = pickResult.pickedPoint.z
      pointerMesh.position.x = target.x
      pointerMesh.position.z = target.z
    }
  }

  window.addEventListener('resize', onWindowResize, false)

  // YUKA specific
  target = new YUKA.Vector3()

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()
  vehicle = new YUKA.Vehicle()
  vehicle.setRenderComponent(vehicleMesh, sync)

  const fleeBehavior = new YUKA.FleeBehavior(target, 5)
  vehicle.steering.add(fleeBehavior)

  entityManager.add(vehicle)
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const delta = time.update().getDelta()
  entityManager.update(delta)

  scene.render()
}

function sync(entity, renderComponent) {
  BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).decomposeToTransformNode(renderComponent)
}
