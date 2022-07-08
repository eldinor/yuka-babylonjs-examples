import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

let engine, scene
let entityManager, time

const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  scene.useRightHandedSystem = true
  //	scene.debugLayer.show();

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(120),
    BABYLON.Tools.ToRadians(40),
    25,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
  light.diffuse = BABYLON.Color3.Teal()

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 30, height: 20 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)
  ground.material.backFaceCulling = false
  ground.visibility = 0.4
  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  //

  const vehicleMeshPrefab = createVehicle(scene, { size: 0.8 })
  vehicleMeshPrefab.setEnabled(false)

  for (let i = 0; i < 50; i++) {
    const vehicleMesh = vehicleMeshPrefab.clone('vehicle')
    vehicleMesh.setEnabled(true)

    vehicleMesh.bakeCurrentTransformIntoVertices()

    const vehicle = new YUKA.Vehicle()
    vehicle.rotation.fromEuler(0, 2 * Math.PI * Math.random(), 0)
    vehicle.position.x = 2.5 - Math.random() * 5
    vehicle.position.z = 2.5 - Math.random() * 5
    vehicle.setRenderComponent(vehicleMesh, sync)

    const wanderBehavior = new YUKA.WanderBehavior()
    vehicle.steering.add(wanderBehavior)

    entityManager.add(vehicle)
  }

  //

  //

  window.addEventListener('resize', onWindowResize, false)
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
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}
