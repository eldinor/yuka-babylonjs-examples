/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

import { CustomEntity } from './src/CustomEntity.js'
import { Obstacle } from '../common/Obstacle.js'
import { createVisionHelper } from '../common/VisionHelper.js'
import { createVehicle } from '../../creator.js'

let engine, scene, targetMaterial
let entityManager, time, entity, target

const entityMatrix = new BABYLON.Matrix()
const pointer = new BABYLON.Vector2(1, 1)

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
    BABYLON.Tools.ToRadians(90),
    BABYLON.Tools.ToRadians(40),
    12,
    new BABYLON.Vector3(0, 0, 0),
    scene
  )

  camera.setTarget(new BABYLON.Vector3(0, -4, 0))
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 10, height: 10 }, scene)
  ground.position.y = -1
  ground.position.z = 1
  const groundMaterial = new BABYLON.GridMaterial('grid', scene)
  groundMaterial.gridRatio = 0.4
  ground.visibility = 0.35
  ground.material = groundMaterial

  const obstacleMesh = BABYLON.MeshBuilder.CreateBox('obstacleMesh', { width: 2, height: 2, depth: 0.2 }, scene)
  obstacleMesh.rotation.y = Math.PI
  obstacleMesh.position.z = 2
  obstacleMesh.material = new BABYLON.StandardMaterial('obstacle', scene)
  obstacleMesh.material.backFaceCulling = false

  const entityMesh = createVehicle(scene)

  const targetMesh = BABYLON.MeshBuilder.CreateSphere('target', { diameter: 0.15, segments: 8 }, scene)
  targetMaterial = new BABYLON.StandardMaterial('target', scene)
  targetMesh.material = targetMaterial
  targetMaterial.emissiveColor = BABYLON.Color3.Red()
  targetMaterial.disableLighting = true

  scene.onPointerMove = () => {
    var pickResult = scene.pick(scene.pointerX, scene.pointerY)
    if (pickResult?.pickedPoint) {
      target.x = pickResult.pickedPoint.x
      target.y = pickResult.pickedPoint.y
      target.z = pickResult.pickedPoint.z
    }
  }

  window.addEventListener('resize', onWindowResize, false)

  // YUKA specific
  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  const vertices = obstacleMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
  const indices = obstacleMesh.getIndices()
  const geometry = new YUKA.MeshGeometry(vertices, indices)

  const obstacle = new Obstacle(geometry)
  obstacle.name = 'obstacle'
  obstacle.position.z = 3
  obstacle.setRenderComponent(obstacleMesh, sync)

  target = new YUKA.GameEntity()
  target.name = 'target'
  target.setRenderComponent(targetMesh, sync)

  const entity = new CustomEntity()
  entity.setRenderComponent(entityMesh, sync)

  const helper = createVisionHelper(entity.vision)

  entityManager.add(entity)
  entityManager.add(obstacle)
  entityManager.add(target)
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  time.update()

  const delta = time.getDelta()
  const elapsed = time.getElapsed()

  target.position.set(Math.sin(elapsed * 0.3) * 5, 0, 4)

  entityManager.update(delta)

  scene.render()
}

function sync(entity, renderComponent) {
  BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).decomposeToTransformNode(renderComponent)
}
