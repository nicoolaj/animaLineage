module.exports = {
  extends: 'lighthouse:default',
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'first-meaningful-paint',
      'speed-index',
      'cumulative-layout-shift',
      'total-blocking-time',
      'max-potential-fid',
      'interactive',
      'server-response-time',
      'first-cpu-idle',
      'estimated-input-latency',
      'render-blocking-resources',
      'unused-css-rules',
      'unused-javascript',
      'efficient-animated-content',
      'offscreen-images',
      'unminified-css',
      'unminified-javascript',
      'legacy-javascript',
      'modern-image-formats',
      'uses-optimized-images',
      'uses-text-compression',
      'uses-responsive-images',
      'critical-request-chains',
      'user-timings',
      'bootup-time',
      'mainthread-work-breakdown',
      'font-display',
      'resource-summary',
      'third-party-summary',
      'third-party-facades',
      'largest-contentful-paint-element',
      'layout-shift-elements',
      'uses-long-cache-ttl',
      'total-byte-weight',
      'duplicated-javascript',
      'viewport',
      'color-contrast',
      'image-alt',
      'label',
      'link-name',
      'meta-description',
      'structured-data',
      'valid-lang',
      'aria-valid-attr',
      'button-name',
      'bypass',
      'document-title',
      'html-has-lang',
      'list',
      'listitem',
      'tabindex',
      'td-headers-attr',
      'th-has-data-cells'
    ],
    // Configuration pour les tests de performance
    throttlingMethod: 'simulate',
    throttling: {
      rttMs: 150,
      throughputKbps: 1.6 * 1024,
      cpuSlowdownMultiplier: 4,
      requestLatencyMs: 150,
      downloadThroughputKbps: 1.6 * 1024,
      uploadThroughputKbps: 750
    },
    // Émulation d'appareil mobile
    emulatedFormFactor: 'mobile',
    // Configuration du navigateur
    channel: 'node',
    // Nombre d'exécutions pour moyenner les résultats
    runs: 3
  },
  audits: [
    'metrics/first-contentful-paint',
    'metrics/largest-contentful-paint',
    'metrics/cumulative-layout-shift',
    'metrics/total-blocking-time'
  ],
  categories: {
    performance: {
      title: 'Performance',
      description: 'Métriques de performance de l\'application AnimaLineage',
      audits: [
        { id: 'first-contentful-paint', weight: 10, group: 'metrics' },
        { id: 'largest-contentful-paint', weight: 25, group: 'metrics' },
        { id: 'cumulative-layout-shift', weight: 25, group: 'metrics' },
        { id: 'total-blocking-time', weight: 30, group: 'metrics' },
        { id: 'speed-index', weight: 10, group: 'metrics' }
      ]
    },
    accessibility: {
      title: 'Accessibilité',
      description: 'Tests d\'accessibilité pour AnimaLineage',
      audits: [
        { id: 'color-contrast', weight: 3, group: 'a11y-color-contrast' },
        { id: 'image-alt', weight: 3, group: 'a11y-names-labels' },
        { id: 'label', weight: 3, group: 'a11y-names-labels' },
        { id: 'link-name', weight: 3, group: 'a11y-names-labels' },
        { id: 'button-name', weight: 3, group: 'a11y-names-labels' }
      ]
    },
    'best-practices': {
      title: 'Bonnes Pratiques',
      description: 'Vérifications des bonnes pratiques pour AnimaLineage',
      audits: [
        { id: 'uses-https', weight: 1 },
        { id: 'uses-http2', weight: 1 },
        { id: 'no-vulnerable-libraries', weight: 1 },
        { id: 'external-anchors-use-rel-noopener', weight: 1 }
      ]
    },
    seo: {
      title: 'SEO',
      description: 'Optimisations pour les moteurs de recherche',
      audits: [
        { id: 'meta-description', weight: 1 },
        { id: 'document-title', weight: 1 },
        { id: 'html-has-lang', weight: 1 },
        { id: 'viewport', weight: 1 }
      ]
    }
  },
  groups: {
    metrics: {
      title: 'Métriques de Performance'
    },
    'load-opportunities': {
      title: 'Opportunités d\'Optimisation'
    },
    'a11y-color-contrast': {
      title: 'Contraste des Couleurs'
    },
    'a11y-names-labels': {
      title: 'Noms et Labels'
    }
  }
};