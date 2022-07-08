import { ArriveBehavior, PursuitBehavior, Regulator, SeekBehavior } from '../../../../../../lib/yuka.module.js'
import { CONFIG, FIELDPLAYER_STATES } from '../core/Constants.js'
import {
  ChaseBallState,
  DribbleState,
  GlobalState,
  KickBallState,
  ReceiveBallState,
  ReturnHomeState,
  SupportAttackerState,
  WaitState,
} from '../states/FieldplayerStates.js'
import Player from './Player.js'

/**
 * Base class for representing a field player.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments Player
 */
class FieldPlayer extends Player {
  /**
   * Constructs a new field player.
   *
   * @param {Number} role - The role of the player.
   * @param {Team} team - A reference to its team.
   * @param {Pitch} pitch - A reference to the pitch.
   * @param {Number} defaultRegionId - The id of its default home region.
   */
  constructor(role, team, pitch, defaultRegionId) {
    super(role, team, pitch, defaultRegionId)

    /**
     * Regulates how often a field player is able to kick the ball in one second.
     * @type {Number}
     */
    this._kickRegulator = new Regulator(CONFIG.PLAYER_KICK_FREQUENCY)

    // steering behaviors

    const seekBehavior = new SeekBehavior()
    seekBehavior.active = false
    this.steering.add(seekBehavior)

    const arriveBehavior = new ArriveBehavior()
    arriveBehavior.active = false
    arriveBehavior.deceleration = 1.5
    this.steering.add(arriveBehavior)

    const pursuitBehavior = new PursuitBehavior()
    pursuitBehavior.active = false
    this.steering.add(pursuitBehavior)

    // states

    this.stateMachine.globalState = new GlobalState()

    this.stateMachine.add(FIELDPLAYER_STATES.CHASE_BALL, new ChaseBallState())
    this.stateMachine.add(FIELDPLAYER_STATES.DRIBBLE, new DribbleState())
    this.stateMachine.add(FIELDPLAYER_STATES.KICK_BALL, new KickBallState())
    this.stateMachine.add(FIELDPLAYER_STATES.RECEIVE_BALL, new ReceiveBallState())
    this.stateMachine.add(FIELDPLAYER_STATES.RETURN_HOME, new ReturnHomeState())
    this.stateMachine.add(FIELDPLAYER_STATES.SUPPORT_ATTACKER, new SupportAttackerState())
    this.stateMachine.add(FIELDPLAYER_STATES.WAIT, new WaitState())

    this.stateMachine.changeTo(FIELDPLAYER_STATES.WAIT)
  }

  /**
   * Updates the field player.
   *
   * @param {Number} delta - The time delta value.
   * @return {FieldPlayer} A reference to this field player.
   */
  update(delta) {
    super.update(delta)

    // In most states field players should always focus the ball. In other states (RETURN_HOME and SUPPORT_ATTACKER) the focus point
    // depends on the current situation. It might be the ball or the current steering target.

    if (
      this.stateMachine.in(FIELDPLAYER_STATES.RETURN_HOME) === false &&
      this.stateMachine.in(FIELDPLAYER_STATES.SUPPORT_ATTACKER) === false
    ) {
      this.rotateTo(this.team.ball.position, delta)
    }
  }

  /**
   * Returns true if the field player is able to kick the ball again.
   *
   * @return {Boolean} Whether the field player is able to kick the ball again or not.
   */
  isReadyForNextKick() {
    return this._kickRegulator.ready()
  }
}

export default FieldPlayer
