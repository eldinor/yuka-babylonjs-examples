import * as YUKA from '../../../../lib/yuka.module.js'
import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
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
  //	scene.debugLayer.show();

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(-90),
    BABYLON.Tools.ToRadians(180),
    15,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, -1, 0))

  //

  const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder(
    'cone',
    { height: 0.5, diameterTop: 0, diameterBottom: 0.25 },
    scene
  )
  vehicleMesh.rotation.x = Math.PI * 0.5
  vehicleMesh.bakeCurrentTransformIntoVertices()

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

  //

  window.addEventListener('resize', onWindowResize, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()
  vehicle = new YUKA.Vehicle()

  vehicle.setRenderComponent(vehicleMesh, sync)

  const path = new YUKA.Path()
  path.loop = true
  path.add(new YUKA.Vector3(-4, 0, 4))
  path.add(new YUKA.Vector3(-6, 0, 0))
  path.add(new YUKA.Vector3(-4, 0, -4))
  path.add(new YUKA.Vector3(0, 0, 0))
  path.add(new YUKA.Vector3(4, 0, -4))
  path.add(new YUKA.Vector3(6, 0, 0))
  path.add(new YUKA.Vector3(4, 0, 4))
  path.add(new YUKA.Vector3(0, 0, 6))

  vehicle.position.copy(path.current())

  // use "FollowPathBehavior" for basic path following

  const followPathBehavior = new YUKA.FollowPathBehavior(path, 0.5)
  vehicle.steering.add(followPathBehavior)

  // use "OnPathBehavior" to realize a more strict path following.
  // it's a separate steering behavior to provide more flexibility.

  onPathBehavior = new YUKA.OnPathBehavior(path)
  vehicle.steering.add(onPathBehavior)

  entityManager.add(vehicle)

  //

  const position = []

  for (let i = 0; i < path._waypoints.length; i++) {
    const waypoint = path._waypoints[i]

    position.push(waypoint.x, waypoint.y, waypoint.z)
  }

  path._waypoints.push(path._waypoints[0]) // to close the line
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
