import { writable, type Writable } from 'svelte/store';
import type { GraphType } from 'graphology-types';
import Graph from 'graphology';
import { operators, fanIn } from '../operators';
import { topologicalSort } from 'graphology-dag';
import type { Map, NodeWidget, Endo } from '../types';
import * as R from 'ramda';
import type { Evolver } from 'ramda';

export class DataFlowGraph extends Graph {
  constructor(options?: any) {
	super(options);
  }
  // Returns an array of node keys representing the ancestors (upstream) of the given node, including itself.
  upstreamGraph(nodeId: string): string[] {
	const visited = new Set<string>();
	const stack = [nodeId];
	while (stack.length > 0) {
	  const current = stack.pop()!;
	  if (!visited.has(current)) {
		visited.add(current);
		for (const edge of this.inEdges(current)) {
		  const source = this.source(edge);
		  stack.push(source);
		}
	  }
	}
	return Array.from(visited);
  }

  // Given a list of node keys, returns only those that have no incoming edges (i.e., are leaves).
  terminalAncestors(keys: string[]): string[] {
	return keys.filter(key => this.inDegree(key) === 0);
  }

  // Given a list of node keys, returns the list of all descendant node keys (reachable by outgoing edges, excluding the input keys).
  descendants(keys: string[]): string[] {
	const visited = new Set<string>();
	const stack = [...keys];
	// Mark input keys as visited so we don't include them as descendants
	for (const key of keys) visited.add(key);
	while (stack.length > 0) {
	  const current = stack.pop()!;
	  for (const edge of this.outEdges(current)) {
		const target = this.target(edge);
		if (!visited.has(target)) {
		  visited.add(target);
		  stack.push(target);
		}
	  }
	}
	// Remove the original input keys from the result
	for (const key of keys) visited.delete(key);
	return Array.from(visited);
  }

  // Compute the colimit of the ancestor diagram of a given node, i.e. the recursive composition of the operators referenced by its ancestors.
  // Note: This requires the graph to be directed and acyclic.
  colimit(nodeId: string): Map<(...args: any[]) => any> {
	const upstreamIds = this.upstreamGraph(nodeId);
	const order = topologicalSort(this).filter(key => upstreamIds.includes(key));
	//opMap stores the colimit at each node given its key, sorted topologically
	const opMap: Record<string, (...args: any[]) => any> = {};

	for (const key of order) {
	  //get the operator referenced by this node
	  const opKey = this.getNodeAttribute(key, 'operation') as keyof typeof operators;
	  const ports: number[] = R.range(0, operators[opKey].dummyInputs.length);
	  const inEdges: Record<number, string> = R.indexBy(edgeId => this.getEdgeAttribute(edgeId, 'targetPort'), this.inEdges(key))

	  const portNumberToParentOp = (portNumber: number): (...args: any[]) => any => {
		if (R.has(portNumber, inEdges)) {
		  //if the node has an incoming edge on this port, use colimit computed at the source node
		  return opMap[this.source(inEdges[portNumber])];
		} else {
		  //if the node has no incoming edge on this port, use the dummy input for this operator
		  return operators[opKey].dummyInputs[portNumber];
		}
	  }

	  const parentOps = R.map(portNumberToParentOp, ports);
	  opMap[key] = fanIn(parentOps, operators[opKey].operation);
	}
	return opMap;
  }
}



export const createGraphStore2 = (
  nodes: { key: string; attributes: any }[],
  edges: { source: string; target: string; attributes?: any }[]
) => {
  const serialized = {
    attributes: {},
    options: { type: 'directed' as GraphType, allowSelfLoops: true },
    nodes,
    edges
  };
  const graph: InstanceType<typeof DataFlowGraph> = DataFlowGraph.from(serialized) as DataFlowGraph;
  const graphStructureStore: Writable<InstanceType<typeof DataFlowGraph>> = writable(graph);
  const graphLayoutStore: Writable<Map<NodeWidget>> = writable()

  function createNode(key: string, attributes: any) {
	graph.addNode(key, { ...attributes });
	graphStructureStore.set(graph)
	graphLayoutStore.update(R.assoc(key,{position: {x: 0, y:0}}))
  }

  function destroyNode(key: string) {

	/**
	* TODO: if the deleted node is not an upstream leaf: evaluate the colimit at this node. 
	*	    Store it in a temporary variable
	*		also store the keys of its descendants, and the edge ports that map to them.
	*		then call "dropNode" on that node
	*/
	
	graph.dropNode(key);
	graphStructureStore.set(graph)
	graphLayoutStore.update(R.omit([key]))
  }

  function createEdge(source: string, target: string, attributes: any = {}) {
	graph.addEdge(source, target, attributes);
	graphStructureStore.set(graph)
  }

  function destroyEdge(source: string, target: string) {
	graph.dropEdge(source, target);
	graphStructureStore.set(graph)
  }

  function displaceNodes(displacements: Record<string, {dx: number, dy:number}>) {
	let evolver: Evolver<Map<NodeWidget>> = R.mapObjIndexed(
	  ({ dx, dy }, _key) => ({ position: { x: R.add(dx), y: R.add(dy)}}),
	  displacements
	);
	graphLayoutStore.update(R.evolve(evolver))
  }

  return {
	displaceNodes,
	createNode,
	destroyNode,
	createEdge,
	destroyEdge,
    nodes: () => graph.nodes(),
	edges: () => graph.edges(),
	getNodeAttributes: (key: string) => graph.getNodeAttributes(key),
	getEdgeAttributes: (key: string) => graph.getEdgeAttributes(key),
	source: (edge: string) => graph.source(edge),
	target: (edge: string) => graph.target(edge),
	layout: {
	  subscribe: graphLayoutStore.subscribe,
	},
	structure: {
	  subscribe: graphStructureStore.subscribe
	}
  };
}

// we create a bidirectional binding between a graphLayoutStore and a graphDataStore.
// calling 
export function createGraphStore(
  nodes: { key: string; attributes: any }[],
  edges: { source: string; target: string; attributes?: any }[]
) {
  const graph: InstanceType<typeof DataFlowGraph> = new DataFlowGraph({ type: 'directed', allowSelfLoops: true });
  const graphStore: Writable<InstanceType<typeof DataFlowGraph>> = writable(graph);

  function update() {
	graphStore.set(graph);
  }

  function addNode(key: string, attributes: any) {
	graph.addNode(key, { ...attributes });
	update();
  }

  function addEdge(source: string, target: string, attributes: any = {}) {
	graph.addEdge(source, target, attributes);
	update();
  }

  function removeNode(key: string) {
 
	graph.dropNode(key);
	// then 
	update();
  }

  function removeEdge(source: string, target: string) {
	graph.dropEdge(source, target);
	update();
  }


  // Populate the graph using the public addNode/addEdge methods
  for (const node of nodes) {
	addNode(node.key, node.attributes);
  }
  for (const edge of edges) {
	addEdge(edge.source, edge.target, edge.attributes ?? {});
  }

  return {
	subscribe: graphStore.subscribe,
	addNode,
	addEdge,
	removeNode,
	removeEdge,
	nodes: () => graph.nodes(),
	edges: () => graph.edges(),
	getNodeAttributes: (key: string) => graph.getNodeAttributes(key),
	getEdgeAttributes: (key: string) => graph.getEdgeAttributes(key),
	source: (edge: string) => graph.source(edge),
	target: (edge: string) => graph.target(edge),
  };
}


export const graphStore = createGraphStore(
  [
	{ key: 'add1', attributes: { operation: 'add' } },
	{ key: 'add2', attributes: { operation: 'add' } },
	{ key: 'hydraNoise', attributes: { operation: 'hydraNoise' } },
	{ key: 'hydraOsc', attributes: { operation: 'hydraOsc' } },
	{ key: 'hydraPosterize', attributes: { operation: 'hydraPosterize' } },
	{ key: 'hydraBlend', attributes: { operation: 'hydraBlend' } },
	{ key: 'multiply', attributes: { operation: 'multiply' } },
	{ key: 'multiply2', attributes: { operation: 'multiply' } },
  ],
  [
	{ source: 'add1', target: 'multiply', attributes: { targetPort: 0 } },
	{ source: 'add2', target: 'multiply', attributes: { targetPort: 1 } },
	// { source: 'multiply', target: 'hydraOsc', attributes: { targetPort: 0 } },
	{ source: 'multiply', target: 'multiply2', attributes: { targetPort: 0 } },
	{ source: 'hydraNoise', target: 'hydraPosterize', attributes: { targetPort: 0 } },
	{ source: 'hydraOsc', target: 'hydraBlend', attributes: { targetPort: 1 } },
	{ source: 'hydraPosterize', target: 'hydraBlend', attributes: { targetPort: 0 } },
  ]
);