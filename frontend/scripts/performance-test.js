#!/usr/bin/env node

/**
 * Script de test de performance pour AnimaLineage
 * Utilise Lighthouse pour analyser les performances, l'accessibilité et les bonnes pratiques
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

// Configuration des tests
const config = {
  urls: [
    'http://localhost:3000', // Page de connexion
    'http://localhost:3000/dashboard', // Dashboard principal (nécessite auth)
  ],
  options: {
    logLevel: 'info',
    output: ['json', 'html'],
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: undefined, // Sera défini par Chrome Launcher
  },
  thresholds: {
    performance: 80,
    accessibility: 90,
    'best-practices': 80,
    seo: 80,
  }
};

/**
 * Lance les tests Lighthouse
 */
async function runLighthouseTests() {
  const reportsDir = path.join(__dirname, '../reports');

  // Créer le dossier de rapports s'il n'existe pas
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  let chrome;
  let results = [];

  try {
    // Lancer Chrome
    console.log('🚀 Lancement de Chrome...');
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-dev-shm-usage']
    });
    config.options.port = chrome.port;

    console.log('📊 Début des tests de performance...\n');

    // Tester chaque URL
    for (const url of config.urls) {
      console.log(`🔍 Test de: ${url}`);

      try {
        const runResult = await lighthouse(url, config.options);
        const reportName = url.replace(/[^a-zA-Z0-9]/g, '_');

        // Sauvegarder les rapports
        const jsonPath = path.join(reportsDir, `lighthouse-${reportName}.json`);
        const htmlPath = path.join(reportsDir, `lighthouse-${reportName}.html`);

        fs.writeFileSync(jsonPath, JSON.stringify(runResult.lhr, null, 2));
        fs.writeFileSync(htmlPath, runResult.report[1]); // HTML report

        // Extraire les scores
        const scores = {
          url,
          performance: Math.round(runResult.lhr.categories.performance.score * 100),
          accessibility: Math.round(runResult.lhr.categories.accessibility.score * 100),
          'best-practices': Math.round(runResult.lhr.categories['best-practices'].score * 100),
          seo: Math.round(runResult.lhr.categories.seo.score * 100),
        };

        results.push(scores);

        // Afficher les résultats
        console.log(`  ⚡ Performance: ${scores.performance}%`);
        console.log(`  ♿ Accessibilité: ${scores.accessibility}%`);
        console.log(`  ✅ Bonnes pratiques: ${scores['best-practices']}%`);
        console.log(`  🔍 SEO: ${scores.seo}%`);
        console.log(`  📄 Rapports sauvés: ${jsonPath}, ${htmlPath}\n`);

      } catch (error) {
        console.error(`❌ Erreur lors du test de ${url}:`, error.message);
        results.push({
          url,
          error: error.message,
          performance: 0,
          accessibility: 0,
          'best-practices': 0,
          seo: 0,
        });
      }
    }

  } catch (error) {
    console.error('❌ Erreur lors du lancement des tests:', error.message);
    process.exit(1);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }

  return results;
}

/**
 * Vérifie si les seuils sont respectés
 */
function checkThresholds(results) {
  let allPassed = true;

  console.log('📊 RÉSUMÉ DES TESTS DE PERFORMANCE\n');
  console.log('='.repeat(50));

  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.url}: ERREUR - ${result.error}`);
      allPassed = false;
      return;
    }

    console.log(`\n🌐 ${result.url}`);

    Object.entries(config.thresholds).forEach(([category, threshold]) => {
      const score = result[category];
      const passed = score >= threshold;
      const status = passed ? '✅' : '❌';

      console.log(`  ${status} ${category}: ${score}% (seuil: ${threshold}%)`);

      if (!passed) {
        allPassed = false;
      }
    });
  });

  console.log('\n' + '='.repeat(50));

  if (allPassed) {
    console.log('🎉 Tous les tests de performance sont passés!');
  } else {
    console.log('⚠️  Certains tests de performance ont échoué.');
    console.log('📝 Consultez les rapports détaillés dans le dossier reports/');
  }

  return allPassed;
}

/**
 * Génère un rapport de résumé
 */
function generateSummaryReport(results) {
  const summaryPath = path.join(__dirname, '../reports/performance-summary.json');

  const summary = {
    timestamp: new Date().toISOString(),
    results,
    thresholds: config.thresholds,
    passed: results.every(result =>
      !result.error &&
      Object.entries(config.thresholds).every(([category, threshold]) =>
        result[category] >= threshold
      )
    )
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📄 Rapport de résumé sauvé: ${summaryPath}`);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('🦕 AnimaLineage - Tests de Performance\n');

  try {
    const results = await runLighthouseTests();
    const allPassed = checkThresholds(results);
    generateSummaryReport(results);

    // Code de sortie basé sur les résultats
    process.exit(allPassed ? 0 : 1);

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  main();
}

module.exports = {
  runLighthouseTests,
  checkThresholds,
  generateSummaryReport
};