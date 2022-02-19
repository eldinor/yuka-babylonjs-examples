import { GameEntity, MathUtils, Matrix4, Quaternion, StateMachine, Vector3 } from '../../../../../../lib/yuka.module.js'
import { MESSAGE, TEAM, ROLE, CONFIG, FIELDPLAYER_STATES, TEAM_STATES } from '../core/Constants.js'
import SupportSpotCalculator from '../etc/SupportSpotCalculator.js'
import { AttackingState, DefendingState, GlobalState, PrepareForKickOffState } from '../states/TeamStates.js'
import FieldPlayer from './FieldPlayer.js'
import Goalkeeper from './Goalkeeper.js'

const _localPositionOfOpponent = new Vector3()
const _startPosition = new Vector3()
const _endPosition = new Vector3()
const _toPoint = new Vector3()
const _target = new Vector3()
const _passes = []
const _tangent1 = new Vector3()
const _tangent2 = new Vector3()

const _rotation = new Quaternion()
const _direction = new Vector3()
const _scale = new Vector3(1, 1, 1)

const _matrix = new Matrix4()
const _inverseMatrix = new Matrix4()

const _forward = new Vector3(0, 0, 1)
const _up = new Vector3(0, 1, 0)

// these define the home regions for this state of each of the players

const _blueDefendingRegions = [1, 6, 8, 3, 5]
const _blueAttackingRegions = [1, 12, 14, 4, 8]

const _redDefendingRegions = [16, 9, 11, 12, 14]
const _redAttackingRegions = [16, 3, 5, 10, 11]

/**
 * Class for representing a soccer team.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments GameEntity
 */
class Team extends GameEntity {
  /**
   * Constructs a new team.
   *
   * @param {Number} color - The color of the team.
   * @param {Ball} ball - A reference to the ball.
   * @param {Pitch} pitch - A reference to the pitch.
   * @param {Goal} homeGoal - A reference to the own goal.
   * @param {Goal} opposingGoal - A reference to the opposing goal.
   */
  constructor(color, ball, pitch, homeGoal, opposingGoal) {
    super()

    /**
     * A reference to the ball.
     * @type {Ball}
     */
    this.ball = ball

    /**
     * The color of the team.
     * @type {Number}
     */
    this.color = color

    /**
     * The player who is currently controlling the ball. Can be null.
     * @type {Player}
     */
    this.controllingPlayer = null

    /**
     * The number of goals this team has scored so far.
     * @type {Number}
     */
    this.goals = 0

    /**
     * A reference to the own goal.
     * @type {Goal}
     */
    this.homeGoal = homeGoal

    /**
     * A reference to the opposing goal.
     * @type {Goal}
     */
    this.opposingGoal = opposingGoal

    /**
     * A reference to the opposing team. Set by the World class.
     * @type {Team}
     */
    this.opposingTeam = null

    /**
     * A reference to the player which is closest to the ball.
     * This player is determined per simulation step.
     * @type {Player}
     */
    this.playerClosestToBall = null

    /**
     * A reference to the pitch.
     * @type {Pitch}
     */
    this.pitch = pitch

    /**
     * A reference to the player waiting to receive the ball from a team mate. Can be null.
     * @type {Player}
     */
    this.receivingPlayer = null

    /**
     * The state machine of the team.
     * @type {StateMachine}
     */
    this.stateMachine = new StateMachine(this)

    /**
     * A reference to the player who is supporting the controlling player in an attack. Can be null.
     * @type {Player}
     */
    this.supportingPlayer = null

    /**
     * The team's support spot calculator.
     * @type {SupportSpotCalculator}
     */
    this._supportSpotCalculator = new SupportSpotCalculator(this)

    // states

    this.stateMachine.globalState = new GlobalState()

    this.stateMachine.add(TEAM_STATES.ATTACKING, new AttackingState())
    this.stateMachine.add(TEAM_STATES.DEFENDING, new DefendingState())
    this.stateMachine.add(TEAM_STATES.PREPARE_FOR_KICKOFF, new PrepareForKickOffState())

    this.stateMachine.changeTo(TEAM_STATES.DEFENDING)

    //

    this._createPlayers()
  }

  /**
   * Updates the team.
   *
   * @param {Number} delta - The time delta value.
   * @return {FieldPlayer} A reference to this team.
   */
  update(/*delta */) {
    this._computePlayerClosestToBall()

    this.stateMachine.update()

    return this
  }

  /**
   * Holds the implementation for the message handling of this team.
   *
   * @param {Telegram} telegram - The telegram with the message data.
   * @return {Boolean} Whether the message was processed or not.
   */
  handleMessage(telegram) {
    return this.stateMachine.handleMessage(telegram)
  }

  /**
   * Returns true if all players are in their home region.
   *
   * @return {Boolean} Whether all players are in their home region or not.
   */
  areAllPlayersAtHome() {
    for (let i = 0, l = this.children.length; i < l; i++) {
      const player = this.children[i]

      if (player.inHomeRegion() === false) {
        return false
      }
    }

    return true
  }

  /**
   * Given a ball position, a kicking power and a reference to a target vector
   * this method will sample random positions along the opponent's goalmouth and
   * check to see if a goal can be scored if the ball was to be kicked in that
   * direction with the given power. If a possible shot is found, the method
   * will immediately return true, with the target position stored in the target
   * vector.
   *
   * @param {Vector3} ballPosition - The position of the ball.
   * @param {Number} kickingPower - The power of the shoot.
   * @param {Vector3} shootTarget - The target vector.
   * @returns {boolean} Whether a shoot on the opposing goal is possible or not?
   */
  canShoot(ballPosition, kickingPower, shootTarget) {
    const halfWidth = this.opposingGoal.width / 2

    for (let i = 0; i < CONFIG.PLAYER_NUM_ATTEMPTS_TO_FIND_VALID_STRIKE; i++) {
      const ball = this.ball

      // Choose a random position along the opponent's goalmouth.

      shootTarget.copy(this.opposingGoal.position)

      const minZ = this.opposingGoal.position.z - halfWidth + ball.boundingRadius
      const maxZ = this.opposingGoal.position.z + halfWidth - ball.boundingRadius

      shootTarget.z = MathUtils.randFloat(minZ, maxZ) // random

      // Make sure striking the ball with the given power is enough to drive the ball over the goal line.

      const time = ball.timeToCoverDistance(ballPosition, shootTarget, kickingPower)

      // If it is, this shot is then tested to see if any of the opponents can intercept it.

      if (time >= 0) {
        if (this.isPassSafeFromAllOpponents(ballPosition, shootTarget, null, kickingPower)) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Computes and returns the best supporting attacker. If no player is determined, null is returned.
   *
   * @return {Player} The best supporting attacker.
   */
  computeBestSupportingAttacker() {
    let minDistance = Infinity
    let bestPlayer = null

    const players = this.children

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]

      if (player.role === ROLE.ATTACKER && player !== this.controllingPlayer) {
        const distance = player.position.squaredDistanceTo(this._supportSpotCalculator.getBestSupportingPosition())

        if (distance < minDistance) {
          minDistance = distance

          bestPlayer = player
        }
      }
    }

    return bestPlayer
  }

  /**
   * Computes the best supporting position.
   */
  computeBestSupportingPosition() {
    this._supportSpotCalculator.computeBestSupportingPosition()
  }

  /**
   * The best pass is considered to be the pass that cannot be intercepted by an
   * opponent and that is as far forward of the receiver as possible. If no best pass
   * is found, null is returned.
   *
   * @param {Player} passer - The player who passes the ball.
   * @param {Number} passPower - The power of the pass.
   * @param {Number} minPassingDistance - The minimum distance of the pass.
   * @param {Object} pass - The pass object holding receiver and target.
   * @returns {Pass} The best possible pass.
   */
  findPass(passer, passPower, minPassingDistance, pass) {
    let minDistance = Infinity
    const minPassingSquaredDistance = minPassingDistance * minPassingDistance

    pass.receiver = null

    const players = this.children

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]

      const squaredDistanceToReceiver = passer.position.squaredDistanceTo(player.position)

      // Make sure the potential receiver is not this player and that it is further away than the minimum pass distance.

      if (player !== passer && squaredDistanceToReceiver >= minPassingSquaredDistance) {
        if (this._getBestPassToReceiver(passer, player, passPower, _target)) {
          const distanceToGoal = _target.squaredDistanceTo(this.opposingGoal.position)

          if (distanceToGoal < minDistance) {
            minDistance = distanceToGoal

            pass.receiver = player
            pass.target.copy(_target)
          }
        }
      }
    }

    if (pass.receiver !== null) {
      return pass
    } else {
      return null
    }
  }

  /**
   * The method should ensure that attacking players always have assistance by a supporting player.
   */
  findSupport() {
    if (this.supportingPlayer === null) {
      this.supportingPlayer = this.computeBestSupportingAttacker()

      if (this.supportingPlayer !== null) {
        // let the player know that he should support the attacker

        this.sendMessage(this.supportingPlayer, MESSAGE.SUPPORT_ATTACKER)
      }

      return
    }

    const bestSupportPlayer = this.computeBestSupportingAttacker()

    // check if the best supporting player has changed over time

    if (bestSupportPlayer !== null && bestSupportPlayer !== this.supportingPlayer) {
      // if so, instruct the older supporting player to return home

      this.sendMessage(this.supportingPlayer, MESSAGE.RETURN_HOME)

      this.supportingPlayer = bestSupportPlayer

      // and inform the new supporting attacker

      this.sendMessage(this.supportingPlayer, MESSAGE.SUPPORT_ATTACKER)
    }
  }

  /**
   * Returns the best supporting position for the supporting player.
   *
   * @return {Vector3} The best supporting position for the supporting player.
   */
  getSupportPosition() {
    return this._supportSpotCalculator.getBestSupportingPosition()
  }

  /**
   * Returns true if the team is in control of the ball.
   *
   * @return {Boolean} Whether the team is in control of the ball or not.
   */
  inControl() {
    return this.controllingPlayer !== null
  }

  /**
   * Returns true if an opponent is within the given radius.
   *
   * @param {Player} player - The time delta value.
   * @param {Number} radius - The radius.
   * @return {Boolean} Whether an opponent is within the given radius or not.
   */
  isOpponentWithinRadius(player, radius) {
    const opponents = this.opposingTeam.children
    const squaredRadius = radius * radius

    for (let i = 0, l = opponents.length; i < l; i++) {
      const opponent = opponents[i]

      const distance = opponent.position.squaredDistanceTo(player.position)

      if (distance <= squaredRadius) return true
    }

    return false
  }

  /**
   * Tests a pass from position "start" to position "target" against each member of
   * the opposing team. Returns true if the pass can be made without getting intercepted.
   *
   * @param {Vector3} start - The start position of the pass.
   * @param {Vector3} target - The target position of the pass.
   * @param {Player} receiver - The receiver of the pass.
   * @param {Number} passingForce - The force of the pass.
   * @returns {Boolean} Whether the pass be intercepted by one of the opposing players or not.
   */
  isPassSafeFromAllOpponents(start, target, receiver, passingForce) {
    // Compute a matrix that will be used to transform opponent players into the
    // local coordinate system of the pass.

    _direction.subVectors(target, start).normalize()
    _rotation.lookAt(_forward, _direction, _up)

    _matrix.compose(start, _rotation, _scale)
    _matrix.getInverse(_inverseMatrix)

    // check all players of the opposing team

    const opponents = this.opposingTeam.children

    for (let i = 0, l = opponents.length; i < l; i++) {
      const opponent = opponents[i]

      if (this._isPassSafeFromOpponent(start, target, receiver, opponent, passingForce, _inverseMatrix) === false) {
        return false
      }
    }

    return true
  }

  /**
   * Called then the team loses the control over the ball.
   */
  lostControl() {
    this.controllingPlayer = null
    this.receivingPlayer = null
    this.supportingPlayer = null
  }

  /**
   * This method tests to see if a pass is possible between the requester and the controlling player.
   * If it is possible a message is sent to the controlling player to pass the ball.
   *
   * @param {Player} requester - The player who requests the pass.
   */
  requestPass(requester) {
    // let the request fail sometimes

    if (Math.random() > CONFIG.PLAYER_PASS_REQUEST_SUCCESS) return

    // check the safety of the pass

    if (
      this.inControl() &&
      this.isPassSafeFromAllOpponents(
        this.controllingPlayer.position,
        requester.position,
        requester,
        CONFIG.PLAYER_MAX_PASSING_FORCE
      )
    ) {
      this.sendMessage(this.controllingPlayer, MESSAGE.PASS_TO_ME, 0, { requester: requester })
    }
  }

  /**
   * This method sends all players of the team to their home region.
   *
   * @param {Boolean} withGoalKeeper - Whether the goal keep should return home or not.
   */
  returnAllFieldPlayersToHome(withGoalKeeper = false) {
    const players = this.children

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]

      if (withGoalKeeper === true) {
        this.sendMessage(player, MESSAGE.RETURN_HOME)
      } else {
        if (player.role !== ROLE.GOALKEEPER) {
          this.sendMessage(player, MESSAGE.RETURN_HOME)
        }
      }
    }
  }

  /**
   * Sets the given player as the controlling player. This method will also ensure
   * that the opposing team loses control over the ball.
   *
   * @param {Player} player - The new controlling player.
   */
  setControl(player) {
    this.controllingPlayer = player

    this.opposingTeam.lostControl()
  }

  /**
   * Defines the home regions of the players according to the current team strategy.
   */
  setupTeamPositions() {
    // pick appropriate home regions

    let regions

    if (this.color === TEAM.RED) {
      if (this.stateMachine.in(TEAM_STATES.DEFENDING)) {
        regions = _redDefendingRegions
      } else {
        regions = _redAttackingRegions
      }
    } else {
      if (this.stateMachine.in(TEAM_STATES.DEFENDING)) {
        regions = _blueDefendingRegions
      } else {
        regions = _blueAttackingRegions
      }
    }

    // set new home regions

    const players = this.children

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]
      const regionId = regions[i]

      player.homeRegionId = regionId
    }
  }

  /**
   * Updates the steering targets of field players. This method only affects players in the WAIT and RETURN_HOME state
   * to ensure they move to updated home regions.
   */
  updateSteeringTargetOfPlayers() {
    const players = this.children

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]

      if (player.role !== ROLE.GOALKEEPER) {
        if (player.stateMachine.in(FIELDPLAYER_STATES.WAIT) || player.stateMachine.in(FIELDPLAYER_STATES.RETURN_HOME)) {
          player.steeringTarget.copy(player.getHomeRegion().center)
        }
      }
    }
  }

  //

  /**
   * Creates the players of the team. It will also ensure to orient the players towards the opposing goal.
   */
  _createPlayers() {
    let rotation = Math.PI * 0.5
    let regions

    if (this.color === TEAM.RED) {
      regions = _redDefendingRegions
      rotation *= -1
    } else {
      regions = _blueDefendingRegions
    }

    const goalkeeper = new Goalkeeper(this, this.pitch, regions[0])
    goalkeeper.rotation.fromEuler(0, rotation, 0)
    this.add(goalkeeper)

    const fieldplayer1 = new FieldPlayer(ROLE.ATTACKER, this, this.pitch, regions[1])
    fieldplayer1.rotation.fromEuler(0, rotation, 0)
    this.add(fieldplayer1)

    const fieldplayer2 = new FieldPlayer(ROLE.ATTACKER, this, this.pitch, regions[2])
    fieldplayer2.rotation.fromEuler(0, rotation, 0)
    this.add(fieldplayer2)

    const fieldplayer3 = new FieldPlayer(ROLE.DEFENDER, this, this.pitch, regions[3])
    fieldplayer3.rotation.fromEuler(0, rotation, 0)
    this.add(fieldplayer3)

    const fieldplayer4 = new FieldPlayer(ROLE.DEFENDER, this, this.pitch, regions[4])
    fieldplayer4.rotation.fromEuler(0, rotation, 0)
    this.add(fieldplayer4)
  }

  /**
   * This method is called in update() to determine the closest player to the ball per simulation step.
   */
  _computePlayerClosestToBall() {
    const ball = this.ball
    const players = this.children

    let closestDistance = Infinity

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]

      const distance = player.position.squaredDistanceTo(ball.position)

      if (distance < closestDistance) {
        closestDistance = distance

        this.playerClosestToBall = player
      }
    }
  }

  /**
   * Given a point P and a circle of radius R centered at C this function
   * determines the two points on the circle that intersect with the tangents from
   * P to the circle. Returns false if P is within the circle.
   *
   * @param {Vector3} C - The center of the circle.
   * @param {Number} R - The radius of the circle.
   * @param {Vector3} P - The origin point.
   * @param {Vector3} T1 - The first tangent.
   * @param {Vector3} T2 - The second tangent.
   * @returns {Boolean} Whether point P lies inside the circle or not?
   */
  _computeTangentPoints(C, R, P, T1, T2) {
    _toPoint.subVectors(P, C)
    const squaredlength = _toPoint.squaredLength()
    const RSq = R * R

    if (squaredlength <= RSq) {
      // P is inside or on the circle

      return false
    }

    const squaredLengthInverse = 1 / squaredlength
    const root = Math.sqrt(squaredlength - RSq)

    T1.x = C.x + R * (R * _toPoint.x - _toPoint.z * root) * squaredLengthInverse
    T1.z = C.z + R * (R * _toPoint.z + _toPoint.x * root) * squaredLengthInverse
    T2.x = C.x + R * (R * _toPoint.x + _toPoint.z * root) * squaredLengthInverse
    T2.z = C.z + R * (R * _toPoint.z - _toPoint.x * root) * squaredLengthInverse

    return true
  }

  /**
   * Three potential passes are calculated. One directly toward the receiver's
   * current position and two that are the tangents from the ball position to the
   * circle of radius "range" from the receiver. These passes are then tested to
   * see if they can be intercepted by an opponent and to make sure they terminate
   * within the playing area. If all the passes are invalidated the method
   * returns false. Otherwise the method returns the pass that takes the ball
   * closest to the opponent's goal area.
   *
   * @param {Player} passer - The player who passes the ball.
   * @param {Player} receiver - The player who receives the ball.
   * @param {Number} passPower - The power of the pass.
   * @param {Vector3} passTarget - The target of the pass.
   * @returns {Boolean} Whether a pass to the receiver is possible or not.
   */
  _getBestPassToReceiver(passer, receiver, passPower, passTarget) {
    let result = false

    let minDistance = Infinity

    _passes.length = 0

    const ball = this.ball

    // First, compute how much time it will take for the ball to reach this receiver, if the receiver was to remain motionless.

    const t = ball.timeToCoverDistance(ball.position, receiver.position, passPower)

    // Return false if the ball cannot reach the receiver after having been kicked with the given power.

    if (t < 0) return false

    // The maximum distance the receiver can cover in this time scaled by the interception range. This range ensures the receiver can easier
    // obtain the ball (so the pass is more safe).

    const interceptRange = t * receiver.maxSpeed * 0.2

    // Now compute the pass targets which are positioned at the intercepts of the tangents from the ball to the receiver's range circle.

    this._computeTangentPoints(receiver.position, interceptRange, ball.position, _tangent1, _tangent2)

    _passes.push(_tangent1, receiver.position, _tangent2)

    for (let i = 0, l = _passes.length; i < l; i++) {
      const pass = _passes[i]

      const distanceToGoal = pass.squaredDistanceTo(this.opposingGoal.position)

      // This pass is the best found so far if it is:
      //
      // 1. Further upfield than the closest valid pass for this receiver found so far.
      // 2. Within the playing area.
      // 3. Cannot be intercepted by any opponents.

      if (
        distanceToGoal < minDistance &&
        this.pitch.playingArea.isInside(pass) &&
        this.isPassSafeFromAllOpponents(ball.position, pass, receiver, passPower)
      ) {
        minDistance = distanceToGoal

        passTarget.copy(pass)

        result = true
      }
    }

    return result
  }

  /**
   * Tests if a pass can be intercepted by an opposing player.
   *
   * @param {Vector3} start - The start position of the pass.
   * @param {Vector3} target - The target position of the pass.
   * @param {Player} receiver - The receiver of the pass.
   * @param {Player} opponent - The opposing player.
   * @param {Number} passingForce - The force of the pass.
   * @param {Matrix4} inverseMatrix - Used to transform the opponent into the pass's local coordinate system.
   * @returns {Boolean} Whether the pass can be intercepted by an opposing player or not.
   */
  _isPassSafeFromOpponent(start, target, receiver, opponent, passingForce, inverseMatrix) {
    _localPositionOfOpponent.copy(opponent.position).applyMatrix4(inverseMatrix)

    // 1. Test: If opponent is behind the ball then pass is considered okay (this is based on the
    // assumption that the ball is going to be kicked with a velocity greater than the opponent's max velocity).

    if (_localPositionOfOpponent.z < 0) {
      return true
    }

    // 2. Test: If the opponent is further away than the target we need to consider
    // if the opponent can reach the position before the receiver.

    if (start.squaredDistanceTo(target) < start.squaredDistanceTo(opponent.position)) {
      // This condition is here because this method might be called without reference to a receiver.
      // For example, one may want to find out if a ball can reach a position on the field before an opponent can get to it.

      if (receiver !== null) {
        if (target.squaredDistanceTo(opponent.position) > target.squaredDistanceTo(receiver.position)) {
          return true
        } else {
          return false
        }
      } else {
        return true
      }
    }

    // 3. Test: Compute how long it takes the ball to cover the distance to the position orthogonal to the opponents position.

    _endPosition.set(_localPositionOfOpponent.z, 0, 0)

    const t = this.ball.timeToCoverDistance(_startPosition, _endPosition, passingForce)

    const reach = opponent.maxSpeed * t + this.ball.boundingRadius + opponent.boundingRadius

    // If the range plus the radius of the opponent and the ball's bounding radius is lower than the opponent's x position, the pass is safe.

    if (reach < Math.abs(_localPositionOfOpponent.x)) {
      return true
    }

    return false
  }
}

export default Team
