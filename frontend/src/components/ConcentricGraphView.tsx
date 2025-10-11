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

        // Fonction pour extraire SEULEMENT les vrais descendants de l'animal central
        const extractTrueDescendants = (jsonData: any, centralAnimalId: number): Array<{animal: any, generation: number}> => {
            const descendants: Array<{animal: any, generation: number}> = [];
            const knownDescendants = new Set<number>();
            const processedAnimals = new Set<number>(); // Pour éviter les doublons dans descendants
            knownDescendants.add(centralAnimalId); // L'animal central est l'ancêtre

            // Fonction récursive pour parcourir tout le JSON
            const traverse = (obj: any) => {
                if (!obj || typeof obj !== 'object') return;

                // Si c'est un objet avec animal et level négatif
                if (obj.animal && obj.level && obj.level < 0) {
                    const animalId = obj.animal.id;
                    const pereId = obj.animal.pere_id;
                    const mereId = obj.animal.mere_id;

                    // Vérifier si cet animal a un parent qui est déjà dans nos descendants connus
                    const isDescendant = (pereId && knownDescendants.has(pereId)) ||
                                       (mereId && knownDescendants.has(mereId));

                    // Debug pour Theodore et ses enfants
                    if (animalId === obj.animal.id) {
                        console.log(`🔍 Examen de ${obj.animal.identifiant_officiel}:`, {
                            animalId,
                            pereId,
                            mereId,
                            centralAnimalId,
                            pereEstCentral: pereId === centralAnimalId,
                            mereEstCentrale: mereId === centralAnimalId,
                            pereInKnown: pereId && knownDescendants.has(pereId),
                            mereInKnown: mereId && knownDescendants.has(mereId),
                            knownDescendants: Array.from(knownDescendants),
                            isDescendant
                        });
                    }

                    if (isDescendant && !processedAnimals.has(animalId)) {
                        // Calculer la vraie génération : si l'un des parents est l'animal central, c'est génération 1
                        let realGeneration = Math.abs(obj.level);
                        if (pereId === centralAnimalId || mereId === centralAnimalId) {
                            realGeneration = 1; // Enfant direct
                        }

                        descendants.push({
                            animal: obj.animal,
                            generation: realGeneration
                        });
                        knownDescendants.add(animalId); // Ajouter cet animal aux descendants connus
                        processedAnimals.add(animalId); // Marquer comme traité pour éviter les doublons
                        console.log(`✅ Vrai descendant: ${obj.animal.identifiant_officiel} (génération ${realGeneration}, level original: ${Math.abs(obj.level)}) - Parents: père=${pereId}, mère=${mereId}`);
                    } else if (obj.level < 0) {
                        console.log(`❌ Ignoré: ${obj.animal.identifiant_officiel} (génération ${Math.abs(obj.level)}) - Parents: père=${pereId}, mère=${mereId} - isDescendant=${isDescendant}, alreadyProcessed=${processedAnimals.has(animalId)}`);
                    }
                }

                // Parcourir récursivement toutes les propriétés
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        const value = obj[key];
                        if (Array.isArray(value)) {
                            value.forEach(item => traverse(item));
                        } else if (typeof value === 'object') {
                            traverse(value);
                        }
                    }
                }
            };

            console.log(`📊 Analyse du JSON pour extraire les VRAIS descendants de l'animal ${centralAnimalId}...`);
            console.log(`🎯 Animal central ajouté aux knownDescendants:`, centralAnimalId);

            // Faire plusieurs passes pour s'assurer qu'on trouve tous les descendants
            let previousCount = -1;
            let currentCount = 0;
            let passCount = 0;

            while (currentCount !== previousCount && passCount < 10) { // Limite de sécurité
                previousCount = currentCount;
                traverse(jsonData);
                currentCount = descendants.length;
                passCount++;
                console.log(`🔄 Passe ${passCount}: ${currentCount} descendants trouvés`);
            }

            console.log(`✅ Total VRAIS descendants trouvés: ${descendants.length}`);
            return descendants;
        };

        // Extraire SEULEMENT les vrais descendants du JSON
        const rawDescendants = extractTrueDescendants(rootNode, rootNode.animal.id);

        // Convertir au format FamilyTreeNode
        const allDescendants = rawDescendants.map(desc => ({
            animal: desc.animal,
            level: desc.generation,
            enfants: undefined // On s'en fiche des enfants pour l'affichage concentrique
        }));

        console.log(`Vue concentrique - Descendants collectés: ${allDescendants.length}`);

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

        // Organiser les descendants par génération et construire la hiérarchie
        const descendantsByGeneration = allDescendants.reduce((acc, descendant) => {
            const gen = descendant.level;
            if (!acc[gen]) acc[gen] = [];
            acc[gen].push(descendant);
            return acc;
        }, {} as Record<number, FamilyTreeNode[]>);

        // Fonction pour trouver le parent d'un descendant dans la génération précédente
        const findParent = (descendant: FamilyTreeNode, rawDescendants: Array<{animal: any, generation: number}>) => {
            const parentGeneration = descendant.level - 1;
            if (parentGeneration === 0) return null; // Parent est l'animal central

            // Chercher dans les données brutes qui est le parent
            return rawDescendants.find(parent =>
                parent.generation === parentGeneration &&
                (descendant.animal.pere_id === parent.animal.id || descendant.animal.mere_id === parent.animal.id)
            );
        };

        // Créer les secteurs hiérarchiques
        let currentAngle = 0;

        // Niveau 1 : Diviser le cercle complet entre les enfants directs
        const niveau1 = descendantsByGeneration[1] || [];
        const anglePerEnfant = (2 * Math.PI) / niveau1.length;

        niveau1.forEach((enfant, index) => {
            const secteurStart = index * anglePerEnfant;
            const secteurEnd = (index + 1) * anglePerEnfant;
            const secteurMilieu = (secteurStart + secteurEnd) / 2;

            // Position du niveau 1
            const radius1 = centerRadius + ringThickness;
            positions.push({
                node: enfant,
                x: 0, // On utilisera les angles pour dessiner les secteurs
                y: 0,
                angle: secteurMilieu,
                radius: radius1,
                angleStart: secteurStart,
                angleEnd: secteurEnd,
                generation: 1
            });

            // Niveau 2+ : Subdiviser le secteur parent
            for (let gen = 2; gen <= maxGenerations && descendantsByGeneration[gen]; gen++) {
                const descendantsThisGen = descendantsByGeneration[gen].filter(desc => {
                    // Vérifier si ce descendant appartient à la lignée de cet enfant niveau 1
                    return isDescendantOf(desc, enfant, rawDescendants);
                });

                if (descendantsThisGen.length > 0) {
                    const sousAngleParDescendant = (secteurEnd - secteurStart) / descendantsThisGen.length;

                    descendantsThisGen.forEach((descendant, subIndex) => {
                        const sousStart = secteurStart + (subIndex * sousAngleParDescendant);
                        const sousEnd = secteurStart + ((subIndex + 1) * sousAngleParDescendant);
                        const sousMilieu = (sousStart + sousEnd) / 2;

                        const radiusGen = centerRadius + (gen * ringThickness);

                        positions.push({
                            node: descendant,
                            x: 0,
                            y: 0,
                            angle: sousMilieu,
                            radius: radiusGen,
                            angleStart: sousStart,
                            angleEnd: sousEnd,
                            generation: gen
                        });
                    });
                }
            }
        });

        // Fonction helper pour vérifier si un descendant appartient à une lignée
        function isDescendantOf(descendant: FamilyTreeNode, ancestor: FamilyTreeNode, allDescendants: Array<{animal: any, generation: number}>): boolean {
            if (descendant.level <= ancestor.level) return false;

            let currentDesc = descendant;

            // Remonter la lignée jusqu'à trouver l'ancêtre ou atteindre le niveau 1
            while (currentDesc.level > 1) {
                const parent = allDescendants.find(d =>
                    d.generation === currentDesc.level - 1 &&
                    (currentDesc.animal.pere_id === d.animal.id || currentDesc.animal.mere_id === d.animal.id)
                );

                if (!parent) break;

                if (parent.animal.id === ancestor.animal.id) {
                    return true;
                }

                currentDesc = {animal: parent.animal, level: parent.generation, enfants: undefined};
            }

            return false;
        }

        console.log(`Vue concentrique - Positions calculées: ${positions.length} (${positions.length - 1} descendants + 1 racine)`);
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
        const { node, generation } = pos;
        const { animal } = node;

        const quality = getQualityFromAnimal(animal);
        const qualityColor = getQualityColor(quality);

        // Effet hover
        if (isHovered) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 15;
        }

        if (generation === 0) {
            // Animal central : dessiner comme un disque plein
            const radius = 50;
            ctx.fillStyle = animal.sexe === 'M' ? '#dbeafe' : '#fce7f3'; // bg-blue-50 et bg-pink-50
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, 2 * Math.PI);
            ctx.fill();

            // Bordure selon le sexe
            ctx.strokeStyle = animal.sexe === 'M' ? '#bfdbfe' : '#fbcfe8'; // border-blue-200 et border-pink-200
            ctx.lineWidth = 4;
            ctx.stroke();

            // Hachurage pour l'animal central décédé
            if (animal.statut === 'mort') {
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, radius, 0, 2 * Math.PI);
                ctx.clip();

                // Utiliser une couleur de hachurage basée sur le sexe
                ctx.strokeStyle = animal.sexe === 'M' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(236, 72, 153, 0.6)';
                ctx.lineWidth = 2;

                // Dessiner des lignes diagonales
                const step = 8;
                for (let i = -radius; i <= radius; i += step) {
                    ctx.beginPath();
                    ctx.moveTo(i, -radius);
                    ctx.lineTo(i, radius);
                    ctx.stroke();
                }

                ctx.restore();
            }

            // Texte central
            ctx.fillStyle = '#1F2937'; // text-gray-800
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let displayText = animal.identifiant_officiel;
            if (displayText.length > 10) {
                displayText = displayText.substring(0, 8) + '...';
            }
            ctx.fillText(displayText, 0, -5);

            if (animal.nom) {
                ctx.font = '10px sans-serif';
                ctx.fillText(`"${animal.nom}"`, 0, 8);
            }

            // Année de naissance pour l'animal central
            if (animal.date_naissance) {
                const birthYear = new Date(animal.date_naissance).getFullYear();
                ctx.font = '9px sans-serif';
                ctx.fillStyle = '#4B5563'; // text-gray-600 pour l'année
                ctx.fillText(`(${birthYear})`, 0, animal.nom ? 18 : 15);

                // Remettre la couleur principale pour le sexe
                ctx.fillStyle = '#1F2937'; // text-gray-800
            }

            ctx.font = '18px sans-serif';
            ctx.fillText(animal.sexe === 'M' ? '♂' : '♀', 0, animal.date_naissance ? 30 : 25);

        } else {
            // Descendants : dessiner comme des secteurs de camembert
            const innerRadius = generation === 1 ? 60 : 60 + ((generation - 1) * 80);
            const outerRadius = innerRadius + 80;

            // Couleur du secteur selon le sexe
            const sectorColor = animal.sexe === 'M' ? '#dbeafe' : '#fce7f3'; // bg-blue-50 et bg-pink-50
            ctx.fillStyle = sectorColor;

            // Dessiner le secteur
            ctx.beginPath();
            ctx.arc(0, 0, innerRadius, pos.angleStart, pos.angleEnd);
            ctx.arc(0, 0, outerRadius, pos.angleEnd, pos.angleStart, true);
            ctx.closePath();
            ctx.fill();

            // Bordure du secteur
            ctx.strokeStyle = animal.sexe === 'M' ? '#bfdbfe' : '#fbcfe8'; // border-blue-200 et border-pink-200
            ctx.lineWidth = 2;
            ctx.stroke();

            // Hachurage pour les décédés
            if (animal.statut === 'mort') {
                ctx.save();
                ctx.clip();
                // Utiliser une couleur de hachurage basée sur le sexe
                ctx.strokeStyle = animal.sexe === 'M' ? 'rgba(59, 130, 246, 0.6)' : 'rgba(236, 72, 153, 0.6)';
                ctx.lineWidth = 1;

                // Dessiner des lignes diagonales dans le secteur
                const step = 8;
                for (let r = innerRadius; r <= outerRadius; r += step) {
                    ctx.beginPath();
                    ctx.arc(0, 0, r, pos.angleStart, pos.angleEnd);
                    ctx.stroke();
                }

                ctx.restore();
            }

            // Texte dans le secteur
            const textRadius = (innerRadius + outerRadius) / 2;
            const textAngle = (pos.angleStart + pos.angleEnd) / 2;
            const textX = Math.cos(textAngle) * textRadius;
            const textY = Math.sin(textAngle) * textRadius;

            ctx.save();
            ctx.translate(textX, textY);
            ctx.rotate(textAngle);

            // Ajuster l'orientation du texte pour qu'il soit lisible
            if (textAngle > Math.PI / 2 && textAngle < 3 * Math.PI / 2) {
                ctx.rotate(Math.PI);
            }

            ctx.fillStyle = '#1F2937'; // text-gray-800
            ctx.font = `bold ${Math.max(8, 14 - generation * 2)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Identifiant
            let displayText = animal.identifiant_officiel;
            if (displayText.length > 12) {
                displayText = displayText.substring(0, 10) + '...';
            }
            ctx.fillText(displayText, 0, animal.nom ? -12 : -8);

            // Nom de l'animal (si disponible)
            if (animal.nom) {
                ctx.font = `${Math.max(6, 10 - generation * 1)}px sans-serif`;
                ctx.fillStyle = '#4B5563'; // text-gray-600 pour le nom
                let nomText = `"${animal.nom}"`;
                if (nomText.length > 15) {
                    nomText = nomText.substring(0, 13) + '..."';
                }
                ctx.fillText(nomText, 0, -2);

                // Remettre la couleur principale pour le sexe
                ctx.fillStyle = '#1F2937'; // text-gray-800
            }

            // Année de naissance (si disponible)
            if (animal.date_naissance) {
                const birthYear = new Date(animal.date_naissance).getFullYear();
                ctx.font = `${Math.max(6, 8 - generation * 1)}px sans-serif`;
                ctx.fillStyle = '#4B5563'; // text-gray-600 pour l'année
                ctx.fillText(`(${birthYear})`, 0, animal.nom ? 8 : 5);

                // Remettre la couleur principale pour le sexe
                ctx.fillStyle = '#1F2937'; // text-gray-800
            }

            // Sexe
            ctx.font = `${Math.max(12, 16 - generation * 2)}px sans-serif`;
            ctx.fillText(animal.sexe === 'M' ? '♂' : '♀', 0, animal.date_naissance ? 18 : 8);

            ctx.restore();
        }

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
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
                if (pos.generation === 0) {
                    // Pour l'animal central : vérifier si on est dans le cercle
                    const distance = Math.sqrt(Math.pow(mousePos.x, 2) + Math.pow(mousePos.y, 2));
                    return distance <= 50;
                } else {
                    // Pour les secteurs : vérifier si on est dans le secteur
                    const mouseDistance = Math.sqrt(Math.pow(mousePos.x, 2) + Math.pow(mousePos.y, 2));
                    const mouseAngle = Math.atan2(mousePos.y, mousePos.x);

                    // Normaliser l'angle entre 0 et 2π
                    const normalizedMouseAngle = mouseAngle < 0 ? mouseAngle + 2 * Math.PI : mouseAngle;

                    const innerRadius = pos.generation === 1 ? 60 : 60 + ((pos.generation - 1) * 80);
                    const outerRadius = innerRadius + 80;

                    // Vérifier si on est dans la bonne tranche de distance
                    const inRadiusRange = mouseDistance >= innerRadius && mouseDistance <= outerRadius;

                    // Vérifier si on est dans le bon secteur angulaire
                    let inAngleRange = false;
                    if (pos.angleStart <= pos.angleEnd) {
                        inAngleRange = normalizedMouseAngle >= pos.angleStart && normalizedMouseAngle <= pos.angleEnd;
                    } else {
                        // Cas où le secteur traverse le 0
                        inAngleRange = normalizedMouseAngle >= pos.angleStart || normalizedMouseAngle <= pos.angleEnd;
                    }

                    return inRadiusRange && inAngleRange;
                }
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
                        {hoveredNode.node.animal.date_naissance && (
                            <div>Né le: {new Date(hoveredNode.node.animal.date_naissance).toLocaleDateString('fr-FR')}</div>
                        )}
                        {hoveredNode.node.animal.date_deces && (
                            <div>Décédé le: {new Date(hoveredNode.node.animal.date_deces).toLocaleDateString('fr-FR')}</div>
                        )}
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