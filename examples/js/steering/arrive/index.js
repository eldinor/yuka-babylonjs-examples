import * as YUKA from '../../../../lib/yuka.module.js'
import 'https://preview.babylonjs.com/babylon.js'
import { createVehicle } from '../../creator.js'

let engine, scene
let entityManager, time, vehicle, target

const entityMatrix = new BABYLON.Matrix()

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
    BABYLON.Tools.ToRadians(30),
    BABYLON.Tools.ToRadians(40),
    8,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl()

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  //

  const vehicleMesh = createVehicle(scene, { size: 0.5 })

  const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {
    diameter: 5,
    segments: 16,
  })
  sphere.material = new BABYLON.StandardMaterial('sphereMaterial', scene)
  sphere.material.disableLighting = true
  sphere.material.emissiveColor = new BABYLON.Color3(0.8, 0.8, 0.8)
  sphere.material.alpha = 0.2
  sphere.material.wireframe = true

  //

  const targetMesh = BABYLON.MeshBuilder.CreateSphere('target', {
    diameter: 0.1,
    segments: 16,
  })
  targetMesh.material = new BABYLON.StandardMaterial('targetMaterial', scene)
  targetMesh.material.disableLighting = true
  targetMesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0)

  //

  window.addEventListener('resize', onWindowResize, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  target = new YUKA.GameEntity()
  target.setRenderComponent(targetMesh, sync)

  vehicle = new YUKA.Vehicle()
  vehicle.setRenderComponent(vehicleMesh, sync)

  const arriveBehavior = new YUKA.ArriveBehavior(target.position, 2.5, 0.1)
  vehicle.steering.add(arriveBehavior)

  entityManager.add(target)
  entityManager.add(vehicle)

  generateTarget()
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

function generateTarget() {
  // generate a random point on a sphere

  const radius = 2
  const phi = Math.acos(2 * Math.random() - 1)
  const theta = Math.random() * Math.PI * 2

  target.position.fromSpherical(radius, phi, theta)

  setTimeout(generateTarget, 10000)
}
