import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

let engine, scene
let entityManager, time, target

const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  //	scene.debugLayer.show();

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(70),
    BABYLON.Tools.ToRadians(60),
    15,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))
  light.diffuse = BABYLON.Color3.Green()
  //

  const leaderMesh = createVehicle(scene, { size: 0.8 })

  const followerMeshTemplate = createVehicle(scene, { size: 0.5 })
  followerMeshTemplate.isVisible = false

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)
  ground.material.backFaceCulling = false
  ground.visibility = 0.4

  //

  window.addEventListener('resize', onWindowResize, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  target = new YUKA.Vector3()

  // leader

  const leader = new YUKA.Vehicle()
  leader.setRenderComponent(leaderMesh, sync)

  const seekBehavior = new YUKA.SeekBehavior(target)
  leader.steering.add(seekBehavior)

  entityManager.add(leader)

  // follower

  const offsets = [
    new YUKA.Vector3(0.5, 0, -0.5),
    new YUKA.Vector3(-0.5, 0, -0.5),
    new YUKA.Vector3(1.5, 0, -1.5),
    new YUKA.Vector3(-1.5, 0, -1.5),
  ]

  for (let i = 0; i < 4; i++) {
    const followerMesh = followerMeshTemplate.clone()
    followerMesh.isVisible = true

    const follower = new YUKA.Vehicle()
    follower.maxSpeed = 2
    follower.position.copy(offsets[i]) // initial position
    follower.scale.set(0.5, 0.5, 0.5) // make the followers a bit smaller
    follower.setRenderComponent(followerMesh, sync)

    const offsetPursuitBehavior = new YUKA.OffsetPursuitBehavior(leader, offsets[i])
    follower.steering.add(offsetPursuitBehavior)

    entityManager.add(follower)
  }
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  time.update()

  const deltaTime = time.getDelta()
  const elapsedTime = time.getElapsed()

  target.z = Math.cos(elapsedTime * 0.2) * 5
  target.y = Math.cos(elapsedTime * 0.4) * 3
  target.x = Math.sin(elapsedTime * 0.2) * 5

  entityManager.update(deltaTime)

  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}
