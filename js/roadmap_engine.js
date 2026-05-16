/**
 * RoadmapEngine - A sophisticated hierarchical tree visualization system
 * Features: Infinite canvas, camera controller, recursive rendering, 
 * multiple layout modes, and GPU-accelerated transforms.
 */

class ViewportState {
    constructor() {
        this.scale = 1;
        this.translateX = 0;
        this.translateY = 0;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
    }
}

class RoadmapNode {
    constructor(data, level = 0) {
        this.id = data.id || `node_${Math.random().toString(36).substr(2, 9)}`;
        this.label = data.label || 'New Node';
        this.description = data.description || '';
        this.type = data.type || 'level1';
        this.level = level;
        this.collapsed = false;
        this.x = 0;
        this.y = 0;
        this.width = 180;
        this.height = 60;
        this.children = (data.children || []).map(child => new RoadmapNode(child, level + 1));
        
        // Layout metadata
        this.subtreeWidth = 0;
        this.subtreeHeight = 0;
        this.offset = 0;
    }

    getAllNodes() {
        let nodes = [this];
        if (!this.collapsed) {
            this.children.forEach(child => {
                nodes = nodes.concat(child.getAllNodes());
            });
        }
        return nodes;
    }

    getConnections() {
        let connections = [];
        if (!this.collapsed) {
            this.children.forEach(child => {
                connections.push({ source: this, target: child });
                connections = connections.concat(child.getConnections());
            });
        }
        return connections;
    }
}

class LayoutEngine {
    constructor() {
        this.nodeSpacingX = 100;
        this.nodeSpacingY = 120;
    }

    calculate(root, mode = 'vertical') {
        switch (mode) {
            case 'horizontal':
                this.calculateHorizontal(root);
                break;
            case 'radial':
                this.calculateRadial(root);
                break;
            default:
                this.calculateVertical(root);
        }
    }

    calculateVertical(node) {
        // Step 1: Calculate subtree sizes
        this._calculateSubtreeSizes(node, true);
        
        // Step 2: Assign positions
        this._assignVerticalPositions(node, 0, 0);
    }

    _calculateSubtreeSizes(node, vertical = true) {
        if (node.collapsed || node.children.length === 0) {
            node.subtreeWidth = node.width;
            node.subtreeHeight = node.height;
            return;
        }

        let totalSize = 0;
        node.children.forEach(child => {
            this._calculateSubtreeSizes(child, vertical);
            totalSize += vertical ? child.subtreeWidth : child.subtreeHeight;
        });

        totalSize += (node.children.length - 1) * (vertical ? this.nodeSpacingX : this.nodeSpacingY);
        
        if (vertical) {
            node.subtreeWidth = Math.max(node.width, totalSize);
            node.subtreeHeight = node.height + this.nodeSpacingY;
        } else {
            node.subtreeHeight = Math.max(node.height, totalSize);
            node.subtreeWidth = node.width + this.nodeSpacingX;
        }
    }

    _assignVerticalPositions(node, x, y) {
        node.x = x;
        node.y = y;

        if (node.collapsed || node.children.length === 0) return;

        let startX = x - (node.subtreeWidth / 2) + (node.children[0].subtreeWidth / 2);
        let currentX = startX;

        node.children.forEach(child => {
            this._assignVerticalPositions(child, currentX, y + this.nodeSpacingY);
            currentX += child.subtreeWidth + this.nodeSpacingX;
        });
    }

    calculateHorizontal(node) {
        this._calculateSubtreeSizes(node, false);
        this._assignHorizontalPositions(node, 0, 0);
    }

    _assignHorizontalPositions(node, x, y) {
        node.x = x;
        node.y = y;

        if (node.collapsed || node.children.length === 0) return;

        let startY = y - (node.subtreeHeight / 2) + (node.children[0].subtreeHeight / 2);
        let currentY = startY;

        node.children.forEach(child => {
            this._assignHorizontalPositions(child, x + (this.nodeSpacingX * 2.5), currentY);
            currentY += child.subtreeHeight + this.nodeSpacingY;
        });
    }

    calculateRadial(node, angleStart = 0, angleEnd = Math.PI * 2, radius = 0) {
        node.x = Math.cos((angleStart + angleEnd) / 2) * radius;
        node.y = Math.sin((angleStart + angleEnd) / 2) * radius;

        if (node.collapsed || node.children.length === 0) return;

        let childCount = node.children.length;
        let angleStep = (angleEnd - angleStart) / childCount;

        node.children.forEach((child, i) => {
            this.calculateRadial(child, angleStart + i * angleStep, angleStart + (i + 1) * angleStep, radius + 250);
        });
    }
}

class ViewportManager {
    constructor(container) {
        this.container = container;
        this.content = container.querySelector('.canvas-content');
        this.state = new ViewportState();
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.setupEvents();
        this.updateTransform();
    }

    setupEvents() {
        this.container.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.isDragging = true;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const dx = e.clientX - this.lastMouseX;
                const dy = e.clientY - this.lastMouseY;
                this.state.translateX += dx;
                this.state.translateY += dy;
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
                this.updateTransform();
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -e.deltaY;
            const factor = Math.pow(1.1, delta / 100);
            
            // Zoom towards mouse
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const worldX = (mouseX - this.state.translateX) / this.state.scale;
            const worldY = (mouseY - this.state.translateY) / this.state.scale;

            const newScale = Math.max(0.1, Math.min(5, this.state.scale * factor));
            
            this.state.translateX = mouseX - worldX * newScale;
            this.state.translateY = mouseY - worldY * newScale;
            this.state.scale = newScale;

            this.updateTransform();
        }, { passive: false });
    }

    updateTransform() {
        this.content.style.transform = `matrix(${this.state.scale}, 0, 0, ${this.state.scale}, ${this.state.translateX}, ${this.state.translateY})`;
    }

    focusNode(node) {
        const rect = this.container.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        this.state.translateX = centerX - node.x * this.state.scale;
        this.state.translateY = centerY - node.y * this.state.scale;
        this.updateTransform();
    }

    fitToScreen(nodes) {
        if (!nodes || nodes.length === 0) return;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        nodes.forEach(n => {
            minX = Math.min(minX, n.x - n.width/2);
            minY = Math.min(minY, n.y - n.height/2);
            maxX = Math.max(maxX, n.x + n.width/2);
            maxY = Math.max(maxY, n.y + n.height/2);
        });

        const rect = this.container.getBoundingClientRect();
        const padding = 100;
        const scaleX = (rect.width - padding) / (maxX - minX);
        const scaleY = (rect.height - padding) / (maxY - minY);
        this.state.scale = Math.min(scaleX, scaleY, 1.2);

        this.state.translateX = (rect.width / 2) - ((minX + maxX) / 2) * this.state.scale;
        this.state.translateY = (rect.height / 2) - ((minY + maxY) / 2) * this.state.scale;
        this.updateTransform();
    }
}

class RoadmapEngine {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.content = this.container.querySelector('.canvas-content');
        this.nodesLayer = this.content.querySelector('.nodes-layer');
        this.edgesLayer = this.content.querySelector('.edges-layer');
        
        this.tree = null;
        this.layout = new LayoutEngine();
        this.viewport = new ViewportManager(this.container);
        this.mode = 'vertical';
        
        this.centralState = {
            selectedId: null,
            hoveredId: null,
            collapsedIds: new Set()
        };
    }

    setData(data) {
        this.tree = new RoadmapNode(data);
        this.refresh();
        setTimeout(() => this.viewport.fitToScreen(this.tree.getAllNodes()), 100);
    }

    setMode(mode) {
        this.mode = mode;
        this.refresh();
    }

    refresh() {
        if (!this.tree) return;
        
        // 1. Calculate Layout
        this.layout.calculate(this.tree, this.mode);
        
        // 2. Virtualize and Render
        this.render();
    }

    render() {
        const nodes = this.tree.getAllNodes();
        const connections = this.tree.getConnections();

        // Render Connections
        this.edgesLayer.innerHTML = '';
        connections.forEach(conn => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const d = this._calculatePath(conn.source, conn.target);
            path.setAttribute('d', d);
            path.setAttribute('class', 'edge-path');
            this.edgesLayer.appendChild(path);
        });

        // Render Nodes
        this.nodesLayer.innerHTML = '';
        nodes.forEach(node => {
            const el = this._createNodeElement(node);
            this.nodesLayer.appendChild(el);
        });
    }

    _calculatePath(s, t) {
        if (this.mode === 'horizontal') {
            const cp1x = s.x + (t.x - s.x) / 2;
            return `M ${s.x} ${s.y} C ${cp1x} ${s.y}, ${cp1x} ${t.y}, ${t.x} ${t.y}`;
        } else if (this.mode === 'radial') {
            return `M ${s.x} ${s.y} L ${t.x} ${t.y}`;
        } else {
            const cp1y = s.y + (t.y - s.y) / 2;
            return `M ${s.x} ${s.y} C ${s.x} ${cp1y}, ${t.x} ${cp1y}, ${t.x} ${t.y}`;
        }
    }

    _createNodeElement(node) {
        const div = document.createElement('div');
        div.className = `roadmap-node ${node.type} ${this.centralState.selectedId === node.id ? 'selected' : ''}`;
        div.style.left = `${node.x}px`;
        div.style.top = `${node.y}px`;
        
        // Depth-aware styling is handled by CSS based on level
        div.dataset.level = node.level;
        
        div.innerHTML = `
            <div class="node-content">
                <span class="node-label">${node.label}</span>
                ${node.children.length > 0 ? `<button class="node-toggle">${node.collapsed ? '+' : '-'}</button>` : ''}
            </div>
            ${node.description ? `<div class="node-tooltip">${node.description}</div>` : ''}
        `;

        div.addEventListener('click', (e) => {
            e.stopPropagation();
            this.centralState.selectedId = node.id;
            this.viewport.focusNode(node);
            this.render();
        });

        const toggle = div.querySelector('.node-toggle');
        if (toggle) {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                node.collapsed = !node.collapsed;
                this.refresh();
            });
        }

        return div;
    }
}

window.RoadmapEngine = RoadmapEngine;
