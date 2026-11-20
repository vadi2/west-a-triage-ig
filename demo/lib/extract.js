// SDC template-based extraction of the WEST-A vital signs, with the extraction library
// of the CSIRO AEHRC Smart Forms renderer (@aehrc/sdc-template-extract). The WEST-A Triage
// Questionnaire carries the extraction: a contained Observation template per vital sign,
// filled in by FHIRPath. Runs in the browser and in Node 20.

let library;

// The library's ES build imports a directory (fhirpath/fhir-context/r4), which bundlers
// such as Vite resolve but Node's ES module loader does not, so Node loads its CommonJS build.
async function loadLibrary() {
  if (!library) {
    const isNode = typeof window === 'undefined' && typeof process !== 'undefined' && !!process.versions?.node;
    if (isNode) {
      const nodeModule = 'node:module'; // a variable, so that bundlers leave it alone
      const { createRequire } = await import(/* @vite-ignore */ nodeModule);
      library = createRequire(import.meta.url)('@aehrc/sdc-template-extract');
    } else {
      library = await import('@aehrc/sdc-template-extract');
    }
  }
  return library;
}

// Drops the items without an answer, so that an unanswered vital sign gives no Observation:
// the library extracts one resource per QuestionnaireResponse item that refers to a template.
function answeredItems(items = []) {
  const kept = [];
  for (const { item: children, ...item } of items) {
    const answeredChildren = answeredItems(children);
    if (answeredChildren.length) kept.push({ ...item, item: answeredChildren });
    else if (item.answer?.length) kept.push(item);
  }
  return kept;
}

// The library writes a value for a primitive in a list, such as meta.profile[0], to the
// JSON property of its extensions (meta._profile) instead of the value (meta.profile).
function fixPrimitiveLists(node) {
  if (Array.isArray(node)) {
    node.forEach(fixPrimitiveLists);
  } else if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      const value = node[key];
      if (key.startsWith('_') && Array.isArray(value) && value.every((v) => v === null || typeof v !== 'object')) {
        node[key.slice(1)] = [...(node[key.slice(1)] ?? []), ...value.filter((v) => v !== null)];
        delete node[key];
      } else {
        fixPrimitiveLists(value);
      }
    }
  }
  return node;
}

function describe(outcome) {
  return (outcome?.issue ?? [])
    .map((issue) => `${issue.severity}: ${issue.diagnostics ?? issue.details?.text ?? issue.code}`)
    .join('\n');
}

/**
 * Extracts the WEST-A vital sign Observations from a WEST-A triage QuestionnaireResponse.
 *
 * @param {object} questionnaire The WEST-A Triage Questionnaire, with its extraction templates
 * @param {object} questionnaireResponse A response to it, with subject, encounter, author and authored
 * @returns {Promise<object>} A transaction Bundle that POSTs one Observation per answered vital
 *   sign (up to 7; the blood pressure is one Observation with two components)
 * @throws {Error} When the response has no subject or authored time, or when extraction fails
 *   or reports any issue, since every issue means an Observation that is missing data
 */
export async function extractVitals(questionnaire, questionnaireResponse) {
  // The templates hold a placeholder time, which only the authored time replaces
  for (const element of ['subject', 'authored']) {
    if (!questionnaireResponse?.[element]) {
      throw new Error(`The QuestionnaireResponse has no ${element}, which the Observations need`);
    }
  }
  const { inAppExtract, extractResultIsOperationOutcome } = await loadLibrary();
  const response = structuredClone(questionnaireResponse);
  response.item = answeredItems(response.item);

  const { extractSuccess, extractResult } = await inAppExtract(response, structuredClone(questionnaire), null);
  if (!extractSuccess || extractResultIsOperationOutcome(extractResult)) {
    throw new Error(`Template extraction failed:\n${describe(extractResult)}`);
  }
  // The library warns about each template whose item is not in the response, which is how an
  // unanswered vital sign is skipped. Any other issue, such as a FHIRPath error, is a bug.
  const issues = (extractResult.issues?.issue ?? []).filter(
    (issue) => !/does not have a target QR item FHIRPath/.test(issue.details?.text ?? issue.diagnostics ?? ''),
  );
  if (issues.length) {
    throw new Error(`Template extraction reported issues:\n${describe({ issue: issues })}`);
  }

  return {
    resourceType: 'Bundle',
    type: 'transaction',
    entry: (extractResult.extractedBundle.entry ?? []).map(({ fullUrl, resource, request }) => ({
      fullUrl,
      resource: fixPrimitiveLists(resource),
      request,
    })),
  };
}
