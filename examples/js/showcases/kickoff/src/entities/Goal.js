import { GameEntity, Vector3 } from '../../../../../../lib/yuka.module.js'
import { TEAM } from '../core/Constants.js'

/**
 * Class for representing a soccer goal.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments GameEntity
 */
class Goal extends GameEntity {
  /**
   * Constructs a new goal.
   *
   * @param {Number} width - The width of the goal.
   * @param {Number} height - The height of the goal.
   * @param {Number} color - The color of the team that owns this goal.
   */
  constructor(width, height, color) {
    super()

    /**
     * The width of the goal.
     * @type {Number}
     */
    this.width = width

    /**
     * The height of the goal.
     * @type {Number}
     */
    this.height = height

    /**
     * The color of the team that owns this goal.
     * @type {Number}
     */
    this.color = color

    /**
     * The position of the left post. Computed by computePosts().
     * @type {Vector3}
     */
    this.leftPost = null

    /**
     * The position of the right post. Computed by computePosts().
     * @type {Vector3}
     */
    this.rightPost = null
  }

  /**
   * Returns the direction of the goal. This overwrites the implementation of
   * GameEntity since the direction only depends on the team color.
   *
   * @param {Vector3} direction - The direction of the goal.
   * @return {Vector3} The direction of the goal.
   */
  getDirection(direction) {
    if (this.color === TEAM.RED) {
      direction.set(-1, 0, 0)
    } else {
      direction.set(1, 0, 0)
    }

    return direction
  }

  /**
   * Computes the posts of the goal.
   */
  computePosts() {
    this.leftPost = new Vector3()
    this.rightPost = new Vector3()

    const halfSize = this.width / 2

    if (this.color === TEAM.RED) {
      this.leftPost.x = this.position.x
      this.leftPost.z = this.position.z + halfSize

      this.rightPost.x = this.position.x
      this.rightPost.z = this.position.z - halfSize
    } else {
      this.leftPost.x = this.position.x
      this.leftPost.z = this.position.z - halfSize

      this.rightPost.x = this.position.x
      this.rightPost.z = this.position.z + halfSize
    }
  }
}

export default Goal
