const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['.git', '.next', 'node_modules', '.vercel', 'public'];
const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_FILE = path.join(ROOT_DIR, 'PROJECT_MAP.md');

function generateMap(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    let map = '';

    files.forEach((file, index) => {
        if (IGNORE_DIRS.includes(file)) return;

        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const isLast = index === files.length - 1;
        const connector = isLast ? '└── ' : '├── ';

        if (stats.isDirectory()) {
            map += `${prefix}${connector}${file}/\n`;
            map += generateMap(filePath, `${prefix}${isLast ? '    ' : '│   '}`);
        } else {
            map += `${prefix}${connector}${file}\n`;
        }
    });

    return map;
}

function getSummary() {
    const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
    return `
# 🗺️ Project Map: ${packageJson.name}
**Generado el:** ${new Date().toLocaleString()}

## 🏗️ Árbol de Archivos
\`\`\`text
${generateMap(ROOT_DIR)}
\`\`\`

## 📦 Dependencias Core
${Object.keys(packageJson.dependencies).map(dep => `- ${dep}: ${packageJson.dependencies[dep]}`).join('\n')}

## 📜 Scripts Disponibles
${Object.keys(packageJson.scripts).map(script => `- \`npm run ${script}\``).join('\n')}
`;
}

try {
    console.log('Generando mapa del proyecto...');
    const content = getSummary();
    fs.writeFileSync(OUTPUT_FILE, content);
    console.log(`✅ Mapa generado exitosamente en: ${OUTPUT_FILE}`);
} catch (error) {
    console.error('❌ Error generando el mapa:', error.message);
    process.exit(1);
}
