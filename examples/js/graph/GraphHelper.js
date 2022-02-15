function createGraphHelper(scene, graph, nodeSize = 1, nodeColor = '#4e84c4', edgeColor = '#ffffff') {
  const nodes = []
  graph.getNodes(nodes)

  const parent = new BABYLON.TransformNode('nodes-parent', scene)

  for (let node of nodes) {
    const nodeMaterial = new BABYLON.StandardMaterial('node', scene)
    nodeMaterial.emmissiveColor = BABYLON.Color3.FromHexString(nodeColor)

    const nodeMesh = BABYLON.MeshBuilder.CreatePolyhedron(
      'node',
      {
        type: 3, // Icosahedron
        size: nodeSize,
      },
      scene
    )
    nodeMesh.parent = parent
    nodeMesh.material = nodeMaterial
    nodeMesh.position = new BABYLON.Vector3(node.position.x, node.position.y, node.position.z)

    // edges
    const edges = []
    for (let node of nodes) {
      graph.getEdgesOfNode(node.index, edges)

      for (let edge of edges) {
        const position = []
        const fromNode = graph.getNode(edge.from)
        const toNode = graph.getNode(edge.to)

        position.push(new BABYLON.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z))
        position.push(new BABYLON.Vector3(toNode.position.x, toNode.position.y, toNode.position.z))

        const pathHelper = BABYLON.MeshBuilder.CreateLines(
          'path-helper',
          {
            points: position,
            updatable: false,
          },
          scene
        )
        pathHelper.color = BABYLON.Color3.Green()
        pathHelper.parent = parent
      }
    }
  }

  return parent
}

function createPathHelper(graph, path, nodeSize, color = 0x00ff00) {
  const group = new THREE.Group()

  // nodes

  const startNodeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 })
  const endNodeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
  const nodeGeometry = new THREE.IcosahedronBufferGeometry(nodeSize, 2)

  const startNodeMesh = new THREE.Mesh(nodeGeometry, startNodeMaterial)
  const endNodeMesh = new THREE.Mesh(nodeGeometry, endNodeMaterial)

  const startNode = graph.getNode(path[0])
  const endNode = graph.getNode(path[path.length - 1])

  startNodeMesh.position.copy(startNode.position)
  endNodeMesh.position.copy(endNode.position)

  group.add(startNodeMesh)
  group.add(endNodeMesh)

  // edges

  const edgesGeometry = new THREE.BufferGeometry()
  const position = []

  const edgesMaterial = new THREE.LineBasicMaterial({ color: color })

  for (let i = 0, l = path.length - 1; i < l; i++) {
    const fromNode = graph.getNode(path[i])
    const toNode = graph.getNode(path[i + 1])

    position.push(fromNode.position.x, fromNode.position.y, fromNode.position.z)
    position.push(toNode.position.x, toNode.position.y, toNode.position.z)
  }

  edgesGeometry.addAttribute('position', new THREE.Float32BufferAttribute(position, 3))

  const lines = new THREE.LineSegments(edgesGeometry, edgesMaterial)
  lines.matrixAutoUpdate = false

  group.add(lines)

  return group
}

function createSearchTreeHelper(graph, searchTree, color = 0xff0000) {
  const geometry = new THREE.BufferGeometry()
  const position = []

  const material = new THREE.LineBasicMaterial({ color: color })

  for (let edge of searchTree) {
    const fromNode = graph.getNode(edge.from)
    const toNode = graph.getNode(edge.to)

    position.push(fromNode.position.x, fromNode.position.y, fromNode.position.z)
    position.push(toNode.position.x, toNode.position.y, toNode.position.z)
  }

  geometry.addAttribute('position', new THREE.Float32BufferAttribute(position, 3))

  const lines = new THREE.LineSegments(geometry, material)
  lines.matrixAutoUpdate = false

  return lines
}

export { createGraphHelper, createPathHelper, createSearchTreeHelper }
