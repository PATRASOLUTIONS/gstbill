export interface SaleItem {
  product: string
  productName: string
  quantity: number
  price: number
  taxRate: number
  taxAmount: number
  total: number
}

export interface Sale {
  _id: string
  orderId?: string
  customer: {
    _id: string
    name: string
    email: string
    contact: string
  } | null
  saleDate: string
  items: SaleItem[]
  subtotal: number
  taxTotal: number
  total: number
  status: string
  paymentStatus: string
  notes?: string
  createdAt: string
  updatedAt: string
  invoiceId?: string
  invoiceNumber?: string
}

