export type Product = {
  id: string
  name: string
  description: string
  category: string
  quantity: number
  cost: number
  purchasePrice: string
  sellingPrice?: number
  supplier: string
  reorderLevel: number
  image?: string
  createdAt: string
  updatedAt: string
}
