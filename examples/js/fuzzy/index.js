/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import * as YUKA from '../../../lib/yuka.module.js'
import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

import { Soldier } from './src/Soldier.js'

let engine, scene, camera
let entityManager, time
let soldier, zombie

const entityMatrix = new BABYLON.Matrix()

const params = {
  distance: 8,
  ammoShotgun: 12,
  ammoAssaultRifle: 30,
}

init()

//

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = BABYLON.Color3.FromHexString('#a0a0a0')
  scene.useRightHandedSystem = true

  camera = new BABYLON.ArcRotateCamera('camera', -1.54, 1.37, 2.1, new BABYLON.Vector3(-0.45, 1.32, 0.58), scene, true)
  camera.attachControl()
  camera.wheelDeltaPercentage = 0.02

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2
  scene.fogColor = BABYLON.Color3.FromHexString('#a0a0a0')
  scene.fogDensity = 0.01

  // scene.debugLayer.show()

  //
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 250, height: 250 }, scene)
  const groundMaterial = new BABYLON.StandardMaterial('ground', scene)
  groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#999999')
  // ground.position.y = -2
  ground.material = groundMaterial
  ground.receiveShadows = true

  //

  const hemiLight = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(100, 100, 10), scene)
  const dirLight = new BABYLON.DirectionalLight('dir-light', new BABYLON.Vector3(-10, 10, 10), scene)
  dirLight.range = 100
  const shadowGenerator = new BABYLON.ShadowGenerator(1024, dirLight)

  createPolarHelper()

  BABYLON.SceneLoader.ImportMesh(
    null,
    'model/',
    'soldier.glb',
    scene,
    (soldierMeshes, _, __, ___, soldierTransformNodes) => {
      BABYLON.SceneLoader.ImportMesh(null, 'model/', 'zombie.glb', scene, (zombieMeshes) => {
        BABYLON.SceneLoader.ImportMesh(null, 'model/', 'assaultRifle.glb', scene, (assaultRifleMeshes) => {
          BABYLON.SceneLoader.ImportMesh(
            null,
            '../playground/hideAndSeek/model/',
            'shotgun.glb',
            scene,
            (shotGunMeshes) => {
              // game setup
              // debugger
              entityManager = new YUKA.EntityManager()
              time = new YUKA.Time()

              //
              // Soldier
              //
              soldierMeshes.forEach((mesh) => {
                shadowGenerator.addShadowCaster(mesh)
              })
              const soldierRoot = soldierMeshes[0]
              soldierRoot.name = 'soldier'

              soldier = new Soldier()
              soldier.rotation = new BABYLON.Vector3(0, Math.PI * -0.05, 0)
              // soldier.setRenderComponent(soldierRoot, sync)

              entityManager.add(soldier)

              //
              // Zombie
              //
              zombieMeshes.forEach((mesh) => {
                shadowGenerator.addShadowCaster(mesh)
              })

              const zombieRoot = zombieMeshes[0]
              zombieRoot.name = 'zombie'

              zombie = new YUKA.GameEntity()
              zombie.name = 'zombie'
              zombie.position.set(0, 0, params.distance)
              zombie.setRenderComponent(zombieRoot, sync)

              entityManager.add(zombie)

              //
              // Assault rifle
              //
              assaultRifleMeshes.forEach((mesh) => {
                shadowGenerator.addShadowCaster(mesh)
              })
              const assaultRifleRoot = assaultRifleMeshes[0]
              assaultRifleRoot.name = 'assault-rifle'
              assaultRifleRoot.scaling = new BABYLON.Vector3(150, 150, 150)
              console.log(assaultRifleRoot.scaling)
              assaultRifleRoot.rotation = new BABYLON.Vector3(
                BABYLON.Tools.ToRadians(360),
                BABYLON.Tools.ToRadians(90),
                BABYLON.Tools.ToRadians(90)
              )
              assaultRifleRoot.position = new BABYLON.Vector3(-30, 200, 70)

              //
              // Shotgun
              //
              shotGunMeshes.forEach((mesh) => {
                shadowGenerator.addShadowCaster(mesh)
              })

              const shotGunRoot = shotGunMeshes[0]
              shotGunRoot.name = 'shotgun'
              shotGunRoot.scaling = new BABYLON.Vector3(0.35, -0.35, 0.35)
              shotGunRoot.rotation = new BABYLON.Vector3(
                BABYLON.Tools.ToRadians(180),
                BABYLON.Tools.ToRadians(-90),
                BABYLON.Tools.ToRadians(90)
              )
              shotGunRoot.position = new BABYLON.Vector3(-50, 300, -20)

              //

              const rightHand = soldierTransformNodes.find((tn) => tn.name === 'Armature_mixamorig:RightHand')
              assaultRifleRoot.parent = rightHand
              shotGunRoot.parent = rightHand

              soldier.assaultRifle = assaultRifleRoot
              soldier.shotgun = shotGunRoot

              zombie.lookAt(soldier.position)

              //

              const loadingScreen = document.getElementById('loading-screen')

              loadingScreen.classList.add('fade-out')
              loadingScreen.addEventListener('transitionend', onTransitionEnd)

              //

              window.addEventListener('resize', onWindowResize, false)

              //

              initUI()
              animate()
            }
          )
        })
      })
    }
  )

  function initUI() {
    const gui = new DAT.GUI({ width: 400 })

    gui
      .add(params, 'distance', 5, 20)
      .name('Distance To Enemy')
      .onChange((value) => {
        zombie.position.z = value
      })

    gui
      .add(params, 'ammoShotgun', 0, 12)
      .step(1)
      .name('Ammo Shotgun')
      .onChange((value) => {
        soldier.ammoShotgun = value
      })

    gui
      .add(params, 'ammoAssaultRifle', 0, 30)
      .step(1)
      .name('Ammo Assault Rifle')
      .onChange((value) => {
        soldier.ammoAssaultRifle = value
      })
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
  BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).decomposeToTransformNode(renderComponent)
}

function onTransitionEnd(event) {
  event.target.remove()
}

function createPolarHelper(scene) {
  const polarHelper = new BABYLON.TransformNode('polarHelper', scene)

  const radius = 1

  const circleCount = 20
  for (let c = 0; c < circleCount; c++) {
    var points = []

    for (var i = -Math.PI; i <= Math.PI; i += Math.PI / 360) {
      const r = c * radius
      points.push(new BABYLON.Vector3(r * Math.cos(i), 0, r * Math.sin(i)))
    }

    const baseCircle = BABYLON.MeshBuilder.CreateLines(`circle-${c}`, { points }, scene)
    baseCircle.parent = polarHelper
  }

  const myLines = []
  const sectorCount = 12
  for (var i = -Math.PI; i <= Math.PI; i += Math.PI / sectorCount) {
    const r1 = radius
    const r2 = radius + 18
    myLines.push([
      new BABYLON.Vector3(r1 * Math.cos(i), 0, r1 * Math.sin(i)),
      new BABYLON.Vector3(r2 * Math.cos(i), 0, r2 * Math.sin(i)),
    ])
  }
  //Create linesystem
  const linesystem = BABYLON.MeshBuilder.CreateLineSystem('linesystem', { lines: myLines })
  linesystem.parent = polarHelper

  return polarHelper
}
