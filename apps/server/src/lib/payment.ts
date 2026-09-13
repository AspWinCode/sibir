/**
 * Payment provider seam. Only a stub implementation exists today - the real
 * acquiring integration (bank TBD) plugs in here later without callers changing:
 * whichever provider is chosen just needs to implement PaymentProvider.
 */

export interface PaymentChargeResult {
  success: boolean;
  paidAt: Date;
}

export interface PaymentProvider {
  charge(dealId: string, amount: number): Promise<PaymentChargeResult>;
}

class StubPaymentProvider implements PaymentProvider {
  async charge(_dealId: string, _amount: number): Promise<PaymentChargeResult> {
    return { success: true, paidAt: new Date() };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new StubPaymentProvider();
}
