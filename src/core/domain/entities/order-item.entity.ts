export class OrderItem {
  constructor(
    public readonly sku: string,
    public readonly quantity: number,
    public readonly price: number
  ) {
    if (quantity <= 0) {
      throw new Error("Quantidade do item deve ser maior que zero.");
    }
  }

  get subTotal(): number {
    return this.price * this.quantity;
  }
}
