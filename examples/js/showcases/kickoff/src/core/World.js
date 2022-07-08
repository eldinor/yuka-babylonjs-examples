import {
  Mesh,
  Scene,
  PerspectiveCamera,
  PlaneBufferGeometry,
  SphereBufferGeometry,
  AmbientLight,
  DirectionalLight,
  WebGLRenderer,
  sRGBEncoding,
  PCFSoftShadowMap,
  AxesHelper,
  MeshBasicMaterial,
  PlaneHelper,
  CanvasTexture,
  Sprite,
  SpriteMaterial,
  Color,
  Fog,
} from 'https://cdn.jsdelivr.net/npm/three@0.109/build/three.module.js'
import { EntityManager, Time } from '../../../../../../lib/yuka.module.js'

import * as DAT from 'https://cdn.jsdelivr.net/npm/dat.gui@0.7.7/build/dat.gui.module.js'

import AssetManager from './AssetManager.js'
import Ball from '../entities/Ball.js'
import Goal from '../entities/Goal.js'
import Pitch from '../entities/Pitch.js'
import Team from '../entities/Team.js'
import { TEAM } from './Constants.js'

/**
 * Class for representing the game environment. Entry point for the application.
 *
 * @author {@link https://github.com/Mugen87|Mugen87}
 */
class World {
  /**
   * Constructs a new world instance.
   */
  constructor() {
    /**
     * A reference game's asset manager.
     * @type {AssetManager}
     */
    this.assetManager = null

    /**
     * A reference to the perspective camera.
     * @type {PerspectiveCamera}
     */
    this.camera = null

    /**
     * Whether the debug mode should be active or not.
     * When activated, it's possible to visually debug various aspect
     * of the AI via helper objects.
     * @type {Object}
     */
    this.debug = true

    /**
     * These debug parameters allow to selectively enable/disable helpers.
     * @type {Object}
     */
    this.debugParameter = {
      showAxes: false,
      showWalls: false,
      showRegions: false,
      showSupportSpotsBlue: false,
      showSupportSpotsRed: false,
      showStatesBlue: false,
      showStatesRed: false,
    }

    /**
     * The entity manager of this game.
     * @type {EntityManager}
     */
    this.entityManager = new EntityManager()

    /**
     * The dimensions of the goal.
     * @type {Object}
     */
    this.goalDimensions = {
      width: 2,
      height: 1,
    }

    /**
     * A reference to the pitch object.
     * @type {Pitch}
     */
    this.pitch = null

    /**
     * The dimensions of the pitch.
     * @type {Object}
     */
    this.pitchDimension = {
      width: 20,
      height: 15,
    }

    /**
     * A reference to the WebGL renderer.
     * @type {WebGLRenderer}
     */
    this.renderer = null

    /**
     * A reference to the scene graph.
     * @type {Scene}
     */
    this.scene = null

    /**
     * The timer used to determine time delta values.
     * @type {Time}
     */
    this.time = new Time()

    /**
     * This object holds references to UI elements that will
     * be updated over time.
     * @type {Object}
     */
    this.ui = {
      loadingScreen: document.getElementById('loading-screen'),
      goalsBlue: document.getElementById('goals-blue'),
      goalsRed: document.getElementById('goals-red'),
    }

    // helpers

    this._axesHelper = null
    this._regionHelpers = []
    this._wallHelpers = []
    this._supportingSpotsRedHelpers = []
    this._supportingSpotsBlueHelpers = []
    this._statesRedHelpers = []
    this._statesBlueHelpers = []

    /**
     * Request ID of the animation loop.
     * @type {Number}
     */
    this._requestID = null

    // event listeners and callbacks

    this._startAnimation = startAnimation.bind(this)
    this._stopAnimation = stopAnimation.bind(this)
    this._onWindowResize = onWindowResize.bind(this)
  }

  /**
   * Inits the game environment. Entry point of the application.
   */
  async init() {
    this.assetManager = new AssetManager(this)

    await this.assetManager.init()

    this._initScene()

    this._initGame()

    if (this.debug) {
      this._initUI()
    }

    this.time.reset()

    this._hideLoadingScreen()

    this._startAnimation()
  }

  /**
   * Updates the state of the user interface.
   */
  refreshUI() {
    const teamBlue = this.pitch.teamBlue
    const teamRed = this.pitch.teamRed

    this.ui.goalsBlue.innerText = teamBlue.goals
    this.ui.goalsRed.innerText = teamRed.goals
  }

  /**
   * Central update loop of the game.
   */
  update() {
    const delta = this.time.update().getDelta()

    // game logic

    this.entityManager.update(delta)

    // update helpers

    if (this.debug) {
      this._updateTeamHelpers(this.pitch.teamBlue, this._supportingSpotsBlueHelpers, this._statesBlueHelpers)
      this._updateTeamHelpers(this.pitch.teamRed, this._supportingSpotsRedHelpers, this._statesRedHelpers)
    }

    // rendering

    this.renderer.render(this.scene, this.camera)
  }

  /**
   * Factory method to create the soccer ball of the game.
   *
   * @param {Pitch} pitch - A reference to the soccer pitch.
   * @return {Ball} The created ball.
   */
  _createBall(pitch) {
    const ball = new Ball(pitch)
    const ballMesh = this.assetManager.models.get('ball')
    ball.setRenderComponent(ballMesh, sync)

    this.scene.add(ballMesh)

    return ball
  }

  /**
   * Factory method to create a soccer goal.
   *
   * @param {Number} width - The width of the goal.
   * @param {Number} height - The height of the goal.
   * @param {Number} color - The color of the team that owns this goal (blue or red).
   * @return {Goal} The created goal.
   */
  _createGoal(width, height, color) {
    const goal = new Goal(width, height, color)
    const goalMesh = this.assetManager.models.get('goal').clone()
    goal.setRenderComponent(goalMesh, sync)

    this.scene.add(goalMesh)

    return goal
  }

  /**
   * Factory method to create a soccer pitch.
   *
   * @param {Number} width - The width of the pitch.
   * @param {Number} height - The height of the pitch.
   * @param {World} world - A reference to the world.
   * @return {Pitch} The created pitch.
   */
  _createPitch(width, height, world) {
    const pitch = new Pitch(width, height, world)
    const pitchMesh = this.assetManager.models.get('pitch')
    pitch.setRenderComponent(pitchMesh, sync)

    this.scene.add(pitchMesh)

    return pitch
  }

  /**
   * Factory method to create a soccer team.
   *
   * @param {Ball} ball - A reference to the ball.
   * @param {Pitch} pitch - A reference to the pitch.
   * @param {Goal} homeGoal - A reference to the home goal.
   * @param {Goal} opposingGoal - A reference to the opposing goal.
   * @param {Number} color - The team's color (blue or red).
   * @return {Team} The created team.
   */
  _createTeam(ball, pitch, homeGoal, opposingGoal, color) {
    const team = new Team(color, ball, pitch, homeGoal, opposingGoal)

    const baseMesh = this.assetManager.models.get(color === TEAM.RED ? 'teamRed' : 'teamBlue')

    // Create render components for the players of the team.

    for (let i = 0, l = team.children.length; i < l; i++) {
      const player = team.children[i]
      const playerMesh = baseMesh.clone()
      player.setRenderComponent(playerMesh, sync)
      this.scene.add(playerMesh)
    }

    return team
  }

  /**
   * Creates visual helpers for debugging the pitch.
   */
  _debugPitch() {
    const pitch = this.pitch

    const helper = new AxesHelper(10)
    helper.visible = false
    helper.position.y = 0.01
    this.scene.add(helper)

    this._axesHelper = helper

    // regions

    const regions = pitch.regions

    for (let i = 0, l = regions.length; i < l; i++) {
      const region = regions[i]

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = 128
      canvas.height = 128

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.fillStyle = '#000000'
      context.font = '24px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(`ID: ${i}`, canvas.width / 2, canvas.height / 2)

      const geometry = new PlaneBufferGeometry(region.width, region.height)
      const material = new MeshBasicMaterial({
        color: 0xffffff * Math.random(),
        map: new CanvasTexture(canvas),
        polygonOffset: true,
        polygonOffsetFactor: -1,
      })

      const helper = new Mesh(geometry, material)
      helper.visible = false
      helper.position.copy(region.center)
      helper.rotation.x = Math.PI * -0.5
      this.scene.add(helper)

      this._regionHelpers.push(helper)
    }

    // walls

    const walls = pitch.walls

    for (let i = 0, l = walls.length; i < l; i++) {
      const wall = walls[i]
      wall.normal.isVector3 = true

      const helper = new PlaneHelper(wall, i < 2 ? 20 : 15)
      helper.visible = false
      this.scene.add(helper)

      this._wallHelpers.push(helper)
    }
  }

  /**
   * Creates visual helpers for debugging a team.
   *
   * @param {Team} team - A reference to the team that should be debugged.
   * @param {Array<Mesh>} supportSpotsHelpers - A reference to an empty array. Support spot helpers will be added to it.
   * @param {Array<Mesh>} statesHelpers - A reference to an empty array. State helpers will be added to it.
   */
  _debugTeam(team, supportSpotsHelpers, statesHelpers) {
    // support spots

    const spots = team._supportSpotCalculator._spots

    const spotGeometry = new SphereBufferGeometry(0.1, 16, 12)
    spotGeometry.translate(0, 0.1, 0)

    for (let i = 0, l = spots.length; i < l; i++) {
      const spot = spots[i]

      const spotMaterial = new MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.6,
      })

      const helper = new Mesh(spotGeometry, spotMaterial)
      helper.visible = false
      helper.position.copy(spot.position)
      this.scene.add(helper)

      supportSpotsHelpers.push(helper)
    }

    // states

    const players = team.children

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]

      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')

      canvas.width = 256
      canvas.height = 64

      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, canvas.width, canvas.height)

      context.fillStyle = '#000000'
      context.font = '24px Arial'
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      context.fillText('null', canvas.width / 2, canvas.height / 2)

      const material = new SpriteMaterial({ map: new CanvasTexture(canvas) })

      const helper = new Sprite(material)
      helper.visible = false
      helper.scale.set(2, 0.5, 1)
      helper.position.y = 2

      player._renderComponent.add(helper)

      statesHelpers.push(helper)
    }
  }

  /**
   * Hides the loading screen after the loading process.
   */
  _hideLoadingScreen() {
    this.ui.loadingScreen.classList.add('fade-out')
    this.ui.loadingScreen.addEventListener('transitionend', onTransitionEnd)
  }

  /**
   * Inits the game and AI logic.
   */
  _initGame() {
    const goalRed = this._createGoal(this.goalDimensions.width, this.goalDimensions.height, TEAM.RED)
    goalRed.rotation.fromEuler(0, Math.PI, 0)
    goalRed.position.x = 10
    this.entityManager.add(goalRed)

    const goalBlue = this._createGoal(this.goalDimensions.width, this.goalDimensions.height, TEAM.BLUE)
    goalBlue.position.x = -10
    this.entityManager.add(goalBlue)

    const pitch = this._createPitch(this.pitchDimension.width, this.pitchDimension.height, this)
    this.entityManager.add(pitch)

    const ball = this._createBall(pitch)
    this.entityManager.add(ball)

    const teamRed = this._createTeam(ball, pitch, goalRed, goalBlue, TEAM.RED)
    this.entityManager.add(teamRed)

    const teamBlue = this._createTeam(ball, pitch, goalBlue, goalRed, TEAM.BLUE)
    this.entityManager.add(teamBlue)

    teamRed.opposingTeam = teamBlue
    teamBlue.opposingTeam = teamRed

    pitch.ball = ball
    pitch.teamBlue = teamBlue
    pitch.teamRed = teamRed

    this.pitch = pitch
  }

  /**
   * Inits the 3D scene of the application.
   */
  _initScene() {
    // rendering setup

    this.camera = new PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 200)
    this.camera.position.set(0, 10, 20)

    this.scene = new Scene()
    this.scene.background = new Color(0x94dbe2)
    this.scene.fog = new Fog(0x94dbe2, 40, 50)
    this.camera.lookAt(this.scene.position)

    const ambientLight = new AmbientLight(0xcccccc, 0.4)
    ambientLight.matrixAutoUpdate = false
    this.scene.add(ambientLight)

    const dirLight = new DirectionalLight(0xffffff, 0.6)
    dirLight.position.set(5, 20, -5)
    dirLight.matrixAutoUpdate = false
    dirLight.updateMatrix()
    dirLight.castShadow = true
    dirLight.shadow.camera.top = 15
    dirLight.shadow.camera.bottom = -15
    dirLight.shadow.camera.left = -15
    dirLight.shadow.camera.right = 15
    dirLight.shadow.camera.near = 1
    dirLight.shadow.camera.far = 25
    dirLight.shadow.mapSize.x = 2048
    dirLight.shadow.mapSize.y = 2048
    dirLight.shadow.bias = 0.01
    this.scene.add(dirLight)

    this.renderer = new WebGLRenderer({ antialias: true })
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    this.renderer.outputEncoding = sRGBEncoding
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap
    document.body.appendChild(this.renderer.domElement)

    window.addEventListener('resize', this._onWindowResize, false)

    // ground

    const groundGeometry = new PlaneBufferGeometry(250, 250)
    groundGeometry.rotateX(Math.PI * -0.5)
    const groundMaterial = new MeshBasicMaterial({
      color: new Color(0xdb8d6e).convertSRGBToLinear(),
      depthWrite: false,
    })
    const groundMesh = new Mesh(groundGeometry, groundMaterial)
    groundMesh.matrixAutoUpdate = false
    groundMesh.renderOrder = -Infinity
    this.scene.add(groundMesh)
  }

  /**
   * Inits the user interface.
   */
  _initUI() {
    // prepare visual helpers

    this._debugPitch()
    this._debugTeam(this.pitch.teamBlue, this._supportingSpotsBlueHelpers, this._statesBlueHelpers)
    this._debugTeam(this.pitch.teamRed, this._supportingSpotsRedHelpers, this._statesRedHelpers)

    // setup debugging UI

    const gui = new DAT.GUI({ width: 300 })
    const params = this.debugParameter

    const folderPitch = gui.addFolder('Pitch')

    folderPitch
      .add(params, 'showAxes')
      .name('show axes')
      .onChange((value) => {
        this._axesHelper.visible = value
      })

    folderPitch
      .add(params, 'showRegions')
      .name('show regions')
      .onChange((value) => {
        const helpers = this._regionHelpers

        for (let i = 0, l = helpers.length; i < l; i++) {
          helpers[i].visible = value
        }
      })

    folderPitch
      .add(params, 'showWalls')
      .name('show walls')
      .onChange((value) => {
        const helpers = this._wallHelpers

        for (let i = 0, l = helpers.length; i < l; i++) {
          helpers[i].visible = value
        }
      })

    folderPitch.open()

    //

    const folderTeamRed = gui.addFolder('Team Red')

    folderTeamRed
      .add(params, 'showStatesRed')
      .name('show states')
      .onChange((value) => {
        const helpers = this._statesRedHelpers

        for (let i = 0, l = helpers.length; i < l; i++) {
          helpers[i].visible = value
        }
      })

    folderTeamRed
      .add(params, 'showSupportSpotsRed')
      .name('show support spots')
      .onChange((value) => {
        const helpers = this._supportingSpotsRedHelpers

        for (let i = 0, l = helpers.length; i < l; i++) {
          helpers[i].visible = value
        }
      })

    folderTeamRed.open()

    //

    const folderTeamBlue = gui.addFolder('Team Blue')

    folderTeamBlue
      .add(params, 'showStatesBlue')
      .name('show states')
      .onChange((value) => {
        const helpers = this._statesBlueHelpers

        for (let i = 0, l = helpers.length; i < l; i++) {
          helpers[i].visible = value
        }
      })

    folderTeamBlue
      .add(params, 'showSupportSpotsBlue')
      .name('show support spots')
      .onChange((value) => {
        const helpers = this._supportingSpotsBlueHelpers

        for (let i = 0, l = helpers.length; i < l; i++) {
          helpers[i].visible = value
        }
      })

    folderTeamBlue.open()
  }

  /**
   * Helpers of teams have to be update per simulation step.
   *
   * @param {Team} team - A reference to the team that helpers should be updated.
   * @param {Array<Mesh>} supportSpotsHelpers - The support spot helpers of the team.
   * @param {Array<Mesh>} statesHelpers - The state helpers of the team.
   */
  _updateTeamHelpers(team, supportSpotsHelpers, statesHelpers) {
    // support spots

    const spots = team._supportSpotCalculator._spots

    for (let i = 0, l = spots.length; i < l; i++) {
      const spot = spots[i]
      const helper = supportSpotsHelpers[i]

      if (helper.visible === true) {
        helper.scale.setScalar(spot.score || 0.5)
        helper.material.color.set(spot.best === true ? 0xff0000 : 0xffffff)
      }
    }

    // states

    const players = team.children

    for (let i = 0, l = players.length; i < l; i++) {
      const player = players[i]
      const helper = statesHelpers[i]

      if (helper.visible === true) {
        const currentState = player.stateMachine.currentState
        const text = currentState !== null ? currentState.constructor.name : 'null'

        const canvas = helper.material.map.image
        const context = canvas.getContext('2d')

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)

        context.fillStyle = '#000000'
        context.font = '24px Arial'
        context.textAlign = 'center'
        context.textBaseline = 'middle'

        context.fillText(text, canvas.width / 2, canvas.height / 2)

        helper.material.map.needsUpdate = true
      }
    }
  }
}

// handles window resizes

function onWindowResize() {
  this.camera.aspect = window.innerWidth / window.innerHeight
  this.camera.updateProjectionMatrix()

  this.renderer.setSize(window.innerWidth, window.innerHeight)
}

// animation loop

function startAnimation() {
  this._requestID = requestAnimationFrame(this._startAnimation)

  this.update()
}

// can be used to stop the animation loop (e.g. when the game is paused)

function stopAnimation() {
  cancelAnimationFrame(this._requestID)
}

// maps transformation of game entities to render components

function sync(entity, renderComponent) {
  renderComponent.matrix.copy(entity.worldMatrix)
}

// removes the loading screen from the DOM

function onTransitionEnd(event) {
  event.target.remove()
}

export default new World()
