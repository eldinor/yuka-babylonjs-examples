/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import { GameEntity } from '../../../../lib/yuka.module.js'

class Obstacle extends GameEntity {
  constructor(mesh) {
    super()
    this.mesh = mesh
  }

  lineOfSightTest(ray, intersectionPoint) {
    return this.mesh.intersectRay(ray, this.worldMatrix, true, intersectionPoint)
  }
}

export { Obstacle }
