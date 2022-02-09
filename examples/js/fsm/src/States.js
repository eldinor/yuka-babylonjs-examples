/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author modified at https://github.com/eldinor/yuka-babylonjs-examples
 */

import * as YUKA from '../../../../lib/yuka.module.js'

const IDLE = 'IDLE'
const WALK = 'WALK'

class IdleState extends YUKA.State {
  enter(girl) {
    girl.ui.currentState.textContent = IDLE

    girl.meshToManage.material.diffuseColor = BABYLON.Color3.Blue()
    girl.vehicle.steering.behaviors[1].active = false
    girl.vehicle.steering.behaviors[0].active = true
    console.log(girl.vehicle.steering.behaviors[0])
    console.log(girl.vehicle.steering.behaviors[1])
  }

  execute(girl) {
    if (girl.currentTime >= girl.idleDuration) {
      girl.currentTime = 0
      girl.stateMachine.changeTo(WALK)
    }
  }

  exit(girl) {}
}

class WalkState extends YUKA.State {
  enter(girl) {
    girl.meshToManage.material.diffuseColor = BABYLON.Color3.Red()
    girl.ui.currentState.textContent = WALK

    girl.walk.start()
    girl.idle.stop()
    girl.walk.loopAnimation = true

    const target = new YUKA.Vector3(5, 0, 6)

    girl.vehicle.steering.behaviors[0].active = false
    girl.vehicle.steering.behaviors[1].active = true
    console.log(girl.vehicle.steering.behaviors[0])
    console.log(girl.vehicle.steering.behaviors[1])
  }

  execute(girl) {
    if (girl.currentTime >= girl.walkDuration) {
      girl.currentTime = 0
      girl.stateMachine.changeTo(IDLE)
      const target = new YUKA.Vector3(-5, 0, 3)
    }
  }

  exit(girl) {
    if ((girl.ui.currentState.textContent = IDLE)) {
      girl.idle.start()
      girl.walk.stop()
      girl.idle.loopAnimation = true
    }
  }
}
export { IdleState, WalkState }
