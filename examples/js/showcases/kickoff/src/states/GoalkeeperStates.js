import { State, Vector3 } from '../../../../../../lib/yuka.module.js'
import { MESSAGE, GOALKEEPER_STATES, CONFIG } from '../core/Constants.js'

const _target = new Vector3()
const _displacement = new Vector3()

/**
 * The global state of the goalkeeper.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class GlobalState extends State {
  onMessage(goalkeeper, telegram) {
    // This state is only used for processing messages.

    switch (telegram.message) {
      case MESSAGE.RETURN_HOME:
        goalkeeper.setDefaultHomeRegion()

        goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.RETURN_HOME)

        return true

      case MESSAGE.RECEIVE_BALL:
        goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.INTERCEPT_BALL)

        return true
    }

    return false
  }
}

/**
 * In this state the goalkeeper simply returns back to the center of the goal region
 * before changing state back to TEND_GOAL.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class ReturnHomeState extends State {
  enter(goalkeeper) {
    const region = goalkeeper.getHomeRegion()
    goalkeeper.steeringTarget.copy(region.center)

    const arriveBehavior = goalkeeper.steering.behaviors[0]
    arriveBehavior.target = goalkeeper.steeringTarget
    arriveBehavior.active = true
  }

  execute(goalkeeper) {
    // If close enough to home or the opponents get control over the ball, change state to TEND_GOAL.

    if (goalkeeper.inHomeRegion() || goalkeeper.team.inControl() === false) {
      goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.TEND_GOAL)
    }
  }

  exit(goalkeeper) {
    const arriveBehavior = goalkeeper.steering.behaviors[0]
    arriveBehavior.target = null
    arriveBehavior.active = false
  }
}

/**
 * This is the main state for the goalkeeper. When in this state he will move left to right across the goalmouth
 * using an interpose-like steering to put himself between the ball and the back of the net. If the ball comes within
 * the "goalkeeper range", he moves out of the goalmouth to attempt to intercept it.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class TendGoalState extends State {
  enter(goalkeeper) {
    const arriveBehavior = goalkeeper.steering.behaviors[0]
    arriveBehavior.target = goalkeeper.steeringTarget
    arriveBehavior.active = true
  }

  execute(goalkeeper) {
    const ball = goalkeeper.team.ball

    // update steering

    goalkeeper.getRearInterposeTarget(_target)

    _displacement.subVectors(ball.position, _target).normalize().multiplyScalar(CONFIG.GOALKEEPER_TENDING_DISTANCE)

    goalkeeper.steeringTarget.copy(_target).add(_displacement)

    // If the ball comes in range the keeper traps it and then changes state to put the ball back in play.

    if (goalkeeper.isBallWithinKeeperRange()) {
      ball.trap()

      goalkeeper.pitch.isGoalKeeperInBallPossession = true

      goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.PUT_BALL_BACK_IN_PLAY)

      return
    }

    // If the keeper has ventured too far away from the goalline and there is no threat from the
    // opponents he should move back towards it.

    if (goalkeeper.isTooFarFromGoalMouth() && goalkeeper.team.inControl()) {
      goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.RETURN_HOME)

      return
    }

    // If ball is within a predefined distance, the keeper moves out from position to try to intercept it.

    if (goalkeeper.isBallWithinRangeForIntercept() && goalkeeper.team.inControl() === false) {
      goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.INTERCEPT_BALL)

      return
    }
  }

  exit(goalkeeper) {
    const arriveBehavior = goalkeeper.steering.behaviors[0]
    arriveBehavior.target = null
    arriveBehavior.active = false
  }
}

/**
 * In this state the goalkeeper will attempt to intercept the ball using the pursuit steering behavior,
 * but he only does so so long as he remains within his home region.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class InterceptBallState extends State {
  enter(goalkeeper) {
    const pursuitBehavior = goalkeeper.steering.behaviors[1]
    pursuitBehavior.evader = goalkeeper.team.ball
    pursuitBehavior.active = true
  }

  execute(goalkeeper) {
    // If the goalkeeper moves too far away from the goal he should return to his home region
    // UNLESS he is the closest player to the ball, in which case, he should keep trying to intercept it.

    if (goalkeeper.isTooFarFromGoalMouth() && goalkeeper.isClosestPlayerOnPitchToBall() === false) {
      goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.RETURN_HOME)

      return
    }

    // If the ball becomes in range of the goalkeeper's hands he traps the ball and puts it back in play.

    if (goalkeeper.isBallWithinKeeperRange()) {
      const ball = goalkeeper.team.ball
      ball.trap()

      goalkeeper.pitch.isGoalKeeperInBallPossession = true

      goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.PUT_BALL_BACK_IN_PLAY)

      return
    }
  }

  exit(goalkeeper) {
    const pursuitBehavior = goalkeeper.steering.behaviors[1]
    pursuitBehavior.evader = null
    pursuitBehavior.active = false
  }
}

/**
 * In this state the goalkeeper will put the ball back in play.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class PutBallBackInPlayState extends State {
  enter(goalkeeper) {
    // Let the team know that the keeper is in control.

    goalkeeper.team.setControl(goalkeeper)

    // Send all players home.

    goalkeeper.team.returnAllFieldPlayersToHome()
    goalkeeper.team.opposingTeam.returnAllFieldPlayersToHome()
  }

  execute(goalkeeper) {
    const pass = {
      receiver: null,
      target: new Vector3(),
    }

    const team = goalkeeper.team

    // Test if there are players further forward on the field we might be able to pass to. If so, make a pass.

    if (
      team.findPass(goalkeeper, CONFIG.PLAYER_MAX_PASSING_FORCE, CONFIG.GOALKEEPER_MIN_PASS_DISTANCE, pass) !== null
    ) {
      const ball = team.ball

      const force = new Vector3()
      force.subVectors(pass.target, ball.position).normalize().multiplyScalar(CONFIG.PLAYER_MAX_PASSING_FORCE)

      // Make the pass.

      ball.kick(force)

      // Goalkeeper no longer has ball.

      goalkeeper.pitch.isGoalKeeperInBallPossession = false

      // Let the receiving player know the ball's coming at him.

      team.sendMessage(pass.receiver, MESSAGE.RECEIVE_BALL, 0, { target: pass.target })

      // Go back to tending the goal.

      goalkeeper.stateMachine.changeTo(GOALKEEPER_STATES.TEND_GOAL)

      return
    }

    // Ensure the goalkeeper stays still when he has the ball.

    goalkeeper.velocity.set(0, 0, 0)
  }
}

export { GlobalState, ReturnHomeState, TendGoalState, InterceptBallState, PutBallBackInPlayState }
