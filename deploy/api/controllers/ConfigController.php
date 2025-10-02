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

require_once __DIR__ . '/../config/config.php';

class ConfigController {

    public function getAdvertisingConfig() {
        try {
            // Load configuration
            $adEnabled = Config::get('AD_ENABLED', 'false') === 'true';
            $adProviderId = Config::get('AD_PROVIDER_ID', '');
            $adSlotId = Config::get('AD_SLOT_ID', '');
            $adFormat = Config::get('AD_FORMAT', '');

            // Return advertising configuration
            $response = [
                'status' => 'success',
                'data' => [
                    'enabled' => $adEnabled,
                    'providerId' => $adProviderId,
                    'slotId' => $adSlotId,
                    'format' => $adFormat
                ]
            ];

            header('Content-Type: application/json');
            echo json_encode($response);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Erreur lors de la récupération de la configuration publicitaire'
            ]);
        }
    }

    public function getPublicConfig() {
        try {
            // Return public configuration (non-sensitive data only)
            $response = [
                'status' => 'success',
                'data' => [
                    'appEnv' => Config::get('APP_ENV', 'development'),
                    'advertising' => [
                        'enabled' => Config::get('AD_ENABLED', 'false') === 'true',
                        'providerId' => Config::get('AD_PROVIDER_ID', ''),
                        'slotId' => Config::get('AD_SLOT_ID', ''),
                        'format' => Config::get('AD_FORMAT', ''),
                    ]
                ]
            ];

            header('Content-Type: application/json');
            echo json_encode($response);

        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode([
                'status' => 'error',
                'message' => 'Erreur lors de la récupération de la configuration'
            ]);
        }
    }
}
?>