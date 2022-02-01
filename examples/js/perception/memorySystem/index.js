import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
// import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
// import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

import { CustomEntity } from './src/CustomEntity.js'
import { Obstacle } from '../common/Obstacle.js'
import { createVisionHelper } from '../common/VisionHelper.js'

let engine, scene
let entityManager, time, target

const entityMatrix = new BABYLON.Matrix()
const pointer = new BABYLON.Vector2(1, 1)

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  scene.useRightHandedSystem = true

  scene.debugLayer.show()

  /*

	//

			const entityGeometry = new THREE.ConeBufferGeometry( 0.1, 0.5, 8 );
			entityGeometry.rotateX( Math.PI * 0.5 );
			const entityMaterial = new THREE.MeshNormalMaterial();

			const entityMesh = new THREE.Mesh( entityGeometry, entityMaterial );
			entityMesh.matrixAutoUpdate = false;
			scene.add( entityMesh );

			const obstacleGeometry = new THREE.PlaneBufferGeometry( 2, 2, 5, 5 );
			obstacleGeometry.rotateY( Math.PI );
			const obstacleMaterial = new THREE.MeshBasicMaterial( { color: 0x777777, side: THREE.DoubleSide } );

			const obstacleMesh = new THREE.Mesh( obstacleGeometry, obstacleMaterial );
			obstacleMesh.matrixAutoUpdate = false;
			scene.add( obstacleMesh );

			const targetGeometry = new THREE.SphereBufferGeometry( 0.05 );
			targetMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

			const targetMesh = new THREE.Mesh( targetGeometry, targetMaterial );
			targetMesh.matrixAutoUpdate = false;
			scene.add( targetMesh );

			//
*/

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(90),
    BABYLON.Tools.ToRadians(0),
    30,
    BABYLON.Vector3.Zero(),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 0, 0)
  camera.attachControl(canvas, true)

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 40, height: 20 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)

  const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder(
    'cone',
    { height: 2, diameterTop: 0, diameterBottom: 1 },
    scene
  )
  vehicleMesh.rotation.x = Math.PI * 0.5
  vehicleMesh.bakeCurrentTransformIntoVertices()

  scene.onPointerMove = () => {
    var pickResult = scene.pick(scene.pointerX, scene.pointerY)
    if (pickResult?.pickedPoint) {
      target.x = pickResult.pickedPoint.x
      target.y = pickResult.pickedPoint.y
      target.z = pickResult.pickedPoint.z
    }
  }

  window.addEventListener('resize', onWindowResize, false)

  // YUKA specific
  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()

  const vertices = obstacleGeometry.attributes.position.array
  const indices = obstacleGeometry.index.array
  const geometry = new YUKA.MeshGeometry(vertices, indices)

  const obstacle = new Obstacle(geometry)
  obstacle.name = 'obstacle'
  obstacle.position.z = 3
  obstacle.setRenderComponent(obstacleMesh, sync)

  target = new YUKA.GameEntity()
  target.name = 'target'
  target.setRenderComponent(targetMesh, sync)

  const entity = new CustomEntity()
  entity.setRenderComponent(entityMesh, sync)

  const helper = createVisionHelper(entity.vision)
  entityMesh.add(helper)

  entityManager.add(entity)
  entityManager.add(obstacle)
  entityManager.add(target)
}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  time.update()

  const delta = time.getDelta()
  const elapsed = time.getElapsed()

  target.position.set(Math.sin(elapsed * 0.3) * 5, 0, 4)

  entityManager.update(delta)

  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}
