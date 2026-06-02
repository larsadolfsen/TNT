const fs = require('fs');
const path = require('path');

const blocksDir = "c:\\Users\\LAAD\\.gemini\\antigravity\\scratch\\TNT\\blocks";
const sectionsDir = "c:\\Users\\LAAD\\.gemini\\antigravity\\scratch\\TNT\\sections";

function analyzeDir(directory) {
  console.log(`\nAnalyzing directory: ${directory}`);
  const files = fs.readdirSync(directory);
  
  for (const filename of files) {
    if (!filename.endsWith('.liquid')) continue;
    const filepath = path.join(directory, filename);
    const content = fs.readFileSync(filepath, 'utf8');
    
    // Find schema
    const schemaMatch = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
    if (!schemaMatch) continue;
    
    const schemaStr = schemaMatch[1].trim();
    let schema;
    try {
      schema = JSON.parse(schemaStr);
    } catch (e) {
      console.log(`Error parsing schema in ${filename}: ${e.message}`);
      continue;
    }
    
    const settings = schema.settings || [];
    const paddingSettings = [];
    for (const setting of settings) {
      const sid = setting.id || "";
      const label = setting.label || "";
      
      const hasPaddingInId = sid.toLowerCase().includes('padding') || sid.toLowerCase().includes('afstand');
      const hasPaddingInLabel = (typeof label === 'string') && (label.toLowerCase().includes('afstand') || label.toLowerCase().includes('padding'));
      
      if (hasPaddingInId || hasPaddingInLabel) {
        paddingSettings.push(setting);
      }
    }
    
    if (paddingSettings.length > 0) {
      console.log(`\nFile: ${filename}`);
      for (const p of paddingSettings) {
        console.log(`  ID: ${p.id}, Type: ${p.type}, Label: ${p.label}, Default: ${p.default}, Min: ${p.min}, Max: ${p.max}, Step: ${p.step}`);
      }
    }
  }
}

console.log("--- BLOCKS ---");
analyzeDir(blocksDir);
console.log("\n--- SECTIONS ---");
analyzeDir(sectionsDir);
