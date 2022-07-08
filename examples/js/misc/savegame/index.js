import 'https://preview.babylonjs.com/babylon.js'

import * as YUKA from '../../../../../lib/yuka.module.js'
import { createVehicle } from '../../creator.js'

import { CustomEntity } from './src/CustomEntity.js'
import { CustomVehicle } from './src/CustomVehicle.js'

let engine, scene

let entityManager, time

let targetMesh, vehicleMesh

const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)

  const camera = new BABYLON.UniversalCamera('UniversalCamera', new BABYLON.Vector3(0, 0, 10), scene)
  camera.target = new BABYLON.Vector3(0, 0, 0)
  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  //

  vehicleMesh = createVehicle(scene, { size: 0.5 })

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

  targetMesh = BABYLON.MeshBuilder.CreateSphere('target', {
    diameter: 0.1,
    segments: 16,
  })
  targetMesh.material = new BABYLON.StandardMaterial('targetMaterial', scene)
  targetMesh.material.disableLighting = true
  targetMesh.material.emissiveColor = new BABYLON.Color3(1, 0, 0)

  //

  window.addEventListener('resize', onWindowResize, false)

  const saveButton = document.getElementById('btn-save')
  saveButton.addEventListener('click', onSave, false)

  const loadButton = document.getElementById('btn-load')
  loadButton.addEventListener('click', onLoad, false)

  const clearButton = document.getElementById('btn-clear')
  clearButton.addEventListener('click', onClear, false)

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  // register custom types so the entity manager is able to instantiate
  // custom objects from JSON

  entityManager.registerType('CustomEntity', CustomEntity)
  entityManager.registerType('CustomVehicle', CustomVehicle)

  if (hasSavegame()) {
    // load an existing savegame

    onLoad()
  } else {
    const target = new CustomEntity()
    target.setRenderComponent(targetMesh, sync)
    target.generatePosition()

    const vehicle = new CustomVehicle()
    vehicle.target = target
    vehicle.setRenderComponent(vehicleMesh, sync)

    const seekBehavior = new YUKA.SeekBehavior(target.position)
    vehicle.steering.add(seekBehavior)

    entityManager.add(target)
    entityManager.add(vehicle)
  }
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

  if (renderComponent.getWorldMatrix() !== undefined) {
    const matrix = renderComponent.getWorldMatrix()
    matrix.copyFrom(entityMatrix)
    matrix.markAsUpdated()
  }
}

// Test function
function syncTest(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)

  if (renderComponent.getWorldMatrix() !== undefined) {
    const matrix = renderComponent.getWorldMatrix()
    matrix.copyFrom(entityMatrix)
    matrix.markAsUpdated()
  }
  if (renderComponent.getWorldMatrix() == undefined) {
    console.log('UNDEFINED')
  }
}

function onSave() {
  const json = entityManager.toJSON()
  const jsonString = JSON.stringify(json)

  localStorage.setItem('yuka_savegame', jsonString)
}

function onLoad() {
  const jsonString = localStorage.getItem('yuka_savegame')

  if (jsonString !== null) {
    try {
      const json = JSON.parse(jsonString)
      entityManager.fromJSON(json)

      console.log('LOADED')

      // restore render components (depends on 3D engine)

      const target = entityManager.getEntityByName('target')
      target.setRenderComponent(targetMesh, syncTest)

      const vehicle = entityManager.getEntityByName('vehicle')
      vehicle.setRenderComponent(vehicleMesh, syncTest)
    } catch (e) {
      console.error(e)
      onClear()
      alert('Invalid Savegame found. Savegame was deleted.')
      window.location.reload()
    }
  }
}

function onClear() {
  localStorage.removeItem('yuka_savegame')

  console.log('yuka_savegame removed')
}

function hasSavegame() {
  return localStorage.getItem('yuka_savegame') !== null
}
