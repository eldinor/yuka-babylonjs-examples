import { TTTGraph } from './src/TTTGraph.js'

let player,
  graph,
  fin = false

initUI()

function initUI() {
  // init buttons

  const buttons = document.querySelectorAll('#startSection button')

  for (let button of buttons) {
    button.addEventListener('click', onButtonClick)
  }

  const button = document.querySelector('#endSection button')

  button.addEventListener('click', onRestart)

  // init cells

  const cells = document.querySelectorAll('.cell')

  for (let cell of cells) {
    cell.addEventListener('click', onCellClick)
  }
}

const boxCells = scene.getTransformNodeByName('allBoxes').getChildren()

for (let boxCell of boxCells) {
  boxCell.actionManager = new BABYLON.ActionManager(scene)
  boxCell.actionManager.registerAction(
    new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, (e) => {
      onCellBoxClick(e)
    })
  )
}

function initGame() {
  const intro = document.getElementById('intro')
  intro.classList.add('hidden')

  // create game state graph

  graph = new TTTGraph(player)

  // let the ai make its first move

  if (player === 2) {
    graph.aiTurn()
    updateUI()
  }
}

function onButtonClick(event) {
  const button = event.target
  player = parseInt(button.dataset.player)

  initGame()
}

function onRestart() {
  window.location.reload()
}

function onCellBoxClick(event) {
  const cellB = event.meshUnderPointer

  const cellBid = parseInt(cellB.name)

  if (fin === false) {
    const cell = event.target

    const cellid = cellBid

    graph.turn(cellid, graph.currentPlayer)
    evaluate()

    if (fin === false) {
      graph.aiTurn()
      evaluate()
    }

    updateUI()
  }
}

function onCellClick(event) {
  if (fin === false) {
    const cell = event.target

    const cellid = cell.dataset.cellid

    graph.turn(cellid, graph.currentPlayer)
    evaluate()

    if (fin === false) {
      graph.aiTurn()
      evaluate()
    }

    updateUI()
  }
}

function evaluate() {
  const board = graph.getNode(graph.currentNode)

  if (board.win === true || board.finished === true) fin = true
}

function updateUI() {
  const node = graph.getNode(graph.currentNode)

  const board = node.board
  const cells = document.querySelectorAll('.cell')

  const cellBoxes = scene.getTransformNodeByName('allBoxes').getChildren()

  for (let cell of cells) {
    const cellid = cell.dataset.cellid
    const status = board[cellid]

    switch (status) {
      case 1:
        cell.textContent = 'X'
        cell.removeEventListener('click', onCellClick)

        let crossMove = scene.getMeshByName('cross').clone('crossMove')
        crossMove.isVisible = true

        bPos(crossMove, cell.dataset.cellid)

        crossMove.position.y = 0.6

        scene.getMeshByName(cell.dataset.cellid).isPickable = false
        crossMove.isPickable = false

        break

      case 2:
        cell.textContent = 'O'
        cell.removeEventListener('click', onCellClick)

        let torusMove = scene.getMeshByName('torus').clone('crossMove')
        torusMove.isVisible = true

        bPos(torusMove, cell.dataset.cellid)
        torusMove.position.y = 0.6

        scene.getMeshByName(cell.dataset.cellid).isPickable = false
        torusMove.isPickable = false

        break

      default:
        cell.textContent = ''
        //    console.log("DEFAULT")
        break
    }
  }

  if (fin === true) {
    const intro = document.getElementById('intro')
    intro.classList.remove('hidden')

    const startSection = document.getElementById('startSection')
    startSection.style.display = 'none'

    const endSection = document.getElementById('endSection')
    endSection.style.display = 'flex'

    const result = document.getElementById('result')

    if (node.win === true) {
      if (node.winPlayer === player) {
        result.textContent = 'You win the game!'
      } else {
        result.textContent = 'Yuka AI wins the game!'
      }
    } else {
      result.textContent = 'Draw!'
    }
  }
}
