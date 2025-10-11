import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config/api';
import DescendanceListView from './DescendanceListView';
import ConcentricGraphView from './ConcentricGraphView';

interface Animal {
    id: number;
    identifiant_officiel: string;
    nom?: string;
    sexe: 'M' | 'F';
    race_nom: string;
    date_naissance?: string;
    date_deces?: string;
    statut: 'vivant' | 'mort';
    pere_id?: number;
    mere_id?: number;
}

interface FamilyTreeNode {
    animal: Animal;
    pere?: FamilyTreeNode;
    mere?: FamilyTreeNode;
    enfants?: FamilyTreeNode[];
    level: number;
}

interface FamilyTreeProps {
    animalId: number;
    onClose: () => void;
}

interface Position {
    x: number;
    y: number;
}

interface NodeLayout {
    node: FamilyTreeNode;
    position: Position;
    width: number;
    height: number;
}

const FamilyTree: React.FC<FamilyTreeProps> = ({ animalId, onClose }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [treeData, setTreeData] = useState<FamilyTreeNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [maxLevels, setMaxLevels] = useState(3);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [hoveredNode, setHoveredNode] = useState<NodeLayout | null>(null);
    const [viewMode, setViewMode] = useState<'tree' | 'list' | 'concentric'>('tree');

    useEffect(() => {
        fetchFamilyTree();
    }, [animalId, maxLevels]);

    useEffect(() => {
        if (treeData) {
            drawTree();
        }
    }, [treeData, scale, offset, hoveredNode]);

    // Gestionnaire d'événement wheel avec preventDefault approprié
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || viewMode !== 'tree') return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.max(0.3, Math.min(2, prev * scaleChange)));
        };

        canvas.addEventListener('wheel', handleWheelEvent, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', handleWheelEvent);
        };
    }, [viewMode]);

    const fetchFamilyTree = async () => {
        try {
            setLoading(true);
            setError('');
            const token = sessionStorage.getItem('token');

            if (!token) {
                throw new Error('Token d\'authentification manquant');
            }

            const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/genealogie?levels=${maxLevels}&include_children=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erreur lors du chargement de l\'arbre généalogique');
            }

            const data = await response.json();
            setTreeData(data);

        } catch (error: any) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };


    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };


    const calculateTreeLayout = (node: FamilyTreeNode): NodeLayout[] => {
        const layouts: NodeLayout[] = [];
        const cardWidth = 200;
        const cardHeight = 140;
        const levelHeight = 180;
        const horizontalSpacing = 50;
        const visited = new Set<FamilyTreeNode>();

        // Collecter tous les nœuds par niveau pour éviter les chevauchements
        const nodesByLevel = new Map<number, FamilyTreeNode[]>();

        const collectNodes = (n: FamilyTreeNode, level: number) => {
            if (visited.has(n)) return;
            visited.add(n);

            if (!nodesByLevel.has(level)) {
                nodesByLevel.set(level, []);
            }
            nodesByLevel.get(level)!.push(n);

            // Collecter les parents (niveaux négatifs)
            if (n.pere) collectNodes(n.pere, level - 1);
            if (n.mere) collectNodes(n.mere, level - 1);

            // Collecter les enfants (niveaux positifs)
            if (n.enfants) {
                n.enfants.forEach(enfant => collectNodes(enfant, level + 1));
            }
        };

        if (node) {
            const canvas = canvasRef.current;
            if (!canvas) return layouts;

            // Collecter tous les nœuds en partant du nœud central (niveau 0)
            collectNodes(node, 0);

            // Calculer les positions pour chaque niveau
            const levels = Array.from(nodesByLevel.keys()).sort((a, b) => a - b);
            const centerY = canvas.height / 2;

            levels.forEach(level => {
                const nodesAtLevel = nodesByLevel.get(level)!;
                const totalWidth = (cardWidth * nodesAtLevel.length) + (horizontalSpacing * (nodesAtLevel.length - 1));
                const startX = canvas.width / 2 - totalWidth / 2;
                const y = centerY + (level * levelHeight) - cardHeight / 2;

                nodesAtLevel.forEach((n, index) => {
                    const x = startX + (index * (cardWidth + horizontalSpacing));

                    const layout: NodeLayout = {
                        node: n,
                        position: { x, y },
                        width: cardWidth,
                        height: cardHeight
                    };
                    layouts.push(layout);
                });
            });

            // Réorganiser pour éviter les chevauchements familiaux
            optimizeLayout(layouts, nodesByLevel);
        }

        return layouts;
    };

    const optimizeLayout = (layouts: NodeLayout[], nodesByLevel: Map<number, FamilyTreeNode[]>) => {
        // Optimiser la position des parents pour qu'ils soient au-dessus de leurs enfants
        layouts.forEach(layout => {
            const { node } = layout;

            if (node.pere || node.mere) {
                const pereLayout = layouts.find(l => l.node === node.pere);
                const mereLayout = layouts.find(l => l.node === node.mere);

                if (pereLayout && mereLayout) {
                    // Centrer les parents au-dessus de l'enfant
                    const childX = layout.position.x + layout.width / 2;
                    const totalParentWidth = layout.width * 2 + 50;
                    const parentStartX = childX - totalParentWidth / 2;

                    pereLayout.position.x = parentStartX;
                    mereLayout.position.x = parentStartX + layout.width + 50;
                } else if (pereLayout) {
                    // Centrer le père au-dessus de l'enfant
                    pereLayout.position.x = layout.position.x;
                } else if (mereLayout) {
                    // Centrer la mère au-dessus de l'enfant
                    mereLayout.position.x = layout.position.x;
                }
            }

            if (node.enfants && node.enfants.length > 0) {
                // Centrer les enfants en dessous du parent
                const enfantsLayouts = node.enfants.map(enfant =>
                    layouts.find(l => l.node === enfant)
                ).filter(Boolean);

                if (enfantsLayouts.length > 0) {
                    const parentX = layout.position.x + layout.width / 2;
                    const totalChildrenWidth = (layout.width * enfantsLayouts.length) + (50 * (enfantsLayouts.length - 1));
                    const childrenStartX = parentX - totalChildrenWidth / 2;

                    enfantsLayouts.forEach((enfantLayout, index) => {
                        if (enfantLayout) {
                            enfantLayout.position.x = childrenStartX + (index * (layout.width + 50));
                        }
                    });
                }
            }
        });
    };

    const drawCard = (ctx: CanvasRenderingContext2D, layout: NodeLayout, isHovered: boolean = false) => {
        const { node, position, width, height } = layout;
        const { animal } = node;

        // Couleurs selon le sexe (gardé même pour les décédés)
        let backgroundColor, borderColor;
        if (animal.sexe === 'M') {
            backgroundColor = '#eff6ff';
            borderColor = '#93c5fd';
        } else {
            backgroundColor = '#fdf2f8';
            borderColor = '#f9a8d4';
        }

        // Effet hover
        if (isHovered) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 10;
        }

        // Fond de la carte
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(position.x, position.y, width, height);

        // Hachurage diagonal pour les animaux décédés
        if (animal.statut === 'mort') {
            ctx.save();

            // Créer un clipping path pour limiter les hachures au rectangle
            ctx.beginPath();
            ctx.rect(position.x, position.y, width, height);
            ctx.clip();

            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;

            // Créer le pattern hachuré diagonal
            const spacing = 8; // Espacement entre les lignes
            const x = position.x;
            const y = position.y;

            // Lignes diagonales de bas-gauche vers haut-droite
            for (let i = -height; i < width + height; i += spacing) {
                ctx.beginPath();
                ctx.moveTo(x + i, y + height);
                ctx.lineTo(x + i + height, y);
                ctx.stroke();
            }

            ctx.restore();
        }

        // Bordure
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(position.x, position.y, width, height);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Texte
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';

        let textY = position.y + 25;

        // Identifiant officiel
        ctx.fillText(animal.identifiant_officiel, position.x + width / 2, textY);
        textY += 20;

        // Nom
        if (animal.nom) {
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#374151';
            ctx.fillText(`"${animal.nom}"`, position.x + width / 2, textY);
            textY += 18;
        }

        // Sexe
        ctx.font = '20px sans-serif';
        ctx.fillText(animal.sexe === 'M' ? '♂️' : '♀️', position.x + width / 2, textY);
        textY += 25;

        // Race
        ctx.font = '10px sans-serif';
        ctx.fillStyle = '#6b7280';
        ctx.fillText(animal.race_nom, position.x + width / 2, textY);
        textY += 15;

        // Date de naissance
        if (animal.date_naissance) {
            ctx.fillText(`Né le ${formatDate(animal.date_naissance)}`, position.x + width / 2, textY);
            textY += 12;
        }

        // Date de décès
        if (animal.date_deces) {
            ctx.fillStyle = '#dc2626';
            ctx.fillText(`† ${formatDate(animal.date_deces)}`, position.x + width / 2, textY);
            textY += 15;
        }

        // Statut
        const statusColor = animal.statut === 'vivant' ? '#10b981' : '#ef4444';
        ctx.fillStyle = statusColor;
        ctx.font = '10px sans-serif';
        ctx.fillText(animal.statut === 'vivant' ? 'Vivant' : 'Décédé', position.x + width / 2, textY);
    };

    const drawConnections = (ctx: CanvasRenderingContext2D, layouts: NodeLayout[]) => {
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;

        layouts.forEach(layout => {
            const { node, position, width, height } = layout;

            if (node.pere || node.mere) {
                const childCenterX = position.x + width / 2;
                const childTopY = position.y;

                // Trouver les positions des parents
                const pereLayout = layouts.find(l => l.node === node.pere);
                const mereLayout = layouts.find(l => l.node === node.mere);

                if (pereLayout && mereLayout) {
                    // Ligne horizontale entre les parents
                    const pereX = pereLayout.position.x + pereLayout.width / 2;
                    const mereX = mereLayout.position.x + mereLayout.width / 2;
                    const parentY = pereLayout.position.y + pereLayout.height;

                    ctx.beginPath();
                    ctx.moveTo(pereX, parentY);
                    ctx.lineTo(mereX, parentY);
                    ctx.stroke();

                    // Ligne verticale vers l'enfant
                    const midX = (pereX + mereX) / 2;
                    ctx.beginPath();
                    ctx.moveTo(midX, parentY);
                    ctx.lineTo(midX, childTopY - 20);
                    ctx.lineTo(childCenterX, childTopY - 20);
                    ctx.lineTo(childCenterX, childTopY);
                    ctx.stroke();
                } else if (pereLayout) {
                    // Un seul parent (père)
                    const pereX = pereLayout.position.x + pereLayout.width / 2;
                    const parentY = pereLayout.position.y + pereLayout.height;

                    ctx.beginPath();
                    ctx.moveTo(pereX, parentY);
                    ctx.lineTo(pereX, childTopY - 20);
                    ctx.lineTo(childCenterX, childTopY - 20);
                    ctx.lineTo(childCenterX, childTopY);
                    ctx.stroke();
                } else if (mereLayout) {
                    // Un seul parent (mère)
                    const mereX = mereLayout.position.x + mereLayout.width / 2;
                    const parentY = mereLayout.position.y + mereLayout.height;

                    ctx.beginPath();
                    ctx.moveTo(mereX, parentY);
                    ctx.lineTo(mereX, childTopY - 20);
                    ctx.lineTo(childCenterX, childTopY - 20);
                    ctx.lineTo(childCenterX, childTopY);
                    ctx.stroke();
                }
            }

            // Dessiner les connexions vers les enfants
            if (node.enfants && node.enfants.length > 0) {
                const parentCenterX = position.x + width / 2;
                const parentBottomY = position.y + height;

                // Trouver les positions des enfants
                const enfantsLayouts = node.enfants.map(enfant =>
                    layouts.find(l => l.node === enfant)
                ).filter(Boolean);

                if (enfantsLayouts.length > 0) {
                    if (enfantsLayouts.length === 1) {
                        // Un seul enfant
                        const enfantLayout = enfantsLayouts[0]!;
                        const enfantX = enfantLayout.position.x + enfantLayout.width / 2;
                        const enfantTopY = enfantLayout.position.y;

                        ctx.beginPath();
                        ctx.moveTo(parentCenterX, parentBottomY);
                        ctx.lineTo(parentCenterX, parentBottomY + 20);
                        ctx.lineTo(enfantX, parentBottomY + 20);
                        ctx.lineTo(enfantX, enfantTopY);
                        ctx.stroke();
                    } else {
                        // Plusieurs enfants
                        const firstEnfant = enfantsLayouts[0]!;
                        const lastEnfant = enfantsLayouts[enfantsLayouts.length - 1]!;

                        const firstX = firstEnfant.position.x + firstEnfant.width / 2;
                        const lastX = lastEnfant.position.x + lastEnfant.width / 2;
                        const childrenY = firstEnfant.position.y;

                        // Ligne verticale du parent
                        ctx.beginPath();
                        ctx.moveTo(parentCenterX, parentBottomY);
                        ctx.lineTo(parentCenterX, parentBottomY + 20);
                        ctx.stroke();

                        // Ligne horizontale entre tous les enfants
                        ctx.beginPath();
                        ctx.moveTo(firstX, parentBottomY + 20);
                        ctx.lineTo(lastX, parentBottomY + 20);
                        ctx.stroke();

                        // Lignes verticales vers chaque enfant
                        enfantsLayouts.forEach(enfantLayout => {
                            if (enfantLayout) {
                                const enfantX = enfantLayout.position.x + enfantLayout.width / 2;
                                ctx.beginPath();
                                ctx.moveTo(enfantX, parentBottomY + 20);
                                ctx.lineTo(enfantX, childrenY);
                                ctx.stroke();
                            }
                        });
                    }
                }
            }
        });
    };

    const drawTree = () => {
        const canvas = canvasRef.current;
        if (!canvas || !treeData) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Redimensionner le canvas
        const container = containerRef.current;
        if (container) {
            canvas.width = container.clientWidth;
            canvas.height = container.clientHeight;
        }

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Sauvegarder l'état du contexte
        ctx.save();

        // Appliquer les transformations
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        // Calculer les positions
        const layouts = calculateTreeLayout(treeData);

        // Dessiner les connexions
        drawConnections(ctx, layouts);

        // Dessiner les cartes
        layouts.forEach(layout => {
            const isHovered = hoveredNode === layout;
            drawCard(ctx, layout, isHovered);
        });

        // Restaurer l'état du contexte
        ctx.restore();
    };

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - offset.x) / scale,
            y: (e.clientY - rect.top - offset.y) / scale
        };
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            const deltaX = e.clientX - lastMousePos.x;
            const deltaY = e.clientY - lastMousePos.y;

            setOffset(prev => ({
                x: prev.x + deltaX,
                y: prev.y + deltaY
            }));

            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else {
            // Vérifier le survol des cartes
            if (treeData) {
                const mousePos = getMousePos(e);
                const layouts = calculateTreeLayout(treeData);

                const hovered = layouts.find(layout =>
                    mousePos.x >= layout.position.x &&
                    mousePos.x <= layout.position.x + layout.width &&
                    mousePos.y >= layout.position.y &&
                    mousePos.y <= layout.position.y + layout.height
                );

                setHoveredNode(hovered || null);
            }
        }
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDragging(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const resetView = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
                {/* En-tête */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900">
                        🌳 Arbre Généalogique
                    </h2>
                    <div className="flex items-center gap-4">
                        {/* Sélecteur de vue */}
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Vue:</label>
                            <select
                                value={viewMode}
                                onChange={(e) => setViewMode(e.target.value as 'tree' | 'list' | 'concentric')}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="tree">🌳 Arbre classique</option>
                                <option value="list">📋 Liste descendance</option>
                                <option value="concentric">⭕ Vue concentrique</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <label className="text-sm text-gray-700">Générations:</label>
                            <select
                                value={maxLevels}
                                onChange={(e) => setMaxLevels(Number(e.target.value))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value={2}>2</option>
                                <option value={3}>3</option>
                                <option value={4}>4</option>
                                <option value={5}>5</option>
                            </select>
                        </div>
                        {viewMode === 'tree' && (
                            <button
                                onClick={resetView}
                                className="text-gray-700 hover:text-gray-900 text-sm px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Centrer
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-700 hover:text-gray-900 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-sm"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Contenu */}
                <div
                    ref={containerRef}
                    className="relative h-[calc(90vh-140px)]"
                >
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-gray-700">Chargement de l'arbre généalogique...</div>
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                            <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
                                ⚠️ {error}
                            </div>
                        </div>
                    )}

                    {treeData && !loading && (
                        <>
                            {viewMode === 'tree' && (
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full cursor-move"
                                    onMouseMove={handleMouseMove}
                                    onMouseDown={handleMouseDown}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                />
                            )}
                            {viewMode === 'list' && (
                                <div className="w-full h-full overflow-y-auto">
                                    <DescendanceListView treeData={treeData} />
                                </div>
                            )}
                            {viewMode === 'concentric' && (
                                <div className="w-full h-full">
                                    <ConcentricGraphView treeData={treeData} />
                                </div>
                            )}
                        </>
                    )}

                    {!treeData && !loading && !error && (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-700">
                            <div className="text-center">
                                <div className="text-4xl mb-4">🌳</div>
                                <p>Aucune donnée généalogique disponible.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contrôles et légende */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded"></div>
                                <span>Mâle vivant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 bg-pink-50 border-2 border-pink-300 rounded"></div>
                                <span>Femelle vivante</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative w-4 h-4 bg-blue-50 border-2 border-blue-300 rounded overflow-hidden">
                                    <div className="absolute inset-0 opacity-30"
                                         style={{
                                             background: 'repeating-linear-gradient(45deg, transparent, transparent 2px, #000 2px, #000 3px)'
                                         }}>
                                    </div>
                                </div>
                                <span>Décédé (hachuré)</span>
                            </div>
                        </div>
                        <div className="text-xs text-gray-500">
                            {viewMode === 'tree' && '🖱️ Cliquez-glissez pour déplacer • 🔍 Molette pour zoomer'}
                            {viewMode === 'list' && '📋 Descendance organisée par génération'}
                            {viewMode === 'concentric' && '⭕ Vue radiale • Cliquez-glissez et zoomez • Survolez pour détails'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FamilyTree;