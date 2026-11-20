import type { Bundle } from 'fhir/r4';
import { lib, type DischargeReportArgs } from './libs';

/**
 * An HL7 Europe Hospital Discharge Report (document Bundle) for the stay, by
 * demo/lib/hdr.js in both modes. It takes one NEWS2 and one triage Observation.
 */
export function dischargeReport(args: DischargeReportArgs): Bundle {
  return lib('hdr').dischargeReport(args);
}
