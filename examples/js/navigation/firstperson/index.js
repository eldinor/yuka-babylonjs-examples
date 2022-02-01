import * as YUKA from '../../../../lib/yuka.module.js'
import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

import { FirstPersonControls } from './src/FirstPersonControls.js'
import { Player } from './src/Player.js'

let engine, scene, camera, cameraParent

let entityManager, time, controls

const entityMatrix = new BABYLON.Matrix()

init()

//

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = BABYLON.Color3.FromHexString('#a0a0a0')
  scene.useRightHandedSystem = true

  scene.debugLayer.show()

  cameraParent = new BABYLON.TransformNode('camera-parent', scene)
  camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(-13, -0.75, -9), scene, true)
  cameraParent.rotationQuaternion = new BABYLON.Quaternion()

  // camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.parent = cameraParent
  camera.attachControl(canvas, true)

  // TODO: add fog
  // scene.fog = new THREE.Fog( 0xa0a0a0, 20, 40 );

  //

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 150, height: 150 }, scene)
  ground.position.y = -1
  const groundMaterial = new BABYLON.StandardMaterial('grid', scene)
  groundMaterial.diffuseColor = BABYLON.Color3.FromHexString('#999999')
  ground.material = groundMaterial
  ground.rotation.x = -Math.PI / 2

  //

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0), scene)
  new BABYLON.DirectionalLight('dir-light', new BABYLON.Vector3(1, 1, 0), scene)

  //
  BABYLON.SceneLoader.ImportMesh(null, 'model/', 'house.glb', scene, (meshes) => {
    // TODO: set alpha
    // if ( object.isMesh ) object.material.alphaTest = 0.5;

    // 3D assets are loaded, now load nav mesh

    const loader = new YUKA.NavMeshLoader()
    loader.load('./navmesh/navmesh.glb', { epsilonCoplanarTest: 0.25 }).then((navMesh) => {
      player.navMesh = navMesh

      const loadingScreen = document.getElementById('loading-screen')

      loadingScreen.classList.add('fade-out')
      loadingScreen.addEventListener('transitionend', onTransitionEnd)

      animate()
    })
  })

  //

  // const audioLoader = new THREE.AudioLoader( loadingManager );
  // const listener = new THREE.AudioListener();
  // camera.add( listener );

  // const step1 = new THREE.Audio( listener );
  // const step2 = new THREE.Audio( listener );

  // audioLoader.load( 'audio/step1.ogg', buffer => step1.setBuffer( buffer ) );
  // audioLoader.load( 'audio/step2.ogg', buffer => step2.setBuffer( buffer ) );

  //

  //

  // TODO: set gamma
  // renderer.gammaOutput = true

  window.addEventListener('resize', onWindowResize, false)

  const intro = document.getElementById('intro')

  intro.addEventListener(
    'click',
    () => {
      controls.connect()
      // TODO: set audio
      // const context = THREE.AudioContext.getContext();
      // if ( context.state === 'suspended' ) context.resume();
    },
    false
  )

  // game setup

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  const player = new Player()
  // player.head.setRenderComponent(cameraParent, sync)
  player.setRenderComponent(cameraParent, sync)
  player.position.set(-13, -0.75, -9)

  controls = new FirstPersonControls(player)
  controls.setRotation(-2.2, 0.2)

  // controls.sounds.set('rightStep', step1)
  // controls.sounds.set('leftStep', step2)

  controls.addEventListener('lock', () => {
    intro.classList.add('hidden')
  })

  controls.addEventListener('unlock', () => {
    intro.classList.remove('hidden')
  })

  entityManager.add(player)
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

let updateFlag = 0
function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  const matrix = renderComponent.getViewMatrix()
  matrix.copyFrom(entityMatrix)
  matrix.updateFlag = updateFlag++
  // console.log(entity.position.x, entity.position.y, entity.position.z)
  // cameraParent.position.x = entity.position.x
  // cameraParent.position.y = entity.position.y
  // cameraParent.position.z = entity.position.z
  // cameraParent.rotationQuaternion.x = -entity.rotation.x
  // cameraParent.rotationQuaternion.y = entity.rotation.y
  // cameraParent.rotationQuaternion.z = entity.rotation.z
  // cameraParent.rotationQuaternion.w = entity.rotation.w
  // renderComponent.rotation.x = entity.rotation.x
  // renderComponent.rotation.y = entity.rotation.y
  // renderComponent.rotation.z = entity.rotation.z
  // console.log(entity.rotation)
}

function onTransitionEnd(event) {
  event.target.remove()
}
