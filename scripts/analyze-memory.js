const fs = require('fs');
const path = require('path');

const files = fs.readdirSync('.').filter(f => f.includes('bench-') && (f.endsWith('.heapprofile') || f.endsWith('.memory.json')));

const memoryFiles = files.filter(f => f.endsWith('.memory.json'));
const heapFiles = files.filter(f => f.endsWith('.heapprofile'));

console.log('Memory Usage Analysis:');
console.log('======================');

memoryFiles.forEach(file => {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const testName = file.replace('bench-', '').replace(/-.+\.memory\.json$/, '');
  
  console.log(`\n${testName}:`);
  console.log(`  Heap Used Delta: ${(data.heapUsed / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  Heap Total Delta: ${(data.heapTotal / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  External Delta: ${(data.external / 1024 / 1024).toFixed(2)} MB`);
  console.log(`  RSS Delta: ${(data.rss / 1024 / 1024).toFixed(2)} MB`);
});

console.log('\nHeap Profile Analysis:');
console.log('======================');

heapFiles.forEach(file => {
  const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
  const testName = file.replace('bench-', '').replace(/-.+\.heapprofile$/, '');
  
  const samples = profile.samples || [];
  const locations = profile.locations || [];
  
  console.log(`\n${testName}:`);
  console.log(`  Total Samples: ${samples.length}`);
  console.log(`  Allocation Locations: ${locations.length}`);
  
  const allocationCounts = {};
  samples.forEach(sample => {
    const location = locations[sample.location_id];
    if (location && location.line) {
      const key = `${location.script_name}:${location.line}`;
      allocationCounts[key] = (allocationCounts[key] || 0) + sample.size;
    }
  });
  
  const topAllocations = Object.entries(allocationCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);
    
  console.log('  Top Allocation Sites:');
  topAllocations.forEach(([location, size]) => {
    console.log(`    ${location}: ${(size / 1024).toFixed(2)} KB`);
  });
});
