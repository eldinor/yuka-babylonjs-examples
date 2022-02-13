/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import { Vehicle } from '../../../../../lib/yuka.module.js'

import { HideBehavior } from './HideBehavior.js'
import world from './World.js'

class Enemy extends Vehicle {
  constructor(geometry) {
    super()

    this.name = 'enemy'

    this.geometry = geometry
    this.maxSpeed = 5
    this.deathAnimDuration = 0.5
    this.currentTime = 0
    this.dead = false
    this.notifiedWorld = false
    this.spawningPoint = null
  }

  start() {
    const player = this.manager.getEntityByName('player')

    const hideBehavior = new HideBehavior(this.manager, player)
    this.steering.add(hideBehavior)

    return this
  }

  update(delta) {
    super.update(delta)

    if (this.dead) {
      if (this.notifiedWorld === false) {
        this.notifiedWorld = true
        world.hits++
        world.refreshUI()

        //

        const audio = world.audios.get('dead')
        if (audio.isPlaying === true) {
          audio.stop()
        }
        audio.play()

        audio.attachToMesh(this._renderComponent)
      }

      this.currentTime += delta

      if (this.currentTime <= this.deathAnimDuration) {
        const value = this.currentTime / this.deathAnimDuration

        // const shader = this._renderComponent.material.userData.shader

        // shader.uniforms.alpha.value = value <= 1 ? value : 1
        // this._renderComponent.material.opacity = 1 - shader.uniforms.alpha.value
      } else {
        world.remove(this)
      }
    }

    return this
  }

  handleMessage() {
    this.dead = true

    // this._renderComponent.castShadow = false

    return true
  }
}

export { Enemy }
