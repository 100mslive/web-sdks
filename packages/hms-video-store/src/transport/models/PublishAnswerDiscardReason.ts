/**
 * Why a publish answer was not applied to the connection. The values are the wire values: they
 * go out verbatim as `reason` on the `publishAnswerDiscarded` analytics event.
 */
export enum PublishAnswerDiscardReason {
  /** handleSFUMigration swapped publishConnection for a different object mid-flight */
  ConnectionReplaced = 'connection_replaced',
  /** same connection, but a racer staged a newer local offer */
  SupersededOffer = 'superseded_offer',
  /** neither of the above and still not in have-local-offer; counted, never expected */
  UnexpectedState = 'unexpected_state',
  /** a newer owner took the single renegotiation slot before this one was settled */
  WaiterDisplaced = 'waiter_displaced',
  /** the publish connection was torn down before the renegotiation could run */
  ConnectionGone = 'connection_gone',
}
