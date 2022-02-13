/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples / roland@babylonjs.xyz
 */

import { Task } from '../../../../../lib/yuka.module.js'

class PathPlannerTask extends Task {
  constructor(planner, vehicle, from, to, callback) {
    super()

    this.callback = callback
    this.planner = planner
    this.vehicle = vehicle
    this.from = from
    this.to = to
  }

  execute() {
    const path = this.planner.navMesh.findPath(this.from, this.to)

    this.callback(this.vehicle, path)
  }
}

export { PathPlannerTask }
