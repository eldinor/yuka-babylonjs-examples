/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { Trigger } from '../../../../build/yuka.module.js';

class CustomTrigger extends Trigger {

            constructor(triggerRegion, scene) {

				super(triggerRegion);
				this.scene = scene;

            }

	execute( entity ) {

		super.execute();

	//	console.log(entity._renderComponent)
		// entity._renderComponent.material.diffuseColor.r = 0;

	//	this.scene.getMeshByName(entity._renderComponent.name).material.emissiveColor.r = 1;
	//	this.scene.getMeshByName(entity._renderComponent.name).material.emissiveColor.g = 0;

	}

}

export { CustomTrigger };
