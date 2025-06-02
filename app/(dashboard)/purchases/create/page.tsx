"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { PurchaseForm } from "@/components/purchases/purchase-form"
import { AddProductForm } from "@/components/purchases/add-product-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"

interface Supplier {
  _id: string
  name: string
  contactPerson: string
  email: string
  phone: string
}

interface Product {
  _id: string
  name: string
  sku: string
  cost: number
  sellingPrice: number
  quantity: number
  category: string
  taxRate?: number
  tax?: number
}

interface Category {
  _id: string
  name: string
  type: string
}

interface FormData {
  supplierId: string
  orderDate: Date | undefined
  expectedDeliveryDate: Date | undefined
  status: string
  notes: string
  items: {
    productId: string
    productSku: string
    quantity: number
    unitPrice: number
    originalCost: number
    originalSellingPrice: number
    taxRate: number
    isExistingProduct: boolean
  }[]
  attachments?: File[]
}

export default function CreatePurchaseOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAddProductOpen, setIsAddProductOpen] = useState(false)
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false)
  const [currentItemIndex, setCurrentItemIndex] = useState<number | null>(null)
  const [productSearchTerm, setProductSearchTerm] = useState("")
  const [supplierSearchTerm, setSupplierSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState(0)

  // Form state
  const [formData, setFormData] = useState<FormData>({
    supplierId: "",
    orderDate: new Date(),
    expectedDeliveryDate: new Date(),
    status: "Draft", // Default to Draft
    notes: "",
    items: [
      {
        productId: "",
        productSku: "",
        quantity: 1,
        unitPrice: 0,
        originalCost: 0,
        originalSellingPrice: 0,
        taxRate: 0,
        isExistingProduct: false,
      },
    ],
    attachments: [],
  })

  // Form validation
  const [formErrors, setFormErrors] = useState<{
    supplierId?: string
    orderDate?: string
    items?: string[]
  }>({})

  const [newProductData, setNewProductData] = useState({
    name: "",
    sku: "",
    category: "General",
    quantity: 0,
    cost: 0,
    sellingPrice: 0,
    taxRate: 18,
    reorderLevel: 10,
    supplierId: "",
    purchasePrice: 0,
  })

  const [newSupplierData, setNewSupplierData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
  })

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/suppliers")
      if (!response.ok) {
        throw new Error("Failed to fetch suppliers")
      }
      const data = await response.json()
      setSuppliers(data.suppliers || [])
    } catch (error) {
      console.error("Error fetching suppliers:", error)
      toast({
        title: "Error",
        description: "Failed to fetch suppliers. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products")
      if (!response.ok) {
        throw new Error("Failed to fetch products")
      }
      const data = await response.json()
      setProducts(data.products || [])
    } catch (error) {
      console.error("Error fetching products:", error)
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again.",
        variant: "destructive",
      })
    }
  }

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories?type=product")
      if (!response.ok) {
        throw new Error("Failed to fetch categories")
      }
      const data = await response.json()
      setCategories(data.categories || [])
    } catch (error) {
      console.error("Error fetching categories:", error)
      toast({
        title: "Error",
        description: "Failed to fetch categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchSuppliers()
    fetchProducts()
    fetchCategories()
  }, [])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle date changes
  const handleDateChange = (date: Date | undefined, field: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date,
    }))
  }

  // Handle item changes
  const handleItemChange = (index: number, field: string, value: string | number) => {
    setFormData((prev) => {
      const updatedItems = [...prev.items]
      updatedItems[index] = {
        ...updatedItems[index],
        [field]: value,
      }
      return {
        ...prev,
        items: updatedItems,
      }
    })
  }

  // Add new item
  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          productId: "",
          productSku: "",
          quantity: 1,
          unitPrice: 0,
          originalCost: 0,
          originalSellingPrice: 0,
          taxRate: 0,
          isExistingProduct: false,
        },
      ],
    }))
  }

  // Remove item
  const removeItem = (index: number) => {
    if (formData.items.length === 1) {
      return // Don't remove the last item
    }
    setFormData((prev) => {
      const updatedItems = [...prev.items]
      updatedItems.splice(index, 1)
      return {
        ...prev,
        items: updatedItems,
      }
    })
  }

  // Calculate item total
  const calculateItemTotal = (item: { quantity: number; unitPrice: number; taxRate: number }) => {
    const subtotal = item.quantity * item.unitPrice
    const taxAmount = subtotal * (item.taxRate / 100)
    return subtotal + taxAmount
  }

  // Calculate order total
  const calculateOrderTotal = () => {
    return formData.items.reduce((total, item) => total + calculateItemTotal(item), 0)
  }

  // Handle supplier selection
  const handleSupplierSelection = (supplierId: string) => {
    if (supplierId === "add-new") {
      setIsAddSupplierOpen(true)
      return
    }

    setFormData((prev) => ({
      ...prev,
      supplierId,
    }))
  }

  // Handle product selection
  const handleProductSelection = (productId: string, index: number) => {
    if (productId === "add-new") {
      setCurrentItemIndex(index)
      setIsAddProductOpen(true)
      return
    }

    const selectedProduct = products.find((p) => p._id === productId)
    if (selectedProduct) {
      setFormData((prev) => {
        const updatedItems = [...prev.items]
        updatedItems[index] = {
          ...updatedItems[index],
          productId,
          productSku: selectedProduct.sku,
          unitPrice: selectedProduct.cost,
          originalCost: selectedProduct.cost,
          originalSellingPrice: selectedProduct.sellingPrice,
          taxRate: selectedProduct.tax || selectedProduct.taxRate || 18,
          isExistingProduct: true,
        }
        return {
          ...prev,
          items: updatedItems,
        }
      })
    }
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])

      // Update form data with files
      setFormData((prev) => ({
        ...prev,
        attachments: [...(prev.attachments || []), ...filesArray],
      }))
    }
  }

  // Remove selected file
  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev]
      updated.splice(index, 1)
      return updated
    })

    // Update form data
    setFormData((prev) => {
      const updatedAttachments = [...(prev.attachments || [])]
      updatedAttachments.splice(index, 1)
      return {
        ...prev,
        attachments: updatedAttachments,
      }
    })
  }

  // Upload files for a purchase order
  const uploadFiles = async (purchaseId: string, files: File[]) => {
    if (!files.length) return []

    const uploadedFiles = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const formData = new FormData()
      formData.append("file", file)
      formData.append("purchaseId", purchaseId)

      try {
        // Update progress
        setUploadProgress(Math.round((i / files.length) * 100))

        const response = await fetch("/api/uploads", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }

        const data = await response.json()
        uploadedFiles.push(data.file)

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100))
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        toast({
          title: "Upload Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      }
    }

    // Reset progress
    setTimeout(() => setUploadProgress(0), 1000)

    return uploadedFiles
  }

  // Validate form
  const validateForm = () => {
    const errors: {
      supplierId?: string
      orderDate?: string
      items?: string[]
    } = {}

    if (!formData.supplierId) {
      errors.supplierId = "Supplier is required"
    }

    if (!formData.orderDate) {
      errors.orderDate = "Order date is required"
    }

    const itemErrors: string[] = []
    formData.items.forEach((item, index) => {
      if (!item.productId) {
        itemErrors[index] = "Product is required"
      } else if (item.quantity <= 0) {
        itemErrors[index] = "Quantity must be greater than 0"
      } else if (item.unitPrice < 0) {
        itemErrors[index] = "Unit price cannot be negative"
      }
    })

    if (itemErrors.length > 0) {
      errors.items = itemErrors
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Calculate purchase price (cost + tax)
  const calculatePurchasePrice = (cost: number, taxRate: number) => {
    return cost + (cost * taxRate) / 100
  }

  const handleAddNewSupplier = async () => {
    try {
      // Basic validation
      if (!newSupplierData.name || !newSupplierData.email) {
        toast({
          title: "Error",
          description: "Supplier name and email are required",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      const response = await fetch("/api/suppliers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSupplierData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to add supplier")
      }

      const data = await response.json()
      const newSupplierId = data.supplierId

      toast({
        title: "Success",
        description: "Supplier added successfully",
      })

      // Refresh suppliers list
      await fetchSuppliers()

      // Auto-select the newly created supplier
      setFormData((prev) => ({
        ...prev,
        supplierId: newSupplierId,
      }))

      // Close dialog and reset form
      setIsAddSupplierOpen(false)
      setNewSupplierData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
      })
    } catch (error) {
      console.error("Error adding supplier:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add supplier",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddNewProduct = async () => {
    try {
      // Basic validation
      if (!newProductData.name || !newProductData.sku) {
        toast({
          title: "Error",
          description: "Product name and SKU are required",
          variant: "destructive",
        })
        return
      }

      // Validate supplier selection
      if (!newProductData.supplierId) {
        toast({
          title: "Error",
          description: "Please select a supplier",
          variant: "destructive",
        })
        return
      }

      setIsSubmitting(true)

      // Prepare the product data
      const productData = {
        name: newProductData.name,
        sku: newProductData.sku,
        category: newProductData.category,
        quantity: 0, // Always set to 0 for new products from purchases
        cost: newProductData.cost,
        sellingPrice: newProductData.sellingPrice,
        tax: newProductData.taxRate, // Use tax instead of taxRate
        reorderLevel: newProductData.reorderLevel,
        supplierID: newProductData.supplierId, // Make sure this matches the expected field name in the API
        lastModifiedFrom: "purchases",
      }

      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error("Product creation error:", data)

        // Handle duplicate SKU error specifically
        if (data.code === "DUPLICATE_SKU") {
          toast({
            title: "Duplicate SKU",
            description: "A product with this SKU already exists. Please use a different SKU.",
            variant: "destructive",
          })
          return
        }

        throw new Error(data.message || "Failed to add product")
      }

      const newProductId = data.productId

      toast({
        title: "Success",
        description: "Product added successfully",
      })

      // Refresh products list
      await fetchProducts()

      // If we have a current item index, update that item with the new product
      if (currentItemIndex !== null) {
        // Get the newly added product
        const productResponse = await fetch(`/api/products?id=${newProductId}`)
        if (productResponse.ok) {
          const productData = await productResponse.json()

          // Update the form data with the new product
          setFormData((prev) => {
            const updatedItems = [...prev.items]
            updatedItems[currentItemIndex] = {
              ...updatedItems[currentItemIndex],
              productId: newProductId,
              productSku: productData.sku,
              unitPrice: productData.cost,
              originalCost: productData.cost,
              originalSellingPrice: productData.sellingPrice,
              taxRate: productData.tax || 18,
              isExistingProduct: true,
            }
            return {
              ...prev,
              items: updatedItems,
            }
          })
        }
      }

      // Close dialog and reset form
      setIsAddProductOpen(false)
      setCurrentItemIndex(null)
      setNewProductData({
        name: "",
        sku: "",
        category: "General",
        quantity: 0,
        cost: 0,
        sellingPrice: 0,
        taxRate: 18,
        reorderLevel: 10,
        supplierId: "",
        purchasePrice: 0,
      })
    } catch (error) {
      console.error("Error adding product:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add product",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle product form change
  const handleProductFormChange = (field: string, value: string | number) => {
    setNewProductData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)

      // Find supplier name
      const supplier = suppliers.find((s) => s._id === formData.supplierId)
      if (!supplier) {
        throw new Error("Supplier not found")
      }

      // Prepare items with product names
      const preparedItems = await Promise.all(
        formData.items.map(async (item) => {
          const product = products.find((p) => p._id === item.productId)
          if (!product) {
            throw new Error("Product not found")
          }

          const subtotal = item.quantity * item.unitPrice
          const taxAmount = subtotal * (item.taxRate / 100)

          // Update product in database if it's an existing product
          if (item.isExistingProduct && formData.status === "Received") {
            try {
              // Calculate cost difference and adjust selling price
              const costDifference = item.unitPrice - item.originalCost
              const newSellingPrice = item.originalSellingPrice + costDifference

              const updateResponse = await fetch(`/api/products?id=${item.productId}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  quantity: product.quantity + item.quantity,
                  cost: item.unitPrice,
                  sellingPrice: newSellingPrice,
                  tax: item.taxRate,
                  lastModified: new Date(),
                  lastModifiedFrom: "purchases",
                }),
              })

              if (!updateResponse.ok) {
                const errorData = await updateResponse.json()
                console.error("Failed to update product:", errorData)
                throw new Error(errorData.message || "Failed to update product")
              }
            } catch (error) {
              console.error("Error updating product:", error)
              toast({
                title: "Warning",
                description: `Failed to update product information: ${error instanceof Error ? error.message : String(error)}`,
                variant: "destructive",
              })
            }
          }

          return {
            productId: item.productId,
            productName: product.name,
            productSku: product.sku,
            quantity: item.quantity,
            receivedQuantity: formData.status === "Received" ? item.quantity : 0,
            unitPrice: item.unitPrice,
            totalPrice: subtotal,
            taxRate: item.taxRate,
            taxAmount: taxAmount,
          }
        }),
      )

      // Generate PO number
      const poNumber = `PO-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)}`

      // Prepare purchase order data
      const purchaseOrderData = {
        poNumber,
        supplierId: formData.supplierId,
        supplierName: supplier.name,
        orderDate: formData.orderDate?.toISOString().split("T")[0] || new Date().toISOString().split("T")[0],
        expectedDeliveryDate: formData.expectedDeliveryDate?.toISOString().split("T")[0] || null,
        deliveryDate: formData.status === "Received" ? new Date().toISOString().split("T")[0] : null,
        status: formData.status,
        paymentStatus: "Unpaid",
        totalAmount: calculateOrderTotal(),
        paidAmount: 0,
        items: preparedItems,
        notes: formData.notes || null,
        createdBy: "", // Will be set by the server
        createdAt: new Date().toISOString(),
      }

      // Submit to API
      const response = await fetch("/api/purchases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseOrderData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || "Failed to create purchase order")
      }

      const result = await response.json()
      const purchaseId = result.purchaseId

      // Upload files if any
      if (formData.attachments && formData.attachments.length > 0) {
        await uploadFiles(purchaseId, formData.attachments)
      }

      // Success
      toast({
        title: "Success",
        description: "Purchase order created successfully",
      })

      // Navigate back to purchases page
      router.push("/purchases")
    } catch (error) {
      console.error("Error creating purchase order:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create purchase order",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Create Purchase Order</h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/purchases")}>
            Cancel
          </Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <PurchaseForm
          formData={formData}
          formErrors={formErrors}
          suppliers={suppliers}
          products={products}
          categories={categories}
          selectedFiles={selectedFiles}
          uploadProgress={uploadProgress}
          isSubmitting={isSubmitting}
          productSearchTerm={productSearchTerm}
          setProductSearchTerm={setProductSearchTerm}
          supplierSearchTerm={supplierSearchTerm}
          setSupplierSearchTerm={setSupplierSearchTerm}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          handleSupplierSelection={handleSupplierSelection}
          handleDateChange={handleDateChange}
          handleInputChange={handleInputChange}
          handleProductSelection={handleProductSelection}
          handleItemChange={handleItemChange}
          addItem={addItem}
          removeItem={removeItem}
          calculateItemTotal={calculateItemTotal}
          calculateOrderTotal={calculateOrderTotal}
          handleFileChange={handleFileChange}
          removeSelectedFile={removeSelectedFile}
          onCancel={() => router.push("/purchases")}
          onSubmit={handleSubmit}
        />
      </div>

      <Dialog open={isAddSupplierOpen} onOpenChange={setIsAddSupplierOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
            <DialogDescription>Fill in the details to add a new supplier.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="supplierName" className="text-sm font-medium">
                  Supplier Name
                </label>
                <input
                  id="supplierName"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newSupplierData.name}
                  onChange={(e) => setNewSupplierData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter supplier name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="contactPerson" className="text-sm font-medium">
                  Contact Person
                </label>
                <input
                  id="contactPerson"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newSupplierData.contactPerson}
                  onChange={(e) => setNewSupplierData((prev) => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Enter contact person"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newSupplierData.email}
                  onChange={(e) => setNewSupplierData((prev) => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium">
                  Phone
                </label>
                <input
                  id="phone"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newSupplierData.phone}
                  onChange={(e) => setNewSupplierData((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setIsAddSupplierOpen(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={handleAddNewSupplier} disabled={isSubmitting}>
                {isSubmitting ? "Adding..." : "Add Supplier"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>Fill in the details to add a new product to your inventory.</DialogDescription>
          </DialogHeader>
          <AddProductForm
            newProductData={newProductData}
            categories={categories}
            suppliers={suppliers}
            isSubmitting={isSubmitting}
            onCancel={() => setIsAddProductOpen(false)}
            onSubmit={handleAddNewProduct}
            onChange={handleProductFormChange}
            calculatePurchasePrice={calculatePurchasePrice}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
