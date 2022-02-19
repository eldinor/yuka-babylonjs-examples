import { MovingEntity, Ray, Vector3 } from '../../../../../../lib/yuka.module.js'
import { MESSAGE, TEAM } from '../core/Constants.js'

const _acceleration = new Vector3()
const _brakingForce = new Vector3()
const _ray = new Ray()
const _intersectionPoint = new Vector3()

/**
 * Class for representing a soccer ball.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments MovingEntity
 */
class Ball extends MovingEntity {
  /**
   * Constructs a new ball.
   *
   * @param {Pitch} pitch - A reference to the soccer pitch.
   */
  constructor(pitch) {
    super()

    /**
     * The bounding radius of the ball.
     * @type {Number}
     */
    this.boundingRadius = 0.1

    /**
     * The mass of the ball.
     * @type {Number}
     */
    this.mass = 0.44 // 440g

    /**
     * The maximum speed of the ball.
     * @type {Number}
     */
    this.maxSpeed = 42 // 42 m/s ~ 150km/h

    /**
     * A reference to the soccer pitch.
     * @type {Pitch}
     */
    this.pitch = pitch

    /**
     * The friction of the ball. This value decreases the velocity of the ball over time.
     * @type {Number}
     */
    this.friction = -0.8

    // internals

    /**
     * Represents the previous position of the ball in a simulation step.
     * @type {Vector3}
     */
    this._previousPosition = new Vector3()
  }

  /**
   * Updates the ball physics, checks for goals, tests for any collisions and
   * adjusts the ball's velocity accordingly.
   *
   * @param {Number} delta - The time delta value.
   * @return {Ball} A reference to this ball.
   */
  update(delta) {
    this._previousPosition.copy(this.position)

    _brakingForce.copy(this.velocity).normalize().multiplyScalar(this.friction)

    _acceleration.copy(_brakingForce).divideScalar(this.mass)

    this.velocity.add(_acceleration.multiplyScalar(delta))

    if (this.getSpeedSquared() < 0.0001) {
      this.velocity.set(0, 0, 0)
    }

    super.update(delta)

    if (this._isScored() === false) {
      this._collisionDetection()
    }

    return this
  }

  /**
   * Applies the given force to the ball. For simplicity we do no use a physical correct model here:
   *
   * 1. The ball is assumed to have a zero velocity immediately prior to a kick.
   * 2. The force and the resulting acceleration of a kick is applied in a single simulation step.
   * Hence, the lenght of the acceleration represents the new speed (and consequently the velocity) of the ball.
   *
   * @param {Vector3} force - The force.
   * @return {Ball} A reference to this ball.
   */
  kick(force) {
    _acceleration.copy(force).divideScalar(this.mass)

    this.velocity.copy(_acceleration)

    return this
  }

  /**
   * Positions the ball at the given location and sets the ball's velocity to zero.
   *
   * @param {Vector3} position - The new position of the ball (optional).
   * @return {Ball} A reference to this ball.
   */
  placeAt(position = new Vector3(0, 0, 0)) {
    this.position.copy(position)
    this.velocity.set(0, 0, 0)

    return this
  }

  /**
   * Given a distance to cover defined by two vectors and a force, this method calculates how
   * long it will take the ball to travel between the two points.
   *
   * @param {Vector3} startPosition - The start position of the ball.
   * @param {Vector3} endPosition - The end position of the ball.
   * @param {Number} force - The force of the ball.
   * @return {Ball} A time value in second that represents how long it will take the ball to travel between the two points.
   */
  timeToCoverDistance(startPosition, endPosition, force) {
    // Similar to kick(), we assume no accumulative velocities in this method. Meaning the following computation
    // represents the speed of the ball if the player was to make the pass.

    const speed = force / this.mass

    // Calculate the velocity at the end position using the equation: v^2 = u^2 + 2as.

    const s = startPosition.distanceTo(endPosition) // distance to cover

    const term = speed * speed + 2 * this.friction * s

    // If (u^2 + 2as) is negative it means the ball cannot reach the end position.

    if (term <= 0.0) {
      return -1.0
    }

    // It IS possible for the ball to reach its destination and we know its speed when it
    // gets there, so now it's easy to calculate the time using the equation.
    //
    // t = ( v-u ) / a
    //

    return (Math.sqrt(term) - speed) / this.friction
  }

  /**
   * This is used by players and goalkeepers to "trap" a ball, to stop it dead.
   * That player is then assumed to be in possession of the ball.
   *
   * @return {Ball} A reference to this ball.
   */
  trap() {
    this.velocity.set(0, 0, 0)

    return this
  }

  /**
   * Checks for collisions between the ball and the walls of the pitch. When a collision is detected,
   * the ball's velocity is adjusted accordingly.
   *
   * @return {Ball} A reference to this ball.
   */
  _collisionDetection() {
    const walls = this.pitch.walls

    _ray.origin.copy(this._previousPosition)
    _ray.direction.subVectors(this.position, this._previousPosition).normalize()

    const d = this._previousPosition.squaredDistanceTo(this.position)

    let closestDistance = Infinity
    let closestWall = null

    for (let i = 0, l = walls.length; i < l; i++) {
      const wall = walls[i]

      if (_ray.intersectPlane(wall, _intersectionPoint) !== null) {
        const s = this._previousPosition.squaredDistanceTo(_intersectionPoint)

        if (s <= d && s < closestDistance) {
          closestDistance = s
          closestWall = wall
        }
      }
    }

    if (closestWall !== null) {
      this.position.copy(this._previousPosition)
      this.velocity.reflect(closestWall.normal)
    }
  }

  /**
   * Checks if the ball crosses both goal lines on the pitch. If a goal is detected, the method returns
   * true and informs both teams and the pitch about the score.
   *
   * @return {Boolean} Whether a goal was detected or not.
   */
  _isScored() {
    const teamBlue = this.pitch.teamBlue
    const teamRed = this.pitch.teamRed

    const goalBlue = teamBlue.homeGoal
    const goalRed = teamRed.homeGoal

    if (goalRed.leftPost === null) goalRed.computePosts()
    if (goalBlue.leftPost === null) goalBlue.computePosts()

    let team = null

    if (
      checkLineIntersection(
        this._previousPosition.x,
        this._previousPosition.z,
        this.position.x,
        this.position.z,
        goalRed.leftPost.x,
        goalRed.leftPost.z,
        goalRed.rightPost.x,
        goalRed.rightPost.z
      )
    ) {
      team = TEAM.BLUE
    }

    if (
      checkLineIntersection(
        this._previousPosition.x,
        this._previousPosition.z,
        this.position.x,
        this.position.z,
        goalBlue.leftPost.x,
        goalBlue.leftPost.z,
        goalBlue.rightPost.x,
        goalBlue.rightPost.z
      )
    ) {
      team = TEAM.RED
    }

    if (team !== null) {
      // reset the ball to the origin

      this.placeAt(new Vector3(0, 0, 0))

      // inform game entities

      this.sendMessage(teamBlue, MESSAGE.GOAL_SCORED, 0, { team: team })
      this.sendMessage(teamRed, MESSAGE.GOAL_SCORED, 0, { team: team })
      this.sendMessage(this.pitch, MESSAGE.GOAL_SCORED)

      return true
    }

    return false
  }
}

//

function checkLineIntersection(
  line1StartX,
  line1StartY,
  line1EndX,
  line1EndY,
  line2StartX,
  line2StartY,
  line2EndX,
  line2EndY
) {
  let a, b

  const denominator =
    (line2EndY - line2StartY) * (line1EndX - line1StartX) - (line2EndX - line2StartX) * (line1EndY - line1StartY)

  if (denominator === 0) {
    return false
  }

  a = line1StartY - line2StartY
  b = line1StartX - line2StartX
  const numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b
  const numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b
  a = numerator1 / denominator
  b = numerator2 / denominator

  if (a > 0 && a < 1 && b > 0 && b < 1) {
    return true
  }

  return false
}

export default Ball
