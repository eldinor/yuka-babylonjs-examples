/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import * as YUKA from '../../../../lib/yuka.module.js'
import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'

import { createGraphHelper } from '../../graph/GraphHelper.js'
import { createConvexRegionHelper } from '../common/NavMeshHelper.js'
import { createVehicle } from '../../creator.js'

let engine, scene, plane, pathHelper, graphHelper, navMeshGroup, vehicleMesh
let entityManager, time, vehicle, target
let navMesh

const entityMatrix = new BABYLON.Matrix()
const pointer = new BABYLON.Vector2(1, 1)

const params = {
  showNavigationGraph: true,
}

init()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  scene.useRightHandedSystem = true

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(40),
    BABYLON.Tools.ToRadians(60),
    30,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, -1, 0))
  light.intensity = 0.7

  //

  vehicleMesh = createVehicle(scene, { size: 1.5, y: 1 })

  window.addEventListener('resize', onWindowResize, false)

  // gui

  const gui = new DAT.GUI({ width: 300 })

  gui.add(params, 'showNavigationGraph', 1, 30).onChange((value) => {
    if (graphHelper) {
      graphHelper.setEnabled(value)
    }
  })

  gui.open()

  // YUKA specific
  target = new YUKA.Vector3()

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  const loader = new YUKA.NavMeshLoader()
  loader.load('../common/navmeshes/basic/navmesh.gltf').then((navigationMesh) => {
    vehicle = new YUKA.Vehicle()
    vehicle.maxSpeed = 1.5
    vehicle.maxForce = 10
    vehicle.setRenderComponent(vehicleMesh, sync)

    // visualize convex regions
    navMesh = navigationMesh
    navMeshGroup = createConvexRegionHelper(navMesh, scene)

    // visualize graph
    const graph = navMesh.graph
    graphHelper = createGraphHelper(scene, graph, 0.2)

    scene.onPointerMove = () => {
      var pickResult = scene.pick(scene.pointerX, scene.pointerY)
      if (pickResult?.pickedPoint) {
        target.x = pickResult.pickedPoint.x
        target.y = pickResult.pickedPoint.y
        target.z = pickResult.pickedPoint.z
      }
    }

    scene.onPointerPick = (e, pickResult) => {
      if (pickResult?.pickedPoint) {
        findPathTo(new YUKA.Vector3().copy(pickResult.pickedPoint))
      }
    }
    const followPathBehavior = new YUKA.FollowPathBehavior()
    followPathBehavior.active = false
    vehicle.steering.add(followPathBehavior)

    entityManager.add(vehicle)
    animate()
  })
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

function findPathTo(target) {
  const from = vehicle.position
  const to = target

  const path = navMesh.findPath(from, to)

  //

  if (pathHelper) {
    pathHelper.dispose()
  }
  pathHelper = BABYLON.MeshBuilder.CreateLines(
    'path-helper',
    {
      points: path,
      updatable: false,
    },
    scene
  )
  pathHelper.color = BABYLON.Color3.Red()

  //

  const followPathBehavior = vehicle.steering.behaviors[0]
  followPathBehavior.active = true
  followPathBehavior.path.clear()

  for (const point of path) {
    followPathBehavior.path.add(point)
  }
}

function sync(entity, renderComponent) {
  BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).decomposeToTransformNode(renderComponent)
}
