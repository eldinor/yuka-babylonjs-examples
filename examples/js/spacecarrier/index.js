import * as YUKA from '../../../../lib/yuka.module.js'
import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'

import { Carrier } from './src/carrier.js'

let engine, scene
let entityManager, time, vehicle, target, theBase

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
    BABYLON.Tools.ToRadians(90),
    BABYLON.Tools.ToRadians(80),
    10,
    BABYLON.Vector3.Zero(),
    scene
  )
  camera.wheelDeltaPercentage = 0.005
  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas)
  camera.useAutoRotationBehavior = true

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  //

  const vehicleMeshO = BABYLON.MeshBuilder.CreateCylinder(
    'cone',
    { height: 0.5, diameterTop: 0, diameterBottom: 0.25 },
    scene
  )
  vehicleMeshO.rotation.x = Math.PI * 0.5

  const dodecahedron2 = BABYLON.MeshBuilder.CreatePolyhedron('dodecahedron', {
    type: 1,
    size: 0.1,
  })
  dodecahedron2.position.z -= 0.1

  const dodecahedron3 = BABYLON.MeshBuilder.CreatePolyhedron('dodecahedron', {
    type: 3,
    size: 0.1,
  })
  dodecahedron3.position.z -= 0.25

  const vehicleMesh = BABYLON.Mesh.MergeMeshes([vehicleMeshO, dodecahedron2, dodecahedron3], true)

  vehicleMesh.bakeCurrentTransformIntoVertices()

  const cell = new BABYLON.CellMaterial('cell', scene)
  cell.diffuseColor = BABYLON.Color3.Green()
  vehicleMesh.material = cell

  const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {
    diameter: 5,
    segments: 8,
  })
  sphere.material = new BABYLON.StandardMaterial('sphereMaterial', scene)
  sphere.material.disableLighting = true
  sphere.material.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.8)
  sphere.material.alpha = 0.2
  sphere.material.wireframe = true
  sphere.isVisible = true

  const dodecahedron = BABYLON.MeshBuilder.CreatePolyhedron('dodecahedron', {
    type: 1,
  })
  dodecahedron.material = new BABYLON.StandardMaterial('dodecahedronMaterial', scene)
  dodecahedron.material.alpha = 0.2
  dodecahedron.material.emissiveColor = BABYLON.Color3.Teal()
  dodecahedron.material.wireframe = true

  dodecahedron.position.x = 5
  dodecahedron.position.z = 0

  //

  const targetMesh = BABYLON.MeshBuilder.CreatePolyhedron('targetMesh', {
    type: 2,
    size: 0.1,
  })

  targetMesh.material = new BABYLON.CellMaterial('targetMaterial', scene)
  //targetMesh.material.disableLighting = true;
  targetMesh.material.diffuseColor = new BABYLON.Color3(1, 0, 0)

  scene.onBeforeRenderObservable.add(function () {
    dodecahedron.rotation.y += 0.003 * scene.getAnimationRatio()
    sphere.rotation.y -= 0.001 * scene.getAnimationRatio()
    sphere.rotation.x -= 0.002 * scene.getAnimationRatio()
  })

  // Particle systems

  const partTex = new BABYLON.Texture('./src/textures_flare.png', scene)
  const pSystem = BABYLON.ParticleHelper.CreateFromSnippetAsync('7VWTHG#9', scene, false).then((system) => {
    system.particleTexture = partTex
    system.minSize = 0.02
    system.maxSize = 0.05
    system.color1 = new BABYLON.Color4(0.02, 0.086, 0.965, 0.9)
    system.color2 = new BABYLON.Color4(0.5, 255 / 255, 40 / 255, 0.9)
    system.color3 = new BABYLON.Color4(0.5, 255 / 255, 140 / 255, 0.9)

    //  system.createConeEmitter(2, Math.PI / 4);
    system.createPointEmitter(new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, 0, -1))

    system.emitter = vehicleMesh

    system.stop()
  })

  const pSystem2 = BABYLON.ParticleHelper.CreateFromSnippetAsync('7VWTHG#9', scene, false).then((system) => {
    system.particleTexture = partTex
    system.minSize = 0.02
    system.maxSize = 0.05
    system.color1 = new BABYLON.Color4(0.02, 0.086, 0.965, 1)
    system.color2 = new BABYLON.Color4(0.95, 30 / 255, 11 / 255, 1)
    system.color3 = new BABYLON.Color4(0.35, 50 / 255, 177 / 255, 1)
    system.emitRate = 2000
    //  system.createConeEmitter(2, Math.PI / 4);
    system.createPointEmitter(new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(-1, -1, -1))

    system.emitter = vehicleMesh

    system.stop()
    // scene.debugLayer.show();
    //  scene.debugLayer.select(system);
  })

  const pSystem3 = BABYLON.ParticleHelper.CreateFromSnippetAsync('7VWTHG#9', scene, false).then((system) => {
    system.particleTexture = partTex
    system.minSize = 0.02
    system.maxSize = 0.08
    system.color1 = new BABYLON.Color4(0.5, 0.086, 0.4, 0.9)
    system.color2 = new BABYLON.Color4(0, 150 / 255, 250 / 255, 0.9)
    system.color3 = new BABYLON.Color4(0, 150 / 255, 255 / 255, 0.9)

    system.emitRate = 4000

    system.createPointEmitter(new BABYLON.Vector3(1, 1, 1), new BABYLON.Vector3(-1, -1, -1))

    system.emitter = dodecahedron
    system.stop()
  })

  //
  window.addEventListener('resize', onWindowResize, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  target = new YUKA.GameEntity()
  target.setRenderComponent(targetMesh, sync)

  vehicle = new Carrier(scene, time, target)
  vehicle.setRenderComponent(vehicleMesh, sync)

  const arriveBehavior = new YUKA.ArriveBehavior(target.position, 2.5, 0.1)
  arriveBehavior.active = false
  vehicle.steering.add(arriveBehavior)

  vehicle.stateMachine.changeTo('IDLE')
  entityManager.add(target)
  entityManager.add(vehicle)

  vehicle.generateTarget()

  theBase = new YUKA.Vector3(5, 0, 0)
  theBase.meshToManage = dodecahedron
  theBase.goods = 0
  entityManager.add(theBase)
  // console.log(entityManager)
  // console.log(theBase)
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
