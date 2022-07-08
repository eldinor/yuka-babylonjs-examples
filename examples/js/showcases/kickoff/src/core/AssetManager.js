import {
  ConeBufferGeometry,
  CylinderBufferGeometry,
  LoadingManager,
  Mesh,
  MeshPhongMaterial,
  PlaneBufferGeometry,
  sRGBEncoding,
  TextureLoader,
} from 'https://cdn.jsdelivr.net/npm/three@0.109/build/three.module.js'

import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.109/examples/jsm/loaders/GLTFLoader.js'
/**
 * Class for representing the app's asset manager. It is responsible
 * for loading and parsing all assets from the backend and providing
 * the result in a series of maps.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class AssetManager {
  /**
   * Constructs a new asset manager.
   *
   * @param {World} world - A reference to the World class.
   */
  constructor(world) {
    /**
     * The loading manager. Used to identify the moment when
     * all resources are ready.
     * @type {LoadingManager}
     */
    this.loadingManager = new LoadingManager()

    /**
     * A map that contains all models of the app.
     * @type {Map<String,Object3D>}
     */
    this.models = new Map()

    /**
     * A map that contains all textures of the app.
     * @type {Map<String,Texture>}
     */
    this.textures = new Map()

    /**
     * A reference to the World class.
     * @type {World}
     */
    this.world = world

    // loaders

    /**
     * Used for glTF assets
     * @type {GLTFLoader}
     */
    this.gltfLoader = new GLTFLoader(this.loadingManager)

    /**
     * Used for loading textures.
     * @type {TextureLoader}
     */
    this.textureLoader = new TextureLoader(this.loadingManager)
  }

  /**
   * Initializes the asset manager. All assets are prepared so they
   * can be used by the game.
   *
   * @return {Promise} Resolves when all assets are ready.
   */
  async init() {
    this._loadGLTFAssets()
    this._loadTextures()
    this._generateMeshes()

    return new Promise((resolve) => {
      this.loadingManager.onLoad = () => {
        resolve()
      }
    })
  }

  /**
   * Generate meshes which are created with geometry generators.
   *
   * @return {AssetManager} A reference to this asset manager.
   */
  _generateMeshes() {
    // pitch

    const world = this.world

    const pitchGeometry = new PlaneBufferGeometry(world.pitchDimension.width, world.pitchDimension.height)
    pitchGeometry.rotateX(Math.PI * -0.5)

    const pitchTexture = this.textures.get('pitchTexture')
    const pitchMaterial = new MeshPhongMaterial({ map: pitchTexture })

    const pitchMesh = new Mesh(pitchGeometry, pitchMaterial)
    pitchMesh.receiveShadow = true
    pitchMesh.matrixAutoUpdate = false

    this.models.set('pitch', pitchMesh)

    // players

    const bodyGeometry = new CylinderBufferGeometry(0.2, 0.2, 0.5, 16)
    bodyGeometry.translate(0, 0.25, 0)
    const headGeometry = new ConeBufferGeometry(0.2, 0.2, 16)
    headGeometry.rotateX(Math.PI * 0.5)
    headGeometry.translate(0, 0.3, 0.3)

    const teamRedMaterial = new MeshPhongMaterial({ color: 0xff0000 })
    const teamBlueMaterial = new MeshPhongMaterial({ color: 0x0000ff })

    const teamRedMesh = new Mesh(bodyGeometry, teamRedMaterial)
    teamRedMesh.castShadow = true
    teamRedMesh.matrixAutoUpdate = false

    const teamBlueMesh = new Mesh(bodyGeometry, teamBlueMaterial)
    teamBlueMesh.castShadow = true
    teamBlueMesh.matrixAutoUpdate = false

    const coneRed = new Mesh(headGeometry, teamRedMaterial)
    coneRed.castShadow = true
    coneRed.matrixAutoUpdate = false

    const coneBlue = new Mesh(headGeometry, teamBlueMaterial)
    coneBlue.castShadow = true
    coneBlue.matrixAutoUpdate = false

    teamRedMesh.add(coneRed)
    teamBlueMesh.add(coneBlue)

    this.models.set('teamRed', teamRedMesh)
    this.models.set('teamBlue', teamBlueMesh)

    return this
  }

  /**
   * Loads all glTF assets from the backend.
   *
   * @return {AssetManager} A reference to this asset manager.
   */
  _loadGLTFAssets() {
    this.gltfLoader.load('./assets/ball.glb', (gltf) => {
      const renderComponent = gltf.scene

      renderComponent.traverse((object) => {
        if (object.isMesh) object.position.y = 0.1

        object.castShadow = true
        object.matrixAutoUpdate = false
        object.updateMatrix()
      })

      this.models.set('ball', renderComponent)
    })

    this.gltfLoader.load('./assets/goal.glb', (gltf) => {
      const renderComponent = gltf.scene

      renderComponent.traverse((object) => {
        object.matrixAutoUpdate = false
        object.updateMatrix()
      })

      this.models.set('goal', renderComponent)
    })

    return this
  }

  /**
   * Loads all textures from the backend.
   *
   * @return {AssetManager} A reference to this asset manager.
   */
  _loadTextures() {
    const pitchTexture = this.textureLoader.load('./textures/pitch_texture.jpg')
    pitchTexture.encoding = sRGBEncoding
    this.textures.set('pitchTexture', pitchTexture)

    return this
  }
}

export default AssetManager
