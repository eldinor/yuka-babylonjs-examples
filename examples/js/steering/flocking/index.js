import * as YUKA from '../../../../lib/yuka.module.js'
import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

let engine, scene

let entityManager, time

const entityMatrix = new BABYLON.Matrix()

const params = {
  alignment: 1,
  cohesion: 0.9,
  separation: 0.3,
}

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
    BABYLON.Tools.ToRadians(90),
    BABYLON.Tools.ToRadians(0),
    120,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 80, height: 80 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)
  //

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  const alignmentBehavior = new YUKA.AlignmentBehavior()
  const cohesionBehavior = new YUKA.CohesionBehavior()
  const separationBehavior = new YUKA.SeparationBehavior()

  alignmentBehavior.weight = params.alignment
  cohesionBehavior.weight = params.cohesion
  separationBehavior.weight = params.separation

  const vehicleMeshPrefab = createVehicle(scene, { size: 2 })
  vehicleMeshPrefab.setEnabled(false)

  for (let i = 0; i < 50; i++) {
    const vehicleMesh = vehicleMeshPrefab.clone('vehicle')
    vehicleMesh.setEnabled(true)

    const vehicle = new YUKA.Vehicle()
    vehicle.maxSpeed = 1.5
    vehicle.updateNeighborhood = true
    vehicle.neighborhoodRadius = 10
    vehicle.rotation.fromEuler(0, Math.PI * Math.random(), 0)
    vehicle.position.x = 10 - Math.random() * 20
    vehicle.position.z = 10 - Math.random() * 20

    vehicle.setRenderComponent(vehicleMesh, sync)

    vehicle.steering.add(alignmentBehavior)
    vehicle.steering.add(cohesionBehavior)
    vehicle.steering.add(separationBehavior)

    const wanderBehavior = new YUKA.WanderBehavior()
    wanderBehavior.weight = 0.5
    vehicle.steering.add(wanderBehavior)

    entityManager.add(vehicle)
  }

  // dat.gui

  const gui = new DAT.GUI({ width: 300 })

  gui
    .add(params, 'alignment', 0.1, 2)
    .name('alignment')
    .onChange((value) => (alignmentBehavior.weight = value))
  gui
    .add(params, 'cohesion', 0.1, 2)
    .name('cohesion')
    .onChange((value) => (cohesionBehavior.weight = value))
  gui
    .add(params, 'separation', 0.1, 2)
    .name('separation')
    .onChange((value) => (separationBehavior.weight = value))

  gui.open()

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
