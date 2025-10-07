# Guide de Style AnimaLineage

## 🎨 Système de Design Unifié

Ce guide définit les standards de style pour assurer la cohérence et l'uniformité sur toute l'application.

## 📏 Système de Spacing

### Container & Padding
```css
/* Container principal */
.container-padding { @apply px-4 sm:px-6 lg:px-8; }

/* Cartes et contenus */
.card-padding { @apply p-4 sm:p-6; }

/* Sections */
.section-spacing { @apply py-8 sm:py-12 lg:py-16; }
```

### Breakpoints Standards
- `sm:` - 640px et plus (mobile landscape/tablette)
- `md:` - 768px et plus (tablette)
- `lg:` - 1024px et plus (desktop)
- `xl:` - 1280px et plus (large desktop)

## 🎯 Système de Boutons

### Boutons Primaires
```css
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-lg font-medium
         hover:bg-blue-700 transition-colors
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

### Boutons Secondaires
```css
.btn-secondary {
  @apply bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium
         hover:bg-gray-300 transition-colors
         focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2;
}
```

### Boutons Outline
```css
.btn-outline {
  @apply bg-white text-blue-600 px-4 py-2 rounded-lg font-medium
         border-2 border-blue-600 hover:bg-blue-50 transition-colors
         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2;
}
```

### Tailles de Boutons
- **Small**: `px-3 py-1 text-sm rounded-md`
- **Standard**: `px-4 py-2 rounded-lg`
- **Large**: `px-6 sm:px-8 py-3 text-lg rounded-lg`

## 🗂️ Système de Cartes

```css
.card {
  @apply bg-white rounded-lg shadow-md border border-gray-200;
}

.card-header {
  @apply border-b border-gray-100 p-4 sm:p-6;
}

.card-content {
  @apply p-4 sm:p-6;
}
```

## 📢 Système de Messages

### Types d'Alertes
```css
.alert { @apply p-3 rounded-lg border; }
.alert-success { @apply bg-green-100 border-green-400 text-green-700; }
.alert-error { @apply bg-red-100 border-red-400 text-red-700; }
.alert-warning { @apply bg-yellow-100 border-yellow-400 text-yellow-700; }
.alert-info { @apply bg-blue-100 border-blue-400 text-blue-700; }
```

## 📝 Système de Typographie

### Titres
- **H1**: `text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900`
- **H2**: `text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900`
- **H3**: `text-lg sm:text-xl font-semibold text-gray-800`
- **H4**: `text-base sm:text-lg font-semibold text-gray-800`

### Corps de Texte
- **Large**: `text-lg sm:text-xl text-gray-600`
- **Regular**: `text-base text-gray-600`
- **Small**: `text-sm text-gray-600`

## 📱 Grilles Responsive

### 2 Colonnes
```css
.grid-responsive-2 {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6;
}
```

### 3 Colonnes
```css
.grid-responsive-3 {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6;
}
```

## 📊 Tableaux Responsive

```css
.table-responsive { @apply overflow-x-auto; }
.table-standard {
  @apply min-w-full bg-white border border-gray-200 rounded-lg
         overflow-hidden shadow-sm;
}
.table-header {
  @apply bg-gray-50 px-3 sm:px-4 py-3 text-left text-xs
         font-medium text-gray-500 uppercase tracking-wider;
}
.table-cell { @apply px-3 sm:px-4 py-4 text-sm text-gray-900; }
.table-row { @apply hover:bg-gray-50 transition-colors; }
```

## 🎨 Palette de Couleurs

### Couleurs Principales
- **Primary**: `blue-600` (boutons principaux)
- **Secondary**: `gray-600` (boutons secondaires)
- **Background**: `gray-50` (fond principal), `gray-100` (fond alternatif)

### États
- **Success**: `green-100/400/700`
- **Error**: `red-100/400/700`
- **Warning**: `yellow-100/400/700`
- **Info**: `blue-100/400/700`

## ♿ Accessibilité

### Focus States Obligatoires
Tous les éléments interactifs doivent avoir :
```css
focus:outline-none focus:ring-2 focus:ring-[color]-500 focus:ring-offset-2
```

### Responsive Text
- Toujours utiliser des classes responsive pour le texte
- Minimum `text-sm` sur mobile, `text-base` sur desktop
- Titres avec progression logique

## 📏 Règles de Cohérence

1. **Spacing uniforme** : Utiliser le système `px-4 sm:px-6 lg:px-8`
2. **Breakpoints cohérents** : Respecter `sm:` `lg:` `xl:` principalement
3. **Focus states obligatoires** : Tous les boutons et liens
4. **Transitions standardisées** : `transition-colors` pour les hover
5. **Border radius uniforme** : `rounded-lg` par défaut
6. **Ombres cohérentes** : `shadow-sm` ou `shadow-md`

## 📱 Mobile-First

- Toujours commencer par le design mobile
- Utiliser `sm:` pour tablette, `lg:` pour desktop
- Tester sur différentes tailles d'écran
- Éviter les débordements horizontaux
- Privilégier les layouts en colonne sur mobile