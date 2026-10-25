const {spawnSync}=require('child_process');
const result=spawnSync("node scripts/prepare-static.mjs && node brand-build.cjs && node scripts/brand-isolation.mjs dist && node scripts/brand-isolation.mjs dist --check && node scripts/brand-check.mjs dist && node scripts/consolidate-content.cjs && node scripts/buyer-intent-release.cjs dist && node scripts/contextual-crosslinks.cjs dist && node scripts/brand-check.mjs dist",{shell:true,stdio:'inherit'});
process.exit(result.status===null?1:result.status);
