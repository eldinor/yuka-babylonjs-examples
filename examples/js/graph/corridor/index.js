import * as YUKA from '../../../../lib/yuka.module.js'
import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

let engine, scene

let entityManager, time, vehicle

const entityMatrix = new BABYLON.Matrix()

let lines

let onPathBehavior

const params = {
  onPathActive: true,
  radius: 0.1,
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
    BABYLON.Tools.ToRadians(60),
    BABYLON.Tools.ToRadians(20),
    20,
    BABYLON.Vector3.Zero(),
    scene
  )
  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  let light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 0, 1))
  light.intensity = 2
  light.diffuse = BABYLON.Color3.Red()
  //

  const vehicleMesh = createVehicle(scene, { size: 0.8 })
  // dat.gui

  const gui = new DAT.GUI({ width: 300 })

  gui
    .add(params, 'onPathActive')
    .name('activate onPath')
    .onChange((value) => (onPathBehavior.active = value))
  gui
    .add(params, 'radius', 0.01, 1)
    .name('radius')
    .onChange((value) => (onPathBehavior.radius = value))

  gui.open()

  //
  window.addEventListener('resize', onWindowResize, false)

  const evaderMaterial = new BABYLON.StandardMaterial('evaderMaterial', scene)
  evaderMaterial.disableLighting = true
  evaderMaterial.emissiveColor = new BABYLON.Color3(1, 0, 1)

  const evmat = evaderMaterial.clone('evmat')
  evmat.emissiveColor = new BABYLON.Color3(0, 1, 1)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()
  vehicle = new YUKA.Vehicle()
  vehicle.maxSpeed = 2
  vehicle.smoother = new YUKA.Smoother(20)

  vehicle.setRenderComponent(vehicleMesh, sync)

  const corridor = new YUKA.Corridor()
  // console.log(corridor);

  const from = new YUKA.Vector3(-8, 0, 0) // the start point
  const to = new YUKA.Vector3(-4, 0, 0) // the end point

  // create 2 spheres to mark the start and end points
  const fromMesh = BABYLON.MeshBuilder.CreateSphere('from', {
    diameter: 0.4,
    segments: 16,
  })
  fromMesh.position.x = from.x
  const toMesh = BABYLON.MeshBuilder.CreateSphere('to', {
    diameter: 0.4,
    segments: 16,
  })
  toMesh.position.x = to.x

  // Arrays for left and right portal edges
  const leftArray = []
  const rightArray = []

  // Populate arrays
  leftArray.push(new YUKA.Vector3(3, 0, -5))
  leftArray.push(new YUKA.Vector3(6, 0, -8))
  leftArray.push(new YUKA.Vector3(9, 0, -10))
  leftArray.push(new YUKA.Vector3(8, 0, 0))
  leftArray.push(new YUKA.Vector3(5, 0, 0))
  leftArray.push(new YUKA.Vector3(3, 0, 3))
  leftArray.push(new YUKA.Vector3(2, 0, 1))

  rightArray.push(new YUKA.Vector3(3, 0, -7))
  rightArray.push(new YUKA.Vector3(6, 0, -10))
  rightArray.push(new YUKA.Vector3(9, 0, -12))
  rightArray.push(new YUKA.Vector3(10, 0, -2))
  rightArray.push(new YUKA.Vector3(4, 0, -2))
  rightArray.push(new YUKA.Vector3(3, 0, 1))
  rightArray.push(new YUKA.Vector3(2, 0, 0))

  // Visualize portal edges
  leftArray.forEach((p) => {
    const portalEdgeMesh = BABYLON.MeshBuilder.CreateBox('box', { size: 0.4 }, scene)

    portalEdgeMesh.material = evaderMaterial
    portalEdgeMesh.position.x = p.x
    portalEdgeMesh.position.y = p.y
    portalEdgeMesh.position.z = p.z
  })
  rightArray.forEach((p) => {
    const portalEdgeMesh = BABYLON.MeshBuilder.CreateBox('box', { size: 0.4 }, scene)

    portalEdgeMesh.material = evmat
    portalEdgeMesh.position.x = p.x
    portalEdgeMesh.position.y = p.y
    portalEdgeMesh.position.z = p.z
  })

  // Starting to push our data to the corridor
  corridor.push(from, from) // at the beginning and ending, it's important to push the same object as left and right vertex

  for (let i = 0; i < leftArray.length; i++) {
    corridor.push(leftArray[i], rightArray[i])
  }
  corridor.push(to, to)
  console.log(corridor)

  // generate path from the corridor
  const pathC = corridor.generate()
  console.log('Generated Vector3 Path', pathC)

  const path = new YUKA.Path()

  path.loop = true
  // Adding Vector3 points from the corridor-generated path
  pathC.forEach((p) => {
    path.add(p)
  })

  vehicle.position.copy(path.current())

  // Use "FollowPathBehavior" for basic path following

  const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5)
  vehicle.steering.add(followPathBehavior)

  // use "OnPathBehavior" to realize a more strict path following.
  // it's a separate steering behavior to provide more flexibility.

  onPathBehavior = new YUKA.OnPathBehavior(path)
  vehicle.steering.add(onPathBehavior)

  entityManager.add(vehicle)

  //

  for (let i = 0; i < path._waypoints.length; i++) {
    const waypoint = path._waypoints[i]
  }

  //  path._waypoints.push(path._waypoints[0]); // to close the line
  lines = BABYLON.MeshBuilder.CreateLines('lines', {
    points: path._waypoints,
    updatable: true,
  })

  lines.color = BABYLON.Color3.Teal()
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
