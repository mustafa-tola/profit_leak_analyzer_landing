const ruleCopy: Record<string, [name: string, description: string]> = {
  ADJUSTMENT_PRESENT: ['Settlement adjustment', 'A payout adjustment was recorded in settlement cash.'],
  AMBIGUOUS_RELATIONSHIP: ['Ambiguous shipment match', 'The allocation matches multiple shipments.'],
  COD_MISMATCH: ['COD mismatch', 'Recorded COD amounts differ.'],
  DUE_DATE_UNKNOWN: ['Unknown due date', 'The available data cannot establish whether payment is overdue.'],
  EXPECTED_UNKNOWN: ['Unknown receivable', 'Required inputs for the expected receivable are missing.'],
  FEE_ATTRIBUTION_EXCEEDS_SETTLEMENT: ['Excess fee attribution', 'Shipment fees exceed the settlement fee total.'],
  FEE_DISCREPANCY: ['Delivery fee discrepancy', 'Attributed delivery fees exceed the contracted fees.'],
  FEE_NOT_ATTRIBUTABLE: ['Unattributed delivery fee', 'A missing fee breakdown prevents attribution to this shipment.'],
  INVALID_ROW: ['Invalid source row', 'An input row was excluded by validation.'],
  OVER_ALLOCATED_SETTLEMENT: ['Overallocated settlement', 'Allocations exceed the net settlement amount.'],
  OVERDUE_SETTLEMENT: ['Overdue settlement', 'A receivable remains outstanding past its due date.'],
  OVERPAID: ['Overpayment', 'Verified payments exceed the expected receivable.'],
  PARTIAL_SETTLEMENT: ['Partial settlement', 'Verified payments cover only part of the expected receivable.'],
  RTO_COST: ['Return-to-origin cost', 'An operating cost was recorded for a returned parcel.'],
  RTO_FEE_DISCREPANCY: ['Return fee discrepancy', 'Attributed return fees exceed the contracted fees.'],
  SETTLEMENT_ARITHMETIC_MISMATCH: ['Settlement total mismatch', 'The recorded net payout differs from the calculated total.'],
  UNALLOCATED_SETTLEMENT: ['Unallocated settlement', 'Part of the settlement remains unallocated.'],
  UNEXPECTED_PAYMENT_ON_NON_DELIVERED: ['Payment on undelivered parcel', 'A positive payment was allocated to an undelivered shipment.'],
  UNKNOWN_STATUS: ['Unknown shipment status', 'The courier status could not be recognized.'],
  UNMATCHED_ALLOCATION: ['Unmatched allocation', 'The allocation could not be applied to a shipment.'],
  UNMATCHED_ORDER: ['Unmatched order', 'The order has no matching valid shipment.'],
  UNMATCHED_SHIPMENT: ['Unmatched shipment', 'The shipment references an order missing from the valid input.'],
  UNSETTLED_SHIPMENT: ['Unsettled shipment', 'A delivered shipment has no verified settlement.'],
  'SD-02': ['Settlement delay', ''],
  'PV-07': ['Payout variance', ''],
  'CH-03': ['Unexpected return fee', ''],
  'CH-05': ['Unsupported weight surcharge', ''],
};

export function findingPresentation(ruleId: string) {
  const [name, description] = Object.prototype.hasOwnProperty.call(ruleCopy, ruleId)
    ? ruleCopy[ruleId]
    : ['Exception flagged', ''];
  return { name, description };
}
