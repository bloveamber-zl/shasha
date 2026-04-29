const SECRET_MARKERS = [
  'appSecret',
  'AppSecret',
  'mchKey',
  'apiV3Key',
  'private_key',
  'BEGIN PRIVATE KEY',
  'SECRET_KEY'
];

function shouldSkipSecretScan(file) {
  return file.startsWith('docs/') || file.startsWith('tests/') || file.includes('/node_modules/');
}

function findForbiddenSecretMarkers(files) {
  const findings = [];
  (files || []).forEach(({ file, content }) => {
    if (shouldSkipSecretScan(file)) return;

    SECRET_MARKERS.forEach((marker) => {
      if (String(content || '').includes(marker)) {
        findings.push({ file, marker });
      }
    });
  });
  return findings;
}

function validateFeatureWorkflow(featureList) {
  const errors = [];
  const features = featureList.features || [];
  const statusLegend = featureList.status_legend || {};
  const allowedStatuses = new Set(Object.keys(statusLegend));
  const activeCount = features.filter((feature) => feature.status === 'in_progress').length;

  if (activeCount > 1) {
    errors.push('同一时间最多只能有一个 in_progress 功能');
  }

  features.forEach((feature) => {
    if (!allowedStatuses.has(feature.status)) {
      errors.push(`未知功能状态: ${feature.id} -> ${feature.status}`);
    }

    if (feature.status === 'passing' && (!Array.isArray(feature.evidence) || feature.evidence.length === 0)) {
      errors.push(`passing 功能缺少验证证据: ${feature.id}`);
    }
  });

  return errors;
}

module.exports = {
  findForbiddenSecretMarkers,
  validateFeatureWorkflow
};
