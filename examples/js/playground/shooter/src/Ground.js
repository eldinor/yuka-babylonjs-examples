import { GameEntity } from '../../../../../lib/yuka.module.js'

class Ground extends GameEntity {
  constructor(geometry) {
    super()
    this.geometry = geometry
  }

  handleMessage() {
    // do nothing

    return true
  }
}

export { Ground }
