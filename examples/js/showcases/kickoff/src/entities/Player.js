import { Vehicle, MathUtils, StateMachine, Quaternion, Vector3 } from '../../../../../../lib/yuka.module.js'
import { CONFIG, ROLE } from '../core/Constants.js'

const _quaterion = new Quaternion()
const _displacement = new Vector3()
const _direction = new Vector3()
const _toPosition = new Vector3()

/**
 * Base class for representing a soccer players.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments Vehicle
 */
class Player extends Vehicle {
  /**
   * Constructs a new player.
   *
   * @param {Number} role - The role of the player.
   * @param {Team} team - A reference to its team.
   * @param {Pitch} pitch - A reference to the pitch.
   * @param {Number} defaultRegionId - The id of its default home region.
   */
  constructor(role, team, pitch, defaultRegionId) {
    super()

    /**
     * The accuracy of kicks. Must be in the range [0,1]. The lower the value the worse the player gets.
     * @type {Number}
     */
    this.accuracy = 0.99

    /**
     * The bounding radius of the player.
     * @type {Number}
     */
    this.boundingRadius = 0.2

    /**
     * The current time delta value. Used in states.
     * @type {Number}
     */
    this.currentDelta = 0

    /**
     * The default region of this player. This region represents the area
     * of the pitch where the player is located before kickoff.
     * @type {Number}
     */
    this.defaultRegionId = defaultRegionId

    /**
     * The current home region of this player. This region will vary over time
     * according to the team's strategy.
     * @type {Number}
     */
    this.homeRegionId = defaultRegionId

    /**
     * A reference to the pitch.
     * @type {Pitch}
     */
    this.pitch = pitch

    /**
     * Players can take different roles e.g. Attacker or Defender.
     * @type {Number}
     */
    this.role = role

    /**
     * The state machine of the player.
     * @type {StateMachine}
     */
    this.stateMachine = new StateMachine(this)

    /**
     * The current steering target of the player.
     * @type {Vector3}
     */
    this.steeringTarget = new Vector3()

    /**
     * A reference to the player's team.
     * @type {Team}
     */
    this.team = team

    /**
     * Players have to update their orientation manually.
     * @type {Boolean}
     */
    this.updateOrientation = false

    //

    this.position.copy(pitch.getRegionById(defaultRegionId).center)
    this.steeringTarget.copy(this.position)
  }

  /**
   * Updates the player.
   *
   * @param {Number} delta - The time delta value.
   * @return {Player} A reference to this player.
   */
  update(delta) {
    this.currentDelta = delta

    this.stateMachine.update()

    super.update(delta)

    return this
  }

  /**
   * Holds the implementation for the message handling of this player.
   *
   * @param {Telegram} telegram - The telegram with the message data.
   * @return {Boolean} Whether the message was processed or not.
   */
  handleMessage(telegram) {
    return this.stateMachine.handleMessage(telegram)
  }

  /**
   * Adds a random noice value to the given target position. This can be used to avoid
   * "perfect" kicks and introduce a natural randomness.
   *
   * @param {Vector3} target - The target position.
   * @return {Vector3} The target position.
   */
  addNoise(target) {
    const displacement = (Math.PI - Math.PI * this.accuracy) * MathUtils.randFloat(-1, 1)

    _quaterion.fromEuler(0, displacement, 0)

    _displacement.subVectors(target, this.position).applyRotation(_quaterion)

    return target.addVectors(_displacement, this.position)
  }

  /**
   * Returns the euclidean distance from the player's position to its home goal.
   *
   * @return {Number} The euclidean distance from the player's position to its home goal.
   */
  getDistanceToHomeGoal() {
    const goal = this.team.homeGoal

    return this.position.distanceTo(goal.position)
  }

  /**
   * Returns the euclidean distance from the player's position to the opposing goal.
   *
   * @return {Number} The euclidean distance from the player's position to the opposing goal.
   */
  getDistanceToOpposingGoal() {
    const goal = this.team.opposingGoal

    return this.position.distanceTo(goal.position)
  }

  /**
   * Returns true if this player is ahead of the team's controlling player. If the own
   * team does not possess the ball, false is returned.
   *
   * @return {Boolean} Whether this player is ahead of the team's controlling player or not.
   */
  isAheadOfAttacker() {
    const team = this.team

    if (team.inControl()) {
      return this.getDistanceToOpposingGoal() < team.controllingPlayer.getDistanceToOpposingGoal()
    } else {
      return false
    }
  }

  /**
   * Returns true if this player is at the position of its current steering target.
   *
   * @return {Boolean} Whether this player is at the position of its current steering target or not.
   */
  atTarget() {
    return this.position.squaredDistanceTo(this.steeringTarget) < CONFIG.PLAYER_IN_TARGET_RANGE_SQ
  }

  /**
   * Returns true if this player is close enough to the ball to kick it.
   *
   * @return {Boolean} Whether this player is close enough to the ball in order to kick it or not.
   */
  isBallWithinKickingRange() {
    const ball = this.team.ball

    return this.position.squaredDistanceTo(ball.position) < CONFIG.PLAYER_KICKING_RANGE_SQ
  }

  /**
   * Returns true if this player is close enough to the ball to start chasing it.
   *
   * @return {Boolean} Whether this player is close enough to the ball to start chasing it or not.
   */
  isBallWithinReceivingRange() {
    const ball = this.team.ball

    return this.position.squaredDistanceTo(ball.position) < CONFIG.PLAYER_RECEIVING_RANGE_SQ
  }

  /**
   * Returns true if this player is the closes team member to the ball.
   *
   * @return {Boolean} Whether this player is the closes team member to the ball or not.
   */
  isClosestTeamMemberToBall() {
    return this === this.team.playerClosestToBall
  }

  /**
   * Returns true if this player is the closes player to the ball.
   *
   * @return {Boolean} Whether this player is the closes player to the ball or not.
   */
  isClosestPlayerOnPitchToBall() {
    if (this.isClosestTeamMemberToBall()) {
      const ball = this.team.ball
      const opponentClosestToBall = this.team.opposingTeam.playerClosestToBall

      return (
        this.position.squaredDistanceTo(ball.position) < opponentClosestToBall.position.squaredDistanceTo(ball.position)
      )
    } else {
      return false
    }
  }

  /**
   * Returns true if this player is the controlling player of the team.
   *
   * @return {Boolean} Whether this player is the controlling player of the team or not.
   */
  isControllingPlayer() {
    return this === this.team.controllingPlayer
  }

  /**
   * Returns true if the given position is in front of the player.
   *
   * @return {Boolean} Whether the given position is in front of the player or not.
   */
  isPositionInFrontOfPlayer(position) {
    this.getDirection(_direction)

    _toPosition.subVectors(position, this.position)

    return _direction.dot(_toPosition) >= 0
  }

  /**
   * Returns true if this player is in its home region.
   *
   * @return {Boolean} Whether this player is in its home region or not.
   */
  inHomeRegion() {
    const homeRegion = this.getHomeRegion()

    // the home region check if more restrictive for field players

    return homeRegion.isInside(this.position, this.role !== ROLE.GOALKEEPER)
  }

  /**
   * Returns true if this player is in the third of the pitch closest to the opponent’s goal.
   *
   * @return {Boolean} Whether this player is in the third of the pitch closest to the opponent’s goal or not.
   */
  inHotRegion() {
    return this.getDistanceToOpposingGoal() < this.pitch.playingArea.width / 3
  }

  /**
   * Returns true if there is an opponent within this player's comfort zone.
   *
   * @return {Boolean} Whether this player is in its home region or not.
   */
  isThreatened() {
    const opponents = this.team.opposingTeam.children

    for (let i = 0, l = opponents.length; i < l; i++) {
      const opponent = opponents[i]

      // if opponent is in front of the player and the distance to the opponent is less than the comfort zone, return true

      if (
        this.isPositionInFrontOfPlayer(opponent.position) &&
        this.position.squaredDistanceTo(opponent.position) < CONFIG.PLAYER_COMFORT_ZONE_SQ
      ) {
        return true
      }
    }

    return false
  }

  /**
   * Returns the player's home region.
   *
   * @return {Region} The player's home region.
   */
  getHomeRegion() {
    return this.pitch.getRegionById(this.homeRegionId)
  }

  /**
   * Overwrites the home region with the defaul region of the player.
   */
  setDefaultHomeRegion() {
    this.homeRegionId = this.defaultRegionId
  }
}

export default Player
