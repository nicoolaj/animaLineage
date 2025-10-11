import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';

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

interface ConcentricGraphViewProps {
    treeData: FamilyTreeNode;
}

interface PositionedNode {
    node: FamilyTreeNode;
    x: number;
    y: number;
    angle: number;
    radius: number;
    angleStart: number;
    angleEnd: number;
    generation: number;
}

const ConcentricGraphView: React.FC<ConcentricGraphViewProps> = ({ treeData }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredNode, setHoveredNode] = useState<PositionedNode | null>(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

    // Fonction de calcul des positions mémorisée
    const calculateConcentricPositions = useCallback((rootNode: FamilyTreeNode): PositionedNode[] => {
        const positions: PositionedNode[] = [];
        const centerRadius = 60;
        const ringThickness = 80;
        const maxGenerations = 5;

        // Ajouter le nœud central
        positions.push({
            node: rootNode,
            x: 0,
            y: 0,
            angle: 0,
            radius: 0,
            angleStart: 0,
            angleEnd: 2 * Math.PI,
            generation: 0
        });

        // Fonction récursive pour positionner les descendants
        const positionDescendants = (
            node: FamilyTreeNode,
            generation: number,
            angleStart: number,
            angleEnd: number,
            parentRadius: number
        ) => {
            if (generation >= maxGenerations || !node || !node.enfants || node.enfants.length === 0) {
                return;
            }

            const currentRadius = centerRadius + (generation * ringThickness);
            const angleRange = angleEnd - angleStart;
            const anglePerChild = angleRange / node.enfants.length;

            node.enfants.forEach((enfant, index) => {
                if (!enfant || !enfant.animal) return;

                const childAngleStart = angleStart + (index * anglePerChild);
                const childAngleEnd = angleStart + ((index + 1) * anglePerChild);
                const childAngle = (childAngleStart + childAngleEnd) / 2;

                const x = Math.cos(childAngle) * currentRadius;
                const y = Math.sin(childAngle) * currentRadius;

                positions.push({
                    node: enfant,
                    x,
                    y,
                    angle: childAngle,
                    radius: currentRadius,
                    angleStart: childAngleStart,
                    angleEnd: childAngleEnd,
                    generation
                });

                // Récursion pour la génération suivante
                positionDescendants(enfant, generation + 1, childAngleStart, childAngleEnd, currentRadius);
            });
        };

        // Commencer avec les enfants directs du nœud racine
        if (rootNode.enfants && rootNode.enfants.length > 0) {
            positionDescendants(rootNode, 1, 0, 2 * Math.PI, centerRadius);
        }

        return positions;
    }, []);

    // Mémoriser les positions calculées pour éviter les recalculs inutiles
    const positions = useMemo(() => {
        return calculateConcentricPositions(treeData);
    }, [treeData, calculateConcentricPositions]);

    useEffect(() => {
        if (treeData) {
            drawConcentricGraph();
        }
    }, [treeData, scale, offset, hoveredNode, positions]);

    // Gestionnaire d'événement wheel avec preventDefault approprié
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheelEvent = (e: WheelEvent) => {
            e.preventDefault();
            const scaleChange = e.deltaY > 0 ? 0.9 : 1.1;
            setScale(prev => Math.max(0.3, Math.min(2, prev * scaleChange)));
        };

        canvas.addEventListener('wheel', handleWheelEvent, { passive: false });

        return () => {
            canvas.removeEventListener('wheel', handleWheelEvent);
        };
    }, []);

    const getQualityFromAnimal = (animal: Animal): string => {
        // Simulation de qualité basée sur le statut et d'autres critères
        if (animal.statut === 'mort') return 'MOYEN';
        if (animal.sexe === 'M' && animal.nom) return 'EXCELLENT';
        if (animal.sexe === 'F' && animal.nom) return 'BONNE';
        return 'MOYEN';
    };

    const getQualityColor = (quality: string): string => {
        switch (quality) {
            case 'EXCELLENT': return '#10b981'; // Green
            case 'BONNE': return '#3b82f6'; // Blue
            case 'MOYEN': return '#f59e0b'; // Orange
            default: return '#6b7280'; // Gray
        }
    };

    const getLineageColor = (generation: number, childIndex: number): string => {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
            '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
            '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
            '#ec4899', '#f43f5e'
        ];
        return colors[(generation * 3 + childIndex) % colors.length];
    };


    const drawConcentricGraph = () => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container || !treeData) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Redimensionner le canvas
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Effacer le canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Sauvegarder l'état du contexte
        ctx.save();

        // Appliquer les transformations
        ctx.translate(centerX + offset.x, centerY + offset.y);
        ctx.scale(scale, scale);

        // Utiliser les positions mémorisées

        // Dessiner les anneaux de génération
        drawGenerationRings(ctx, positions);

        // Dessiner les connexions
        drawConnections(ctx, positions);

        // Dessiner les nœuds
        positions.forEach(pos => {
            drawConcentricNode(ctx, pos, pos === hoveredNode);
        });

        // Dessiner la légende
        drawLegend(ctx, canvas);

        // Restaurer l'état du contexte
        ctx.restore();
    };

    const drawGenerationRings = (ctx: CanvasRenderingContext2D, positions: PositionedNode[]) => {
        const generations = [...new Set(positions.map(p => p.generation))].filter(g => g > 0);
        const centerRadius = 60;
        const ringThickness = 80;

        generations.forEach(gen => {
            const radius = centerRadius + (gen * ringThickness);
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
        });
    };

    const drawConnections = (ctx: CanvasRenderingContext2D, positions: PositionedNode[]) => {
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;

        positions.forEach(pos => {
            if (pos.node.enfants && pos.node.enfants.length > 0) {
                pos.node.enfants.forEach(enfant => {
                    const childPos = positions.find(p => p.node.animal.id === enfant.animal.id);
                    if (childPos) {
                        ctx.beginPath();
                        ctx.moveTo(pos.x, pos.y);
                        ctx.lineTo(childPos.x, childPos.y);
                        ctx.stroke();
                    }
                });
            }
        });
    };

    const drawConcentricNode = (ctx: CanvasRenderingContext2D, pos: PositionedNode, isHovered: boolean) => {
        const { node, x, y, generation } = pos;
        const { animal } = node;

        const radius = generation === 0 ? 40 : Math.max(20, 30 - generation * 2);
        const quality = getQualityFromAnimal(animal);
        const qualityColor = getQualityColor(quality);

        // Effet hover
        if (isHovered) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 15;
        }

        // Dessiner le secteur de lignée (pour les générations > 0)
        if (generation > 0) {
            const lineageColor = getLineageColor(generation, 0);
            ctx.fillStyle = lineageColor + '20'; // Transparent
            ctx.beginPath();
            ctx.arc(0, 0, pos.radius + 10, pos.angleStart, pos.angleEnd);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        }

        // Cercle principal
        ctx.fillStyle = qualityColor;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fill();

        // Bordure selon le sexe
        ctx.strokeStyle = animal.sexe === 'M' ? '#3b82f6' : '#ec4899';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Hachurage pour les décédés
        if (animal.statut === 'mort') {
            ctx.save();
            ctx.clip();
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 2;
            for (let i = -radius; i <= radius; i += 6) {
                ctx.beginPath();
                ctx.moveTo(x + i - radius, y - radius);
                ctx.lineTo(x + i + radius, y + radius);
                ctx.stroke();
            }
            ctx.restore();
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Texte
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${Math.max(8, 12 - generation)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Identifiant (tronqué si nécessaire)
        let displayText = animal.identifiant_officiel;
        if (displayText.length > 8) {
            displayText = displayText.substring(0, 6) + '...';
        }
        ctx.fillText(displayText, x, y - 4);

        // Sexe
        ctx.font = `${Math.max(12, 16 - generation)}px sans-serif`;
        ctx.fillText(animal.sexe === 'M' ? '♂' : '♀', x, y + 8);
    };

    const drawLegend = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        const legendX = -canvas.width / 2 + 20;
        const legendY = -canvas.height / 2 + 20;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(legendX, legendY, 200, 120);
        ctx.strokeStyle = '#d1d5db';
        ctx.strokeRect(legendX, legendY, 200, 120);

        ctx.fillStyle = '#374151';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Légende', legendX + 10, legendY + 20);

        ctx.font = '10px sans-serif';

        // Qualités
        const qualities = [
            { name: 'Excellent', color: '#10b981' },
            { name: 'Bonne', color: '#3b82f6' },
            { name: 'Moyen', color: '#f59e0b' }
        ];

        qualities.forEach((q, i) => {
            ctx.fillStyle = q.color;
            ctx.beginPath();
            ctx.arc(legendX + 20, legendY + 40 + (i * 15), 6, 0, 2 * Math.PI);
            ctx.fill();
            ctx.fillStyle = '#374151';
            ctx.fillText(q.name, legendX + 35, legendY + 45 + (i * 15));
        });

        // Sexes
        ctx.fillText('♂ Mâle (bordure bleue)', legendX + 10, legendY + 100);
        ctx.fillText('♀ Femelle (bordure rose)', legendX + 10, legendY + 115);
    };

    const getMousePos = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };

        const rect = canvas.getBoundingClientRect();
        return {
            x: ((e.clientX - rect.left) - canvas.width / 2 - offset.x) / scale,
            y: ((e.clientY - rect.top) - canvas.height / 2 - offset.y) / scale
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
            // Vérifier le survol des nœuds
            const mousePos = getMousePos(e);

            const hovered = positions.find(pos => {
                const distance = Math.sqrt(
                    Math.pow(mousePos.x - pos.x, 2) + Math.pow(mousePos.y - pos.y, 2)
                );
                const radius = pos.generation === 0 ? 40 : Math.max(20, 30 - pos.generation * 2);
                return distance <= radius;
            });

            setHoveredNode(hovered || null);
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
        <div className="relative h-full">
            {/* Contrôles */}
            <div className="absolute top-4 right-4 z-10 flex gap-2">
                <button
                    onClick={resetView}
                    className="bg-white/90 hover:bg-white text-gray-700 px-3 py-1 rounded border shadow text-sm"
                >
                    Centrer
                </button>
            </div>

            {/* Canvas */}
            <div ref={containerRef} className="w-full h-full">
                <canvas
                    ref={canvasRef}
                    className="w-full h-full cursor-move"
                    onMouseMove={handleMouseMove}
                    onMouseDown={handleMouseDown}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>

            {/* Tooltip */}
            {hoveredNode && (
                <div className="absolute top-4 left-4 bg-white/95 border border-gray-200 rounded-lg p-3 shadow-lg text-sm max-w-xs z-10">
                    <div className="font-semibold text-gray-800">
                        {hoveredNode.node.animal.identifiant_officiel}
                    </div>
                    {hoveredNode.node.animal.nom && (
                        <div className="text-gray-600 italic">
                            "{hoveredNode.node.animal.nom}"
                        </div>
                    )}
                    <div className="mt-1 text-xs text-gray-600">
                        <div>Sexe: {hoveredNode.node.animal.sexe === 'M' ? 'Mâle ♂' : 'Femelle ♀'}</div>
                        <div>Race: {hoveredNode.node.animal.race_nom}</div>
                        <div>Génération: {hoveredNode.generation === 0 ? 'Souche' : hoveredNode.generation}</div>
                        <div>Qualité: {getQualityFromAnimal(hoveredNode.node.animal)}</div>
                        <div>Statut: {hoveredNode.node.animal.statut === 'vivant' ? 'Vivant' : 'Décédé'}</div>
                        {hoveredNode.node.enfants && hoveredNode.node.enfants.length > 0 && (
                            <div>Descendants: {hoveredNode.node.enfants.length}</div>
                        )}
                    </div>
                </div>
            )}

            {/* Instructions */}
            <div className="absolute bottom-4 left-4 bg-white/90 text-xs text-gray-600 p-2 rounded border">
                🖱️ Cliquez-glissez pour déplacer • 🔍 Molette pour zoomer • Survolez les nœuds pour plus d'infos
            </div>
        </div>
    );
};

export default ConcentricGraphView;