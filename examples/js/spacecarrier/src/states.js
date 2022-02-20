import * as YUKA from '../../../../lib/yuka.module.js'
const IDLE = 'IDLE'
const ROTATE = 'ROTATE'
const FLY = 'FLY'
const GATHER = 'GATHER'
const TOTHEBASE = 'TO THE BASE'
const UNLOAD = 'UNLOAD'

class IdleState extends YUKA.State {
  constructor(scene) {
    super()
    this.scene = scene
  }
  enter(owner) {
    owner.ui.currentState.textContent = IDLE
    owner.ui.currentGoods.textContent = owner.goods

    if (this.scene.particleSystems[0]) {
      console.log('STOP PARTICLES ')
      this.scene.particleSystems[0].stop()
    }
    if (this.scene.particleSystems[1]) {
      console.log('STOP PARTICLES ')
      this.scene.particleSystems[1].stop()
    }

    console.log('ENTER IDLE')
    console.log(owner)
    owner.steering.behaviors[0].active = false
    setTimeout(() => {
      owner.velocity = new YUKA.Vector3(0, 0, 0)
    }, 200)
  }

  execute(owner) {
    owner.ui.currentTime.textContent = owner.currentTime.toFixed(1)
    if (owner.currentTime >= owner.idleDuration) {
      owner.currentTime = 0
      owner.stateMachine.changeTo(ROTATE)
    }
  }

  exit(owner) {
    console.log('EXIT IDLE')
  }
}

class RotateState extends YUKA.State {
  constructor(time) {
    super()
    this.time = time
  }
  enter(owner) {
    owner.ui.currentState.textContent = ROTATE

    console.log('ENTER ROTATE')
    //    console.log(owner.steering.behaviors[0].target)
  }

  execute(owner) {
    owner.ui.currentTime.textContent = owner.currentTime.toFixed(1)
    owner.ui.currentSpeed.textContent = owner.getSpeed().toFixed(1)

    if (owner.goods <= 1) {
      if (owner.rotateTo(owner.steering.behaviors[0].target, this.time.getDelta())) {
        owner.currentTime = 0
        owner.stateMachine.changeTo(FLY)
      }
    } else {
      owner.steering.behaviors[0].target = owner.manager.entities[2]
      if (owner.rotateTo(owner.steering.behaviors[0].target, this.time.getDelta())) {
        owner.currentTime = 0
        owner.stateMachine.changeTo(TOTHEBASE)
      }
    }
  }

  exit(owner) {
    console.log('EXIT ROTATE')
  }
}

class FlyState extends YUKA.State {
  constructor(scene) {
    super()
    this.scene = scene
  }
  enter(owner) {
    owner.ui.currentState.textContent = FLY

    console.log('ENTER FLY')
    owner.steering.behaviors[0].active = true
    if (this.scene.particleSystems[0]) {
      console.log('PARTICLES 1')
      this.scene.particleSystems[0].start()
    }
  }

  execute(owner) {
    owner.ui.currentTime.textContent = owner.currentTime.toFixed(1)
    owner.ui.currentSpeed.textContent = owner.getSpeed().toFixed(2)

    // console.log(owner.getSpeed());

    const squaredDistance = owner.position.squaredDistanceTo(owner.steering.behaviors[0].target)
    if (squaredDistance < 0.25) {
      owner.currentTime = 0
      owner.stateMachine.changeTo(GATHER)
    }
  }

  exit(owner) {
    console.log('EXIT FLY')
  }
}

class GatherState extends YUKA.State {
  constructor(scene) {
    super()
    this.scene = scene
  }
  enter(owner) {
    owner.ui.currentState.textContent = GATHER

    if (this.scene.particleSystems[1]) {
      console.log('PARTICLES 2')
      this.scene.particleSystems[1].start()
    }

    console.log('ENTER GATHER')
    owner.steering.behaviors[0].active = false
    setTimeout(() => {
      owner.velocity = new YUKA.Vector3(0, 0, 0)
    }, 200)
    setTimeout(() => {
      owner.generateTarget()
    }, 6000)
  }

  execute(owner) {
    owner.ui.currentTime.textContent = owner.currentTime.toFixed(1)
    owner.ui.currentSpeed.textContent = owner.getSpeed().toFixed(1)
    if (owner.currentTime >= owner.gatherDuration) {
      owner.currentTime = 0
      owner.stateMachine.changeTo(IDLE)
    }
  }

  exit(owner) {
    console.log('EXIT GATHER')
    owner.goods++
  }
}

class ToTheBaseState extends YUKA.State {
  constructor(scene) {
    super()
    this.scene = scene
  }
  enter(owner) {
    owner.ui.currentState.textContent = TOTHEBASE
    owner.steering.behaviors[0].active = true
    if (this.scene.particleSystems[1]) {
      console.log('PARTICLES 2')
      this.scene.particleSystems[1].start()
    }
    if (this.scene.particleSystems[0]) {
      console.log('PARTICLES 2')
      this.scene.particleSystems[0].start()
    }

    console.log('ENTER ToTheBaseState')
  }

  execute(owner) {
    owner.ui.currentTime.textContent = owner.currentTime.toFixed(1)
    owner.ui.currentSpeed.textContent = owner.getSpeed().toFixed(1)
    const squaredDistance = owner.position.squaredDistanceTo(owner.steering.behaviors[0].target)
    if (squaredDistance < 0.05) {
      owner.currentTime = 0
      owner.stateMachine.changeTo(UNLOAD)
    }
  }

  exit(owner) {
    console.log('EXIT ToTheBaseState')
  }
}

class UnloadState extends YUKA.State {
  constructor(scene) {
    super()
    this.scene = scene
  }
  enter(owner) {
    owner.ui.currentState.textContent = UNLOAD
    owner.steering.behaviors[0].active = false
    owner.velocity = new YUKA.Vector3(0, 0, 0)
    if (this.scene.particleSystems[0]) {
      console.log('PARTICLES 2')
      this.scene.particleSystems[0].stop()
    }
    if (this.scene.particleSystems[1]) {
      console.log('PARTICLES 2')
      this.scene.particleSystems[1].stop()
    }
    if (this.scene.particleSystems[2]) {
      console.log('PARTICLES 3')
      this.scene.particleSystems[2].start()
    }

    console.log('ENTER UnloadState')

    //  console.log(owner.manager.entities[2].meshToManage)

    BABYLON.Animation.CreateAndStartAnimation(
      'alphachange',
      owner.manager.entities[2].meshToManage.material,
      'alpha',
      60,
      240,
      0.2,
      1,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      null,
      aniCallback
    )

    function aniCallback() {
      BABYLON.Animation.CreateAndStartAnimation(
        'alphachange',
        owner.manager.entities[2].meshToManage.material,
        'alpha',
        60,
        240,
        1,
        0.2,
        BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
      )
    }
  }

  execute(owner) {
    owner.ui.currentTime.textContent = owner.currentTime.toFixed(1)
    owner.ui.currentSpeed.textContent = owner.getSpeed().toFixed(1)

    if (owner.currentTime >= owner.unloadDuration) {
      owner.currentTime = 0

      owner.manager.entities[2].goods += owner.goods
      owner.goods = 0

      owner.steering.behaviors[0].active = false
      owner.steering.behaviors[0].target = owner.manager.entities[0].position

      owner.stateMachine.changeTo(ROTATE)
    }
  }

  exit(owner) {
    console.log('EXIT UnloadState')
    console.log(owner.manager.entities[2].goods)
    owner.ui.currentGoods.textContent = owner.goods
    owner.ui.storedGoods.textContent = owner.manager.entities[2].goods

    if (this.scene.particleSystems[2]) {
      console.log('PARTICLES 3')
      this.scene.particleSystems[2].stop()
    }
  }
}

export { IdleState, RotateState, FlyState, GatherState, ToTheBaseState, UnloadState }
