#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testsDir = path.join(__dirname, '../tests');
const outputFile = path.join(__dirname, '../TEST_LIST.md');

// Parse test files and extract test names
function parseTestFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileName = path.basename(filePath);
  const tests = [];

  // Pattern to match describe blocks
  const describePattern = /test\.describe(?:\.skip)?\s*\(\s*['"`]([^'"`]+)['"`]\s*,\s*\(\s*\)\s*=>/g;
  // Pattern to match individual tests
  const testPattern = /test(?:\.skip)?\s*\(\s*['"`]([^'"`]+)['"`]/g;

  let describeMatch;
  let currentDescribe = null;
  let fileContent = content;

  // Extract describe blocks with their content
  const describes = [];
  while ((describeMatch = describePattern.exec(content)) !== null) {
    const describeName = describeMatch[1];
    const startPos = describeMatch.index;
    
    // Find the corresponding closing brace
    let braceCount = 0;
    let foundOpening = false;
    let endPos = content.length;
    
    for (let i = startPos + describeMatch[0].length - 1; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        foundOpening = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (foundOpening && braceCount === 0) {
          endPos = i + 1;
          break;
        }
      }
    }

    describes.push({
      name: describeName,
      content: content.substring(startPos, endPos),
    });
  }

  // Extract tests from describe blocks
  describes.forEach((describe) => {
    let testMatch;
    const testRegex = /test(?:\.skip)?\s*\(\s*['"`]([^'"`]+)['"`]/g;
    while ((testMatch = testRegex.exec(describe.content)) !== null) {
      const testName = testMatch[1];
      tests.push({
        describe: describe.name,
        name: testName,
        isSkipped: describe.content.substring(testMatch.index - 20, testMatch.index).includes('.skip'),
      });
    }
  });

  // If no tests found via describe blocks, extract top-level tests
  if (tests.length === 0) {
    while ((testMatch = testPattern.exec(content)) !== null) {
      tests.push({
        describe: null,
        name: testMatch[1],
        isSkipped: content.substring(testMatch.index - 5, testMatch.index).includes('.skip'),
      });
    }
  }

  return { fileName, tests };
}

// Generate markdown output
function generateMarkdown(testFiles) {
  let markdown = '# Test List\n\n';
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  markdown += '## Summary\n\n';

  let totalTests = 0;
  let skippedTests = 0;

  testFiles.forEach((file) => {
    totalTests += file.tests.length;
    skippedTests += file.tests.filter((t) => t.isSkipped).length;
  });

  markdown += `- **Total Tests:** ${totalTests}\n`;
  markdown += `- **Skipped Tests:** ${skippedTests}\n`;
  markdown += `- **Active Tests:** ${totalTests - skippedTests}\n`;
  markdown += `- **Test Files:** ${testFiles.length}\n\n`;

  markdown += '## Tests by File\n\n';

  testFiles.forEach((file) => {
    markdown += `### ${file.fileName}\n\n`;

    const grouped = {};
    file.tests.forEach((test) => {
      const describe = test.describe || 'Uncategorized';
      if (!grouped[describe]) {
        grouped[describe] = [];
      }
      grouped[describe].push(test);
    });

    Object.entries(grouped).forEach(([describe, tests]) => {
      markdown += `#### ${describe}\n\n`;
      tests.forEach((test) => {
        const skipIcon = test.isSkipped ? '⏭️ ' : '';
        markdown += `- ${skipIcon}${test.name}\n`;
      });
      markdown += '\n';
    });
  });

  return markdown;
}

// Main execution
try {
  const specFiles = fs
    .readdirSync(testsDir)
    .filter((file) => file.endsWith('.spec.ts'))
    .sort();

  console.log(`Found ${specFiles.length} test files`);

  const testFiles = specFiles
    .map((file) => {
      const filePath = path.join(testsDir, file);
      return parseTestFile(filePath);
    })
    .filter((file) => file.tests.length > 0);

  const markdown = generateMarkdown(testFiles);
  fs.writeFileSync(outputFile, markdown, 'utf-8');

  console.log(`✅ Test list generated: ${outputFile}`);
  console.log(
    `\n📊 Summary: ${testFiles.reduce((sum, f) => sum + f.tests.length, 0)} tests found`
  );
} catch (error) {
  console.error('❌ Error generating test list:', error.message);
  process.exit(1);
}
