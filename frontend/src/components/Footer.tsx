import React from 'react';

interface FooterProps {
    onMentionsLegalesClick?: () => void;
    onPolitiqueConfidentialiteClick?: () => void;
}

const Footer: React.FC<FooterProps> = ({ onMentionsLegalesClick, onPolitiqueConfidentialiteClick }) => {
    return (
        <footer className="bg-gray-800 border-t border-gray-700 py-4 px-4 sm:px-6 lg:px-8 mt-auto">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-sm text-gray-400">
                        © {new Date().getFullYear()} AnimaLineage. Tous droits réservés.
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-sm">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <button
                                onClick={onMentionsLegalesClick}
                                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 underline focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-sm"
                            >
                                Mentions légales
                            </button>
                            <span className="text-gray-600">•</span>
                            <button
                                onClick={onPolitiqueConfidentialiteClick}
                                className="text-gray-400 hover:text-gray-300 transition-colors duration-200 underline focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-sm"
                            >
                                Politique de confidentialité
                            </button>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-gray-600 hidden sm:inline">•</span>
                            <span className="text-gray-400">
                                Gestion de lignées d'animaux
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;