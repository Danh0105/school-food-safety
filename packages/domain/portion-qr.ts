import type { Actor, ServiceMode } from './policy'

export type MealType = 'BREAKFAST' | 'LUNCH' | 'SNACK'
export type PortionQrState = 'ACTIVE' | 'REVOKED'

export type PortionQrScope = {
  schoolId: string
  kitchenId: string
  wardId: string
  serviceMode: ServiceMode
  serviceDate: string
  mealType: MealType
}

export type PortionQrRecord = PortionQrScope & {
  id: string
  publicToken: string
  sequence: number
  batchId: string
  issuedAt: string
  issuedBy: string
}

export type PortionQrEvent = {
  id: string
  portionQrId: string
  type: 'REVOKED'
  reason: string
  recordedAt: string
  actorId: string
}

export const portionServiceKey = (scope: PortionQrScope) =>
  `${scope.schoolId}:${scope.kitchenId}:${scope.serviceDate}:${scope.mealType}`

export function assertCanIssuePortionQr(actor: Actor, scope: PortionQrScope, quantity: number) {
  if (scope.serviceMode !== 'CENTRAL_KITCHEN') throw new Error('CENTRAL_KITCHEN_ONLY')
  if (actor.role !== 'central_kitchen' || actor.kitchenId !== scope.kitchenId) throw new Error('FORBIDDEN')
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 5_000) throw new Error('INVALID_QUANTITY')
}

export function canReadPortionQrRegistry(actor: Actor, scope: PortionQrScope) {
  return (actor.role === 'central_kitchen' && actor.kitchenId === scope.kitchenId)
    || (actor.role === 'school_board' && actor.schoolId === scope.schoolId)
    || (actor.role === 'culture_social_office' && actor.wardId === scope.wardId)
}

export function activePortionQrs(records: readonly PortionQrRecord[], events: readonly PortionQrEvent[]) {
  const revoked = new Set(events.filter(event => event.type === 'REVOKED').map(event => event.portionQrId))
  return records.filter(record => !revoked.has(record.id))
}

export function assertDispatchQrCoverage(actualServings: number, activeRecords: readonly PortionQrRecord[]) {
  if (!Number.isSafeInteger(actualServings) || actualServings < 1 || actualServings > 5_000) throw new Error('INVALID_QUANTITY')
  if (activeRecords.length !== actualServings) throw new Error('QR_COVERAGE_MISMATCH')
  if (new Set(activeRecords.map(record => record.publicToken)).size !== actualServings) throw new Error('DUPLICATE_QR_TOKEN')
  if (new Set(activeRecords.map(record => record.sequence)).size !== actualServings) throw new Error('DUPLICATE_QR_SEQUENCE')
}

export function encodeOpaqueToken(bytes: Uint8Array) {
  if (bytes.length < 16) throw new Error('TOKEN_ENTROPY_TOO_LOW')
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}
