import * as YUKA from '../../../../lib/yuka.module.js'
import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import { createVehicle } from '../../creator.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

let engine, scene
let entityManager, time, pursuer, evader, target

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
    BABYLON.Tools.ToRadians(30),
    BABYLON.Tools.ToRadians(40),
    15,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)
  ground.visibility = 0.5
  ground.material.backFaceCulling = false

  //

  const pursuerMesh = createVehicle(scene)

  const evaderMesh = BABYLON.MeshBuilder.CreateBox('box', { size: 0.2 }, scene)

  const evaderMaterial = new BABYLON.StandardMaterial('evaderMaterial', scene)
  evaderMaterial.disableLighting = true
  evaderMaterial.emissiveColor = new BABYLON.Color3(1, 0, 0)

  evaderMesh.material = evaderMaterial

  /*	
const grid = new THREE.GridHelper( 10, 25 );
scene.add( grid );
*/
  //

  //

  window.addEventListener('resize', onWindowResize, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  target = new YUKA.Vector3()

  evader = new YUKA.Vehicle()
  evader.maxSpeed = 3
  evader.setRenderComponent(evaderMesh, sync)

  pursuer = new YUKA.Vehicle()
  pursuer.maxSpeed = 3
  pursuer.position.z = -5
  pursuer.setRenderComponent(pursuerMesh, sync)

  const pursuitBehavior = new YUKA.PursuitBehavior(evader, 2)
  pursuer.steering.add(pursuitBehavior)

  const seekBehavior = new YUKA.SeekBehavior(target)
  evader.steering.add(seekBehavior)

  entityManager.add(evader)
  entityManager.add(pursuer)

  // dat.gui

  const gui = new DAT.GUI({ width: 300 })

  gui.add(pursuitBehavior, 'predictionFactor', 0, 5).name('prediction factor')

  gui.open()
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const deltaTime = time.update().getDelta()
  const elapsedTime = time.getElapsed()

  target.x = Math.cos(elapsedTime) * Math.sin(elapsedTime * 0.2) * 6
  target.y = Math.cos(elapsedTime) * Math.sin(elapsedTime * 0.2) * 12 + 2
  target.z = Math.sin(elapsedTime * 0.8) * 6

  //	console.log(target.x)

  entityManager.update(deltaTime)

  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}
