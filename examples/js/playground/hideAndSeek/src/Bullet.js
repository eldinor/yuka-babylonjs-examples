/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import { MovingEntity, MathUtils, Ray, Vector3 } from '../../../../../lib/yuka.module.js'
import world from './World.js'
import { Enemy } from './Enemy.js'

const intersectionPoint = new Vector3()
const normal = new Vector3()
const ray = new Ray()

class Bullet extends MovingEntity {
  constructor(owner = null, ray = new Ray()) {
    super()

    this.owner = owner
    this.ray = ray

    this.maxSpeed = 400 // 400 m/s

    this.position.copy(ray.origin)
    this.velocity.copy(ray.direction).multiplyScalar(this.maxSpeed)

    const s = 1 + Math.random() * 3 // scale the shot line a bit

    this.lifetime = 1
    this.currentTime = 0
  }

  update(delta) {
    this.currentTime += delta

    if (this.currentTime > this.lifetime) {
      world.remove(this)
    } else {
      ray.copy(this.ray)
      ray.origin.copy(this.position)

      super.update(delta)

      const obstacle = world.intersectRay(ray, intersectionPoint, normal)

      if (obstacle !== null) {
        // calculate distance from origin to intersection point

        const distanceToIntersection = ray.origin.squaredDistanceTo(intersectionPoint)
        const validDistance = ray.origin.squaredDistanceTo(this.position)

        if (distanceToIntersection <= validDistance) {
          // hit!

          const audio = world.audios.get('impact' + MathUtils.randInt(1, 5))
          if (audio.isPlaying === true) {
            audio.stop()
          }
          audio.play()

          // inform game entity about hit

          this.owner.sendMessage(obstacle, 'hit')

          // add visual feedback
          if (obstacle instanceof Enemy === false) {
            world.addBulletHole(intersectionPoint, normal, audio)
          } else {
            // enemy hit
            world.assetManager.explodeEnemy(obstacle._renderComponent)
          }

          // remove bullet from world

          world.remove(this)
        }
      }
    }

    return this
  }
}

export { Bullet }
