<script lang="ts">
  import { onMount } from 'svelte';
  import { operators } from '../operators';
  import Node from './Node.svelte';
  import { writable, derived } from 'svelte/store';
  import type { Attributes } from 'graphology-types';
  import { graphStore } from '../stores/graphStore';
  import {positions} from '../stores/positions'
  import type { Obj } from '../types';
  import * as R from 'ramda';

  let container: HTMLDivElement;

  //onMount, for every Node in graphStore whose key is not present in the layoutStore, instantiate it in the Layout store with arbitrary coordinates

  // Load positions from localStorage
  onMount(() => {
    const updatePositions = R.pipe(
      (saved: string | null) => saved ? JSON.parse(saved) : {},
      (parsed: Obj) => positions.update(pos => {
        let changed = false;
        for (const node of graphStore!.nodes()) {
          if (!parsed[node]) {
            parsed[node] = { x: 100 + Math.random() * 300, y: 100 + Math.random() * 300 };
            changed = true;
          }
        }
        if (changed) localStorage.setItem('nodePositions', JSON.stringify(parsed));
        return { ...parsed };
      })
    );
    updatePositions(localStorage.getItem('nodePositions'));
  });

  function handleNodeDrag(key: string, dx: number, dy: number) {
    positions.update(pos => {
      const newPos = {
        ...pos,
        [key]: {
          x: pos[key].x + dx,
          y: pos[key].y + dy
        }
      };
      // Uncomment to persist
      // localStorage.setItem('nodePositions', JSON.stringify(newPos));
      return newPos;
    });
  }

  interface EdgeData {
    key: string;
    source: string;
    target: string;
    attributes: Attributes & {
      targetPort: number;
    };
  }

  $: nodes = graphStore
    ? graphStore.nodes().map((node: string) => ({
        key: node,
        operation: graphStore!.getNodeAttributes(node).operation,
       
      }))
    : [];

  type Point = { x: number; y: number }

  // Returns an SVG path string for a cubic spline between two points
  function DrawEdge(sourcePoint: Point, targetPoint: Point): string {
    const dx = targetPoint.x - sourcePoint.x;
    const controlPoint1X = sourcePoint.x + Math.max(10,dx * 0.5);
    const controlPoint2X = targetPoint.x - Math.max(10,dx * 0.5);
    return `M ${sourcePoint.x} ${sourcePoint.y} C ${controlPoint1X} ${sourcePoint.y}, ${controlPoint2X} ${targetPoint.y}, ${targetPoint.x} ${targetPoint.y}`;
  }

  const getPortPosition = (portNumber:number, totalPortCount:number) => (nodeDimensions:Point, nodePosition:Point):Point => {
    return {x:nodePosition.x, y:(portNumber + 1)*nodeDimensions.y/(totalPortCount+1)}
  }


  // Derived store for edge paths
  const edgePaths = derived([
    positions,
    graphStore
  ], ([$positions, graphStore]) =>
    R.pipe(
      () => graphStore
        ? graphStore.edges().map((edge: string) => ({
            key: edge,
            source: graphStore!.source(edge),
            target: graphStore!.target(edge),
            attributes: graphStore!.getEdgeAttributes(edge)
          })) as EdgeData[]
        : [],
      R.map((edge: EdgeData) => {
        const sourceNode = nodes.find(n => n.key === edge.source);
        const targetNode = nodes.find(n => n.key === edge.target);
        if (!sourceNode || !targetNode) return { key: edge.key, path: '' };
        const sourcePos = $positions[sourceNode.key] || { x: 0, y: 0 };
        const targetPos = $positions[targetNode.key] || { x: 0, y: 0 };
        const sourceX = sourcePos.x + 150;
        const sourceY = sourcePos.y + 100 / 2;
        const targetX = targetPos.x;
        const targetNodeHeight = 100;
        const inputCount = operators[targetNode.operation as keyof typeof operators]?.operation?.length ?? 0;
        const portSpacing = targetNodeHeight / (inputCount + 1);
        const targetY = targetPos.y + (edge.attributes.targetPort + 1) * portSpacing;
        const dx = targetX - sourceX;
        const controlPoint1X = sourceX + dx * 0.5;
        const controlPoint2X = targetX - dx * 0.5;
        const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${sourceY}, ${controlPoint2X} ${targetY}, ${targetX} ${targetY}`;
        return { key: edge.key, path };
      })
    )()
  );


</script>

<div class="graph-container" bind:this={container}>
  {#each nodes as node (node.key)}
    <Node
      key={node.key}
      opKey={node.operation}
      position={$positions[node.key]}
      onDragMove={handleNodeDrag}
    />
  {/each}
  <svg class="edges-layer">
    {#each $edgePaths as edgePath}
      <path
        d={edgePath.path}
        stroke="#666"
        stroke-width="2"
        fill="none"
        marker-end="url(#arrowhead)"
      />
    {/each}
    <defs>
      <marker
        id="arrowhead"
        markerWidth="10"
        markerHeight="7"
        refX="9"
        refY="3.5"
        orient="auto"
      >
        <polygon points="0 0, 10 3.5, 0 7" fill="#666" />
      </marker>
    </defs>
  </svg>
</div>

<style>
  .graph-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .edges-layer {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style> 