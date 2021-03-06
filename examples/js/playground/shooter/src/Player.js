/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import { MovingEntity, GameEntity, Quaternion } from '../../../../../lib/yuka.module.js'
import { Blaster } from './Blaster.js'

const q = new Quaternion()

class Player extends MovingEntity {
  constructor(camera) {
    super()
    this.camera = camera

    this.headContainer = new GameEntity()
    this.add(this.headContainer)

    this.head = new GameEntity()
    this.head.position.set(0, 2, 10)
    this.headContainer.add(this.head)

    this.weaponContainer = new GameEntity()
    this.head.add(this.weaponContainer)

    this.weapon = new Blaster(this)
    this.weaponContainer.add(this.weapon)

    //

    this.forward.set(0, 0, -1)
    this.maxSpeed = 10
    this.updateOrientation = false
  }

  getDirection(result) {
    q.multiplyQuaternions(this.rotation, this.head.rotation)

    return result.copy(this.forward).applyRotation(q).normalize()
  }
}

export { Player }
