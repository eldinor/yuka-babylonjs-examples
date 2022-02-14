/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import * as YUKA from '../../../../lib/yuka.module.js'
import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

import { FirstPersonControls } from './src/FirstPersonControls.js'
import { Player } from './src/Player.js'

let engine, scene, camera, step1, step2
let entityManager, time, controls

const entityMatrix = new BABYLON.Matrix()

init()

//

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  if (BABYLON.Engine.audioEngine) {
    BABYLON.Engine.audioEngine.useCustomUnlockedButton = true
  }

  scene = new BABYLON.Scene(engine)
  scene.clearColor = BABYLON.Color3.FromHexString('#a0a0a0')
  scene.useRightHandedSystem = true

  camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(-13, 0.75, -9), scene, true)
  camera.minZ = 0.1

  scene.fogMode = BABYLON.Scene.FOGMODE_EXP2
  scene.fogColor = BABYLON.Color3.FromHexString('#a0a0a0')
  scene.fogDensity = 0.01

  //
  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 250, height: 250 }, scene)
  ground.position.y = -5
  const groundMaterial = new BABYLON.StandardMaterial('grid', scene)
  groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#999999')
  ground.material = groundMaterial

  //

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene)
  new BABYLON.DirectionalLight('dir-light', new BABYLON.Vector3(1, 1, 0), scene)

  //
  BABYLON.SceneLoader.ImportMesh(null, 'model/', 'house.glb', scene, (meshes) => {
    // 3D assets are loaded, now load nav mesh

    const loader = new YUKA.NavMeshLoader()
    loader.load('./navmesh/navmesh.glb', { epsilonCoplanarTest: 0.25 }).then((navMesh) => {
      const loadingScreen = document.getElementById('loading-screen')

      loadingScreen.classList.add('fade-out')
      loadingScreen.addEventListener('transitionend', onTransitionEnd)

      //

      step1 = new BABYLON.Sound('step1', 'audio/step1.ogg', scene, null, {
        loop: false,
        autoplay: false,
      })

      step2 = new BABYLON.Sound('step2', 'audio/step2.ogg', scene, null, {
        loop: false,
        autoplay: false,
      })

      //

      window.addEventListener('resize', onWindowResize, false)

      const intro = document.getElementById('intro')

      intro.addEventListener(
        'click',
        () => {
          if (BABYLON.Engine.audioEngine) {
            BABYLON.Engine.audioEngine.unlock()
          }

          controls.connect()
        },
        false
      )

      // game setup

      entityManager = new YUKA.EntityManager()
      time = new YUKA.Time()

      const player = new Player()
      player.navMesh = navMesh
      player.head.setRenderComponent(camera, syncCamera)
      player.position.set(-13, -0.75, -9)

      controls = new FirstPersonControls(player)
      controls.setRotation(-2.2, 0.2)

      controls.sounds.set('rightStep', step1)
      controls.sounds.set('leftStep', step2)

      controls.addEventListener('lock', () => {
        intro.classList.add('hidden')
      })

      controls.addEventListener('unlock', () => {
        intro.classList.remove('hidden')
      })

      entityManager.add(player)

      animate()
    })
  })
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const delta = time.update().getDelta()
  controls.update(delta)
  entityManager.update(delta)

  scene.render()
}

function syncCamera(entity, renderComponent) {
  renderComponent.getViewMatrix().copyFrom(BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).invert())
}

function onTransitionEnd(event) {
  event.target.remove()
}
