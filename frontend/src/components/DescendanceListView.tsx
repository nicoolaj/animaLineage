import React, { useEffect, useRef } from 'react';

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

interface DescendanceListViewProps {
    treeData: FamilyTreeNode;
}

const DescendanceListView: React.FC<DescendanceListViewProps> = ({ treeData }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('fr-FR');
    };

    // Gestionnaire d'événement wheel pour empêcher le zoom du navigateur
    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleWheelEvent = (e: WheelEvent) => {
            // Ne pas empêcher le scroll vertical de la liste, seulement le zoom
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
            }
        };

        container.addEventListener('wheel', handleWheelEvent, { passive: false });

        return () => {
            container.removeEventListener('wheel', handleWheelEvent);
        };
    }, []);

    const collectDescendants = (node: FamilyTreeNode): FamilyTreeNode[] => {
        const descendants: FamilyTreeNode[] = [];
        const visited = new Set<number>();

        const traverse = (currentNode: FamilyTreeNode, generation: number) => {
            if (!currentNode || !currentNode.animal || visited.has(currentNode.animal.id)) return;

            if (currentNode.enfants && currentNode.enfants.length > 0) {
                currentNode.enfants.forEach(enfant => {
                    if (enfant && enfant.animal && !visited.has(enfant.animal.id)) {
                        // Marquer comme visité AVANT de l'ajouter à la liste
                        visited.add(enfant.animal.id);

                        const enfantWithGeneration = {
                            ...enfant,
                            level: generation
                        };
                        descendants.push(enfantWithGeneration);

                        // Récursion pour collecter toute la descendance
                        traverse(enfant, generation + 1);
                    }
                });
            }
        };

        // Commencer la collecte à partir de la génération 1 (enfants directs)
        // Ne pas marquer le nœud racine comme visité
        traverse(node, 1);

        // Debug: log pour vérifier la collecte
        console.log(`Collecte descendance - Total: ${descendants.length}`, descendants.map(d => ({
            id: d.animal.id,
            nom: d.animal.identifiant_officiel,
            generation: d.level,
            enfants: d.enfants?.length || 0
        })));

        // Vérifier s'il y a des doublons
        const uniqueIds = new Set(descendants.map(d => d.animal.id));
        if (uniqueIds.size !== descendants.length) {
            console.warn(`⚠️ Doublons détectés! ${descendants.length} descendants mais seulement ${uniqueIds.size} IDs uniques`);
        }

        return descendants;
    };

    const descendants = collectDescendants(treeData);

    if (descendants.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                    <div className="text-4xl mb-4">🌱</div>
                    <p>Aucune descendance répertoriée pour cet animal.</p>
                </div>
            </div>
        );
    }

    const groupedByGeneration = descendants.reduce((acc, descendant) => {
        const gen = descendant.level;
        if (!acc[gen]) acc[gen] = [];
        acc[gen].push(descendant);
        return acc;
    }, {} as Record<number, FamilyTreeNode[]>);

    return (
        <div ref={containerRef} className="p-4 space-y-6">
            <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800">
                    📋 Vue Liste - Descendance de {treeData.animal.identifiant_officiel}
                    {treeData.animal.nom && ` "${treeData.animal.nom}"`}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                    {descendants.length} descendant{descendants.length > 1 ? 's' : ''} sur {Object.keys(groupedByGeneration).length} génération{Object.keys(groupedByGeneration).length > 1 ? 's' : ''}
                </p>
            </div>

            {Object.entries(groupedByGeneration)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([generation, animals]) => (
                    <div key={generation} className="mb-8">
                        <h4 className="text-md font-semibold text-gray-700 mb-4 flex items-center">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm mr-3">
                                Génération {generation}
                            </span>
                            <span className="text-sm text-gray-500">
                                ({animals.length} individu{animals.length > 1 ? 's' : ''})
                            </span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {animals.map((descendant) => {
                                const { animal } = descendant;
                                const isDeceased = animal.statut === 'mort';

                                return (
                                    <div
                                        key={animal.id}
                                        className={`border-2 rounded-lg p-4 ${
                                            animal.sexe === 'M'
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-pink-50 border-pink-200'
                                        } ${isDeceased ? 'opacity-75' : ''} hover:shadow-md transition-shadow`}
                                    >
                                        {isDeceased && (
                                            <div className="absolute top-2 right-2">
                                                <span className="text-red-600 text-lg">†</span>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mb-3">
                                            <div className="font-semibold text-gray-800">
                                                {animal.identifiant_officiel}
                                            </div>
                                            <div className="text-2xl">
                                                {animal.sexe === 'M' ? '♂️' : '♀️'}
                                            </div>
                                        </div>

                                        {animal.nom && (
                                            <div className="text-sm text-gray-600 mb-2 italic">
                                                "{animal.nom}"
                                            </div>
                                        )}

                                        <div className="space-y-1 text-xs text-gray-700">
                                            <div>
                                                <span className="font-medium">Race:</span> {animal.race_nom}
                                            </div>

                                            {animal.date_naissance && (
                                                <div>
                                                    <span className="font-medium">Né le:</span> {formatDate(animal.date_naissance)}
                                                </div>
                                            )}

                                            {animal.date_deces && (
                                                <div className="text-red-600">
                                                    <span className="font-medium">Décédé le:</span> {formatDate(animal.date_deces)}
                                                </div>
                                            )}

                                            <div className="mt-2 pt-2 border-t border-gray-200">
                                                <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                                    animal.statut === 'vivant'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {animal.statut === 'vivant' ? 'Vivant' : 'Décédé'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Informations sur la descendance de cet individu */}
                                        {descendant.enfants && descendant.enfants.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-gray-200">
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-medium">Descendance:</span> {descendant.enfants.length} enfant{descendant.enfants.length > 1 ? 's' : ''}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}

            {/* Statistiques de descendance */}
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h5 className="font-semibold text-gray-700 mb-3">📊 Statistiques de descendance</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-center">
                        <div className="font-bold text-lg text-blue-600">
                            {descendants.filter(d => d.animal.sexe === 'M').length}
                        </div>
                        <div className="text-gray-600">Mâles</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-pink-600">
                            {descendants.filter(d => d.animal.sexe === 'F').length}
                        </div>
                        <div className="text-gray-600">Femelles</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-green-600">
                            {descendants.filter(d => d.animal.statut === 'vivant').length}
                        </div>
                        <div className="text-gray-600">Vivants</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold text-lg text-gray-600">
                            {descendants.filter(d => d.animal.statut === 'mort').length}
                        </div>
                        <div className="text-gray-600">Décédés</div>
                    </div>
                </div>

                {/* Répartition par race */}
                {(() => {
                    const raceCount = descendants.reduce((acc, d) => {
                        acc[d.animal.race_nom] = (acc[d.animal.race_nom] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    return Object.keys(raceCount).length > 1 ? (
                        <div className="mt-4">
                            <div className="font-medium text-gray-700 mb-2">Répartition par race:</div>
                            <div className="flex flex-wrap gap-2">
                                {Object.entries(raceCount).map(([race, count]) => (
                                    <span
                                        key={race}
                                        className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                                    >
                                        {race}: {count}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : null;
                })()}
            </div>
        </div>
    );
};

export default DescendanceListView;