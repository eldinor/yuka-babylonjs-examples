/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import { GameEntity, Ray, Vector3 } from '../../../../../lib/yuka.module.js'
import world from './World.js'

const intersectionPoint = new Vector3()
const target = new Vector3()
const muzzlePosition = new Vector3()
const scatter = new Vector3()

class Shotgun extends GameEntity {
  constructor(owner = null) {
    super()

    this.owner = owner
    this.status = STATUS.READY
    this.name = 'shotgun'
    this.camera = owner.camera

    this.position.set(0.25, -0.3, -1)

    this.roundsLeft = 12
    this.roundsPerClip = 12
    this.ammo = 48
    this.maxAmmo = 96

    // times are in seconds

    this.shotTime = 1
    this.shotReloadTime = 0.5
    this.reloadTime = 1.5
    this.muzzleFireTime = 0.1
    this.scatterFactor = 0.03

    this.currentTime = 0
    this.endTimeShot = Infinity
    this.endTimeShotReload = Infinity
    this.endTimeReload = Infinity
    this.endTimeMuzzleFire = Infinity

    this.muzzleSprite = world.assetManager.models.get('muzzle')

    this.ui = {
      roundsLeft: document.getElementById('roundsLeft'),
      ammo: document.getElementById('ammo'),
    }

    this.animations = new Map()
    this.loadAnimations()

    this.updateUI()
  }

  update(delta) {
    this.currentTime += delta

    if (this.currentTime >= this.endTimeShotReload) {
      const audio = world.audios.get('shot_reload')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()

      this.endTimeShotReload = Infinity
    }

    // check reload

    if (this.currentTime >= this.endTimeReload) {
      const toReload = this.roundsPerClip - this.roundsLeft

      if (this.ammo >= toReload) {
        this.roundsLeft = this.roundsPerClip
        this.ammo -= toReload
      } else {
        this.roundsLeft += this.ammo
        this.ammo = 0
      }

      this.status = STATUS.READY

      this.updateUI()

      this.endTimeReload = Infinity
    }

    // check muzzle fire

    if (this.currentTime >= this.endTimeMuzzleFire) {
      this.muzzleSprite.isVisible = false

      this.endTimeMuzzleFire = Infinity
    }

    // check shoot

    if (this.currentTime >= this.endTimeShot) {
      if (this.roundsLeft === 0) {
        this.status = STATUS.EMPTY
      } else {
        this.status = STATUS.READY
      }

      this.endTimeShot = Infinity
    }

    return this
  }

  reload() {
    if ((this.status === STATUS.READY || this.status === STATUS.EMPTY) && this.ammo > 0) {
      this.status = STATUS.RELOAD

      // audio

      const audio = world.audios.get('reload')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()

      // animation

      const reloadPositionAnimation = this.animations.get('reloadPosition')
      const reloadRotationAnimation = this.animations.get('reloadRotation')
      const scene = this.camera.getScene()
      scene.beginDirectAnimation(this, [reloadPositionAnimation, reloadRotationAnimation], 0, 60, false)

      //

      this.endTimeReload = this.currentTime + this.reloadTime
    }

    return this
  }

  shoot() {
    if (this.status === STATUS.READY) {
      this.status = STATUS.SHOT

      // audio

      const audio = world.audios.get('shot')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()

      // animation

      const shootPositionAnimation = this.animations.get('shootPosition')
      const shootRotationAnimation = this.animations.get('shootRotation')
      const scene = this.camera.getScene()
      scene.beginDirectAnimation(this, [shootPositionAnimation, shootRotationAnimation], 0, 60, false)

      // muzzle fire

      this.muzzleSprite.isVisible = true
      this.muzzleSprite.angle = Math.random() * Math.PI

      this.endTimeMuzzleFire = this.currentTime + this.muzzleFireTime

      const owner = this.owner
      const head = owner.head

      const ray = new Ray()

      // first calculate a ray that represents the actual look direction from the head position
      ray.origin.extractPositionFromMatrix(head.worldMatrix)
      owner.getDirection(ray.direction)

      // determine closest intersection point with world object
      const result = world.intersectRay(ray, intersectionPoint)

      // now calculate the distance to the closest intersection point. if no point was found,
      // choose a point on the ray far away from the origin
      const distance = result === null ? 1000 : ray.origin.distanceTo(intersectionPoint)

      // now let's change the origin to the weapon's position.
      target.copy(ray.origin).add(ray.direction.multiplyScalar(distance))
      ray.origin.extractPositionFromMatrix(this.worldMatrix)
      // ray.origin.x += 0.5
      ray.direction.subVectors(target, ray.origin).normalize()

      for (let i = 0; i < 6; i++) {
        const r = ray.clone()

        scatter.x = (1 - Math.random() * 2) * this.scatterFactor
        scatter.y = (1 - Math.random() * 2) * this.scatterFactor
        scatter.z = (1 - Math.random() * 2) * this.scatterFactor

        r.direction.add(scatter).normalize()

        world.addBullet(owner, r)
      }

      this.muzzleSprite.position.x = ray.origin.x
      this.muzzleSprite.position.y = ray.origin.y + 0.2
      this.muzzleSprite.position.z = ray.origin.z

      // adjust ammo

      this.roundsLeft--

      this.endTimeShotReload = this.currentTime + this.shotReloadTime

      this.endTimeShot = this.currentTime + this.shotTime

      this.updateUI()
    } else if (this.status === STATUS.EMPTY) {
      const audio = world.audios.get('empty')
      if (audio.isPlaying === true) {
        audio.stop()
      }
      audio.play()
    }

    return this
  }

  updateUI() {
    this.ui.roundsLeft.textContent = this.roundsLeft
    this.ui.ammo.textContent = this.ammo
  }

  loadAnimations() {
    const animations = this.animations
    // shot
    const frameRate = 1

    // shoot

    const frameTimingShot = [0, 0.05, 0.15, 0.3].map((v) => frameRate * v)
    const shotPositionAnimation = new BABYLON.Animation(
      'shoot-position',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )

    const startPosition = new BABYLON.Vector3(this.position.x, this.position.y, this.position.z)
    const shotPositionKeyFrames = []
    const m = 0.2
    shotPositionKeyFrames.push({
      frame: frameTimingShot[0],
      value: startPosition,
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[1],
      value: new BABYLON.Vector3(startPosition.x + 0.6 * m, startPosition.y + 0.4 * m, startPosition.z + 1.4 * m),
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[2],
      value: new BABYLON.Vector3(startPosition.x + 0.6 * m, startPosition.y + 0.61 * m, startPosition.z + 2 * m),
    })
    shotPositionKeyFrames.push({
      frame: frameTimingShot[3],
      value: startPosition,
    })
    shotPositionAnimation.setKeys(shotPositionKeyFrames)

    const shotRotationAnimation = new BABYLON.Animation(
      'shoot-rotation',
      'rotation',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )
    const shotRotationKeyFrames = []

    shotRotationKeyFrames.push({
      frame: frameTimingShot[0],
      value: new BABYLON.Quaternion(this.rotation.x, this.rotation.y, this.rotation.z, this.rotation.w),
    })
    shotRotationKeyFrames.push({
      frame: frameTimingShot[1],
      value: BABYLON.Quaternion.FromEulerAngles(0.12, 0, 0),
    })
    shotRotationKeyFrames.push({
      frame: frameTimingShot[2],
      value: BABYLON.Quaternion.FromEulerAngles(0.2, 0, 0),
    })
    shotRotationKeyFrames.push({
      frame: frameTimingShot[3],
      value: new BABYLON.Quaternion(),
    })
    shotRotationAnimation.setKeys(shotRotationKeyFrames)

    animations.set('shootPosition', shotPositionAnimation)
    animations.set('shootRotation', shotRotationAnimation)

    // reload

    const frameTimingReload = [0, 0.2, 1.3, 1.5].map((v) => frameRate * v)
    const reloadPositionAnimation = new BABYLON.Animation(
      'reload-position',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )

    const reloadPositionKeyFrames = []
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[0],
      value: startPosition,
    })
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[1],
      value: new BABYLON.Vector3(startPosition.x + 0.3 * m, startPosition.y - 1.5 * m, startPosition.z),
    })
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[2],
      value: new BABYLON.Vector3(startPosition.x + 0.3 * m, startPosition.y - 1.5 * m, startPosition.z),
    })
    reloadPositionKeyFrames.push({
      frame: frameTimingReload[3],
      value: startPosition,
    })
    reloadPositionAnimation.setKeys(reloadPositionKeyFrames)

    const reloadRotationAnimation = new BABYLON.Animation(
      'reload-rotation',
      'rotation',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )
    const reloadRotationKeyFrames = []
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[0],
      value: new BABYLON.Quaternion(),
    })
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[1],
      value: BABYLON.Quaternion.FromEulerAngles(-0.4, 0, 0),
    })
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[2],
      value: BABYLON.Quaternion.FromEulerAngles(-0.4, 0, 0),
    })
    reloadRotationKeyFrames.push({
      frame: frameTimingReload[3],
      value: new BABYLON.Quaternion(),
    })
    reloadRotationAnimation.setKeys(reloadRotationKeyFrames)

    animations.set('reloadPosition', reloadPositionAnimation)
    animations.set('reloadRotation', reloadRotationAnimation)
  }
}

const STATUS = Object.freeze({
  READY: 'ready', // the blaster is ready for the next action
  SHOT: 'shot', // the blaster is firing
  RELOAD: 'reload', // the blaster is reloading
  EMPTY: 'empty', // the blaster is empty
})

export { Shotgun }
