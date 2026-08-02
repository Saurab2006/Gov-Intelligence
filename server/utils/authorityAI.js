// Rule-based stand-in for an AI "area coverage" assistant. Given a district,
// it works out which kinds of authorities that area doesn't have registered
// yet (roads, disaster management, water, electricity, urban dev, general
// ward office) and returns ready-to-insert Authority records for them.
// Same pattern the app already uses for the ETA estimator: a deterministic
// rule engine described as AI-suggested, swappable for a real model call.

const AUTHORITY_BLUEPRINT = [
  { key: 'roads', department: 'Department of Roads', categories: ['road-damage', 'bridge-damage'] },
  { key: 'disaster', department: 'Disaster Management Authority', categories: ['flood', 'landslide'] },
  { key: 'water', department: 'Water Supply & Sewerage Corporation', categories: ['water-supply', 'drainage'] },
  { key: 'electricity', department: 'Electricity Authority', categories: ['electrical'] },
  { key: 'urban', department: 'Urban Development Dept', categories: ['tunnel-blockage'] },
  { key: 'ward', department: 'Municipal Ward Office', categories: ['other'] },
];

function authorityNameFor(department, district) {
  return district ? `${department} — ${district}` : department;
}

// existingNames: Set of "name" strings already registered for this district
function suggestAuthoritiesForArea(district, existingNames = new Set()) {
  const cleanDistrict = (district || '').trim();
  return AUTHORITY_BLUEPRINT
    .map(spec => ({
      name: authorityNameFor(spec.department, cleanDistrict),
      department: spec.department,
      district: cleanDistrict,
      categories: spec.categories,
      source: 'ai',
    }))
    .filter(a => !existingNames.has(a.name));
}

module.exports = { suggestAuthoritiesForArea, AUTHORITY_BLUEPRINT };