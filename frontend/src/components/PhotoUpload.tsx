import React, { useState, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

interface PhotoFile {
  file: File;
  preview: string;
  id?: string;
}

interface ExistingPhoto {
  id: number;
  original_name: string;
  file_size: number;
  mime_type: string;
  width?: number;
  height?: number;
  is_main: boolean;
  created_at: string;
  preview_url: string;
}

interface PhotoUploadProps {
  animalId?: number;
  existingPhotos?: ExistingPhoto[];
  onPhotosChange?: (photos: PhotoFile[]) => void;
  maxPhotos?: number;
  maxSizePerPhoto?: number; // en MB
  className?: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
  animalId,
  existingPhotos = [],
  onPhotosChange,
  maxPhotos = 10,
  maxSizePerPhoto = 5, // 5MB par défaut
  className = ''
}) => {
  const [photos, setPhotos] = useState<PhotoFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleFiles = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const validFiles: PhotoFile[] = [];
    let errorMessages: string[] = [];

    fileArray.forEach(file => {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        errorMessages.push(`${file.name}: Type de fichier non supporté`);
        return;
      }

      // Vérifier la taille
      if (file.size > maxSizePerPhoto * 1024 * 1024) {
        errorMessages.push(`${file.name}: Fichier trop volumineux (max ${maxSizePerPhoto}MB)`);
        return;
      }

      // Créer un aperçu
      const preview = URL.createObjectURL(file);
      validFiles.push({
        file,
        preview,
        id: `temp_${Date.now()}_${Math.random()}`
      });
    });

    if (errorMessages.length > 0) {
      setError(errorMessages.join('\n'));
      setTimeout(() => setError(''), 5000);
    }

    const currentTotal = photos.length + existingPhotos.length;
    const availableSlots = maxPhotos - currentTotal;
    const filesToAdd = validFiles.slice(0, availableSlots);

    if (validFiles.length > availableSlots && availableSlots > 0) {
      setError(`Seules les ${availableSlots} premières images ont été ajoutées (limite: ${maxPhotos} photos)`);
      setTimeout(() => setError(''), 5000);
    } else if (availableSlots <= 0) {
      setError(`Limite de ${maxPhotos} photos atteinte`);
      setTimeout(() => setError(''), 5000);
      return;
    }

    const newPhotos = [...photos, ...filesToAdd];
    setPhotos(newPhotos);
    onPhotosChange?.(newPhotos);
  }, [photos, existingPhotos.length, maxPhotos, maxSizePerPhoto, onPhotosChange]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
    // Reset input pour permettre la sélection du même fichier
    e.target.value = '';
  };

  const removePhoto = (photoId: string) => {
    const newPhotos = photos.filter(photo => photo.id !== photoId);
    setPhotos(newPhotos);
    onPhotosChange?.(newPhotos);

    // Libérer l'URL de l'aperçu
    const photoToRemove = photos.find(photo => photo.id === photoId);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.preview);
    }
  };

  const setAsMainPhoto = async (photoId: number) => {
    if (!animalId) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/photos/${photoId}/main`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Recharger les photos existantes ou mettre à jour l'état
        window.location.reload(); // Solution simple, peut être améliorée
      }
    } catch (error) {
      console.error('Erreur lors de la définition de la photo principale:', error);
    }
  };

  const deleteExistingPhoto = async (photoId: number) => {
    if (!animalId) return;

    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}api/animaux/${animalId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Recharger les photos existantes
        window.location.reload(); // Solution simple, peut être améliorée
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la photo:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`photo-upload-container ${className}`}>
      <div className="mb-4 sm:mb-5">
        <label className="text-gray-900 font-medium text-xs sm:text-sm block mb-1.5 sm:mb-2">
          📸 Photos de l'animal
          <span className="block text-xs text-gray-600 font-normal mt-0.5 sm:mt-1 leading-relaxed">
            Ajoutez jusqu'à {maxPhotos} photos de l'animal ({formatFileSize(maxSizePerPhoto * 1024 * 1024)} max par photo)
          </span>
        </label>

        {error && (
          <div className="error-message text-sm">
            {error.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
        )}

        {/* Zone de drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors duration-200 ${
            dragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
        >
          <div className="space-y-2">
            <div className="text-gray-500">
              <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600">
                Glissez-déposez vos photos ici, ou{' '}
                <label className="font-medium text-blue-600 hover:text-blue-500 cursor-pointer">
                  cliquez pour sélectionner
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                </label>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF jusqu'à {formatFileSize(maxSizePerPhoto * 1024 * 1024)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Photos existantes */}
      {existingPhotos.length > 0 && (
        <div className="mb-4 sm:mb-5">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">Photos actuelles</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {existingPhotos.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={`${API_BASE_URL}${photo.preview_url}`}
                  alt={photo.original_name}
                  className="w-full h-20 sm:h-24 object-cover rounded-md border border-gray-200"
                  onError={(e) => {
                    console.error('Erreur de chargement de l\'image:', `${API_BASE_URL}${photo.preview_url}`);
                    e.currentTarget.style.backgroundColor = '#f3f4f6';
                    e.currentTarget.style.display = 'flex';
                    e.currentTarget.style.alignItems = 'center';
                    e.currentTarget.style.justifyContent = 'center';
                    e.currentTarget.innerHTML = '📷❌';
                  }}
                />
                {photo.is_main && (
                  <div className="absolute top-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded text-xs font-medium">
                    Principale
                  </div>
                )}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {!photo.is_main && (
                      <button
                        onClick={() => setAsMainPhoto(photo.id)}
                        className="bg-blue-600 text-white p-1.5 rounded text-xs hover:bg-blue-700 transition-colors duration-200"
                        title="Définir comme photo principale"
                      >
                        ⭐
                      </button>
                    )}
                    <button
                      onClick={() => deleteExistingPhoto(photo.id)}
                      className="bg-red-600 text-white p-1.5 rounded text-xs hover:bg-red-700 transition-colors duration-200"
                      title="Supprimer cette photo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {photo.original_name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nouvelles photos à uploader */}
      {photos.length > 0 && (
        <div className="mb-4 sm:mb-5">
          <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">
            Nouvelles photos ({photos.length})
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {photos.map(photo => (
              <div key={photo.id} className="relative group">
                <img
                  src={photo.preview}
                  alt={photo.file.name}
                  className="w-full h-20 sm:h-24 object-cover rounded-md border border-gray-200"
                />
                <button
                  onClick={() => removePhoto(photo.id!)}
                  className="absolute top-1 right-1 bg-red-600 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Supprimer cette photo"
                >
                  ✕
                </button>
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {photo.file.name} ({formatFileSize(photo.file.size)})
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compteur */}
      <div className="text-xs text-gray-500 mt-2">
        {existingPhotos.length + photos.length} / {maxPhotos} photos
      </div>
    </div>
  );
};

export default PhotoUpload;