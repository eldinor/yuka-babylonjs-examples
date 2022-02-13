/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import { GameEntity } from '../../../../../lib/yuka.module.js'

class CustomObstacle extends GameEntity {
  constructor(geometry) {
    super()

    this.geometry = geometry
  }

  handleMessage() {
    // do nothing

    return true
  }
}

export { CustomObstacle }
