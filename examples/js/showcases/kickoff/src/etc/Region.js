/**
* Defines a rectangular region. This class is used to split up the
* pitch into multiple regions which can be used by the AI to implement
* different strategies.
*
* @author {@link https://github.com/Mugen87|Mugen87}
*/
class Region {

	/**
	* Constructs a new mesh geometry.
	*
	* @param {Vector3} center - The center point of the region.
	* @param {Number} width - The width of the region.
	* @param {Number} height - The height of the region.
	* @param {Number} id - The unique identifier of the region.
	*/
	constructor( center, width, height, id = 0 ) {

		/**
		* The center point of the region.
		* @type {Vector3}
		*/
		this.center = center;

		/**
		* The width of the region.
		* @type {Number}
		*/
		this.width = width;

		/**
		* The height of the region.
		* @type {Number}
		*/
		this.height = height;

		/**
		* The unique identifier of the region.
		* @type {Number}
		*/
		this.id = id;

		/**
		* The outer left position of the region.
		* @type {Number}
		*/
		this.left = center.x - ( width / 2 );

		/**
		* The outer right position of the region.
		* @type {Number}
		*/
		this.right = center.x + ( width / 2 );

		/**
		* The outer top position of the region.
		* @type {Number}
		*/
		this.top = center.z + ( height / 2 );

		/**
		* The outer bottom position of the region.
		* @type {Number}
		*/
		this.bottom = center.z - ( height / 2 );

	}

	/**
	* Returns true if the given position is inside this region.
	*
	* @param {Vector3} position - The position to test.
	* @param {Boolean} isHalfSize - Whether the region has half size or not which makes the test more strict (optional).
	* @return {Boolean} Whether the given position is inside the region or not.
	*/
	isInside( position, isHalfSize = false ) {

		let marginX, marginY;

		if ( isHalfSize === true ) {

			marginX = this.width * 0.25;
			marginY = this.height * 0.25;

			return ( ( position.x > ( this.left + marginX ) ) &&
				 ( position.x < ( this.right - marginX ) ) &&
				 ( position.z > ( this.bottom + marginY ) ) &&
				 ( position.z < ( this.top - marginY ) ) );

		} else {

			return ( ( position.x > this.left ) &&
				 ( position.x < this.right ) &&
				 ( position.z > this.bottom ) &&
				 ( position.z < this.top ) );

		}

	}

}

export default Region;
