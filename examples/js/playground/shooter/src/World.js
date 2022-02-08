import * as YUKA from '../../../../../lib/yuka.module.js'

// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.max.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

import { AssetManager } from './AssetManager.js'
import { Bullet } from './Bullet.js'
import { Ground } from './Ground.js'
import { Player } from './Player.js'
import { Target } from './Target.js'
import { FirstPersonControls } from './FirstPersonControls.js'

const target = new YUKA.Vector3()
const intersection = {
  point: new YUKA.Vector3(),
  normal: new YUKA.Vector3(),
}

const entityMatrix = new BABYLON.Matrix()
const cameraEntityMatrix = new BABYLON.Matrix()

class World {
  constructor() {
    this.maxBulletHoles = 20

    this.entityManager = new YUKA.EntityManager()
    this.time = new YUKA.Time()

    this.camera = null
    this.scene = null
    this.renderer = null
    this.audios = new Map()
    this.animations = new Map()

    this.player = null
    this.controls = null
    this.obstacles = new Array()
    this.bulletHoles = new Array()

    this.assetManager = new AssetManager()

    this.animate = animate.bind(this)
    this.onIntroClick = onIntroClick.bind(this)
    this.onWindowResize = onWindowResize.bind(this)

    this.ui = {
      intro: document.getElementById('intro'),
      crosshairs: document.getElementById('crosshairs'),
      loadingScreen: document.getElementById('loading-screen'),
    }
  }

  async init() {
    this.initScene()
    await this.assetManager.init(this.scene)
    this.initGround()
    this.initPlayer()
    this.initControls()
    this.initTarget()
    this.initUI()

    this.animate()
  }

  update() {
    const delta = this.time.update().getDelta()

    this.controls.update(delta)

    this.entityManager.update(delta)

    // if (this.mixer) this.mixer.update(delta)

    // this.camera.rotation.x = delta
    this.scene.render()
  }

  add(entity) {
    console.log('Adding entity', entity, entity._renderComponent)
    this.entityManager.add(entity)

    if (entity._renderComponent !== null) {
      // TODO
      // this.scene.add(entity._renderComponent)
    }

    if (entity.geometry) {
      this.obstacles.push(entity)
    }
  }

  remove(entity) {
    this.entityManager.remove(entity)

    if (entity._renderComponent !== null) {
      entity._renderComponent.dispose()
    }

    if (entity.geometry) {
      const index = this.obstacles.indexOf(entity)

      if (index !== -1) {
        this.obstacles.splice(index, 1)
      }
    }
  }

  addBullet(owner, ray) {
    const bulletLine = this.assetManager.models.get('bulletLine')
    bulletLine.setEnabled(true)

    const bullet = new Bullet(owner, ray)
    bullet.setRenderComponent(bulletLine, sync)

    this.add(bullet)
  }

  addBulletHole(position, normal, audio) {
    const bulletHole = this.assetManager.models.get('bulletHole').clone('bullet-hole' + this.bulletHoles.length)
    audio.attachToMesh(bulletHole)

    // var newDecal = BABYLON.MeshBuilder.CreateDecal("decal", cat, pickInfo.pickedPoint, pickInfo.getNormal(true), decalSize);
    // newDecal.material = decalMaterial;

    const s = 1 + Math.random() * 0.5
    bulletHole.scaling = new BABYLON.Vector3(s, s, s)
    bulletHole.position = new BABYLON.Vector3(position.x, position.y, position.z)

    target.copy(position).add(normal)

    // bulletHole.lookAt(new BABYLON.Vector3(target.x, target.y, target.z))

    if (this.bulletHoles.length >= this.maxBulletHoles) {
      const toRemove = this.bulletHoles.shift()
      toRemove.dispose()
    }

    this.bulletHoles.push(bulletHole)
  }

  intersectRay(ray, intersectionPoint, normal = null) {
    const obstacles = this.obstacles
    let minDistance = Infinity
    let closestObstacle = null

    for (let i = 0, l = obstacles.length; i < l; i++) {
      const obstacle = obstacles[i]

      if (
        obstacle.geometry.intersectRay(ray, obstacle.worldMatrix, false, intersection.point, intersection.normal) !==
        null
      ) {
        const squaredDistance = intersection.point.squaredDistanceTo(ray.origin)

        if (squaredDistance < minDistance) {
          minDistance = squaredDistance
          closestObstacle = obstacle

          intersectionPoint.copy(intersection.point)
          if (normal) normal.copy(intersection.normal)
        }
      }
    }

    return closestObstacle === null ? null : closestObstacle
  }

  initScene() {
    const canvas = document.getElementById('renderCanvas')
    this.engine = new BABYLON.Engine(canvas, true, {}, true)

    this.scene = new BABYLON.Scene(this.engine)
    const scene = this.scene

    scene.clearColor = new BABYLON.Color4(0.6, 0.6, 0.6, 1)
    scene.useRightHandedSystem = true

    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2
    scene.fogColor = BABYLON.Color3.FromHexString('#a0a0a0')
    scene.fogDensity = 0.005
    scene.debugLayer
      .show({
        embedMode: true,
      })
      .then(() => {
        const host = document.getElementById('embed-host')
        host.style.zIndex = '999999999'
      })

    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, 0), scene, true)
    this.camera = camera

    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

    this.dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -3, 1), scene)
    this.dirLight.position = new BABYLON.Vector3(3, 9, 3)

    this.audios = this.assetManager.audios

    this.shadowGenerator = new BABYLON.ShadowGenerator(1024, this.dirLight)

    // scene

    window.addEventListener('resize', this.onWindowResize, false)
    this.ui.intro.addEventListener('click', this.onIntroClick, false)
  }

  initGround() {
    const groundMesh = this.assetManager.models.get('ground')
    const vertices = groundMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = groundMesh.getIndices()
    const geometry = new YUKA.MeshGeometry(vertices, indices)

    const ground = new Ground(geometry)
    ground.setRenderComponent(groundMesh, sync)

    this.add(ground)
  }

  initPlayer() {
    const player = new Player(this.camera)
    player.head.setRenderComponent(this.camera, syncCamera)

    this.add(player)
    this.player = player

    // weapon
    const weapon = player.weapon
    const weaponMesh = this.assetManager.models.get('weapon')
    weapon.setRenderComponent(weaponMesh, sync)

    this.shadowGenerator.addShadowCaster(weaponMesh)

    // TODO: audios
    this.audios.get('shot').attachToMesh(weaponMesh)
    this.audios.get('reload').attachToMesh(weaponMesh)
    this.audios.get('empty').attachToMesh(weaponMesh)

    // animations
    this.animations = this.assetManager.animations
  }

  initControls() {
    const player = this.player

    this.controls = new FirstPersonControls(player)

    const intro = this.ui.intro
    const crosshairs = this.ui.crosshairs

    this.controls.addEventListener('lock', () => {
      intro.classList.add('hidden')
      crosshairs.classList.remove('hidden')
    })

    this.controls.addEventListener('unlock', () => {
      intro.classList.remove('hidden')
      crosshairs.classList.add('hidden')
    })
  }

  initTarget() {
    const targetMesh = this.assetManager.models.get('target')
    this.shadowGenerator.addShadowCaster(targetMesh)

    const vertices = targetMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = targetMesh.getIndices()

    const geometry = new YUKA.MeshGeometry(vertices, indices)
    const target = new Target(geometry)
    target.position.set(0, 5, -20)

    target.setRenderComponent(targetMesh, sync)

    this.add(target)
  }

  initUI() {
    const loadingScreen = this.ui.loadingScreen

    loadingScreen.classList.add('fade-out')
    loadingScreen.addEventListener('transitionend', onTransitionEnd)
  }
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()
  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}

function syncCamera(entity, renderComponent) {
  entity.worldMatrix.toArray(cameraEntityMatrix.m)
  cameraEntityMatrix.invert()
  cameraEntityMatrix.markAsUpdated()

  const matrix = renderComponent.getViewMatrix()
  matrix.copyFrom(cameraEntityMatrix)
}

function onIntroClick() {
  this.controls.connect()
}

function onWindowResize() {
  this.engine.resize()
}

function onTransitionEnd(event) {
  event.target.remove()
}

function animate() {
  requestAnimationFrame(this.animate)

  this.update()
}

export default new World()
