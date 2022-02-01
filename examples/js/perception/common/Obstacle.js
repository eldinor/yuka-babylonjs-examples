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
