import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

let engine, scene
let lines
let linePoints = []

let entityManager, time, pursuer, entity1, entity2, target1, target2

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
    20,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
  light.diffuse = BABYLON.Color3.Magenta()

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 15, height: 15 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)
  ground.visibility = 0.4
  ground.material.backFaceCulling = false

  // meshes

  const pursuerMesh = createVehicle(scene, { size: 0.8 })

  const entityMesh1 = BABYLON.MeshBuilder.CreateBox('entityMesh1', { size: 0.2 }, scene)
  const entityMesh2 = BABYLON.MeshBuilder.CreateBox('entityMesh2', { size: 0.2 }, scene)

  const entityMat = new BABYLON.StandardMaterial('entityMat', scene)
  entityMat.disableLighting = true
  entityMat.emissiveColor = BABYLON.Color3.Red()

  entityMesh1.material = entityMat
  entityMesh2.material = entityMat

  // helper

  linePoints[0] = entityMesh1.position
  linePoints[1] = entityMesh2.position

  lines = BABYLON.MeshBuilder.CreateLines('lines', {
    points: linePoints,
    updatable: true,
  })
  lines.color = BABYLON.Color3.Red()

  //

  window.addEventListener('resize', onWindowResize, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  target1 = new YUKA.Vector3()
  target2 = new YUKA.Vector3()

  entity1 = new YUKA.Vehicle()
  entity1.maxSpeed = 2
  entity1.setRenderComponent(entityMesh1, sync)

  const seekBehavior1 = new YUKA.SeekBehavior(target1)
  entity1.steering.add(seekBehavior1)

  entity2 = new YUKA.Vehicle()
  entity2.maxSpeed = 2
  entity2.setRenderComponent(entityMesh2, sync)

  const seekBehavior2 = new YUKA.SeekBehavior(target2)
  entity2.steering.add(seekBehavior2)

  pursuer = new YUKA.Vehicle()
  pursuer.maxSpeed = 3
  pursuer.setRenderComponent(pursuerMesh, sync)

  const interposeBehavior = new YUKA.InterposeBehavior(entity1, entity2, 1)
  pursuer.steering.add(interposeBehavior)

  entityManager.add(entity1)
  entityManager.add(entity2)
  entityManager.add(pursuer)
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const delta = time.update().getDelta()
  const elapsedTime = time.getElapsed()

  target1.x = Math.cos(elapsedTime * 0.1) * Math.sin(elapsedTime * 0.1) * 6
  target1.y = Math.cos(elapsedTime * 0.1) * Math.sin(elapsedTime * 0.1) * 6
  target1.z = Math.sin(elapsedTime * 0.3) * 6

  target2.x = 1 + Math.cos(elapsedTime * 0.5) * Math.sin(elapsedTime * 0.3) * 4
  target2.y = 1 + Math.cos(elapsedTime * 0.5) * Math.sin(elapsedTime * 0.3) * 4
  target2.z = 1 + Math.sin(elapsedTime * 0.3) * 6

  entityManager.update(delta)

  linePoints[0] = entity1.position
  linePoints[1] = entity2.position

  lines = BABYLON.MeshBuilder.CreateLines('lines', {
    points: linePoints,
    instance: lines,
  })

  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}
