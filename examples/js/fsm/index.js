import * as YUKA from '../../../../lib/yuka.module.js'
// import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js';

import 'https://preview.babylonjs.com/babylon.js'
import 'https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js'
// import 'https://preview.babylonjs.com/inspector/babylon.inspector.bundle.js'
import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

import {Girl} from  './src/Girl.js'

let engine, scene
let entityManager, time, vehicle, target

const entityMatrix = new BABYLON.Matrix()

init()
animate()

function init() {
  const canvas = document.getElementById('renderCanvas')
  engine = new BABYLON.Engine(canvas, true, {}, true)

  scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 1)
  scene.useRightHandedSystem = true
  const hdrTexture = new BABYLON.CubeTexture("https://playground.babylonjs.com/textures/environment.env", scene);
  hdrTexture.gammaSpace = false;
  scene.environmentTexture = hdrTexture;
  scene.environmentIntensity = 1;
//  scene.debugLayer.show()

  const camera = new BABYLON.ArcRotateCamera(
    'camera',
    BABYLON.Tools.ToRadians(-90),
    BABYLON.Tools.ToRadians(70),
    9,
    new BABYLON.Vector3(0, 1.2, 0),
    scene
  )

  camera.target = new BABYLON.Vector3(0, 1.3, 0)
  camera.attachControl(canvas, true)
  // camera.useAutoRotationBehavior = true;

  new BABYLON.HemisphericLight('light', new BABYLON.Vector3(1, 1, 0))

  const ground = BABYLON.MeshBuilder.CreateGround('ground', { width: 40, height: 20 }, scene)
  ground.position.y = -1
  ground.material = new BABYLON.GridMaterial('grid', scene)

  const vehicleMesh = BABYLON.MeshBuilder.CreateCylinder(
    'cone',
    { height: 1, diameterTop: 0, diameterBottom: 0.5 },
    scene
  )
  vehicleMesh.rotation.x = Math.PI * 0.5
  vehicleMesh.bakeCurrentTransformIntoVertices()

  vehicleMesh.material = new BABYLON.StandardMaterial("vmesh")

  BABYLON.SceneLoader.LoadAssetContainer("./model/",
  "yuka.glb",
  scene, function (container) {

      container.meshes[0].scaling.scaleInPlace(2)
      container.addAllToScene();

scene.getMaterialByName("kachujin_MAT").alpha = 1; // material correction

for (let index = 0; index < container.animationGroups[0].targetedAnimations.length; index++) {
  let animation = container.animationGroups[0].targetedAnimations[index].animation;
  animation.enableBlending = true;
  animation.blendingSpeed = 0.02;
}

for (let index = 0; index < container.animationGroups[2].targetedAnimations.length; index++) {
  let animation = container.animationGroups[2].targetedAnimations[index].animation;
  animation.enableBlending = true;
  animation.blendingSpeed = 0.015;
}  

    girl.animations = container.animationGroups; // All GLTF animations - to the Yuka entity

    girl.idle = girl.animations[0]
    girl.walk = girl.animations[2]

  });


  window.addEventListener('resize', onWindowResize, false)

  // YUKA specific
  target = new YUKA.Vector3()

  entityManager = new YUKA.EntityManager()
  time = new YUKA.Time()
  vehicle = new YUKA.Vehicle()
  vehicle.setRenderComponent(vehicleMesh, sync)

  // add behavior here
  const path = new YUKA.Path();
  path.loop = true;
  path.add( new YUKA.Vector3( - 4, 0, 4 ) );
  path.add( new YUKA.Vector3( - 6, 0, 0 ) );
  path.add( new YUKA.Vector3( - 4, 0, - 4 ) );
  path.add( new YUKA.Vector3( -2, 0, -2 ) );
  path.add( new YUKA.Vector3( 4, 0, - 4 ) );
  path.add( new YUKA.Vector3( 6, 0, 0 ) );
  path.add( new YUKA.Vector3( 4, 0, 4 ) );
  path.add( new YUKA.Vector3( 0, 0, 6 ) );

  vehicle.position.copy( path.current() );

  // use "FollowPathBehavior" for basic path following

  const followPathBehavior = new YUKA.FollowPathBehavior( path, 0.5 );
  vehicle.steering.add( followPathBehavior );

  const position = [];

  for ( let i = 0; i < path._waypoints.length; i ++ ) {

    const waypoint = path._waypoints[ i ];

    position.push( waypoint.x, waypoint.y, waypoint.z );

  }
  //
  entityManager.add(vehicle)


const girl = new Girl(vehicleMesh );
entityManager.add( girl );

}

function onWindowResize() {
  engine.resize()
}

function animate() {
  requestAnimationFrame(animate)

  const delta = time.update().getDelta()
  entityManager.update(delta)

  scene.render()
}

function sync(entity, renderComponent) {
  entity.worldMatrix.toArray(entityMatrix.m)
  entityMatrix.markAsUpdated()

  const matrix = renderComponent.getWorldMatrix()
  matrix.copyFrom(entityMatrix)
}
