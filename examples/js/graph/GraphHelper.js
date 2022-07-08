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
    const lines = []
    for (let node of nodes) {
      graph.getEdgesOfNode(node.index, edges)

      const position = []
      for (let edge of edges) {
        const fromNode = graph.getNode(edge.from)
        const toNode = graph.getNode(edge.to)

        position.push(new BABYLON.Vector3(fromNode.position.x, fromNode.position.y, fromNode.position.z))
        position.push(new BABYLON.Vector3(toNode.position.x, toNode.position.y, toNode.position.z))
      }

      lines.push(position)
    }

    const pathHelper = BABYLON.MeshBuilder.CreateLineSystem(
      'path-helper',
      {
        lines,
        updatable: false,
      },
      scene
    )
    pathHelper.color = BABYLON.Color3.Green()
    pathHelper.parent = parent
  }

  return parent
}

export { createGraphHelper }
