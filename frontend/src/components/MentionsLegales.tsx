import React from 'react';

interface MentionsLegalesProps {
    onRetour?: () => void;
}

const MentionsLegales: React.FC<MentionsLegalesProps> = ({ onRetour }) => {
    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-6">
                    <button
                        onClick={onRetour}
                        className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors duration-200 mb-4"
                    >
                        ← Retour à l'accueil
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Mentions légales</h1>
                    <p className="text-gray-400">Informations légales relatives au site AnimaLineage</p>
                </div>

                <div className="bg-white rounded-lg p-6 sm:p-8 space-y-8 shadow-sm border border-gray-200">
                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Éditeur du Site</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Ce site est édité par <strong>Nicolas Jalibert</strong>.</p>
                            <p><strong>Responsable de la publication :</strong> Nicolas Jalibert</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Hébergement</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Ce site est hébergé par la société <strong>OVH SAS</strong>.</p>
                            <p><strong>Adresse :</strong> 2 rue Kellermann - 59100 Roubaix - France</p>
                            <p><strong>Téléphone :</strong> 1007</p>
                            <p><strong>Site web :</strong> <a href="https://www.ovh.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">www.ovh.com</a></p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Propriété Intellectuelle</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>L'ensemble des contenus de ce site (textes, images, vidéos, etc.) est la propriété de <strong>Nicolas Jalibert</strong>, sauf mention contraire.</p>
                            <p>Toute reproduction ou représentation totale ou partielle de ce site par quelque procédé que ce soit, sans l'autorisation expresse de l'éditeur du site, est interdite et constituerait une contrefaçon.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Données Personnelles</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Ce site peut être amené à collecter des données personnelles. Pour plus d'informations sur la manière dont vos données sont collectées et traitées, veuillez consulter notre <strong>Politique de Confidentialité</strong>.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Responsabilité</h2>
                        <div className="text-gray-300 space-y-2">
                            <p><strong>Nicolas Jalibert</strong> s'efforce de fournir sur ce site des informations aussi précises que possible.</p>
                            <p>Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers partenaires qui lui fournissent ces informations.</p>
                        </div>
                    </section>

                    <div className="text-sm text-gray-400 pt-6 border-t border-gray-600">
                        <p>Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MentionsLegales;