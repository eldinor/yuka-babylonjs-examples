import * as YUKA from '../../../../lib/yuka.module.js'
import { IdleState, RotateState, FlyState, GatherState, ToTheBaseState, UnloadState } from './states.js'
class Carrier extends YUKA.Vehicle {
  constructor(scene, time, target) {
    super()

    this.scene = scene
    this.time = time
    this.target = target

    this.idleDuration = 2
    this.walkDuration = 5
    this.gatherDuration = 5
    this.unloadDuration = 6
    this.currentTime = 0
    this.maxTurnRate = 0.8
    this.currentSpeed = 0
    this.goods = 0

    this.ui = {
      currentState: document.getElementById('currentState'),
      currentTime: document.getElementById('currentTime'),
      currentSpeed: document.getElementById('currentSpeed'),
      currentGoods: document.getElementById('currentGoods'),
      storedGoods: document.getElementById('storedGoods'),
    }

    this.stateMachine = new YUKA.StateMachine(this)
    this.stateMachine.add('IDLE', new IdleState(scene))
    this.stateMachine.add('ROTATE', new RotateState(time))
    this.stateMachine.add('FLY', new FlyState(scene))
    this.stateMachine.add('GATHER', new GatherState(scene))
    this.stateMachine.add('TO THE BASE', new ToTheBaseState(scene))
    this.stateMachine.add('UNLOAD', new UnloadState(scene))
  }

  generateTarget() {
    // generate a random point on a sphere

    const radius = 2
    const phi = Math.acos(2 * Math.random() - 1)
    const theta = Math.random() * Math.PI * 2

    this.target.position.fromSpherical(radius, phi, theta)
  }
  update(delta) {
    this.currentDelta = delta

    this.stateMachine.update()
    this.currentTime += delta

    super.update(delta)

    return this
  }
}

export { Carrier }
