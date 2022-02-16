import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'

import { Girl } from './src/Girl.js'
import { Collectible } from './src/Collectible.js'

let engine, scene

let entityManager, time

const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color3.FromHexString('#483d8b').toLinearSpace()
  scene.useRightHandedSystem = true
  const hdrTexture = new BABYLON.CubeTexture('https://playground.babylonjs.com/textures/environment.env', scene)
  hdrTexture.gammaSpace = false
  scene.environmentTexture = hdrTexture
  scene.environmentIntensity = 1

  //	scene.debugLayer.show()

  const camera = new BABYLON.ArcRotateCamera('Camera', Math.PI / 2, Math.PI / 2.8, 14, BABYLON.Vector3.Zero(), scene)
  camera.attachControl(canvas, true)
  camera.lowerRadiusLimit = 10
  camera.upperRadiusLimit = 30
  camera.wheelDeltaPercentage = 0.02

  camera.setTarget(new BABYLON.Vector3.Zero())

  var light = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1.1, -1, -0.25), scene)
  light.position.x = 100
  light.position.y = 400
  light.position.z = 100
  light.intensity = 0.9

  var shadowGenerator = new BABYLON.ShadowGenerator(1024, light)
  shadowGenerator.usePercentageCloserFiltering = true
  shadowGenerator.bias = 0.00001

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 25, height: 25 }, scene)
  ground.position.y = -0.1
  const groundMaterial = new BABYLON.StandardMaterial('ground', scene)
  //	groundMaterial.diffuseColor = new BABYLON.Color3.FromHexString('#d2691e')

  const groundTex = new BABYLON.Texture('./model/yan-ots-UuBR5kbvt4Y-unsplash (1).jpg', scene)
  groundMaterial.diffuseTexture = groundTex

  ground.material = groundMaterial
  ground.receiveShadows = true

  const pipeline = new BABYLON.DefaultRenderingPipeline(
    'defaultPipeline', // The name of the pipeline
    true, // Do you want the pipeline to use HDR texture?
    scene, // The scene instance
    [camera] // The list of cameras to be attached to
  )

  pipeline.samples = 4
  pipeline.glowLayerEnabled = true
  pipeline.glowLayer.intensity = 0.5

  //
  /*
  const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder(
    'cone',
    { height: 0.5, diameterTop: 0, diameterBottom: 0.25 },
    scene
  )
  vehicleMesh.rotation.x = Math.PI * 0.5
  vehicleMesh.bakeCurrentTransformIntoVertices()
*/
  const collectibleMat = new BABYLON.StandardMaterial('collectibleMat', scene)
  collectibleMat.emissiveColor = BABYLON.Color3.FromHexString('#0000cd')

  const collectibleMat1 = new BABYLON.StandardMaterial('collectibleMat1', scene)
  collectibleMat1.emissiveColor = BABYLON.Color3.FromHexString('#ff00ff')
  //

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  for (let i = 0; i < 5; i++) {
    const collectibleMesh = BABYLON.MeshBuilder.CreateBox('box', { size: 0.2 }, scene)
    collectibleMesh.material = collectibleMat
    shadowGenerator.getShadowMap().renderList.push(collectibleMesh)

    const collectible = new Collectible(scene)
    collectible.setRenderComponent(collectibleMesh, sync)
    collectible.spawn()

    entityManager.add(collectible)
  }

  BABYLON.SceneLoader.LoadAssetContainer('./model/', 'yuka.glb', scene, function (container) {
    const girl = new Girl()
    girl.name = 'Yuka'

    container.meshes[0].getChildren()[0].scaling.scaleInPlace(1.6)
    container.meshes[0].getChildren()[0].position.y = -0.1

    shadowGenerator.addShadowCaster(container.meshes[0])

    container.addAllToScene()

    //  console.log(container.animationGroups)
    scene.getMaterialByName('kachujin_MAT').alpha = 1

    container.animationGroups.forEach((a) => {
      a.stop()
    })

    // blend all animations

    for (let aniCounter = 0; aniCounter < container.animationGroups.length; aniCounter++) {
      for (let index = 0; index < container.animationGroups[aniCounter].targetedAnimations.length; index++) {
        let animation = container.animationGroups[aniCounter].targetedAnimations[index].animation
        animation.enableBlending = true
        animation.blendingSpeed = 0.02
      }
    }

    const animations = new Map()

    container.meshes[0].getChildren().forEach((child) => (child._isDirty = true))

    girl.setRenderComponent(container.meshes[0], sync)

    //  container.meshes[0].parent = vehicleMesh

    animations.set('GATHER', container.animationGroups[0])
    animations.set('IDLE', container.animationGroups[1])
    animations.set('WALK', container.animationGroups[5])
    animations.set('RIGHT_TURN', container.animationGroups[3])
    animations.set('LEFT_TURN', container.animationGroups[2])
    //    console.log(animations)

    girl.animations = animations
    entityManager.add(girl)

    function go(aniG) {
      container.animationGroups.forEach((a) => {
        a.stop()
      })
      aniG.play()
      aniG.loopAnimation = true
    }

    go(animations.get('IDLE'))
    //   go(animations.get('WALK'))

    const loadingScreen = document.getElementById('loading-screen')

    loadingScreen.classList.add('fade-out')
    loadingScreen.addEventListener('transitionend', onTransitionEnd)
  }) // model import END

  window.addEventListener('resize', onWindowResize, false)
} // init END

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const delta = time.update().getDelta()

  entityManager.update(delta)

  if (scene.getMeshByName('__root__')) {
    scene.getMeshByName('__root__')._childUpdateId++
  }
  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()
  const matrix = renderComponent.getWorldMatrix()

  //  console.log(scene)
  matrix.copyFrom(entityMatrix)
}
function onTransitionEnd(event) {
  event.target.remove()
}
