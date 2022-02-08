/*
 * @author Made at https://github.com/eldinor/yuka-babylonjs-examples
 */

const canvas = document.getElementById('renderCanvas')

var startRenderLoop = function (engine, canvas) {
  engine.runRenderLoop(function () {
    if (sceneToRender && sceneToRender.activeCamera) {
      sceneToRender.render()
    }
  })
}

var engine = null
var scene = null
var sceneToRender = null
var createDefaultEngine = function () {
  return new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  })
}

var gameState = ['', '', '', '', '', '', '', '', '']

function bPos(fieldmesh, order) {
  fieldmesh.position = new BABYLON.Vector3(boxPositions[order][0], boxPositions[order][1], boxPositions[order][2])
}

const boxPositions = [
  [0, 0, 0],
  [1.1, 0, 0],
  [2.2, 0, 0],
  [0, 0, -1.1],
  [1.1, 0, -1.1],
  [2.2, 0, -1.1],
  [0, 0, -2.2],
  [1.1, 0, -2.2],
  [2.2, 0, -2.2],
]

const aniVecArray = []
const aniRate = 2
for (i = 0; i < boxPositions.length; i++) {
  aniVecArray[i] = new BABYLON.Vector3(boxPositions[i][0] * aniRate, boxPositions[i][1], boxPositions[i][2] * aniRate)
}

var createScene = function () {
  var scene = new BABYLON.Scene(engine)
  scene.clearColor = new BABYLON.Color4(0.2, 0.2, 0.45, 1).toLinearSpace()
  var hdrTexture = new BABYLON.CubeTexture('https://playground.babylonjs.com/textures/environment.env', scene)
  hdrTexture.gammaSpace = false
  scene.environmentTexture = hdrTexture
  scene.environmentIntensity = 1

  //	scene.debugLayer.show();

  const camera = new BABYLON.ArcRotateCamera('Camera', -Math.PI / 2, Math.PI / 4, 9, BABYLON.Vector3.Zero(), scene)
  camera.attachControl(canvas, true)
  camera.lowerRadiusLimit = 4
  camera.upperRadiusLimit = 30
  camera.wheelDeltaPercentage = 0.02

  camera.setTarget(new BABYLON.Vector3(1, -1, -1))

  camera.useAutoRotationBehavior = true

  var pipeline = new BABYLON.DefaultRenderingPipeline(
    'defaultPipeline', // The name of the pipeline
    true, // Do you want the pipeline to use HDR texture?
    scene, // The scene instance
    [camera] // The list of cameras to be attached to
  )
  pipeline.samples = 4
  pipeline.fxaaEnabled = true

  pipeline.bloomEnabled = true
  pipeline.bloomThreshold = 0.35
  pipeline.bloomWeight = 0.6
  pipeline.imageProcessing.toneMappingEnabled = true
  pipeline.imageProcessing.toneMappingType = 1

  // CREATE GAME FIELD
  const proto = BABYLON.MeshBuilder.CreateBox(
    'proto',
    {
      size: 1,
    },
    scene
  )
  proto.material = new BABYLON.PBRMaterial('proto')
  proto.material.albedoColor = new BABYLON.Color4(0.1, 0.1, 0.89, 0.9)
  proto.material.metallic = 0.9
  proto.material.roughness = 0.15
  proto.material.alpha = 1
  proto.isVisible = false

  const allBoxes = new BABYLON.TransformNode('allBoxes', scene)

  function putBoxes(index) {
    let iBox = proto.createInstance(String(index))
    bPos(iBox, index)
    iBox.parent = allBoxes
  }

  for (i = 0; i < 9; i++) {
    putBoxes(i)
  }

  // CREATE GAME PIECES
  // Create "O"
  const torus = BABYLON.MeshBuilder.CreateTorus('torus', {
    thickness: 0.2,
    diameter: 0.75,
    tessellation: 64,
  })

  torus.material = new BABYLON.PBRMaterial('torusmaterial')
  torus.material.albedoColor = new BABYLON.Color3(0.98, 0.02, 0.12)
  torus.material.metallic = 1
  torus.material.roughness = 0.6
  torus.isVisible = false

  // Create "X"
  let cylinder = BABYLON.MeshBuilder.CreateCylinder(
    'cylinder',
    {
      height: 1,
      diameter: 0.2,
    },
    scene
  )
  let newcylinder = cylinder.clone()
  newcylinder.rotation.x = -Math.PI / 2

  const cross = BABYLON.Mesh.MergeMeshes([cylinder, newcylinder], true) // "X"
  cross.rotation.y = Math.PI / 4
  cross.rotation.z = -Math.PI / 2
  cross.position.y = 0.1
  cross.name = 'cross'

  cross.material = new BABYLON.PBRMaterial('meshmaterial')
  cross.material.albedoColor = new BABYLON.Color3(0.2, 0.9, 0.3)
  cross.material.metallic = 1
  cross.material.roughness = 0.25
  cross.isVisible = false

  // Creating an easing function
  var oscillations = 2
  var springiness = 0.005

  var easingFunction = new BABYLON.ElasticEase(oscillations, springiness)

  easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT)

  let shootCounter = 0
  let shoot = function (mesh, fRate, fTotal, startPos, endPos) {
    BABYLON.Animation.CreateAndStartAnimation(
      'shoot',
      mesh,
      'position',
      fRate,
      fTotal,
      startPos,
      endPos,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT,
      easingFunction
    )
  }

  for (i = 0; i < boxPositions.length; i++) {
    let mesh = scene.getMeshByName(String(i))

    shoot(mesh, 60, 120, aniVecArray[i], mesh.position)
  }

  return scene
}

window.initFunction = async function () {
  var asyncEngineCreation = async function () {
    try {
      return createDefaultEngine()
    } catch (e) {
      console.log('the available createEngine function failed. Creating the default engine instead')
      return createDefaultEngine()
    }
  }

  window.engine = await asyncEngineCreation()
  if (!engine) throw 'engine should not be null.'
  startRenderLoop(engine, canvas)
  window.scene = createScene()
}
initFunction().then(() => {
  sceneToRender = scene
})

// Resize
window.addEventListener('resize', function () {
  engine.resize()
})
