export interface Customer {
  _id: string
  name: string
  email: string
  contact: string
  address?: string
  customerType: string
  gstin?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface Product {
  _id: string
  name: string
  sku: string
  description?: string
  category: string
  price?: number
  cost: number
  quantity: number
  reorderLevel: number
  tax: number
  sellingPrice?: number
  purchasePrice?: number
  taxRate?: number
  hsn?: string
  supplierId?: string
  supplier?: string
  barcode?: string
  location?: string
  createdAt?: string
  updatedAt?: string
  lastModified?: string
  lastModifiedFrom?: string
}

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
  customer: Customer | null
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

export interface RefundItem extends SaleItem {
  selected: boolean
  refundQuantity: number
}

export interface Refund {
  _id: string
  saleId: string
  orderNumber: string
  customer: Customer
  refundDate: string
  items: SaleItem[]
  subtotal: number
  taxTotal: number
  total: number
  reason: string
  status: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface InvoiceItem {
  id: string
  productId: string
  productName: string
  quantity: number
  price: number
  originalPrice: number
  tax: number
  originalTax: number
  taxAmount: number
  total: number
  totalWithTax: number
}

export interface Invoice {
  _id: string
  number: string
  date: string
  dueDate: string
  customerId: string
  customerName: string
  items: InvoiceItem[]
  subtotal: number
  taxTotal: number
  total: number
  status: "paid" | "pending" | "overdue" | "cancelled" | "draft"
  paymentMethod: string
  notes: string
  isGst: boolean
  createdAt?: string
  convertedToSale?: boolean
}

export interface InvoiceData {
  invoice: {
    _id: string
    number: string
    date: string
    dueDate: string
    items: InvoiceItem[]
    subtotal: number
    taxTotal: number
    total: number
    status: string
    paymentMethod: string
    notes: string
  }
  customer: {
    _id: string
    name: string
    email: string
    phone: string
    address: string[]
    gstin: string
  }
  company: {
    _id: string
    name: string
    address: string[]
    gstin: string
    state: string
    stateCode: string
    contact: string
    email: string
    taxRate: string
    bankDetails: {
      accountName: string
      accountNumber: string
      bankName: string
      ifscCode: string
      branchName: string
    }
  }
  bankDetails: {
    accountHolderName: string
    bankName: string
    accountNumber: string
    ifscCode: string
    branchName: string
  }
}
