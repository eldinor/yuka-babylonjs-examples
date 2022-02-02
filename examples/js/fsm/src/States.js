/**
 * @author Mugen87 / https://github.com/Mugen87
 * @author modified at https://github.com/eldinor/yuka-babylonjs-examples
 */

import * as YUKA from '../../../../lib/yuka.module.js';

const IDLE = 'IDLE';
const WALK = 'WALK';

class IdleState extends YUKA.State {

	enter( girl ) {

    girl.ui.currentState.textContent = IDLE;

    girl.meshToManage.material.diffuseColor = BABYLON.Color3.Blue()

	}

	execute( girl ) {

		if ( girl.currentTime >= girl.stateDuration ) {

			girl.currentTime = 0;
			girl.stateMachine.changeTo( WALK );

		}

	}

	exit( girl ) {

	}

}

class WalkState extends YUKA.State {

	enter( girl ) {

    girl.meshToManage.material.diffuseColor =BABYLON.Color3.Red()
    girl.ui.currentState.textContent = WALK;


		girl.idle.stop()
		girl.walk.start()
		girl.walk.loopAnimation = true;


	}

	execute( girl ) {

		if ( girl.currentTime >= girl.stateDuration ) {

			girl.currentTime = 0;
			girl.stateMachine.changeTo( IDLE );

		}

	}

	exit( girl ) {

  if (girl.ui.currentState.textContent = IDLE){
    girl.idle.start()
    girl.walk.stop()
    girl.idle.loopAnimation = true;
    }

	}

}
export {
	IdleState,
	WalkState
};
