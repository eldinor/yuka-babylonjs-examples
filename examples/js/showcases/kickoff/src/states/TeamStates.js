import { State } from '../../../../../../lib/yuka.module.js'
import { MESSAGE, TEAM_STATES } from '../core/Constants.js'

/**
 * The global state of the team.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class GlobalState extends State {
  onMessage(team, telegram) {
    // This state is only used for processing messages.

    switch (telegram.message) {
      case MESSAGE.GOAL_SCORED:
        if (telegram.data.team === team.color) team.goals++

        team.stateMachine.changeTo(TEAM_STATES.PREPARE_FOR_KICKOFF)

        return true
    }

    return false
  }
}

/**
 * In this state the team tries to make a goal.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class AttackingState extends State {
  enter(team) {
    // Set up the player's new home regions.

    team.setupTeamPositions()

    // If a player is in either the WAIT or RETURN_HOME states, its
    // steering target must be updated to that of its new home region to
    // enable it to move into the correct position.

    team.updateSteeringTargetOfPlayers()
  }

  execute(team) {
    // If this team is no longer in control, change to defending.

    if (team.inControl() === false) {
      team.stateMachine.changeTo(TEAM_STATES.DEFENDING)
    }

    // Compute the best position for any supporting attacker to move to.

    team.computeBestSupportingPosition()
  }

  exit(team) {
    team.lostControl()
  }
}

/**
 * In this state the team tries to defend its goal.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class DefendingState extends State {
  enter(team) {
    team.setupTeamPositions()
    team.updateSteeringTargetOfPlayers()
  }

  execute(team) {
    // If this team gets control over the ball, change to attacking.

    if (team.inControl()) {
      team.stateMachine.changeTo(TEAM_STATES.ATTACKING)
    }
  }
}

/**
 * In this state the team prepares for kickoff.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class PrepareForKickOffState extends State {
  enter(team) {
    team.receivingPlayer = null
    team.playerClosestToBall = null
    team.controllingPlayer = null
    team.supportingPlayer = null

    // send all players to their default regions

    team.returnAllFieldPlayersToHome(true)
  }

  execute(team) {
    if (team.areAllPlayersAtHome() && team.opposingTeam.areAllPlayersAtHome()) {
      team.stateMachine.changeTo(TEAM_STATES.DEFENDING)
    }
  }

  exit(team) {
    team.pitch.isPlaying = true
  }
}

export { AttackingState, DefendingState, GlobalState, PrepareForKickOffState }
