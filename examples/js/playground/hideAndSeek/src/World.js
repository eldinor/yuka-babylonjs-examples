/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import * as YUKA from '../../../../../lib/yuka.module.js'

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'

import { AssetManager } from './AssetManager.js'
import { Bullet } from './Bullet.js'
import { Ground } from './Ground.js'
import { Player } from './Player.js'
import { Enemy } from './Enemy.js'
import { CustomObstacle } from './CustomObstacle.js'

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
    this.maxBulletHoles = 48
    this.enemyCount = 4
    this.minSpawningDistance = 10

    this.entityManager = new YUKA.EntityManager()
    this.time = new YUKA.Time()

    this.camera = null
    this.scene = null
    this.renderer = null
    this.audios = new Map()
    this.animations = new Map()

    this.player = null
    this.controls = null
    this.enemies = new Array()
    this.obstacles = new Array()
    this.bulletHoles = new Array()
    this.spawningPoints = new Array()
    this.usedSpawningPoints = new Set()

    this.hits = 0
    this.playingTime = 60 // 60s

    this.assetManager = new AssetManager()

    this.animate = animate.bind(this)
    this.onIntroClick = onIntroClick.bind(this)
    this.onWindowResize = onWindowResize.bind(this)

    this.ui = {
      intro: document.getElementById('intro'),
      crosshairs: document.getElementById('crosshairs'),
      loadingScreen: document.getElementById('loading-screen'),
      playingTime: document.getElementById('playingTime'),
      hits: document.getElementById('hits'),
      menu_start: document.getElementById('start'),
      menu_gameover: document.getElementById('gameover'),
      menu_hits: document.getElementById('gameover_hits'),
    }

    this.started = false
    this.gameOver = false
    this.debug = false
  }

  async init() {
    this.initScene()
    await this.assetManager.init(this.scene)
    this.initGround()
    this.initPlayer()
    this.initControls()
    this.initUI()

    this.initObstacles()
    this.initSpawningPoints()

    this.animate()
  }

  update() {
    const delta = this.time.update().getDelta()

    // add enemies if necessary

    const enemies = this.enemies
    console.log(enemies.length, this.enemyCount)
    if (enemies.length < this.enemyCount) {
      for (let i = enemies.length, l = this.enemyCount; i < l; i++) {
        this.addEnemy()
      }
    }

    // update UI

    if (this.started === true && this.gameOver === false) {
      this.playingTime -= delta

      this.refreshUI()

      if (this.playingTime < 0) {
        this.gameOver = true
        this.controls.exit()

        this.ui.menu_start.style.display = 'none'
        this.ui.menu_gameover.style.display = 'block'
        this.ui.menu_hits.textContent = this.hits
      }
    }

    //

    this.controls.update(delta)

    this.entityManager.update(delta)

    this.scene.render()
  }

  add(entity) {
    this.entityManager.add(entity)

    if (entity.geometry) {
      this.obstacles.push(entity)
    }

    if (entity instanceof Enemy) {
      this.enemies.push(entity)
    }
  }

  remove(entity) {
    console.log('Removing', entity)
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

    if (entity instanceof Enemy) {
      const index = this.enemies.indexOf(entity)

      if (index !== -1) {
        this.enemies.splice(index, 1)
      }

      this.usedSpawningPoints.delete(entity.spawningPoint)
    }
  }

  addBullet(owner, ray) {
    const bulletLine = this.assetManager.models.get('bulletLine').clone('bullet-line')
    bulletLine.setEnabled(true)

    const bullet = new Bullet(owner, ray)
    bullet.setRenderComponent(bulletLine, sync)

    this.add(bullet)
  }

  addBulletHole(position, normal, audio) {
    const bulletHole = this.assetManager.models.get('bulletHole').clone('bullet-hole' + this.bulletHoles.length)
    bulletHole.setEnabled(true)
    audio.attachToMesh(bulletHole)

    const s = 1 + Math.random() * 0.5
    bulletHole.scaling = new BABYLON.Vector3(s, s, s)
    bulletHole.position = new BABYLON.Vector3(position.x, position.y, position.z)

    target.copy(position).add(normal)

    bulletHole.lookAt(new BABYLON.Vector3(target.x, target.y, target.z))

    if (this.bulletHoles.length >= this.maxBulletHoles) {
      const toRemove = this.bulletHoles.shift()
      toRemove.dispose()
    }

    this.bulletHoles.push(bulletHole)
  }

  addEnemy() {
    const enemyMesh = this.assetManager.models.get('enemy').clone('enemy')
    this.shadowGenerator.addShadowCaster(enemyMesh)
    enemyMesh.makeGeometryUnique()

    const vertices = enemyMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const geometry = new YUKA.MeshGeometry(vertices)

    const enemy = new Enemy(geometry)
    enemy.boundingRadius = enemyMesh.getBoundingInfo().boundingSphere.radius
    enemy.setRenderComponent(enemyMesh, sync)

    // compute spawning point

    let spawningPoint = null

    const minSqDistance = this.minSpawningDistance * this.minSpawningDistance

    let maxiter = 50000
    do {
      const spawningPointIndex = Math.ceil(Math.random() * this.spawningPoints.length - 1)
      spawningPoint = this.spawningPoints[spawningPointIndex]
      maxiter--
      // only pick the spawning point if it is not in use and far enough away from the player
    } while (
      maxiter > 0 &&
      (this.usedSpawningPoints.has(spawningPoint) === true ||
        spawningPoint.squaredDistanceTo(this.player.position) < minSqDistance)
    )

    this.usedSpawningPoints.add(spawningPoint)

    enemy.position.copy(spawningPoint)
    enemy.spawningPoint = spawningPoint

    this.add(enemy)
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
          if (normal) {
            normal.copy(intersection.normal)
          }
        }
      }
    }

    return closestObstacle === null ? null : closestObstacle
  }

  initScene() {
    const canvas = document.getElementById('renderCanvas')
    this.engine = new BABYLON.Engine(canvas, true, {}, true)

    if (BABYLON.Engine.audioEngine) {
      BABYLON.Engine.audioEngine.useCustomUnlockedButton = true
    }

    this.scene = new BABYLON.Scene(this.engine)
    const scene = this.scene

    scene.clearColor = new BABYLON.Color4(0.6, 0.6, 0.6, 1)
    scene.useRightHandedSystem = true

    scene.fogMode = BABYLON.Scene.FOGMODE_EXP2
    scene.fogColor = BABYLON.Color3.FromHexString('#a0a0a0')
    scene.fogDensity = 0.005

    const camera = new BABYLON.UniversalCamera('camera', new BABYLON.Vector3(0, 0, 0), scene, true)
    camera.minZ = 0.01
    camera.max = 1000
    this.camera = camera

    new BABYLON.HemisphericLight('light', new BABYLON.Vector3(-1, 1, 0))

    this.dirLight = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -1, -1), scene)
    this.dirLight.position = new BABYLON.Vector3(100, 90, 30)

    this.audios = this.assetManager.audios

    this.shadowGenerator = new BABYLON.ShadowGenerator(2048, this.dirLight)
    this.shadowGenerator.useBlurExponentialShadowMap = true
    this.shadowGenerator.useKernelBlur = true
    this.shadowGenerator.blurKernel = 32

    window.addEventListener('resize', this.onWindowResize, false)
    this.ui.intro.addEventListener('click', this.onIntroClick, false)
  }

  initSpawningPoints() {
    const spawningPoints = this.spawningPoints

    for (let i = 0; i < 9; i++) {
      const spawningPoint = new YUKA.Vector3()

      spawningPoint.x = 18 - (i % 3) * 12
      spawningPoint.z = 18 - Math.floor(i / 3) * 12

      spawningPoints.push(spawningPoint)
    }

    if (this.debug) {
      const spawningPoints = this.spawningPoints

      const helperMaterial = new BABYLON.StandardMaterial('spawning-point', this.scene)
      helperMaterial.emissiveColor = BABYLON.Color3.Red()
      helperMaterial.alpha = 0.5

      for (let i = 0, l = spawningPoints.length; i < l; i++) {
        const spawningPointMesh = BABYLON.MeshBuilder.CreateSphere(
          'spawning-pot',
          { radius: 0.2, segments: 16 },
          this.scene
        )
        spawningPointMesh.position = BABYLON.Vector3.FromArray(spawningPoints[i])
        spawningPointMesh.material = helperMaterial
        spawningPointMesh.renderingGroupId = 2
      }
    }
  }

  initObstacles() {
    const obstacleMesh = this.assetManager.models.get('obstacle')
    const obstacleCageMesh = this.assetManager.models.get('obstacle-cage')

    const vertices = obstacleCageMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind)
    const indices = obstacleCageMesh.getIndices()

    const geometry = new YUKA.MeshGeometry(vertices, indices)

    for (let i = 0; i < 16; i++) {
      const mesh = obstacleMesh.clone('obstacle')
      mesh.setEnabled(true)

      const cageMesh = obstacleCageMesh.clone('obstacle-cage')
      cageMesh.setEnabled(true)

      const obstacle = new CustomObstacle(geometry)

      const x = 24 - (i % 4) * 12
      const z = 24 - Math.floor(i / 4) * 12

      obstacle.position.set(x, 0, z)
      obstacle.boundingRadius = 4
      this.add(obstacle)

      mesh.position = new BABYLON.Vector3(x, 0, z)
      obstacle.setRenderComponent(mesh, sync)
      this.shadowGenerator.addShadowCaster(mesh)

      if (this.debug) {
        const helper = BABYLON.MeshBuilder.CreateSphere(
          'obstacle',
          { radius: obstacle.boundingRadius, segments: 16 },
          this.scene
        )
        helper.parent = cageMesh
      }
    }
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
    player.position.set(6, 0, 35)

    player.head.setRenderComponent(this.camera, syncCamera)

    this.add(player)
    this.player = player

    // weapon
    const weapon = player.weapon
    const weaponMesh = this.assetManager.models.get('weapon')
    weapon.setRenderComponent(weaponMesh, sync)

    // audios
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

  initUI() {
    const loadingScreen = this.ui.loadingScreen

    loadingScreen.classList.add('fade-out')
    loadingScreen.addEventListener('transitionend', onTransitionEnd)

    this.refreshUI()
  }

  refreshUI() {
    this.ui.playingTime.textContent = Math.ceil(this.playingTime)
    this.ui.hits.textContent = this.hits
  }
}

function sync(entity, renderComponent) {
  renderComponent.getWorldMatrix().copyFrom(BABYLON.Matrix.FromValues(...entity.worldMatrix.elements))
}

// function sync(entity, renderComponent) {
//   BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).decomposeToTransformNode(renderComponent)
// }

function syncCamera(entity, renderComponent) {
  renderComponent.getViewMatrix().copyFrom(BABYLON.Matrix.FromValues(...entity.worldMatrix.elements).invert())
}

function onIntroClick() {
  if (BABYLON.Engine.audioEngine) {
    BABYLON.Engine.audioEngine.unlock()
  }

  if (this.gameOver === false) {
    this.controls.connect()
    this.started = true
  }
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
