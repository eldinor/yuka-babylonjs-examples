import 'https://preview.babylonjs.com/babylon.js'

import * as YUKA from '../../../../../lib/yuka.module.js'
import { createVehicle } from '../../creator.js'

let engine, scene

let entityManager, time, entity, target

const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(90),
    BABYLON.Tools.ToRadians(60),
    10,
    BABYLON.Vector3.Zero(),
    scene
  )
  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.useAutoRotationBehavior = true
  camera.wheelDeltaPercentage = 0.002
  camera.attachControl(canvas, true)

  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0))
  light.diffuse = BABYLON.Color3.Teal()
  //

  const entityMesh = createVehicle(scene, { size: 0.5 })

  const targetMesh = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 0.1, segments: 16 })

  const meshMat = new BABYLON.StandardMaterial('meshMat', scene)
  meshMat.disableLighting = true
  meshMat.emissiveColor = BABYLON.Color3.Red()
  targetMesh.material = meshMat

  const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 5, segments: 16 })
  sphere.material = new BABYLON.StandardMaterial('sphereMaterial', scene)
  sphere.material.disableLighting = true
  sphere.material.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8)
  sphere.material.alpha = 0.2
  sphere.material.wireframe = true

  //

  window.addEventListener('resize', onWindowResize, false)

  // game entity setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  target = new YUKA.GameEntity()
  target.setRenderComponent(targetMesh, sync)

  entity = new YUKA.GameEntity()
  entity.maxTurnRate = Math.PI * 0.5
  entity.setRenderComponent(entityMesh, sync)

  entityManager.add(entity)
  entityManager.add(target)

  //

  generateTarget()
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const delta = time.update().getDelta()

  entity.rotateTo(target.position, delta)

  entityManager.update()

  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}

function generateTarget() {
  // generate a random point on a sphere

  const radius = 2
  const phi = Math.acos(2 * Math.random() - 1)
  const theta = Math.random() * Math.PI * 2

  target.position.fromSpherical(radius, phi, theta)

  setTimeout(generateTarget, 2000)
}
