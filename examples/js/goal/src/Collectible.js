/**
 * @author Mugen87 / https://github.com/Mugen87
 */

import { GameEntity } from '../../../../lib/yuka.module.js';

class Collectible extends GameEntity {

constructor(scene){
	super()
	this.scene = scene; // scene variable is not necessary if you don't need to change anything in the scene
						// here it is using only to change collectible box material after spawning
}

	spawn() {

		this.position.x = Math.random() * 15 - 7.5;
		this.position.z = Math.random() * 15 - 7.5;

		if ( this.position.x < 1 && this.position.x > - 1 ) this.position.x += 1;
		if ( this.position.z < 1 && this.position.y > - 1 ) this.position.z += 1;
		
		console.log("Collectible spawned ")

		this._renderComponent.material = this.scene.getMaterialByName("collectibleMat1")
		setTimeout(() => {
			this._renderComponent.material = this.scene.getMaterialByName("collectibleMat")
		}, 3000);
	}

	handleMessage( telegram ) {

		const message = telegram.message;

		switch ( message ) {

			case 'PickedUp':

				this.spawn();
				return true;

			default:

				console.warn( 'Collectible: Unknown message.' );

		}

		return false;

	}

}

export { Collectible };
