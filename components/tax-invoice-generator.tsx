"use client"

import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer"
import type { InvoiceData, InvoiceItem } from "@/lib/types"

// Register fonts
Font.register({
  family: "Roboto",
  fonts: [
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular.ttf", fontWeight: 400 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium.ttf", fontWeight: 500 },
    { src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold.ttf", fontWeight: 700 },
  ],
})

// Create styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 10,
    padding: 30,
    backgroundColor: "#ffffff",
  },
  title: {
    fontSize: 16,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 10,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 10,
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "solid",
    paddingBottom: 10,
    marginBottom: 10,
  },
  column: {
    flex: 1,
    flexDirection: "column",
  },
  label: {
    fontWeight: 700,
    marginBottom: 5,
  },
  value: {
    marginBottom: 3,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
  },
  table: {
    display: "table",
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
  },
  tableRowHeader: {
    flexDirection: "row",
    backgroundColor: "#f2f2f2",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
  },
  tableCell: {
    padding: 5,
  },
  tableCellRight: {
    padding: 5,
    textAlign: "right",
  },
  amountInWords: {
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000000",
    padding: 5,
    backgroundColor: "#f2f2f2",
    marginBottom: 10,
  },
  footer: {
    marginTop: 30,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  declaration: {
    width: 150,
    textAlign: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    borderBottomStyle: "dashed",
    marginBottom: 5,
    height: 40,
  },
  note: {
    fontSize: 8,
    textAlign: "center",
    marginTop: 10,
    color: "#666666",
  },
})

interface InvoicePDFProps {
  invoiceData: InvoiceData
  calculations: {
    subtotal: number
    totalCGST: number
    totalSGST: number
    totalIGST: number
    totalTax: number
    grandTotal: number
    amountInWords: string
  }
}

const InvoicePDF = ({ invoiceData, calculations }: InvoicePDFProps) => {
  const isIGST = invoiceData.sellerStateCode !== invoiceData.buyerStateCode

  // Calculate tax details for each item
  const taxDetails = invoiceData.items.map((item: InvoiceItem) => {
    const itemAmount = item.quantity * item.rate
    const taxAmount = (itemAmount * item.taxRate) / 100

    return {
      description: item.description,
      taxRate: item.taxRate,
      taxableAmount: itemAmount,
      cgst: isIGST ? 0 : taxAmount / 2,
      sgst: isIGST ? 0 : taxAmount / 2,
      igst: isIGST ? taxAmount : 0,
      totalTax: taxAmount,
    }
  })

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Invoice Title */}
        <View style={styles.title}>
          <Text>Tax Invoice</Text>
        </View>

        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.column}>
            <Text style={styles.label}>From:</Text>
            <Text style={{ ...styles.value, fontWeight: 700 }}>{invoiceData.sellerName}</Text>
            <Text style={styles.value}>{invoiceData.sellerAddress}</Text>
            <Text style={styles.value}>GSTIN: {invoiceData.sellerGstin}</Text>
            <Text style={styles.value}>
              State: {invoiceData.sellerState} ({invoiceData.sellerStateCode})
            </Text>
            {invoiceData.sellerPhone && <Text style={styles.value}>Phone: {invoiceData.sellerPhone}</Text>}
            {invoiceData.sellerEmail && <Text style={styles.value}>Email: {invoiceData.sellerEmail}</Text>}
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>To:</Text>
            <Text style={{ ...styles.value, fontWeight: 700 }}>{invoiceData.buyerName}</Text>
            <Text style={styles.value}>{invoiceData.buyerAddress}</Text>
            {invoiceData.buyerGstin && <Text style={styles.value}>GSTIN: {invoiceData.buyerGstin}</Text>}
            <Text style={styles.value}>
              State: {invoiceData.buyerState} ({invoiceData.buyerStateCode})
            </Text>
            {invoiceData.buyerPhone && <Text style={styles.value}>Phone: {invoiceData.buyerPhone}</Text>}
            {invoiceData.buyerEmail && <Text style={styles.value}>Email: {invoiceData.buyerEmail}</Text>}
          </View>
        </View>

        {/* Invoice Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Invoice No:</Text> {invoiceData.invoiceNo}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Invoice Date:</Text>{" "}
                {new Date(invoiceData.invoiceDate).toLocaleDateString("en-IN")}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Due Date:</Text>{" "}
                {new Date(invoiceData.dueDate).toLocaleDateString("en-IN")}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <Text>
              <Text style={{ fontWeight: 700 }}>Place of Supply:</Text> {invoiceData.placeOfSupply}
            </Text>
          </View>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableRowHeader}>
            <View style={{ ...styles.tableCol, width: "5%" }}>
              <Text style={styles.tableCell}>No.</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "35%" }}>
              <Text style={styles.tableCell}>Description</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "15%" }}>
              <Text style={styles.tableCell}>HSN/SAC</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "10%" }}>
              <Text style={styles.tableCellRight}>Qty</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "15%" }}>
              <Text style={styles.tableCellRight}>Rate (₹)</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "20%" }}>
              <Text style={styles.tableCellRight}>Amount (₹)</Text>
            </View>
          </View>

          {/* Table Body */}
          {invoiceData.items.map((item, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: "5%" }}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "35%" }}>
                <Text style={styles.tableCell}>{item.description}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "15%" }}>
                <Text style={styles.tableCell}>{item.hsn}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "10%" }}>
                <Text style={styles.tableCellRight}>{item.quantity}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "15%" }}>
                <Text style={styles.tableCellRight}>{item.rate.toFixed(2)}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "20%" }}>
                <Text style={styles.tableCellRight}>{(item.quantity * item.rate).toFixed(2)}</Text>
              </View>
            </View>
          ))}

          {/* Table Footer */}
          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: "80%" }}>
              <Text style={{ ...styles.tableCellRight, fontWeight: 700 }}>Subtotal:</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "20%" }}>
              <Text style={styles.tableCellRight}>₹ {calculations.subtotal.toFixed(2)}</Text>
            </View>
          </View>

          {isIGST ? (
            <View style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: "80%" }}>
                <Text style={styles.tableCellRight}>IGST ({invoiceData.items[0].taxRate}%):</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "20%" }}>
                <Text style={styles.tableCellRight}>₹ {calculations.totalIGST.toFixed(2)}</Text>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.tableRow}>
                <View style={{ ...styles.tableCol, width: "80%" }}>
                  <Text style={styles.tableCellRight}>CGST ({invoiceData.items[0].taxRate / 2}%):</Text>
                </View>
                <View style={{ ...styles.tableCol, width: "20%" }}>
                  <Text style={styles.tableCellRight}>₹ {calculations.totalCGST.toFixed(2)}</Text>
                </View>
              </View>
              <View style={styles.tableRow}>
                <View style={{ ...styles.tableCol, width: "80%" }}>
                  <Text style={styles.tableCellRight}>SGST ({invoiceData.items[0].taxRate / 2}%):</Text>
                </View>
                <View style={{ ...styles.tableCol, width: "20%" }}>
                  <Text style={styles.tableCellRight}>₹ {calculations.totalSGST.toFixed(2)}</Text>
                </View>
              </View>
            </>
          )}

          <View style={styles.tableRow}>
            <View style={{ ...styles.tableCol, width: "80%" }}>
              <Text style={{ ...styles.tableCellRight, fontWeight: 700 }}>Total:</Text>
            </View>
            <View style={{ ...styles.tableCol, width: "20%" }}>
              <Text style={{ ...styles.tableCellRight, fontWeight: 700 }}>₹ {calculations.grandTotal.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* Amount in Words */}
        <View style={styles.amountInWords}>
          <Text>
            <Text style={{ fontWeight: 700 }}>Amount in Words:</Text> {calculations.amountInWords}
          </Text>
        </View>

        {/* Tax Summary */}
        <View style={styles.section}>
          <Text style={styles.label}>Tax Summary:</Text>
          <View style={styles.table}>
            {/* Tax Table Header */}
            <View style={styles.tableRowHeader}>
              <View style={{ ...styles.tableCol, width: "25%" }}>
                <Text style={styles.tableCell}>Description</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "20%" }}>
                <Text style={styles.tableCellRight}>Taxable Amount (₹)</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "10%" }}>
                <Text style={styles.tableCellRight}>Tax Rate</Text>
              </View>
              {!isIGST && (
                <>
                  <View style={{ ...styles.tableCol, width: "15%" }}>
                    <Text style={styles.tableCellRight}>CGST (₹)</Text>
                  </View>
                  <View style={{ ...styles.tableCol, width: "15%" }}>
                    <Text style={styles.tableCellRight}>SGST (₹)</Text>
                  </View>
                </>
              )}
              {isIGST && (
                <View style={{ ...styles.tableCol, width: "30%" }}>
                  <Text style={styles.tableCellRight}>IGST (₹)</Text>
                </View>
              )}
              <View style={{ ...styles.tableCol, width: "15%" }}>
                <Text style={styles.tableCellRight}>Total Tax (₹)</Text>
              </View>
            </View>

            {/* Tax Table Body */}
            {taxDetails.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <View style={{ ...styles.tableCol, width: "25%" }}>
                  <Text style={styles.tableCell}>{item.description}</Text>
                </View>
                <View style={{ ...styles.tableCol, width: "20%" }}>
                  <Text style={styles.tableCellRight}>{item.taxableAmount.toFixed(2)}</Text>
                </View>
                <View style={{ ...styles.tableCol, width: "10%" }}>
                  <Text style={styles.tableCellRight}>{item.taxRate}%</Text>
                </View>
                {!isIGST && (
                  <>
                    <View style={{ ...styles.tableCol, width: "15%" }}>
                      <Text style={styles.tableCellRight}>{item.cgst.toFixed(2)}</Text>
                    </View>
                    <View style={{ ...styles.tableCol, width: "15%" }}>
                      <Text style={styles.tableCellRight}>{item.sgst.toFixed(2)}</Text>
                    </View>
                  </>
                )}
                {isIGST && (
                  <View style={{ ...styles.tableCol, width: "30%" }}>
                    <Text style={styles.tableCellRight}>{item.igst.toFixed(2)}</Text>
                  </View>
                )}
                <View style={{ ...styles.tableCol, width: "15%" }}>
                  <Text style={styles.tableCellRight}>{item.totalTax.toFixed(2)}</Text>
                </View>
              </View>
            ))}

            {/* Tax Table Footer */}
            <View style={styles.tableRow}>
              <View style={{ ...styles.tableCol, width: "25%" }}>
                <Text style={{ ...styles.tableCellRight, fontWeight: 700 }}>Total:</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "20%" }}>
                <Text style={styles.tableCellRight}>{calculations.subtotal.toFixed(2)}</Text>
              </View>
              <View style={{ ...styles.tableCol, width: "10%" }}>
                <Text style={styles.tableCellRight}></Text>
              </View>
              {!isIGST && (
                <>
                  <View style={{ ...styles.tableCol, width: "15%" }}>
                    <Text style={styles.tableCellRight}>₹ {calculations.totalCGST.toFixed(2)}</Text>
                  </View>
                  <View style={{ ...styles.tableCol, width: "15%" }}>
                    <Text style={styles.tableCellRight}>₹ {calculations.totalSGST.toFixed(2)}</Text>
                  </View>
                </>
              )}
              {isIGST && (
                <View style={{ ...styles.tableCol, width: "30%" }}>
                  <Text style={styles.tableCellRight}>₹ {calculations.totalIGST.toFixed(2)}</Text>
                </View>
              )}
              <View style={{ ...styles.tableCol, width: "15%" }}>
                <Text style={styles.tableCellRight}>₹ {calculations.totalTax.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bank Details */}
        <View style={styles.section}>
          <Text style={styles.label}>Bank Details:</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Account Name:</Text> {invoiceData.bankDetails.accountName}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Account Number:</Text> {invoiceData.bankDetails.accountNumber}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Bank Name:</Text> {invoiceData.bankDetails.bankName}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>IFSC Code:</Text> {invoiceData.bankDetails.ifscCode}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text>
                <Text style={{ fontWeight: 700 }}>Branch:</Text> {invoiceData.bankDetails.branchName}
              </Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.section}>
          <Text style={styles.label}>Terms and Conditions:</Text>
          <Text>{invoiceData.termsAndConditions}</Text>
        </View>

        {/* Signature */}
        <View style={styles.footer}>
          <View style={styles.declaration}>
            <Text>
              Declaration: We declare that this invoice shows the actual price of the goods/services described and that
              all particulars are true and correct.
            </Text>
          </View>
          <View style={styles.signature}>
            <View style={styles.signatureLine}></View>
            <Text style={{ fontWeight: 700 }}>For {invoiceData.sellerName}</Text>
            <Text style={{ fontSize: 8 }}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Note */}
        <View style={styles.note}>
          <Text>This is a computer generated invoice and does not require a physical signature.</Text>
        </View>
      </Page>
    </Document>
  )
}

