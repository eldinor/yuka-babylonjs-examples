import { GameEntity, Plane, Vector3 } from '../../../../../../lib/yuka.module.js'
import { MESSAGE } from '../core/Constants.js'

import Region from '../etc/Region.js'

/**
 * Class for representing a soccer pitch.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 * @augments GameEntity
 */
class Pitch extends GameEntity {
  /**
   * Constructs a new pitch.
   *
   * @param {Number} width - The width of the pitch.
   * @param {Number} height - The height of the pitch.
   * @param {World} world - A reference to the World class.
   */
  constructor(width, height, world) {
    super()

    /**
     * A reference to the World class.
     * @type {World}
     */
    this.world = world

    /**
     * Represents the walls of the soccer pitch. The ball will
     * collide against these walls so it can leave the playing area.
     * @type {Array<Plane>}
     */
    this.walls = [
      new Plane(new Vector3(0, 0, -1), 7.5), // top
      new Plane(new Vector3(0, 0, 1), 7.5), // bottom
      new Plane(new Vector3(-1, 0, 0), 10), // right (red goal)
      new Plane(new Vector3(1, 0, 0), 10), // left (blue goal)
    ]

    /**
     * Whether both teams are playing or not.
     * @type {Boolean}
     */
    this.isPlaying = true

    /**
     * Whether one of the goalkeepers is in ball possession or not.
     * @type {Boolean}
     */
    this.isGoalKeeperInBallPossession = false

    /**
     * A reference to the soccer ball.
     * @type {Ball}
     */
    this.ball = null

    /**
     * A reference to the red team.
     * @type {Team}
     */
    this.teamRed = null

    /**
     * A reference to the blue team.
     * @type {Team}
     */
    this.teamBlue = null

    /**
     * Represents the playing area of the pitch.
     * @type {Region}
     */
    this.playingArea = new Region(this.position.clone(), width, height)

    /**
     * The region count the pitch along the x axis.
     * @type {Number}
     */
    this.regionCountWidth = 6

    /**
     * The region count the pitch along the z axis.
     * @type {Number}
     */
    this.regionCountHeight = 3

    /**
     * Holds the regions of the soccer pitch.
     * @type {Array<Region>}
     */
    this.regions = []

    this._createRegions()
  }

  /**
   * Holds the implementation for the message handling of this pitch.
   *
   * @param {Telegram} telegram - The telegram with the message data.
   * @return {Boolean} Whether the message was processed or not.
   */
  handleMessage(telegram) {
    switch (telegram.message) {
      case MESSAGE.GOAL_SCORED:
        this.isPlaying = false

        this.world.refreshUI()

        return true
    }

    return false
  }

  /**
   * Returns the region for the given ID.
   *
   * @param {Number} id - The id for the requested region.
   * @return {Region} The requested region.
   */
  getRegionById(id) {
    return this.regions[id]
  }

  /**
   * Generates the regions of this pitch. All regions lie in a XZ at the origin.
   */
  _createRegions() {
    const playingArea = this.playingArea

    let id = 0

    const width = playingArea.width / this.regionCountWidth
    const height = playingArea.height / this.regionCountHeight

    for (let col = 0; col < this.regionCountWidth; col++) {
      for (let row = 0; row < this.regionCountHeight; row++) {
        const x = col * width + width / 2 - playingArea.width / 2
        const y = 0
        const z = row * height + height / 2 - playingArea.height / 2

        this.regions[id] = new Region(new Vector3(x, y, z), width, height, id)

        id++
      }
    }
  }
}

export default Pitch
