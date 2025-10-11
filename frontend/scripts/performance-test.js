#!/usr/bin/env node

import lighthouse from 'lighthouse';
import chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

async function runLighthouseTest() {
  const reportsDir = path.join(process.cwd(), 'reports');

  // Créer le dossier reports s'il n'existe pas
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
  });

  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  const urls = [
    'http://localhost:3002',
  ];

  const results = [];

  console.log('🔍 Démarrage des tests de performance Lighthouse...');

  for (const url of urls) {
    console.log(`📊 Test de ${url}...`);

    try {
      const runnerResult = await lighthouse(url, options);
      const reportJson = runnerResult.lhr;

      // Extraire les scores
      const scores = {
        url: url,
        performance: Math.round(reportJson.categories.performance.score * 100),
        accessibility: Math.round(reportJson.categories.accessibility.score * 100),
        'best-practices': Math.round(reportJson.categories['best-practices'].score * 100),
        seo: Math.round(reportJson.categories.seo.score * 100),
      };

      results.push(scores);

      console.log(`✅ ${url}:`);
      console.log(`   Performance: ${scores.performance}%`);
      console.log(`   Accessibilité: ${scores.accessibility}%`);
      console.log(`   Bonnes pratiques: ${scores['best-practices']}%`);
      console.log(`   SEO: ${scores.seo}%`);

      // Sauvegarder le rapport JSON complet
      const reportPath = path.join(reportsDir, `lighthouse-${url.replace(/[^\w]/g, '_')}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(reportJson, null, 2));

    } catch (error) {
      console.error(`❌ Erreur lors du test de ${url}:`, error.message);
      results.push({
        url: url,
        error: error.message,
        performance: 0,
        accessibility: 0,
        'best-practices': 0,
        seo: 0,
      });
    }
  }

  await chrome.kill();

  // Générer le résumé
  const summary = {
    timestamp: new Date().toISOString(),
    results: results,
    passed: results.every(result =>
      !result.error &&
      result.performance >= 70 &&
      result.accessibility >= 90 &&
      result['best-practices'] >= 80 &&
      result.seo >= 80
    )
  };

  // Sauvegarder le résumé
  const summaryPath = path.join(reportsDir, 'performance-summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('\n📋 Résumé des tests de performance:');
  console.log(`   Statut global: ${summary.passed ? '✅ SUCCÈS' : '❌ ÉCHEC'}`);
  console.log(`   Rapports sauvegardés dans: ${reportsDir}`);

  // Sortir avec le code d'erreur approprié
  process.exit(summary.passed ? 0 : 1);
}

// Attendre que le serveur soit disponible
async function waitForServer(url, maxAttempts = 30) {
  const http = require('http');

  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(url, (res) => {
          resolve();
        });
        req.on('error', reject);
        req.setTimeout(2000, () => reject(new Error('Timeout')));
      });
      return true;
    } catch (error) {
      console.log(`⏳ En attente du serveur (tentative ${i + 1}/${maxAttempts})...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return false;
}

async function main() {
  console.log('🚀 Vérification de la disponibilité du serveur...');

  const serverReady = await waitForServer('http://localhost:3002');
  if (!serverReady) {
    console.error('❌ Le serveur n\'est pas disponible sur http://localhost:3002');
    process.exit(1);
  }

  await runLighthouseTest();
}

main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});