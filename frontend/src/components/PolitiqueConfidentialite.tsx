import React from 'react';

interface PolitiqueConfidentialiteProps {
    onRetour?: () => void;
}

const PolitiqueConfidentialite: React.FC<PolitiqueConfidentialiteProps> = ({ onRetour }) => {
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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Politique de Confidentialité</h1>
                    <p className="text-gray-400">Information sur le traitement de vos données personnelles</p>
                    <p className="text-sm text-gray-500 mt-2">Date de dernière mise à jour : 11 octobre 2025</p>
                </div>

                <div className="bg-white rounded-lg p-6 sm:p-8 space-y-8 shadow-sm border border-gray-200">
                    <div className="bg-blue-900 border border-blue-700 rounded p-4 text-blue-200">
                        <p>Le respect de votre vie privée est notre priorité. Cette politique de confidentialité a pour but de vous informer de manière claire et transparente sur la manière dont nous collectons, utilisons et protégeons vos données personnelles.</p>
                    </div>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Responsable du traitement des données</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Le responsable de la collecte et du traitement de vos données personnelles est :</p>
                            <p><strong>Nicolas Jalibert</strong></p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Données personnelles collectées</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Nous collectons les données suivantes lorsque vous utilisez notre site :</p>
                            <ul className="list-disc list-inside ml-4 space-y-1">
                                <li><strong>Nom</strong></li>
                                <li><strong>Adresse e-mail</strong></li>
                            </ul>
                            <p>Nous associons à ces données un <strong>statut</strong> (lecteur, modérateur ou administrateur) afin de gérer vos droits d'accès et vos permissions sur le site.</p>
                            <p>Ces données sont collectées lorsque vous remplissez un formulaire d'inscription ou de contact sur notre site.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Finalité de la collecte des données (Pourquoi nous les utilisons ?)</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Vos données sont utilisées uniquement pour les finalités suivantes :</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li><strong>Gestion de votre compte utilisateur :</strong> Créer et gérer votre accès au site.</li>
                                <li><strong>Gestion des permissions :</strong> Vous attribuer les droits correspondants à votre statut (par exemple, permettre aux modérateurs de gérer les commentaires).</li>
                                <li><strong>Communication :</strong> Vous contacter si nécessaire concernant votre compte ou l'utilisation du site.</li>
                            </ul>
                            <p className="font-medium">Nous nous engageons à ne pas utiliser vos données à d'autres fins, notamment commerciales, sans votre consentement explicite.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Durée de conservation des données</h2>
                        <div className="text-gray-300">
                            <p>Vos données personnelles sont conservées tant que votre compte est actif sur le site. Vous pouvez demander la suppression de votre compte et de vos données à tout moment (voir section "Vos droits").</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Sécurité de vos données</h2>
                        <div className="text-gray-300">
                            <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger vos données contre tout accès, modification, divulgation ou destruction non autorisés.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Partage des données</h2>
                        <div className="text-gray-300">
                            <p><strong>Nous ne vendons, n'échangeons et ne transférons aucune de vos données personnelles à des tiers.</strong></p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Vos droits sur vos données</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Conformément au RGPD, vous disposez des droits suivants concernant vos données personnelles :</p>
                            <ul className="list-disc list-inside ml-4 space-y-2">
                                <li><strong>Droit d'accès :</strong> Vous pouvez demander à consulter les données que nous détenons sur vous.</li>
                                <li><strong>Droit de rectification :</strong> Vous pouvez demander la modification de vos données si elles sont inexactes ou incomplètes.</li>
                                <li><strong>Droit à l'effacement ("droit à l'oubli") :</strong> Vous pouvez demander la suppression de votre compte et de toutes les données associées.</li>
                                <li><strong>Droit à la limitation du traitement :</strong> Vous pouvez demander à ce que l'utilisation de vos données soit suspendue temporairement.</li>
                            </ul>
                            <p className="font-medium">Pour exercer ces droits, vous pouvez nous contacter avec la personne qui vous a invité à vous inscrire sur ce site.</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies 🍪</h2>
                        <div className="text-gray-300 space-y-2">
                            <p>Notre site peut utiliser des cookies strictement nécessaires à son bon fonctionnement (par exemple, pour maintenir votre session connectée).</p>
                            <p>Notre site peut utiliser des cookies nécessaires à au fonctionnement de ses partenaires publicitaires (par exemple, régie publicitaire google).</p>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Modification de la politique de confidentialité</h2>
                        <div className="text-gray-300">
                            <p>Nous nous réservons le droit de modifier cette politique de confidentialité à tout moment. En cas de modification substantielle, nous vous en informerons par e-mail ou via une notification sur le site.</p>
                        </div>
                    </section>

                    <div className="text-sm text-gray-400 pt-6 border-t border-gray-600">
                        <p>Cette politique de confidentialité est conforme au Règlement Général sur la Protection des Données (RGPD).</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PolitiqueConfidentialite;