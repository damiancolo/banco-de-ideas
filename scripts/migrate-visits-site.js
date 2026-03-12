/**
 * Migration: Tag existing visits with the correct `site` field
 *
 * - Paths matching unbancodeideas.com routes → site: 'unbancodeideas'
 * - WordPress-looking paths → site: 'estudioprompt'
 *
 * Usage: node scripts/migrate-visits-site.js [--dry-run]
 */

const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error('MONGODB_URI not set in .env.local');
    process.exit(1);
}

const dryRun = process.argv.includes('--dry-run');

// Known unbancodeideas.com paths (clean Next.js routes)
const UNBANCODEIDEAS_PATHS = ['/', '/banco', '/about', '/tracker', '/banco/semantic', '/about/ca', '/about/en'];

function classifySite(path) {
    // Known unbancodeideas routes → unbancodeideas
    if (UNBANCODEIDEAS_PATHS.includes(path)) return 'unbancodeideas';
    // Everything else (WordPress posts, slugs, wp-json, etc.) → estudioprompt
    return 'estudioprompt';
}

async function migrate() {
    console.log(`Connecting to MongoDB...`);
    console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : 'LIVE'}\n`);

    await mongoose.connect(MONGODB_URI);

    const Visit = mongoose.connection.collection('visits');

    // Find all visits without site field
    const untagged = await Visit.find({ site: { $exists: false } }).toArray();
    console.log(`Found ${untagged.length} visits without site field\n`);

    if (untagged.length === 0) {
        console.log('Nothing to migrate!');
        await mongoose.disconnect();
        return;
    }

    // Also find visits with site: null
    const nullSite = await Visit.find({ site: null }).toArray();
    const allToMigrate = [...untagged];

    // Add null-site records that aren't already in untagged
    const untaggedIds = new Set(untagged.map(v => v._id.toString()));
    for (const v of nullSite) {
        if (!untaggedIds.has(v._id.toString())) {
            allToMigrate.push(v);
        }
    }

    console.log(`Total records to classify: ${allToMigrate.length}\n`);

    // Classify
    const classified = { unbancodeideas: [], estudioprompt: [] };
    for (const visit of allToMigrate) {
        const site = classifySite(visit.path);
        classified[site].push(visit);
    }

    // Report
    console.log('Classification:');
    console.log(`  unbancodeideas: ${classified.unbancodeideas.length}`);
    console.log(`  estudioprompt:  ${classified.estudioprompt.length}`);
    console.log('');

    // Show details
    for (const [site, visits] of Object.entries(classified)) {
        if (visits.length > 0) {
            console.log(`── ${site} ──`);
            for (const v of visits) {
                const date = new Date(v.timestamp).toISOString().slice(0, 16);
                console.log(`  ${date} | ${v.visitorType.padEnd(5)} | ${(v.botName || v.browser || '-').padEnd(20)} | ${v.path}`);
            }
            console.log('');
        }
    }

    if (dryRun) {
        console.log('DRY RUN — no changes made. Run without --dry-run to apply.');
        await mongoose.disconnect();
        return;
    }

    // Apply updates
    for (const [site, visits] of Object.entries(classified)) {
        if (visits.length > 0) {
            const ids = visits.map(v => v._id);
            const result = await Visit.updateMany(
                { _id: { $in: ids } },
                { $set: { site } }
            );
            console.log(`Updated ${result.modifiedCount} records → site: '${site}'`);
        }
    }

    console.log('\nMigration complete!');
    await mongoose.disconnect();
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
