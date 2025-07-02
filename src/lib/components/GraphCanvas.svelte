<script lang="ts">
    import { onMount } from "svelte";
    import { operators } from "../operators";
    import Node from "./Node.svelte";
    import { writable, derived } from "svelte/store";
    import type { Attributes } from "graphology-types";
    import { graphStore } from "../stores/graphStore";
    import { positions } from "../stores/positions";
    import type { Obj, Point } from "../types";
    import * as R from "ramda";
    import { get } from "svelte/store";

    let container: HTMLDivElement;

    $: graphData = get(graphStore.data);
    $: graphLayout = get(graphStore.layout);

    // Load positions from localStorage
    onMount(() => {
        const positions: Record<string, { x: number; y: number }> =
            Object.fromEntries(
                graphData
                    .nodes()
                    .map((key) => [
                        key,
                        {
                            x: 100 + Math.random() * 300,
                            y: 100 + Math.random() * 300,
                        },
                    ]),
            );
        localStorage.setItem("nodePositions", JSON.stringify(positions));
        graphStore.placeNodes(positions);
        console.log("graphLayout", graphLayout);
    });

    function handleNodeDrag(key: string, dx: number, dy: number) {
        console.log("dragging node", key, dx, dy);
        graphStore.displaceNodes({ [key]: { dx, dy } });
    }

    interface EdgeData {
        key: string;
        source: string;
        target: string;
        attributes: Attributes & {
            targetPort: number;
        };
    }

    const nodes = derived(
        [graphStore.data, graphStore.layout],
        ([$graphData, $graphLayout]) => {
            return $graphData.nodes().map((key) => ({
                key,
                operation: $graphData.getNodeAttributes(key).operation,
                position: $graphLayout?.[key]?.position || { x: 0, y: 0 },
            }));
        },
    );

    // Returns an SVG path string for a cubic spline between two points
    function DrawEdge(sourcePoint: Point, targetPoint: Point): string {
        const dx = targetPoint.x - sourcePoint.x;
        const controlPoint1X = sourcePoint.x + Math.max(10, dx * 0.5);
        const controlPoint2X = targetPoint.x - Math.max(10, dx * 0.5);
        return `M ${sourcePoint.x} ${sourcePoint.y} C ${controlPoint1X} ${sourcePoint.y}, ${controlPoint2X} ${targetPoint.y}, ${targetPoint.x} ${targetPoint.y}`;
    }

    const getPortPosition =
        (portNumber: number, totalPortCount: number) =>
        (nodeDimensions: Point, nodePosition: Point): Point => {
            return {
                x: nodePosition.x,
                y: ((portNumber + 1) * nodeDimensions.y) / (totalPortCount + 1),
            };
        };

    //Derived store for edge paths
    const edgePaths = derived(
        [graphStore.data, graphStore.layout, nodes],
        ([$graphData, $graphLayout, $nodes]) => {
            return $graphData.edges().map((edge: string) => {
                const source = $graphData.source(edge);
                const target = $graphData.target(edge);
                const attributes = $graphData.getEdgeAttributes(edge);
                const sourceNode = $nodes.find((n: any) => n.key === source);
                const targetNode = $nodes.find((n: any) => n.key === target);
                if (!sourceNode || !targetNode) return { key: edge, path: "" };
                const sourcePos = sourceNode.position;
                const targetPos = targetNode.position;
                const sourceX = sourcePos.x + 150;
                const sourceY = sourcePos.y + 100 / 2;
                const targetX = targetPos.x;
                const targetNodeHeight = 100;
                const inputCount =
                    operators[targetNode.operation as keyof typeof operators]
                        ?.operation?.length ?? 0;
                const portSpacing = targetNodeHeight / (inputCount + 1);
                const targetY =
                    targetPos.y + (attributes.targetPort + 1) * portSpacing;
                const dx = targetX - sourceX;
                const controlPoint1X = sourceX + dx * 0.5;
                const controlPoint2X = targetX - dx * 0.5;
                const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${sourceY}, ${controlPoint2X} ${targetY}, ${targetX} ${targetY}`;
                return { key: edge, path };
            });
        },
    );
</script>

<div class="graph-container" bind:this={container}>
    {#each $nodes as node (node.key)}
        <Node
            key={node.key}
            operationName={node.operation}
            position={node.position}
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
