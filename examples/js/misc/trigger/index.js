import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'

import * as YUKA from '../../../../../lib/yuka.module.js'

import { CustomTrigger } from './src/CustomTrigger.js'

let engine, scene

let entityManager, time, entity

const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.useRightHandedSystem = true
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  //	scene.debugLayer.show();

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(90),
    BABYLON.Tools.ToRadians(60),
    15,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.upperBetaLimit = 1.4
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene)

  const ground = BABYLON.MeshBuilder.CreatePlane('plane', { width: 25, height: 25 }, scene)
  ground.position.y = -2
  ground.rotation.x = Math.PI / 2

  ground.material = new BABYLON.GridMaterial('grid', scene)
  ground.material.backFaceCulling = true

  //

  const entityMesh = BABYLON.MeshBuilder.CreateBox('entityMesh', { size: 0.5 }, scene)

  const meshMat = new BABYLON.StandardMaterial('meshMat', scene)
  meshMat.disableLighting = true
  meshMat.emissiveColor = BABYLON.Color3.Red()
  entityMesh.material = meshMat

  // game entity setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  entity = new YUKA.GameEntity()
  entity.boundingRadius = 0.25
  entity.setRenderComponent(entityMesh, sync)

  entityManager.add(entity)

  const radius = 2
  const size = new YUKA.Vector3(3, 3, 3)

  const sphericalTriggerRegion = new YUKA.SphericalTriggerRegion(radius)
  const rectangularTriggerRegion = new YUKA.RectangularTriggerRegion(size)

  const trigger1 = new CustomTrigger(sphericalTriggerRegion, scene)
  trigger1.position.set(3, 0, 0)

  const trigger2 = new CustomTrigger(rectangularTriggerRegion, scene)
  trigger2.position.set(-3, 0, 0)

  entityManager.add(trigger1)
  entityManager.add(trigger2)

  // visualize triggers

  const triggerMesh1 = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 4, segments: 8 })
  triggerMesh1.position = new BABYLON.Vector3(3, 0, 0)

  triggerMesh1.material = new BABYLON.StandardMaterial('sphereMaterial', scene)
  triggerMesh1.material.diffuseColor = BABYLON.Color3.Gray()
  triggerMesh1.material.wireframe = true

  trigger1.setRenderComponent(triggerMesh1, sync)

  const triggerMesh2 = BABYLON.MeshBuilder.CreateBox('triggerMesh2', { size: 3 }, scene)
  triggerMesh2.position = new BABYLON.Vector3(-3, 0, 0)

  triggerMesh2.material = triggerMesh1.material

  trigger2.setRenderComponent(triggerMesh2, sync)

  window.addEventListener('resize', onWindowResize, false)
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const delta = time.update().getDelta()
  const elapsedTime = time.getElapsed()

  entity.position.x = Math.sin(elapsedTime) * 2

  scene.getMeshByName(entity._renderComponent.name).material.emissiveColor.r = 1
  scene.getMeshByName(entity._renderComponent.name).material.emissiveColor.g = 0

  entityManager.update(delta)

  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}
