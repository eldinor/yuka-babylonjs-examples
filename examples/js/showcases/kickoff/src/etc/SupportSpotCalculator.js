import { Regulator, Vector3 } from '../../../../../../lib/yuka.module.js'

import { CONFIG, TEAM } from '../core/Constants.js'

const _target = new Vector3()

/**
 * Helper class to determine the best spots for a supporting soccer player to
 * move to.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class SupportSpotCalculator {
  /**
   * Constructs a new support spot calculator.
   *
   * @param {Team} team - The owner team of this calculator.
   */
  constructor(team) {
    /**
     * The owner team of this calculator.
     * @type {Team}
     */
    this.team = team

    /**
     * Represents the current best supporting spot.
     * @type {Vector3}
     */
    this._bestSupportSpot = null

    /**
     * Used to control how often the computation is done per second.
     * @type {Regulator}
     */
    this._regulator = new Regulator(CONFIG.SUPPORT_SPOT_CALCULATOR_UPDATE_FREQUENCY)

    /**
     * Holds all possible supporting spots of a team.
     * @type {Array<Vector3>}
     */
    this._spots = []

    this._computeSupportingSpots()
  }

  /**
   * This method iterates through each possible spot and computes its score. The spot with the best
   * score is stored and returned. If not best spot could be computed, null is returned.
   *
   * @return {Vector3} Whether the given position is inside the region or not.
   */
  computeBestSupportingPosition() {
    let bestScore = 0

    if (this._regulator.ready() === false && this._bestSupportSpot !== null) {
      return this._bestSupportSpot.position
    }

    this._bestSupportSpot = null

    const spots = this._spots
    const team = this.team

    for (let i = 0, l = spots.length; i < l; i++) {
      const spot = spots[i]
      spot.score = 0
      spot.best = false

      // 1.Test: Is it possible to make a safe pass from the ball's position to this position?

      if (
        team.inControl() &&
        team.isPassSafeFromAllOpponents(
          this.team.controllingPlayer.position,
          spot.position,
          null,
          CONFIG.PLAYER_MAX_PASSING_FORCE
        )
      ) {
        spot.score += CONFIG.SUPPORT_SPOT_CALCULATOR_SCORE_CAN_PASS
      }

      // 2.Test: Determine if a goal can be scored from this position.

      if (team.canShoot(spot.position, CONFIG.PLAYER_MAX_SHOOTING_FORCE, _target)) {
        spot.score += CONFIG.SUPPORT_SPOT_CALCULATOR_SCORE_CAN_SCORE
      }

      // 3. Test: Calculate how far this spot is away from the controlling player.
      // The further away, the higher the score. The constant "OPT_DISTANCE" describes the optimal distance for this score.

      if (team.supportingPlayer !== null) {
        const distance = team.controllingPlayer.position.distanceTo(spot.position)

        if (distance < CONFIG.SUPPORT_SPOT_CALCULATOR_OPT_DISTANCE) {
          // add the score proportionally to the distance

          const f =
            (CONFIG.SUPPORT_SPOT_CALCULATOR_OPT_DISTANCE - distance) / CONFIG.SUPPORT_SPOT_CALCULATOR_OPT_DISTANCE
          spot.score += CONFIG.SUPPORT_SPOT_CALCULATOR_SCORE_DISTANCE * f
        } else {
          // distances greater than "OPT_DISTANCE" get full score

          spot.score += CONFIG.SUPPORT_SPOT_CALCULATOR_SCORE_DISTANCE
        }
      }

      if (spot.score > bestScore) {
        bestScore = spot.score

        this._bestSupportSpot = spot
      }
    }

    if (this._bestSupportSpot !== null) {
      this._bestSupportSpot.best = true

      return this._bestSupportSpot.position
    }

    return null
  }

  /**
   * Returns the best supporting spot if there is one. If one hasn't been
   * computed yet, this method calls computeBestSupportingPosition() and returns
   * the result.
   *
   * @returns {Vector3} The best supporting spot on the soccer pitch.
   */
  getBestSupportingPosition() {
    if (this._bestSupportSpot === null) {
      return this.computeBestSupportingPosition()
    } else {
      return this._bestSupportSpot.position
    }
  }

  /**
   * This method computes all possible supporting spots and stores them in the internal array.
   * Called only once by the constructor.
   */
  _computeSupportingSpots() {
    const playingField = this.team.pitch.playingArea

    const widthOfSpotRegion = playingField.width * 0.8
    const heightOfSpotRegion = playingField.height * 0.8

    const sliceX = widthOfSpotRegion / CONFIG.SUPPORT_SPOT_CALCULATOR_SLICE_X
    const sliceY = heightOfSpotRegion / CONFIG.SUPPORT_SPOT_CALCULATOR_SLICE_Y

    const top = playingField.top - (playingField.height - heightOfSpotRegion) * 0.5 - sliceY * 0.5
    const right = playingField.right - (playingField.width - widthOfSpotRegion) * 0.5 - sliceX * 0.5
    const left = playingField.left + (playingField.width - widthOfSpotRegion) * 0.5 + sliceX * 0.5

    for (let x = 0; x < CONFIG.SUPPORT_SPOT_CALCULATOR_SLICE_X * 0.5 - 1; x++) {
      for (let y = 0; y < CONFIG.SUPPORT_SPOT_CALCULATOR_SLICE_Y; y++) {
        // The spots are always located in the opposing part of the soccer pitch.

        if (this.team.color === TEAM.RED) {
          this._spots.push({
            position: new Vector3(left + x * sliceX, 0, top - y * sliceY),
            score: 0,
            best: false,
          })
        } else {
          this._spots.push({
            position: new Vector3(right - x * sliceX, 0, top - y * sliceY),
            score: 0,
            best: false,
          })
        }
      }
    }
  }
}

export default SupportSpotCalculator
