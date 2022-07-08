import { ArriveBehavior, PursuitBehavior, Vector3 } from '../../../../../../lib/yuka.module.js'
import { GOALKEEPER_STATES, CONFIG, ROLE } from '../core/Constants.js'
import {
  GlobalState,
  InterceptBallState,
  PutBallBackInPlayState,
  ReturnHomeState,
  TendGoalState,
} from '../states/GoalkeeperStates.js'
import Player from './Player.js'

const _target = new Vector3()

/**
 * Base class for representing a goalkeeper.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments Player
 */
class Goalkeeper extends Player {
  /**
   * Constructs a new goalkeeper.
   *
   * @param {Team} team - A reference to its team.
   * @param {Pitch} pitch - A reference to the pitch.
   * @param {Number} defaultRegionId - The id of its default home region.
   */
  constructor(team, pitch, defaultRegionId) {
    super(ROLE.GOALKEEPER, team, pitch, defaultRegionId)

    this.maxSpeed = 1.5

    // steering behaviors

    const arriveBehavior = new ArriveBehavior()
    arriveBehavior.deceleration = 1
    arriveBehavior.active = false
    this.steering.add(arriveBehavior)

    const pursuitBehavior = new PursuitBehavior()
    pursuitBehavior.active = false
    this.steering.add(pursuitBehavior)

    // states

    this.stateMachine.globalState = new GlobalState()

    this.stateMachine.add(GOALKEEPER_STATES.RETURN_HOME, new ReturnHomeState())
    this.stateMachine.add(GOALKEEPER_STATES.TEND_GOAL, new TendGoalState())
    this.stateMachine.add(GOALKEEPER_STATES.INTERCEPT_BALL, new InterceptBallState())
    this.stateMachine.add(GOALKEEPER_STATES.PUT_BALL_BACK_IN_PLAY, new PutBallBackInPlayState())

    this.stateMachine.changeTo(GOALKEEPER_STATES.TEND_GOAL)
  }

  /**
   * Updates the goalkeeper.
   *
   * @param {Number} delta - The time delta value.
   * @return {Goalkeeper} A reference to this goalkeeper.
   */
  update(delta) {
    super.update(delta)

    this.rotateTo(this.team.ball.position, delta)
  }

  /**
   * Returns true if the ball is within the goalkeeper's target range. If so, the keeper is able
   * to trap the ball.
   *
   * @return {Boolean} Whether the ball is within the keeper's target range or not.
   */
  isBallWithinKeeperRange() {
    const ball = this.team.ball

    return this.position.squaredDistanceTo(ball.position) < CONFIG.GOALKEEPER_IN_TARGET_RANGE_SQ
  }

  /**
   * Returns true if the ball is within the goalkeeper's interception range. If so, the keeper will
   * start to pursuit the ball.
   *
   * @return {Boolean} Whether the ball is within the keeper's interception range or not.
   */
  isBallWithinRangeForIntercept() {
    const ball = this.team.ball
    const goal = this.team.homeGoal

    return goal.position.squaredDistanceTo(ball.position) <= CONFIG.GOALKEEPER_INTERCEPT_RANGE_SQ
  }

  /**
   * Returns true if the goalkeeper is too far away from the goalmouth.
   *
   * @return {Boolean} Whether the goalkeeper is too far away from the goalmouth or not.
   */
  isTooFarFromGoalMouth() {
    this.getRearInterposeTarget(_target)

    return this.position.squaredDistanceTo(_target) > CONFIG.GOALKEEPER_INTERCEPT_RANGE_SQ
  }

  /**
   * This method is called by the TendGoalState to determine the spot
   * along the goalmouth which will act as one of the interpose targets
   * (the other is the ball). The specific point at the goal line that
   * the keeper is trying to cover is flexible and can move depending on
   * where the ball is on the field. To achieve this we just scale the
   * ball's z value by the ratio of the goal width to playing field height.
   *
   * @param {Vector3} force - The interpose target.
   * @returns {Vector3} The interpose target.
   */
  getRearInterposeTarget(target) {
    const pitch = this.pitch
    const ball = this.team.ball
    const goal = this.team.homeGoal

    target.x = goal.position.x
    target.y = 0
    target.z = ball.position.z * (goal.width / pitch.playingArea.height)

    return target
  }
}

export default Goalkeeper
