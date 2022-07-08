/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import * as YUKA from '../../../../lib/yuka.module.js'
import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

// import { createGraphHelper } from '../../graph/GraphHelper.js'
import { createCellSpaceHelper } from '../common/CellSpacePartitioningHelper.js'
import { createConvexRegionHelper } from '../common/NavMeshHelper.js'

import { CustomVehicle } from './src/CustomVehicle.js'
import { PathPlanner } from './src/PathPlanner.js'
import { createVehicle } from '../../creator.js'

let engine,
  scene,
  camera,
  pathHelperParent,
  vehicleMeshes = []

let entityManager, time, pathPlanner

const entityMatrix = new BABYLON.Matrix()

const vehicleCount = 100
const vehicles = []
const pathHelpers = []

const params = {
  showNavigationPaths: false,
  showRegions: false,
  showSpatialIndex: false,
}

let spatialIndexHelper
let regionHelper

init()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  scene.useRightHandedSystem = true

  camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(40),
    BABYLON.Tools.ToRadians(40),
    90,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene)
  new BABYLON.DirectionalLight('dir-light', new BABYLON.Vector3(1, 1, 0), scene)

  // dat.gui
  const gui = new DAT.GUI({ width: 400 })

  gui
    .add(params, 'showNavigationPaths', 1, 30)
    .name('show navigation paths')
    .onChange((value) => {
      pathHelperParent.setEnabled(value)
    })

  gui
    .add(params, 'showRegions', 1, 30)
    .name('show regions')
    .onChange((value) => {
      regionHelper.setEnabled(value)
    })

  gui
    .add(params, 'showSpatialIndex', 1, 30)
    .name('show spatial index')
    .onChange((value) => {
      spatialIndexHelper.setEnabled(value)
    })

  gui.open()

  //

  window.addEventListener('resize', onWindowResize, false)

  BABYLON.SceneLoader.ImportMesh(null, 'model/', 'level.glb', scene, (meshes) => {
    meshes[0].rotation = new BABYLON.Vector3(0, Math.PI, 0)

    // 3D assets are loaded, now load nav mesh
    const loader = new YUKA.NavMeshLoader()
    loader.load('../common/navmeshes/complex/navmesh.glb').then((navigationMesh) => {
      // visualize convex regions

      regionHelper = createConvexRegionHelper(navigationMesh)
      regionHelper.setEnabled(false)

      entityManager = new YUKA.EntityManager()
      time = new YUKA.Time()

      pathPlanner = new PathPlanner(navigationMesh)

      // setup spatial index

      const width = 100,
        height = 40,
        depth = 75
      const cellsX = 20,
        cellsY = 5,
        cellsZ = 20

      navigationMesh.spatialIndex = new YUKA.CellSpacePartitioning(width, height, depth, cellsX, cellsY, cellsZ)
      navigationMesh.updateSpatialIndex()

      spatialIndexHelper = createCellSpaceHelper(navigationMesh.spatialIndex, scene)
      spatialIndexHelper.setEnabled(false)

      // create vehicles
      const vehicleMeshPrefab = createVehicle(scene, { size: 0.8, y: 1 })

      const vehicleMeshMaterial = new BABYLON.StandardMaterial('vehicle', scene)
      vehicleMeshMaterial.diffuseColor = BABYLON.Color3.Red()
      vehicleMeshPrefab.material = vehicleMeshMaterial
      vehicleMeshPrefab.setEnabled(false)

      pathHelperParent = new BABYLON.TransformNode('path-helper-parent', scene)
      pathHelperParent.setEnabled(false)

      for (let i = 0; i < vehicleCount; i++) {
        const vehicleMesh = vehicleMeshPrefab.clone(`vehixle-${i}`)
        vehicleMeshes[i] = vehicleMesh
        vehicleMesh.setEnabled(true)

        // vehicle
        const vehicle = new CustomVehicle()
        vehicle.navMesh = navigationMesh
        vehicle.maxSpeed = 1.5
        vehicle.maxForce = 10

        const toRegion = vehicle.navMesh.getRandomRegion()
        vehicle.position.copy(toRegion.centroid)
        vehicle.toRegion = toRegion

        const followPathBehavior = new YUKA.FollowPathBehavior()
        followPathBehavior.nextWaypointDistance = 0.5
        followPathBehavior.active = false
        vehicle.steering.add(followPathBehavior)

        entityManager.add(vehicle)
        vehicles.push(vehicle)
      }

      // update UI

      const entityCount = document.getElementById('entityCount')
      entityCount.textContent = vehicleCount

      const regionCount = document.getElementById('regionCount')
      regionCount.textContent = navigationMesh.regions.length

      const partitionCount = document.getElementById('partitionCount')
      partitionCount.textContent = navigationMesh.spatialIndex.cells.length

      const loadingScreen = document.getElementById('loading-screen')

      loadingScreen.classList.add('fade-out')
      loadingScreen.addEventListener('transitionend', onTransitionEnd)

      //

      animate()
    })
  })
}

function onPathFound(vehicle, path) {
  // update path helper

  const index = vehicles.indexOf(vehicle)
  let pathHelper = pathHelpers[index]

  if (pathHelper) {
    pathHelper.dispose()
  }

  pathHelper = BABYLON.MeshBuilder.CreateLines(
    `path-helper`,
    {
      points: path,
      updatable: true,
    },
    scene
  )
  pathHelper.parent = pathHelperParent
  pathHelper.color = BABYLON.Color3.Red()
  pathHelpers[index] = pathHelper

  // update path and steering

  const followPathBehavior = vehicle.steering.behaviors[0]
  followPathBehavior.active = true
  followPathBehavior.path.clear()

  for (const point of path) {
    followPathBehavior.path.add(point)
  }
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)
  updatePathfinding()

  const delta = time.update().getDelta()
  entityManager.update(delta)
  pathPlanner.update()
  updateInstancing()

  scene.render()
}

function updatePathfinding() {
  for (let i = 0, l = vehicles.length; i < l; i++) {
    const vehicle = vehicles[i]

    if (vehicle.currentRegion === vehicle.toRegion) {
      vehicle.fromRegion = vehicle.toRegion
      vehicle.toRegion = vehicle.navMesh.getRandomRegion()

      const from = vehicle.position
      const to = vehicle.toRegion.centroid

      pathPlanner.findPath(vehicle, from, to, onPathFound)
    }
  }
}

function updateInstancing() {
  for (let i = 0, l = vehicles.length; i < l; i++) {
    const vehicle = vehicles[i]
    const vehicleMesh = vehicleMeshes[i]
    BABYLON.Matrix.FromValues(...vehicle.worldMatrix.elements).decomposeToTransformNode(vehicleMesh)
  }
}

function onTransitionEnd(event) {
  event.target.remove()
}
