/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author Examples with Babylon.js were made at https://github.com/eldinor/yuka-babylonjs-examples
 */

import { Trigger } from '../../../../../lib/yuka.module.js'

class CustomTrigger extends Trigger {
  constructor(triggerRegion, scene) {
    // scene variable is using here only to change the entity material color
    super(triggerRegion)
    this.scene = scene
  }

  execute(entity) {
    super.execute()

    this.scene.getMeshByName(entity._renderComponent.name).material.emissiveColor.r = 0
    this.scene.getMeshByName(entity._renderComponent.name).material.emissiveColor.g = 1
  }
}

export { CustomTrigger }
