"use client"

import type React from "react"

import { useRef, useState } from "react"
import { Plus, Search, Trash2, Upload, Paperclip } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DatePicker } from "@/components/ui/date-picker"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"

interface PurchaseFormProps {
  formData: any
  formErrors: any
  suppliers: any[]
  products: any[]
  categories: any[]
  selectedFiles: File[]
  uploadProgress: number
  isSubmitting: boolean
  productSearchTerm: string
  setProductSearchTerm: (term: string) => void
  supplierSearchTerm: string
  setSupplierSearchTerm: (term: string) => void
  categoryFilter: string
  setCategoryFilter: (filter: string) => void
  handleSupplierSelection: (supplierId: string) => void
  handleDateChange: (date: Date | undefined, field: string) => void
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleProductSelection: (productId: string, index: number) => void
  handleItemChange: (index: number, field: string, value: string | number) => void
  addItem: () => void
  removeItem: (index: number) => void
  calculateItemTotal: (item: { quantity: number; unitPrice: number; taxRate: number }) => number
  calculateOrderTotal: () => number
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeSelectedFile: (index: number) => void
  onCancel: () => void
  onSubmit: () => void
}

export function PurchaseForm({
  formData,
  formErrors,
  suppliers,
  products,
  categories,
  selectedFiles,
  uploadProgress,
  isSubmitting,
  productSearchTerm,
  setProductSearchTerm,
  supplierSearchTerm,
  setSupplierSearchTerm,
  categoryFilter,
  setCategoryFilter,
  handleSupplierSelection,
  handleDateChange,
  handleInputChange,
  handleProductSelection,
  handleItemChange,
  addItem,
  removeItem,
  calculateItemTotal,
  calculateOrderTotal,
  handleFileChange,
  removeSelectedFile,
  onCancel,
  onSubmit,
}: PurchaseFormProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [step, setStep] = useState(1)

  const goToNextStep = () => {
    // Basic validation for first step
    if (step === 1) {
      if (!formData.supplierId) {
        return
      }
    }
    setStep(2)
  }

  const goToPreviousStep = () => {
    setStep(1)
  }

  return (
    <div className="grid gap-4 py-4">
      {step === 1 ? (
        // Step 1: Basic purchase information
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Step 1: Basic Information</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Step {step} of 2</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="supplier">
                Supplier <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.supplierId} onValueChange={(value) => handleSupplierSelection(value)}>
                <SelectTrigger id="supplier" className={formErrors.supplierId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  <div className="sticky top-0 z-10 bg-background p-2 border-b">
                    <div className="flex items-center gap-2 px-1 pb-2">
                      <Search className="h-4 w-4 opacity-50 flex-shrink-0" />
                      <Input
                        className="h-8 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                        placeholder="Search suppliers..."
                        value={supplierSearchTerm}
                        onChange={(e) => setSupplierSearchTerm(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                  <div className="pt-2">
                    <SelectItem value="add-new" className="text-primary font-medium border-b mb-1 pb-1">
                      + Add New Supplier
                    </SelectItem>
                    {suppliers
                      .filter(
                        (supplier) =>
                          supplierSearchTerm === "" ||
                          supplier.name.toLowerCase().includes(supplierSearchTerm.toLowerCase()) ||
                          supplier.email.toLowerCase().includes(supplierSearchTerm.toLowerCase()),
                      )
                      .map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier._id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                  </div>
                </SelectContent>
              </Select>
              {formErrors.supplierId && <p className="text-xs text-red-500">{formErrors.supplierId}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="orderDate">
                Order Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={formData.orderDate}
                setDate={(date) => handleDateChange(date, "orderDate")}
                className={formErrors.orderDate ? "border-red-500" : ""}
              />
              {formErrors.orderDate && <p className="text-xs text-red-500">{formErrors.orderDate}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
              <DatePicker
                date={formData.expectedDeliveryDate}
                setDate={(date) => handleDateChange(date, "expectedDeliveryDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange({ target: { name: "status", value } } as any)}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Ordered">Ordered</SelectItem>
                  <SelectItem value="Received">Received (Updates Inventory)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Note: Product inventory is only updated when status is "Received"
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={goToNextStep}>Next</Button>
            </div>
          </div>
        </>
      ) : (
        // Step 2: Items, notes, and attachments
        <>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Step 2: Items & Attachments</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Step {step} of 2</span>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">
                Items <span className="text-red-500">*</span>
              </Label>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>
                        Product <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>
                        Quantity <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead>
                        Cost Price <span className="text-red-500">*</span>
                      </TableHead>
                      <TableHead>Tax Rate</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {formData.items.map((item: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="space-y-2 w-full">
                            <Select
                              value={item.productId}
                              onValueChange={(value) => {
                                handleProductSelection(value, index)
                              }}
                            >
                              <SelectTrigger
                                className={formErrors.items && formErrors.items[index] ? "border-red-500" : ""}
                              >
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                              <SelectContent className="max-h-[300px]">
                                <div className="sticky top-0 z-10 bg-background p-2 border-b">
                                  <div className="flex items-center gap-2 px-1 pb-2">
                                    <Search className="h-4 w-4 opacity-50 flex-shrink-0" />
                                    <Input
                                      className="h-8 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                                      placeholder="Search products..."
                                      value={productSearchTerm}
                                      onChange={(e) => setProductSearchTerm(e.target.value)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                    <SelectTrigger className="h-8 w-full text-sm">
                                      <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="all">All Categories</SelectItem>
                                      {categories.map((category) => (
                                        <SelectItem key={category._id} value={category._id}>
                                          {category.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="pt-2">
                                  <SelectItem value="add-new" className="text-primary font-medium border-b mb-1 pb-1">
                                    + Add New Product
                                  </SelectItem>
                                  {products
                                    .filter(
                                      (product) =>
                                        (categoryFilter === "all" || product.category === categoryFilter) &&
                                        (productSearchTerm === "" ||
                                          product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                                          product.sku.toLowerCase().includes(productSearchTerm.toLowerCase())),
                                    )
                                    .map((product) => (
                                      <SelectItem key={product._id} value={product._id}>
                                        {product.name} ({product.sku})
                                      </SelectItem>
                                    ))}
                                </div>
                              </SelectContent>
                            </Select>
                            {formErrors.items && formErrors.items[index] && (
                              <p className="text-xs text-red-500">{formErrors.items[index]}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input value={item.productSku} readOnly className="bg-muted" placeholder="SKU" />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, "quantity", Number.parseInt(e.target.value) || 0)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            placeholder="Price"
                            value={item.unitPrice}
                            onChange={(e) =>
                              handleItemChange(index, "unitPrice", Number.parseFloat(e.target.value) || 0)
                            }
                          />
                          {formData.status === "Received" && item.isExistingProduct && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {item.unitPrice !== item.originalCost
                                ? `Will update cost & selling price (${(item.unitPrice - item.originalCost).toFixed(2)} difference)`
                                : "Will update product cost"}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.taxRate.toString()}
                            onValueChange={(value) => handleItemChange(index, "taxRate", Number.parseFloat(value) || 0)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Tax %" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">0%</SelectItem>
                              <SelectItem value="5">5%</SelectItem>
                              <SelectItem value="12">12%</SelectItem>
                              <SelectItem value="18">18%</SelectItem>
                              <SelectItem value="28">28%</SelectItem>
                            </SelectContent>
                          </Select>
                          {formData.status === "Received" && item.isExistingProduct && (
                            <p className="text-xs text-muted-foreground mt-1">Will update product tax</p>
                          )}
                        </TableCell>
                        <TableCell>₹{calculateItemTotal(item).toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                            {index === formData.items.length - 1 && (
                              <Button variant="ghost" size="sm" onClick={addItem}>
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={5} className="text-right font-bold">
                        Total:
                      </TableCell>
                      <TableCell className="font-bold">₹{calculateOrderTotal().toFixed(2)}</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Enter any additional notes"
                value={formData.notes}
                onChange={handleInputChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="border rounded-md p-4">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">PDF, PNG, JPG or DOCX (MAX. 10MB)</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      onChange={handleFileChange}
                      ref={fileInputRef}
                      multiple
                    />
                  </label>
                </div>

                {selectedFiles.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">Selected Files:</p>
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between border p-2 rounded-md">
                        <div className="flex items-center gap-2">
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeSelectedFile(index)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <p className="text-sm mb-1">Uploading files: {uploadProgress}%</p>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between mt-6">
            <Button variant="outline" onClick={goToPreviousStep} disabled={isSubmitting}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={onSubmit} disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Purchase Order"}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

