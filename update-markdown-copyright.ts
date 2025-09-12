/******************************************************************************
 *
 * Copyright (c) 2019-2025 Fraunhofer IOSB-INA Lemgo,
 * eine rechtlich nicht selbstaendige Einrichtung der Fraunhofer-Gesellschaft
 * zur Foerderung der angewandten Forschung e.V.
 *
 *****************************************************************************/

import fs from 'fs';
import * as path from 'path';

// Configuration: files to update and their copyright patterns
const FILES_TO_UPDATE = [
    {
        file: 'README.md',
        pattern: /Copyright \(C\) (\d{4}(-\d{4})?), Fraunhofer IOSB-INA Lemgo/,
        replacement: 'Copyright (C) 2019-2025, Fraunhofer IOSB-INA Lemgo'
    },
    {
        file: 'readthedocs/source/about/about.md',
        pattern: /Copyright \(C\) (\d{4}(-\d{4})?), Fraunhofer IOSB-INA Lemgo/,
        replacement: 'Copyright (C) 2019-2025, Fraunhofer IOSB-INA Lemgo'
    }
];

async function updateMarkdownCopyright(): Promise<void> {
    console.log('🔄 Updating copyright years in markdown files...\n');
    
    for (const fileConfig of FILES_TO_UPDATE) {
        const filePath = path.resolve(fileConfig.file);
        
        try {
            // Check if file exists
            if (!fs.existsSync(filePath)) {
                console.log(`⚠️  File not found: ${fileConfig.file}`);
                continue;
            }
            
            // Read file content
            const originalContent = await fs.promises.readFile(filePath, 'utf-8');
            
            // Check if pattern exists
            const match = originalContent.match(fileConfig.pattern);
            if (!match) {
                console.log(`ℹ️  No copyright pattern found in: ${fileConfig.file}`);
                continue;
            }
            
            // Update content
            const updatedContent = originalContent.replace(
                fileConfig.pattern, 
                fileConfig.replacement
            );
            
            // Check if changes were made
            if (originalContent === updatedContent) {
                console.log(`✅ ${fileConfig.file}: Already up to date`);
                continue;
            }
            
            // Write updated content
            await fs.promises.writeFile(filePath, updatedContent, 'utf-8');
            
            console.log(`✅ ${fileConfig.file}: Updated copyright year`);
            console.log(`   Old: ${match[0]}`);
            console.log(`   New: ${fileConfig.replacement}\n`);
            
        } catch (error) {
            console.error(`❌ Error updating ${fileConfig.file}:`, error);
        }
    }
    
    console.log('🎉 Copyright update completed!');
}

// Run the script
updateMarkdownCopyright().catch(console.error);