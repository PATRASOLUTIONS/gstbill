export interface CompanyDetails {
  companyName: string
  address: string[]
  gstin: string
  state: string
  stateCode: string
  contact: string
  email: string
  logo: string
}

export interface BuyerDetails {
  name: string
  address: string[]
  state: string
  stateCode: string
  hasGST: boolean
  gstin: string
  contactNumber: string
}

export interface InvoiceDetails {
  number: string
  date: string
  eWayBillNo?: string
  deliveryNote?: string
  buyersOrderNo?: string
  orderDate?: string
  dispatchDocNo?: string
  dispatchedThrough?: string
  destination?: string
  termsOfDelivery?: string
  termsOfPayment?: string
  referenceNo?: string
  otherReference?: string
  billOfLading?: string
  motorVehicleNo?: string
  paymentTerms?: string
  paymentStatus?: string
}

export interface Product {
  id: number
  description: string
  hsn: string
  quantity: number
  rate: number
  gstRate: number
  per: string
}

export interface BankDetails {
  accountHolderName: string
  bankName: string
  accountNumber: string
  branch: string
  ifscCode: string
}
