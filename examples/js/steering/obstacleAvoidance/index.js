import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

let engine, scene
let entityManager, time, vehicle

const obstacles = new Array()
const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  scene.useRightHandedSystem = true
  // scene.debugLayer.show()

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(140),
    BABYLON.Tools.ToRadians(40),
    50,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)
  camera.upperBetaLimit = 1.1

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  const ground = BABYLON.MeshBuilder.CreatePlane('plane', { width: 25, height: 25 }, scene)
  ground.rotation.x = Math.PI / 2

  ground.material = new BABYLON.GridMaterial('grid', scene)
  ground.material.backFaceCulling = true
  ground.visibility = 0.4

  const wayPointsMat = new BABYLON.StandardMaterial('wayPointsMat', scene)
  wayPointsMat.disableLighting = true
  wayPointsMat.emissiveColor = BABYLON.Color3.Magenta()

  const vehicleMesh = createVehicle(scene, { size: 2 })
  window.addEventListener('resize', onWindowResize, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  const path = new YUKA.Path()
  path.loop = true
  path.add(new YUKA.Vector3(10, 0, 10))
  path.add(new YUKA.Vector3(10, 10, -10))
  path.add(new YUKA.Vector3(-10, 0, -10))
  path.add(new YUKA.Vector3(-10, 0, 10))

  vehicle = new YUKA.Vehicle()
  vehicle.maxSpeed = 3
  vehicle.setRenderComponent(vehicleMesh, sync)

  vehicle.boundingRadius = vehicleMesh.getBoundingInfo().boundingSphere.radius
  vehicle.smoother = new YUKA.Smoother(20)

  entityManager.add(vehicle)

  const obstacleAvoidanceBehavior = new YUKA.ObstacleAvoidanceBehavior(obstacles)
  vehicle.steering.add(obstacleAvoidanceBehavior)

  const followPathBehavior = new YUKA.FollowPathBehavior(path)
  vehicle.steering.add(followPathBehavior)

  // obstacles

  setupObstacles()
  setupWaypoints(path)
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

function setupObstacles() {
  const mesh1 = BABYLON.MeshBuilder.CreateBox('mesh1', { size: 2 }, scene)
  const mesh2 = BABYLON.MeshBuilder.CreateBox('mesh1', { width: 2, height: 6, depth: 2 }, scene)
  const mesh3 = BABYLON.MeshBuilder.CreateBox('mesh1', { size: 2 }, scene)

  const meshMat = new BABYLON.StandardMaterial('meshMat', scene)
  meshMat.disableLighting = true
  meshMat.emissiveColor = BABYLON.Color3.Red()

  mesh1.material = meshMat
  mesh2.material = meshMat
  mesh3.material = meshMat

  mesh1.position.set(-10, 0, 0)
  mesh2.position.set(11, 6, 0)
  mesh3.position.set(4, 8, -10)

  const obstacle1 = new YUKA.GameEntity()
  obstacle1.position.copy(mesh1.position)
  obstacle1.boundingRadius = mesh1.getBoundingInfo().boundingSphere.radius * 1.4
  entityManager.add(obstacle1)
  obstacles.push(obstacle1)

  const obstacle2 = new YUKA.GameEntity()
  obstacle2.position.copy(mesh2.position)
  obstacle2.boundingRadius = mesh2.getBoundingInfo().boundingSphere.radius
  entityManager.add(obstacle2)
  obstacles.push(obstacle2)

  const obstacle3 = new YUKA.GameEntity()
  obstacle3.position.copy(mesh3.position)
  obstacle3.boundingRadius = mesh3.getBoundingInfo().boundingSphere.radius
  entityManager.add(obstacle3)
  obstacles.push(obstacle3)
}

function setupWaypoints(path) {
  path._waypoints.forEach((p) => {
    const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', { diameter: 0.4 }, scene)
    sphere.material = scene.getMaterialByName('wayPointsMat')
    sphere.position.x = p.x
    sphere.position.y = p.y
    sphere.position.z = p.z
  })
}
