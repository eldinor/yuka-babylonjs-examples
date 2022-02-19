import { Quaternion, State, Vector3 } from '../../../../../../lib/yuka.module.js'

import { CONFIG, FIELDPLAYER_STATES, MESSAGE, ROLE } from '../core/Constants.js'

const _kickForce = new Vector3()
const _shootTarget = new Vector3()
const _facingDirection = new Vector3()
const _goalDirection = new Vector3()
const _rotation = new Quaternion()
const _toBall = new Vector3()

/**
 * The global state of the field player.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class GlobalState extends State {
  execute(player) {
    // If a player is in possession and close to the ball reduce his max speed.

    if (player.isControllingPlayer() && player.isBallWithinReceivingRange()) {
      player.maxSpeed = CONFIG.PLAYER_MAX_SPEED_WITH_BALL
    } else {
      player.maxSpeed = CONFIG.PLAYER_MAX_SPEED_WITHOUT_BALL
    }
  }

  onMessage(player, telegram) {
    switch (telegram.message) {
      case MESSAGE.RETURN_HOME:
        player.setDefaultHomeRegion()

        // It's important to immediately update the steering target so it reflects the new home position.

        player.steeringTarget.copy(player.getHomeRegion().center)

        player.stateMachine.changeTo(FIELDPLAYER_STATES.RETURN_HOME)

        return true

      case MESSAGE.PASS_TO_ME:
        // If there is already a receiving player or the ball is not within kicking range,
        // this player cannot pass the ball to the player making the request.

        if (player.team.receivingPlayer !== null || player.isBallWithinKickingRange() === false) {
          return true
        }

        const requester = telegram.data.requester
        const ball = player.team.ball

        // Make pass.

        _kickForce
          .subVectors(requester.position, ball.position)
          .normalize()
          .multiplyScalar(CONFIG.PLAYER_MAX_PASSING_FORCE)

        ball.kick(_kickForce)

        // Let the receiver know a pass is coming.

        player.team.sendMessage(requester, MESSAGE.RECEIVE_BALL, 0, { target: requester.position.clone() })

        player.stateMachine.changeTo(FIELDPLAYER_STATES.WAIT)

        // Update supporting attacker.

        player.team.findSupport()

        return true

      case MESSAGE.RECEIVE_BALL:
        player.steeringTarget.copy(telegram.data.target)

        player.stateMachine.changeTo(FIELDPLAYER_STATES.RECEIVE_BALL)

        return true

      case MESSAGE.SUPPORT_ATTACKER:
        if (player.stateMachine.in(FIELDPLAYER_STATES.SUPPORT_ATTACKER)) return true

        player.steeringTarget.copy(player.team.getSupportPosition())

        player.stateMachine.changeTo(FIELDPLAYER_STATES.SUPPORT_ATTACKER)

        return true
    }

    return false
  }
}

/**
 * In this state the field player will try to seek to the ball position.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class ChaseBallState extends State {
  enter(player) {
    const seekBehavior = player.steering.behaviors[0]
    seekBehavior.target = player.steeringTarget
    seekBehavior.active = true
  }

  execute(player) {
    // If the ball is within kicking range the player changes state to KICK_BALL.

    if (player.isBallWithinKickingRange()) {
      player.stateMachine.changeTo(FIELDPLAYER_STATES.KICK_BALL)

      return
    }

    // If the player is the closest player to the ball then he should keep chasing it.

    if (player.isClosestTeamMemberToBall()) {
      const ball = player.team.ball
      player.steeringTarget.copy(ball.position)

      return
    }

    // If the player is not closest to the ball anymore, he should return back to his home region and wait for another opportunity.

    player.stateMachine.changeTo(FIELDPLAYER_STATES.RETURN_HOME)
  }

  exit(player) {
    const seekBehavior = player.steering.behaviors[0]
    seekBehavior.target = null
    seekBehavior.active = false
  }
}

/**
 * In this state the ball controlling field player moves to the opposing goal.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class DribbleState extends State {
  enter(player) {
    player.team.setControl(player)
  }

  execute(player) {
    const ball = player.team.ball

    player.getDirection(_facingDirection)
    player.team.homeGoal.getDirection(_goalDirection)

    const dot = _facingDirection.dot(_goalDirection)

    // If the ball is between the player and the home goal, it needs to
    // swivel the ball around by doing multiple small kicks and turns until
    // the player is facing in the correct direction.

    if (dot < 0) {
      // The player's heading is going to be rotated by a small amount
      // (Pi/4) and then the ball will be kicked in that direction.

      // Calculate the sign (+/-) of the angle between the player heading
      // and the facing direction of the goal so that the player rotates
      // around in the correct direction.

      const sign = _facingDirection.x * _goalDirection.z < _facingDirection.z * _goalDirection.x ? 1 : -1

      _rotation.fromEuler(0, Math.PI * 0.25 * sign, 0)

      _facingDirection.applyRotation(_rotation).normalize()

      _kickForce.copy(_facingDirection).multiplyScalar(CONFIG.PLAYER_MAX_DRIBBLE_AND_TURN_FORCE)

      // Kick the ball with a lower force if the player turns around.

      ball.kick(_kickForce)
    } else {
      // Kick the ball down the field.

      _kickForce.copy(_goalDirection).multiplyScalar(CONFIG.PLAYER_MAX_DRIBBLE_FORCE)

      ball.kick(_kickForce)
    }

    // The player has kicked the ball so he must now change state to follow it.

    player.stateMachine.changeTo(FIELDPLAYER_STATES.CHASE_BALL)
  }
}

/**
 * In this state the player kicks the ball. The player can shot a the goal or pass to a team member.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class KickBallState extends State {
  enter(player) {
    player.team.setControl(player)

    // The player can only make a specific amount of kicks per second.

    if (player.isReadyForNextKick() === false) {
      player.stateMachine.changeTo(FIELDPLAYER_STATES.CHASE_BALL)
    }
  }

  execute(player) {
    const team = player.team
    const ball = team.ball
    const pitch = player.pitch

    // Compute the dot product of the vector pointing to the ball and the player's heading.

    _toBall.subVectors(ball.position, player.position).normalize()
    player.getDirection(_facingDirection)
    const dot = _toBall.dot(_facingDirection)

    // Cannot kick the ball if the goalkeeper is in possession or if it is behind the player
    // or if there is already an assigned receiver. So just continue chasing the ball.

    if (pitch.isGoalKeeperInBallPossession || dot < 0 || team.receivingPlayer !== null) {
      player.stateMachine.changeTo(FIELDPLAYER_STATES.CHASE_BALL)

      return
    }

    /* attempt a shot at the goal */

    // The dot product is used to adjust the shooting force. The more
    // directly the ball is ahead, the more forceful the kick.

    let power = CONFIG.PLAYER_MAX_SHOOTING_FORCE * dot

    // If it is determined that the player could score a goal from this position OR if he should just kick the ball anyway,
    // the player will  attempt to make the shot.

    if (team.canShoot(ball.position, power, _shootTarget) || Math.random() < CONFIG.PLAYER_CHANCE_ATTEMPT_POT_SHOT) {
      // Add some noise to the kick. Avoid players who are too accurate.

      player.addNoise(_shootTarget)

      // This is the direction the ball will be kicked in.

      _kickForce.subVectors(_shootTarget, ball.position).normalize().multiplyScalar(power)

      // Kick.

      ball.kick(_kickForce)

      // Change state

      player.stateMachine.changeTo(FIELDPLAYER_STATES.WAIT)

      // Update supporting attacker.

      team.findSupport()

      return
    }

    /* attempt a pass to a player */

    power = CONFIG.PLAYER_MAX_PASSING_FORCE * dot

    const pass = {
      receiver: null,
      target: new Vector3(),
    }

    // Test if there are any potential candidates available to receive a pass.

    if (player.isThreatened() && team.findPass(player, power, CONFIG.PLAYER_MIN_PASS_DISTANCE, pass)) {
      player.addNoise(pass.target)

      _kickForce.subVectors(pass.target, ball.position).normalize().multiplyScalar(power)

      ball.kick(_kickForce)

      // Let the receiving player know the ball's coming at him.

      team.sendMessage(pass.receiver, MESSAGE.RECEIVE_BALL, 0, { target: pass.target })

      // The player should wait at his current position unless instructed otherwise.

      player.stateMachine.changeTo(FIELDPLAYER_STATES.WAIT)

      // Update supporting attacker.

      team.findSupport()
    } else {
      // Cannot shoot or pass, so dribble the ball upfield.

      player.stateMachine.changeTo(FIELDPLAYER_STATES.DRIBBLE)

      // Update supporting attacker.

      team.findSupport()
    }
  }
}

/**
 * In this state the field player receives the ball.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class ReceiveBallState extends State {
  enter(player) {
    const team = player.team

    team.receivingPlayer = player

    team.setControl(player)

    // There are two types of receive behavior. One uses arrive to direct the
    // receiver to the position sent by the passer in its message. The other
    // uses the pursuit behavior to pursue the ball. This statement selects
    // between them dependent on the probability
    // PLAYER_CHANCE_OF_USING_ARRIVE_TYPE_RECEIVE_BEHAVIOR, whether or not an opposing
    // player is close to the receiving player, and whether or not the receiving
    // player is in the opponents "hot region" (the third of the pitch closest
    // to the opponent's goal).

    if (
      (player.inHotRegion() || Math.random() > CONFIG.PLAYER_CHANCE_OF_USING_ARRIVE_TYPE_RECEIVE_BEHAVIOR) &&
      player.team.isOpponentWithinRadius(player, CONFIG.PLAYER_PASS_THREAD_RADIUS)
    ) {
      const pursuitBehavior = player.steering.behaviors[2]
      pursuitBehavior.evader = team.ball
      pursuitBehavior.active = true
    } else {
      const arriveBehavior = player.steering.behaviors[1]
      arriveBehavior.target = player.steeringTarget
      arriveBehavior.active = true
    }
  }

  execute(player) {
    // If the ball comes close enough to the player or if his team lose
    // control he should change state to chase the ball.

    if (player.isBallWithinReceivingRange() || player.team.inControl() === false) {
      player.stateMachine.changeTo(FIELDPLAYER_STATES.CHASE_BALL)
      return
    }

    // If "pursuit" is active, it's necessary to update the target position.

    const pursuitBehavior = player.steering.behaviors[2]
    const ball = player.team.ball

    if (pursuitBehavior.active) {
      player.steeringTarget.copy(ball.position)
    }

    // If the player has "arrived" at the steering target, he should wait.

    if (player.atTarget()) {
      const arriveBehavior = player.steering.behaviors[1]
      arriveBehavior.target = null
      arriveBehavior.active = false

      const pursuitBehavior = player.steering.behaviors[2]
      pursuitBehavior.evader = null
      pursuitBehavior.active = false

      player.velocity.set(0, 0, 0)
    }
  }

  exit(player) {
    const arriveBehavior = player.steering.behaviors[1]
    arriveBehavior.target = null
    arriveBehavior.active = false

    const pursuitBehavior = player.steering.behaviors[2]
    pursuitBehavior.evader = null
    pursuitBehavior.active = false

    player.team.receivingPlayer = null
  }
}

/**
 * In this state the field player will return to his home region.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class ReturnHomeState extends State {
  enter(player) {
    const arriveBehavior = player.steering.behaviors[1]
    arriveBehavior.target = player.steeringTarget
    arriveBehavior.active = true

    // Ensure the player's steering target is within the home region.

    if (player.getHomeRegion().isInside(player.steeringTarget, true) === false) {
      player.steeringTarget.copy(player.getHomeRegion().center)
    }
  }

  execute(player) {
    const pitch = player.pitch

    if (pitch.isPlaying) {
      // If the ball is nearer this player than any other team member &&
      // there is not an assigned receiver && the goalkeeper does not have the ball, go chase it.

      if (
        player.isClosestTeamMemberToBall() &&
        player.team.receivingPlayer === null &&
        pitch.isGoalKeeperInBallPossession === false
      ) {
        player.stateMachine.changeTo(FIELDPLAYER_STATES.CHASE_BALL)

        return
      }
    }

    // If game is on and the player is close enough to home, change state to
    // wait and set the player target to his current position.

    if (pitch.isPlaying && player.inHomeRegion()) {
      player.steeringTarget.copy(player.position)

      player.stateMachine.changeTo(FIELDPLAYER_STATES.WAIT)

      // If game is not on the player must return much closer to the center of
      // his home region.
    } else if (pitch.isPlaying === false && player.atTarget()) {
      player.stateMachine.changeTo(FIELDPLAYER_STATES.WAIT)
    }

    player.rotateTo(player.steeringTarget, player.currentDelta)
  }

  exit(player) {
    const arriveBehavior = player.steering.behaviors[1]
    arriveBehavior.target = null
    arriveBehavior.active = false
  }
}

/**
 * In this state the field player will try to support to the attacker.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class SupportAttackerState extends State {
  enter(player) {
    player.steeringTarget.copy(player.team.getSupportPosition())

    const arriveBehavior = player.steering.behaviors[1]
    arriveBehavior.target = player.steeringTarget
    arriveBehavior.active = true
  }

  execute(player) {
    const team = player.team

    // If his team loses control go back home.

    if (team.inControl() === false) {
      player.stateMachine.changeTo(FIELDPLAYER_STATES.RETURN_HOME)
      return
    }

    // If the player becomes suddenly the closest player to the ball AND there is no receiving player then chase the ball.

    if (player.isClosestTeamMemberToBall() && player.team.receivingPlayer === null) {
      player.stateMachine.changeTo(FIELDPLAYER_STATES.CHASE_BALL)
      return
    }

    // If the best supporting spot changes, change the steering target.

    if (team.getSupportPosition().equals(player.steeringTarget) === false) {
      player.steeringTarget.copy(team.getSupportPosition())

      const arriveBehavior = player.steering.behaviors[1]
      arriveBehavior.active = true
    }

    // If this player has a shot at the goal AND the attacker can pass the ball to him the attacker should pass the ball to this player.

    if (team.canShoot(player.position, CONFIG.PLAYER_MAX_SHOOTING_FORCE, _shootTarget)) {
      team.requestPass(player)
    }

    // If this player is located at the support spot and his team still have
    // possession, he should remain still and turn to face the ball.

    if (player.atTarget()) {
      const arriveBehavior = player.steering.behaviors[1]
      arriveBehavior.active = false

      // The player should keep his eyes on the ball.

      player.rotateTo(team.ball.position, player.currentDelta)
      player.velocity.set(0, 0, 0)

      // If not threatened by another player request a pass.

      if (player.isThreatened() === false) {
        team.requestPass(player)
      }
    } else {
      player.rotateTo(player.steeringTarget, player.currentDelta)
    }
  }

  exit(player) {
    player.team.supportingPlayer = null

    const arriveBehavior = player.steering.behaviors[1]
    arriveBehavior.target = null
    arriveBehavior.active = false
  }
}

/**
 * In this state the field player will wait in his home region.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class WaitState extends State {
  execute(player) {
    const team = player.team
    const pitch = player.pitch

    const arriveBehavior = player.steering.behaviors[1]

    // If players are in this state and the team strategy changes, it is necessary
    // that the players moves to an updated steering target.

    if (player.atTarget() === false) {
      arriveBehavior.target = player.steeringTarget
      arriveBehavior.active = true
    } else {
      arriveBehavior.target = null
      arriveBehavior.active = false

      player.velocity.set(0, 0, 0)
    }

    if (pitch.isPlaying) {
      // If the ball is nearer to this player than any other team member AND
      // there is not an assigned receiver AND neither goalkeeper has the
      // ball, go chase it.

      if (
        player.isClosestTeamMemberToBall() &&
        team.receivingPlayer === null &&
        pitch.isGoalKeeperInBallPossession === false
      ) {
        player.stateMachine.changeTo(FIELDPLAYER_STATES.CHASE_BALL)
        return
      }
    }

    // If this player's team is controlling AND this player is not the
    // attacker AND is further up the field than the attacker AND if the controlling player
    // is not the goalkeeper he should request a pass

    if (
      team.inControl() &&
      player.isControllingPlayer() === false &&
      player.isAheadOfAttacker() &&
      team.controllingPlayer.role !== ROLE.GOALKEEPER
    ) {
      team.requestPass(player)
    }
  }

  exit(player) {
    const arriveBehavior = player.steering.behaviors[1]
    arriveBehavior.target = null
    arriveBehavior.active = false
  }
}

export {
  ChaseBallState,
  DribbleState,
  GlobalState,
  KickBallState,
  ReceiveBallState,
  ReturnHomeState,
  SupportAttackerState,
  WaitState,
}
