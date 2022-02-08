import 'https://preview.babylonjs.com/babylon.max.js'
import 'https://preview.babylonjs.com/loaders/babylonjs.loaders.min.js'

class AssetManager {
  constructor() {
    this.animations = new Map()
    this.audios = new Map()
    this.models = new Map()
  }

  async init(scene) {
    this.scene = scene

    this._loadAudios()
    await this._loadModels()
    this._loadAnimations()
  }

  _loadAudios() {
    const audios = this.audios

    const step1 = new BABYLON.Sound('step1', 'audio/step1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const step2 = new BABYLON.Sound('step2', 'audio/step2.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const shot = new BABYLON.Sound('shot', 'audio/shot.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const reload = new BABYLON.Sound('reload', 'audio/reload.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact1 = new BABYLON.Sound('impact1', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact2 = new BABYLON.Sound('impact2', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact3 = new BABYLON.Sound('impact3', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact4 = new BABYLON.Sound('impact4', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const impact5 = new BABYLON.Sound('impact5', 'audio/impact1.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })
    const empty = new BABYLON.Sound('empty', 'audio/empty.ogg', this.scene, null, {
      loop: false,
      autoplay: false,
    })

    shot.setVolume(0.3)
    reload.setVolume(0.1)
    empty.setVolume(0.3)

    audios.set('step1', step1)
    audios.set('step2', step2)
    audios.set('shot', shot)
    audios.set('reload', reload)
    audios.set('impact1', impact1)
    audios.set('impact2', impact2)
    audios.set('impact3', impact3)
    audios.set('impact4', impact4)
    audios.set('impact5', impact5)
    audios.set('empty', empty)
  }

  async _loadModels() {
    const models = this.models

    // target
    const targetMeshes = (await BABYLON.SceneLoader.ImportMeshAsync(null, 'model/', 'target.glb', this.scene)).meshes
    const gunMeshes = (await BABYLON.SceneLoader.ImportMeshAsync(null, 'model/', 'gun.glb', this.scene)).meshes

    targetMeshes[0].name = 'target'
    const targetMesh = targetMeshes.find((m) => m.name === 'LowPoly.003__0')
    targetMesh.rotation = new BABYLON.Vector3(Math.PI, Math.PI, Math.PI)
    targetMeshes[0].scaling = new BABYLON.Vector3(0.01, 0.01, 0.01)
    targetMesh.bakeCurrentTransformIntoVertices()
    targetMesh.renderingGroupId = 2

    // TODO: add shadow
    // mesh.castShadow = true

    // weapon
    gunMeshes[0].name = 'gun'
    const gunMesh = gunMeshes.find((m) => m.name === 'BaseMesh')
    gunMesh.scaling = new BABYLON.Vector3(0.6, 0.6, 0.6)
    gunMesh.rotation = new BABYLON.Vector3(0, 0, Math.PI / 2)
    gunMesh.bakeCurrentTransformIntoVertices()
    gunMesh.renderingGroupId = 2

    const spritemanager = new BABYLON.SpriteManager('sprite-manager', 'model/muzzle.png', 1, 128, this.scene)
    spritemanager.renderingGroupId = 1
    const sprite = new BABYLON.Sprite('muzzle', spritemanager)
    sprite.position = new BABYLON.Vector3(0, 0.13, -0.4)
    sprite.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3)
    sprite.isVisible = true

    models.set('target', targetMesh)
    models.set('weapon', gunMesh)
    models.set('muzzle', sprite)

    // bullet hole
    const texture = new BABYLON.Texture('model/bulletHole.png', this.scene)
    texture.hasAlpha = true
    const bulletHoleMesh = new BABYLON.MeshBuilder.CreatePlane('bullet-hole', { size: 0.5 }, this.scene)
    bulletHoleMesh.rotation = new BABYLON.Vector3(0, Math.PI, 0)
    const bulletHoleMaterial = new BABYLON.StandardMaterial('bullet-hole', this.scene)
    bulletHoleMaterial.diffuseTexture = texture
    bulletHoleMesh.material = bulletHoleMaterial
    bulletHoleMesh.renderingGroupId = 3
    bulletHoleMesh.bakeCurrentTransformIntoVertices()
    models.set('bulletHole', bulletHoleMesh)

    // bullet line
    const options = {
      points: [new BABYLON.Vector3(0, 0, 0), new BABYLON.Vector3(0, 0, -10)],
    }
    const bulletLine = BABYLON.MeshBuilder.CreateLines('bullet-line', options, this.scene)
    bulletLine.color = new BABYLON.Color3.FromHexString('#fbf8e6')
    // bulletLine.setEnabled(false)
    models.set('bulletLine', bulletLine)

    // ground

    const groundMesh = BABYLON.MeshBuilder.CreatePlane('ground', { width: 40, height: 40 }, this.scene)

    // Create and tweak the background material.
    var groundMaterial = new BABYLON.BackgroundMaterial('backgroundMaterial', this.scene)
    groundMaterial.diffuseTexture = new BABYLON.Texture(
      'https://assets.babylonjs.com/environments/backgroundGround.png',
      this.scene
    )
    groundMaterial.diffuseTexture.hasAlpha = true
    groundMaterial.opacityFresnel = false
    groundMaterial.shadowLevel = 0.4

    groundMesh.material = groundMaterial
    groundMesh.position.y = 1
    groundMesh.rotation = new BABYLON.Vector3(Math.PI / 2, Math.PI, 0)
    groundMesh.bakeCurrentTransformIntoVertices()
    models.set('ground', groundMesh)
  }

  _loadAnimations() {
    const animations = this.animations

    // shot
    const frameRate = 60

    const frameTiming = [0, 0.2, 1.3, 1.5]

    const shotPositionAnimation = new BABYLON.Animation(
      'shoot-position',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )

    const shotPositionKeyFrames = []
    shotPositionKeyFrames.push({
      frame: frameTiming[0],
      value: new BABYLON.Vector3(0.3, -0.3, -1),
    })
    shotPositionKeyFrames.push({
      frame: frameTiming[1],
      value: new BABYLON.Vector3(0.3, -0.2, -0.7),
    })
    shotPositionKeyFrames.push({
      frame: frameTiming[2],
      frame: 0.05 * frameRate,
      value: new BABYLON.Vector3(0.3, -0.305, -1),
    })
    shotPositionKeyFrames.push({
      frame: frameTiming[3],
      frame: 0.15 * frameRate,
      value: new BABYLON.Vector3(0.3, -0.3, -1),
    })
    shotPositionAnimation.setKeys(shotPositionKeyFrames)

    const shotRotationAnimation = new BABYLON.Animation(
      'shoot-rotation',
      'rotation',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )
    const shotRotationKeyFrames = []
    shotRotationKeyFrames.push({
      frame: frameTiming[0],
      value: new BABYLON.Quaternion(),
    })
    shotRotationKeyFrames.push({
      frame: frameTiming[1],
      value: BABYLON.Quaternion.FromEulerAngles(0.02, 0, 0),
    })
    shotRotationKeyFrames.push({
      frame: frameTiming[2],
      value: BABYLON.Quaternion.FromEulerAngles(-0.02, 0, 0),
    })
    shotRotationKeyFrames.push({
      frame: frameTiming[3],
      value: new BABYLON.Quaternion(),
    })
    shotRotationAnimation.setKeys(shotRotationKeyFrames)

    animations.set('shootPosition', shotPositionAnimation)
    animations.set('shootRotation', shotRotationAnimation)

    // reload

    const reloadPositionAnimation = new BABYLON.Animation(
      'reload-position',
      'position',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_VECTOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )

    const reloadPositionKeyFrames = []
    reloadPositionKeyFrames.push({
      frame: frameTiming[0],
      value: new BABYLON.Vector3(0.3, -0.3, -1),
    })
    reloadPositionKeyFrames.push({
      frame: frameTiming[1],
      value: new BABYLON.Vector3(0.3, -0.2, -0.7),
    })
    reloadPositionKeyFrames.push({
      frame: frameTiming[2],
      frame: 0.05 * frameRate,
      value: new BABYLON.Vector3(0.3, -0.305, -1),
    })
    reloadPositionKeyFrames.push({
      frame: frameTiming[3],
      frame: 0.15 * frameRate,
      value: new BABYLON.Vector3(0.3, -0.3, -1),
    })
    reloadPositionAnimation.setKeys(reloadPositionKeyFrames)

    const reloadRotationAnimation = new BABYLON.Animation(
      'reload-rotation',
      'rotation',
      frameRate,
      BABYLON.Animation.ANIMATIONTYPE_QUATERNION,
      BABYLON.Animation.ANIMATIONLOOPMODE_RELATIVE
    )
    const reloadRotationKeyFrames = []
    reloadRotationKeyFrames.push({
      frame: frameTiming[0],
      value: new BABYLON.Quaternion(),
    })
    reloadRotationKeyFrames.push({
      frame: frameTiming[1],
      value: BABYLON.Quaternion.FromEulerAngles(0.02, 0, 0),
    })
    reloadRotationKeyFrames.push({
      frame: frameTiming[2],
      value: BABYLON.Quaternion.FromEulerAngles(-0.02, 0, 0),
    })
    reloadRotationKeyFrames.push({
      frame: frameTiming[3],
      value: new BABYLON.Quaternion(),
    })
    reloadRotationAnimation.setKeys(reloadRotationKeyFrames)

    animations.set('reloadPosition', reloadPositionAnimation)
    animations.set('reloadRotation', reloadRotationAnimation)
  }
}

export { AssetManager }
