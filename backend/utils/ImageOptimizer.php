<?php
/*
 * Copyright 2025 - Nicolas Jalibert
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

require_once __DIR__ . '/../vendor/autoload.php';

use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class ImageOptimizer {
    private $manager;
    private $maxWidth;
    private $maxHeight;
    private $quality;

    public function __construct($maxWidth = 1000, $maxHeight = 1000, $quality = 80) {
        $this->manager = new ImageManager(new Driver());
        $this->maxWidth = $maxWidth;
        $this->maxHeight = $maxHeight;
        $this->quality = $quality;
    }

    /**
     * Optimise une image depuis un chemin de fichier temporaire
     *
     * @param string $tempPath Chemin vers le fichier temporaire
     * @param string $mimeType Type MIME de l'image
     * @return array Données optimisées [data, width, height, file_size, optimized_format]
     * @throws Exception Si l'optimisation échoue
     */
    public function optimizeFromPath($tempPath, $mimeType) {
        try {
            // Charger l'image
            $image = $this->manager->read($tempPath);

            // Obtenir les dimensions originales
            $originalWidth = $image->width();
            $originalHeight = $image->height();

            // Calculer les nouvelles dimensions en conservant le ratio
            $newDimensions = $this->calculateNewDimensions($originalWidth, $originalHeight);

            // Redimensionner si nécessaire
            if ($newDimensions['width'] !== $originalWidth || $newDimensions['height'] !== $originalHeight) {
                $image->scale($newDimensions['width'], $newDimensions['height']);
                error_log("Image redimensionnée de {$originalWidth}x{$originalHeight} vers {$newDimensions['width']}x{$newDimensions['height']}");
            }

            // Encoder selon le type MIME ou utiliser JPEG par défaut
            $encodedImage = $this->encodeImage($image, $mimeType);
            $imageData = $encodedImage->toString();

            return [
                'data' => $imageData,
                'width' => $image->width(),
                'height' => $image->height(),
                'file_size' => strlen($imageData),
                'optimized_format' => $this->getMimeTypeFormat($mimeType),
                'mime_type' => $mimeType,
                'original_width' => $originalWidth,
                'original_height' => $originalHeight
            ];

        } catch (Exception $e) {
            error_log("Erreur lors de l'optimisation de l'image: " . $e->getMessage());
            throw new Exception("Impossible d'optimiser l'image: " . $e->getMessage());
        }
    }

    /**
     * Optimise une image depuis des données binaires
     *
     * @param string $imageData Données binaires de l'image
     * @param string $mimeType Type MIME de l'image
     * @return array Données optimisées [data, width, height, file_size]
     * @throws Exception Si l'optimisation échoue
     */
    public function optimizeFromData($imageData, $mimeType) {
        try {
            // Charger l'image depuis les données binaires
            $image = $this->manager->read($imageData);

            // Obtenir les dimensions originales
            $originalWidth = $image->width();
            $originalHeight = $image->height();

            // Calculer les nouvelles dimensions en conservant le ratio
            $newDimensions = $this->calculateNewDimensions($originalWidth, $originalHeight);

            // Redimensionner si nécessaire
            if ($newDimensions['width'] !== $originalWidth || $newDimensions['height'] !== $originalHeight) {
                $image->scale($newDimensions['width'], $newDimensions['height']);
                error_log("Image redimensionnée de {$originalWidth}x{$originalHeight} vers {$newDimensions['width']}x{$newDimensions['height']}");
            }

            // Encoder selon le type MIME
            $encodedImage = $this->encodeImage($image, $mimeType);

            return [
                'data' => $encodedImage->toString(),
                'width' => $image->width(),
                'height' => $image->height(),
                'file_size' => strlen($encodedImage->toString()),
                'original_width' => $originalWidth,
                'original_height' => $originalHeight
            ];

        } catch (Exception $e) {
            error_log("Erreur lors de l'optimisation de l'image: " . $e->getMessage());
            throw new Exception("Impossible d'optimiser l'image: " . $e->getMessage());
        }
    }

    /**
     * Calcule les nouvelles dimensions en conservant le ratio d'aspect
     *
     * @param int $originalWidth Largeur originale
     * @param int $originalHeight Hauteur originale
     * @return array [width, height]
     */
    private function calculateNewDimensions($originalWidth, $originalHeight) {
        // Si l'image est déjà dans les limites, ne pas la redimensionner
        if ($originalWidth <= $this->maxWidth && $originalHeight <= $this->maxHeight) {
            return ['width' => $originalWidth, 'height' => $originalHeight];
        }

        // Calculer le ratio pour déterminer quelle dimension limite
        $widthRatio = $this->maxWidth / $originalWidth;
        $heightRatio = $this->maxHeight / $originalHeight;

        // Utiliser le ratio le plus restrictif pour conserver les proportions
        $ratio = min($widthRatio, $heightRatio);

        return [
            'width' => round($originalWidth * $ratio),
            'height' => round($originalHeight * $ratio)
        ];
    }

    /**
     * Trouve le meilleur format (plus petit) pour l'image
     *
     * @param object $image Instance de l'image Intervention
     * @param string $originalMimeType Type MIME original
     * @return array [data, size, format, mime_type]
     */
    private function findBestFormat($image, $originalMimeType) {
        $formats = [];

        // Tester AVIF seulement si supporté
        if (method_exists($image, 'toAvif')) {
            try {
                $avifData = $image->toAvif($this->quality);
                $avifString = $avifData->toString();
                $formats[] = [
                    'data' => $avifString,
                    'size' => strlen($avifString),
                    'format' => 'AVIF',
                    'mime_type' => 'image/avif'
                ];
                error_log("AVIF testé: " . round(strlen($avifString)/1024, 1) . "KB");
            } catch (Exception $e) {
                error_log("AVIF échec: " . $e->getMessage());
            }
        }

        // Tester WebP seulement si supporté
        if (method_exists($image, 'toWebp')) {
            try {
                $webpData = $image->toWebp($this->quality);
                $webpString = $webpData->toString();
                $formats[] = [
                    'data' => $webpString,
                    'size' => strlen($webpString),
                    'format' => 'WebP',
                    'mime_type' => 'image/webp'
                ];
                error_log("WebP testé: " . round(strlen($webpString)/1024, 1) . "KB");
            } catch (Exception $e) {
                error_log("WebP échec: " . $e->getMessage());
            }
        }

        // Tester JPEG (toujours disponible)
        try {
            $jpegData = $image->toJpeg($this->quality);
            $jpegString = $jpegData->toString();
            $formats[] = [
                'data' => $jpegString,
                'size' => strlen($jpegString),
                'format' => 'JPEG',
                'mime_type' => 'image/jpeg'
            ];
            error_log("JPEG testé: " . round(strlen($jpegString)/1024, 1) . "KB");
        } catch (Exception $e) {
            error_log("JPEG échec: " . $e->getMessage());
            throw new Exception("Impossible d'encoder en JPEG: " . $e->getMessage());
        }

        // Tester PNG seulement si l'original était PNG (pour préserver la transparence)
        if ($originalMimeType === 'image/png') {
            try {
                $pngData = $image->toPng();
                $pngString = $pngData->toString();
                $formats[] = [
                    'data' => $pngString,
                    'size' => strlen($pngString),
                    'format' => 'PNG',
                    'mime_type' => 'image/png'
                ];
                error_log("PNG testé: " . round(strlen($pngString)/1024, 1) . "KB");
            } catch (Exception $e) {
                error_log("PNG échec: " . $e->getMessage());
            }
        }

        // Vérifier qu'on a au moins un format
        if (empty($formats)) {
            throw new Exception("Aucun format d'image supporté disponible");
        }

        // Trouver le format avec la plus petite taille
        $bestFormat = array_reduce($formats, function($best, $current) {
            return ($best === null || $current['size'] < $best['size']) ? $current : $best;
        });

        $formatSummary = implode(', ', array_map(function($f) {
            return $f['format'] . ' (' . round($f['size']/1024, 1) . 'KB)';
        }, $formats));

        error_log("Formats testés: " . $formatSummary);
        error_log("Meilleur format sélectionné: {$bestFormat['format']} ({$bestFormat['size']} bytes)");

        return $bestFormat;
    }

    /**
     * Encode l'image selon le type MIME spécifié
     *
     * @param object $image Instance de l'image Intervention
     * @param string $mimeType Type MIME souhaité
     * @return object Image encodée
     */
    private function encodeImage($image, $mimeType) {
        switch ($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                return $image->toJpeg($this->quality);

            case 'image/png':
                return $image->toPng();

            case 'image/gif':
                return $image->toGif();

            case 'image/webp':
                // Temporairement désactivé pour éviter les erreurs 500
                error_log("WebP converti en JPEG pour stabilité");
                return $image->toJpeg($this->quality);

            case 'image/avif':
                // Temporairement désactivé pour éviter les erreurs 500
                error_log("AVIF converti en JPEG pour stabilité");
                return $image->toJpeg($this->quality);

            default:
                // Par défaut, convertir en JPEG pour réduire la taille
                error_log("Type MIME non reconnu: $mimeType, conversion en JPEG");
                return $image->toJpeg($this->quality);
        }
    }

    /**
     * Obtient le nom du format depuis le type MIME
     *
     * @param string $mimeType Type MIME
     * @return string Nom du format
     */
    private function getMimeTypeFormat($mimeType) {
        switch ($mimeType) {
            case 'image/jpeg':
            case 'image/jpg':
                return 'JPEG';
            case 'image/png':
                return 'PNG';
            case 'image/gif':
                return 'GIF';
            case 'image/webp':
                return 'JPEG'; // Converti pour stabilité
            case 'image/avif':
                return 'JPEG'; // Converti pour stabilité
            default:
                return 'JPEG';
        }
    }

    /**
     * Valide si un type MIME est supporté
     *
     * @param string $mimeType Type MIME à valider
     * @return bool True si supporté
     */
    public static function isSupportedMimeType($mimeType) {
        $supportedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/avif'
        ];

        return in_array(strtolower($mimeType), $supportedTypes);
    }

    /**
     * Obtient les informations sur une image sans l'optimiser
     *
     * @param string $tempPath Chemin vers le fichier
     * @return array [width, height, mime_type]
     * @throws Exception Si impossible de lire l'image
     */
    public function getImageInfo($tempPath) {
        try {
            $image = $this->manager->read($tempPath);

            return [
                'width' => $image->width(),
                'height' => $image->height(),
                'mime_type' => $image->origin()->mediaType()
            ];

        } catch (Exception $e) {
            throw new Exception("Impossible de lire les informations de l'image: " . $e->getMessage());
        }
    }
}
?>