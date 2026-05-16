import { useState } from 'react';
import { Plus, Trash2, Network, Link as LinkIcon, Maximize2, Save } from 'lucide-react';

type Node = {
  id: number;
  x: number;
  y: number;
  label: string;
  color: string;
  size: 'small' | 'medium' | 'large';
};

type Connection = {
  from: number;
  to: number;
  label?: string;
};

const initialNodes: Node[] = [
  { id: 1, x: 200, y: 200, label: 'Calculus', color: 'indigo', size: 'large' },
  { id: 2, x: 100, y: 100, label: 'Derivatives', color: 'blue', size: 'medium' },
  { id: 3, x: 300, y: 100, label: 'Integrals', color: 'blue', size: 'medium' },
  { id: 4, x: 50, y: 50, label: 'Power Rule', color: 'green', size: 'small' },
  { id: 5, x: 150, y: 50, label: 'Chain Rule', color: 'green', size: 'small' },
  { id: 6, x: 250, y: 50, label: 'U-Substitution', color: 'green', size: 'small' },
  { id: 7, x: 350, y: 50, label: 'Integration by Parts', color: 'green', size: 'small' },
];

const initialConnections: Connection[] = [
  { from: 1, to: 2 },
  { from: 1, to: 3 },
  { from: 2, to: 4, label: 'uses' },
  { from: 2, to: 5, label: 'uses' },
  { from: 3, to: 6, label: 'technique' },
  { from: 3, to: 7, label: 'technique' },
];

const colors = ['indigo', 'blue', 'green', 'purple', 'pink', 'red', 'orange', 'yellow'];

export default function ConceptMapper() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<number | null>(null);
  const [showAddNode, setShowAddNode] = useState(false);
  const [newNodeLabel, setNewNodeLabel] = useState('');
  const [newNodeColor, setNewNodeColor] = useState('blue');
  const [newNodeSize, setNewNodeSize] = useState<'small' | 'medium' | 'large'>('medium');

  const addNode = () => {
    if (!newNodeLabel) return;
    const newNode: Node = {
      id: Math.max(...nodes.map(n => n.id), 0) + 1,
      x: 200,
      y: 200,
      label: newNodeLabel,
      color: newNodeColor,
      size: newNodeSize
    };
    setNodes([...nodes, newNode]);
    setNewNodeLabel('');
    setShowAddNode(false);
  };

  const deleteNode = (id: number) => {
    setNodes(nodes.filter(n => n.id !== id));
    setConnections(connections.filter(c => c.from !== id && c.to !== id));
    setSelectedNode(null);
  };

  const handleNodeClick = (id: number) => {
    if (connectingFrom === null) {
      setSelectedNode(id);
    } else if (connectingFrom !== id) {
      setConnections([...connections, { from: connectingFrom, to: id }]);
      setConnectingFrom(null);
    }
  };

  const startConnecting = (id: number) => {
    setConnectingFrom(id);
    setSelectedNode(null);
  };

  const getNodeSize = (size: string) => {
    switch (size) {
      case 'small': return 60;
      case 'medium': return 80;
      case 'large': return 100;
      default: return 80;
    }
  };

  const getColorClass = (color: string) => {
    return `bg-${color}-100 border-${color}-500 text-${color}-900`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Concept Mapper</h1>
          <p className="text-gray-600">Visualize connections between concepts</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg font-medium hover:bg-gray-50 transition-all">
            <Save className="inline mb-1 mr-2" size={20} />
            Save Map
          </button>
          <button
            onClick={() => setShowAddNode(true)}
            className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
          >
            <Plus className="inline mb-1 mr-2" size={20} />
            Add Concept
          </button>
        </div>
      </div>

      {/* Add Node Modal */}
      {showAddNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold mb-6">Add New Concept</h3>
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-2">Concept Name</label>
                <input
                  type="text"
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  placeholder="e.g., Pythagorean Theorem"
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 focus:border-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div>
                <label className="block font-medium mb-2">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setNewNodeColor(color)}
                      className={`w-10 h-10 rounded-full border-4 transition-all ${
                        newNodeColor === color ? 'border-gray-900 scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: `var(--${color}-500)` }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block font-medium mb-2">Importance</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['small', 'medium', 'large'] as const).map(size => (
                    <button
                      key={size}
                      onClick={() => setNewNodeSize(size)}
                      className={`py-2 rounded-lg border-2 font-medium transition-all ${
                        newNodeSize === size
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {size.charAt(0).toUpperCase() + size.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={addNode}
                className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
              >
                Add Concept
              </button>
              <button
                onClick={() => {
                  setShowAddNode(false);
                  setNewNodeLabel('');
                }}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Canvas */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6" style={{ height: '600px' }}>
        <svg className="w-full h-full">
          {/* Connections */}
          {connections.map((conn, index) => {
            const fromNode = nodes.find(n => n.id === conn.from);
            const toNode = nodes.find(n => n.id === conn.to);
            if (!fromNode || !toNode) return null;

            return (
              <g key={index}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke="#94a3b8"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                {conn.label && (
                  <text
                    x={(fromNode.x + toNode.x) / 2}
                    y={(fromNode.y + toNode.y) / 2}
                    fill="#64748b"
                    fontSize="12"
                    textAnchor="middle"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Arrow marker */}
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="10"
              refX="8"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 10 3, 0 6" fill="#94a3b8" />
            </marker>
          </defs>

          {/* Nodes */}
          {nodes.map((node) => {
            const size = getNodeSize(node.size);
            const isSelected = selectedNode === node.id;
            const isConnecting = connectingFrom === node.id;

            return (
              <g key={node.id}>
                <foreignObject
                  x={node.x - size / 2}
                  y={node.y - size / 2}
                  width={size}
                  height={size}
                >
                  <div
                    onClick={() => handleNodeClick(node.id)}
                    className={`w-full h-full rounded-full border-4 flex items-center justify-center text-center p-2 cursor-pointer transition-all hover:shadow-lg ${getColorClass(node.color)} ${
                      isSelected ? 'ring-4 ring-indigo-500' : ''
                    } ${isConnecting ? 'ring-4 ring-purple-500 animate-pulse' : ''}`}
                    style={{ fontSize: node.size === 'small' ? '10px' : node.size === 'large' ? '14px' : '12px' }}
                  >
                    <span className="font-bold leading-tight">{node.label}</span>
                  </div>
                </foreignObject>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-md">
          <h3 className="font-bold mb-3 flex items-center gap-2">
            <Network size={20} className="text-indigo-600" />
            Node Actions
          </h3>
          {selectedNode ? (
            <div className="space-y-2">
              <p className="text-sm text-gray-600 mb-3">
                Selected: <span className="font-bold">{nodes.find(n => n.id === selectedNode)?.label}</span>
              </p>
              <button
                onClick={() => startConnecting(selectedNode)}
                className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium hover:bg-indigo-200 transition-colors"
              >
                <LinkIcon className="inline mb-1 mr-2" size={16} />
                Connect to Another
              </button>
              <button
                onClick={() => deleteNode(selectedNode)}
                className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-colors"
              >
                <Trash2 className="inline mb-1 mr-2" size={16} />
                Delete Node
              </button>
            </div>
          ) : connectingFrom ? (
            <p className="text-sm text-purple-600 font-medium">
              Click another node to create a connection
            </p>
          ) : (
            <p className="text-sm text-gray-500">
              Click a node to select it
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
          <h3 className="font-bold mb-2">📊 Map Stats</h3>
          <div className="space-y-2 text-sm">
            <p><span className="font-bold">{nodes.length}</span> concepts</p>
            <p><span className="font-bold">{connections.length}</span> connections</p>
            <p><span className="font-bold">{nodes.filter(n => n.size === 'large').length}</span> key concepts</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6">
          <h3 className="font-bold mb-2">💡 Tips</h3>
          <ul className="space-y-1 text-sm text-gray-700">
            <li>• Use colors to group related topics</li>
            <li>• Size indicates importance</li>
            <li>• Connect concepts to see relationships</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
